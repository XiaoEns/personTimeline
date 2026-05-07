"""
文件上传、切片与事件抽取 API 路由。
提供 8 个端点：上传、列表、详情、删除、切片、切片列表、切片文本、事件抽取。
"""
import asyncio
import logging
import os
import uuid as uuid_mod
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models.biography_text import BiographyText
from models.person import Person
from models.uploaded_file import UploadedFile
from schemas.biography import ChunkItem, ChunkListResponse, ChunkTextResponse, FileExtractResponse
from schemas.upload import ChunkResult, PaginatedUploadedFiles, UploadedFileItem, UploadedFileResponse
from services.chunking_service import run_chunking
from services.extraction_service import run_extraction_for_file

logger = logging.getLogger(__name__)

router = APIRouter(tags=['上传与抽取'])

ALLOWED_EXTENSIONS = {'.txt', '.pdf'}


def _validate_file_type(filename: str) -> str:
    """
    校验文件扩展名是否允许，返回小写扩展名（不含点）。
    参数:
        filename: 原始文件名
    返回:
        小写扩展名
    抛出:
        HTTPException 400: 不支持的文件格式
    """
    if not filename:
        raise HTTPException(status_code=400, detail='文件名不能为空')
    if '.' not in filename:
        raise HTTPException(status_code=400, detail='无法识别文件格式')
    ext = filename.rsplit('.', 1)[-1].lower()
    if f'.{ext}' not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f'不支持的文件格式 ".{ext}"，仅支持 .txt 和 .pdf',
        )
    return ext


def _build_files_query(
    person_id: UUID | None = None,
    status: str | None = None,
):
    """
    构建上传文件查询的公用 select 语句，含 chunk_count 子查询和 person_name JOIN。
    参数:
        person_id: 可选的人物 ID 筛选
        status: 可选的状态筛选
    返回:
        (count_stmt, fetch_stmt) 元组
    """
    # chunk_count 子查询
    chunk_subq = (
        select(func.count(BiographyText.id))
        .where(BiographyText.file_id == UploadedFile.id)
        .correlate(UploadedFile)
        .scalar_subquery()
    )

    # 基础查询条件
    conditions = []
    if person_id:
        conditions.append(UploadedFile.person_id == person_id)
    if status:
        conditions.append(UploadedFile.status == status)

    # 计数查询
    count_stmt = select(func.count(UploadedFile.id))
    if conditions:
        count_stmt = count_stmt.where(*conditions)

    # 数据查询
    fetch_stmt = (
        select(
            UploadedFile,
            chunk_subq.label('chunk_count'),
            Person.name.label('person_name'),
        )
        .outerjoin(Person, UploadedFile.person_id == Person.id)
    )
    if conditions:
        fetch_stmt = fetch_stmt.where(*conditions)
    fetch_stmt = fetch_stmt.order_by(UploadedFile.created_at.desc())

    return count_stmt, fetch_stmt


# ============================================================================
# 1. POST /api/upload — 上传文件
# ============================================================================

@router.post('/api/upload', response_model=UploadedFileResponse, status_code=201)
async def upload_file(
    file: UploadFile = File(..., description='传记文件（.txt 或 .pdf）'),
    person_id: str = Form(..., description='关联人物 ID'),
    db: AsyncSession = Depends(get_db),
):
    """
    上传传记文件，校验格式与大小，保存到磁盘，创建数据库记录，
    并在后台启动文本切片任务。
    """
    try:
        # 校验文件类型
        ext = _validate_file_type(file.filename or '')

        # 读取内容并校验大小
        content = await file.read()
        if len(content) > settings.max_upload_size:
            raise HTTPException(status_code=400, detail='文件大小超过 10MB 限制')

        # 生成 UUID 文件名并保存到磁盘
        file_uuid = uuid_mod.uuid4()
        stored_name = f'{file_uuid}.{ext}'
        full_path = os.path.join(settings.upload_dir, stored_name)
        os.makedirs(settings.upload_dir, exist_ok=True)
        with open(full_path, 'wb') as f:
            f.write(content)

        # 创建 uploaded_files 记录
        uploaded = UploadedFile(
            id=file_uuid,
            original_name=file.filename,
            file_path=full_path,
            file_size=len(content),
            file_type=ext,
            person_id=UUID(person_id),
            status='uploaded',
        )
        db.add(uploaded)
        await db.commit()
        await db.refresh(uploaded)

        # 后台启动切片任务
        asyncio.create_task(run_chunking(uploaded.id))
        logger.info(
            '文件上传完成，后台切片已启动: id=%s, name=%s, size=%d',
            uploaded.id, uploaded.original_name, uploaded.file_size,
        )

        return UploadedFileResponse(
            id=uploaded.id,
            original_name=uploaded.original_name,
            file_path=uploaded.file_path,
            file_size=uploaded.file_size,
            file_type=uploaded.file_type,
            person_id=uploaded.person_id,
            person_name=None,
            status=uploaded.status,
            error_message=None,
            chunk_count=0,
            created_at=uploaded.created_at,
            updated_at=uploaded.updated_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception('文件上传失败')
        raise HTTPException(status_code=500, detail=f'上传失败：{str(e)}')


# ============================================================================
# 2. GET /api/uploaded-files — 上传文件列表
# ============================================================================

@router.get('/api/uploaded-files', response_model=PaginatedUploadedFiles)
async def list_uploaded_files(
    page: int = Query(1, ge=1, description='页码'),
    page_size: int = Query(20, ge=1, le=100, description='每页条数'),
    person_id: UUID | None = Query(None, description='按人物 ID 筛选'),
    status: str | None = Query(None, description='按状态筛选'),
    db: AsyncSession = Depends(get_db),
):
    """
    分页查询上传文件列表，支持按人物和状态筛选，
    每条记录含 chunk_count 和 person_name。
    """
    try:
        count_stmt, fetch_stmt = _build_files_query(person_id, status)

        # 查询总数
        total = (await db.execute(count_stmt)).scalar() or 0

        # 查询分页数据
        rows = (
            await db.execute(
                fetch_stmt
                .offset((page - 1) * page_size)
                .limit(page_size),
            )
        ).all()

        items = [
            UploadedFileItem(
                id=upload.id,
                original_name=upload.original_name,
                file_size=upload.file_size,
                file_type=upload.file_type,
                person_id=upload.person_id,
                person_name=person_name,
                status=upload.status,
                error_message=upload.error_message,
                chunk_count=chunk_count or 0,
                created_at=upload.created_at,
            )
            for upload, chunk_count, person_name in rows
        ]

        return PaginatedUploadedFiles(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception('查询上传文件列表失败')
        raise HTTPException(status_code=500, detail=f'查询失败：{str(e)}')


# ============================================================================
# 3. GET /api/uploaded-files/{file_id} — 文件详情
# ============================================================================

@router.get(
    '/api/uploaded-files/{file_id}',
    response_model=UploadedFileResponse,
)
async def get_uploaded_file(
    file_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    查询单个上传文件的详情，含 chunk_count 和 person_name。
    """
    try:
        count_stmt, fetch_stmt = _build_files_query()
        # 添加 file_id 筛选条件
        fetch_stmt = fetch_stmt.where(UploadedFile.id == file_id)

        row = (await db.execute(fetch_stmt)).one_or_none()
        if not row:
            raise HTTPException(status_code=404, detail='文件记录不存在')

        upload, chunk_count, person_name = row[0], row[1], row[2]

        return UploadedFileResponse(
            id=upload.id,
            original_name=upload.original_name,
            file_path=upload.file_path,
            file_size=upload.file_size,
            file_type=upload.file_type,
            person_id=upload.person_id,
            person_name=person_name,
            status=upload.status,
            error_message=upload.error_message,
            chunk_count=chunk_count or 0,
            created_at=upload.created_at,
            updated_at=upload.updated_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception('查询文件详情失败: %s', file_id)
        raise HTTPException(status_code=500, detail=f'查询失败：{str(e)}')


# ============================================================================
# 4. DELETE /api/uploaded-files/{file_id} — 删除文件
# ============================================================================

@router.delete('/api/uploaded-files/{file_id}', status_code=204)
async def delete_uploaded_file(
    file_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    删除上传文件记录，清理磁盘文件，级联删除切片数据。
    """
    try:
        result = await db.execute(
            select(UploadedFile).where(UploadedFile.id == file_id),
        )
        record = result.scalar_one_or_none()
        if not record:
            raise HTTPException(status_code=404, detail='文件记录不存在')

        # 删除磁盘文件（异常时记录日志但不阻断）
        try:
            if os.path.isfile(record.file_path):
                os.remove(record.file_path)
                logger.info('磁盘文件已删除: %s', record.file_path)
        except OSError as e:
            logger.warning('删除磁盘文件失败: %s, error=%s', record.file_path, e)

        # 级联删除 biography_text 切片 + uploaded_files 记录
        await db.delete(record)
        await db.commit()

        logger.info('文件记录已删除: id=%s, name=%s', file_id, record.original_name)
        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.exception('删除文件失败: %s', file_id)
        raise HTTPException(status_code=500, detail=f'删除失败：{str(e)}')


# ============================================================================
# 5. POST /api/uploaded-files/{file_id}/chunk — 触发切片
# ============================================================================

@router.post(
    '/api/uploaded-files/{file_id}/chunk',
    response_model=ChunkResult,
)
async def trigger_chunk(
    file_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    触发或查询文件切片状态：
    - status ∈ {uploaded, error} → 启动后台切片
    - status ∈ {chunking, chunked, extracting, completed} → 返回当前状态
    """
    try:
        result = await db.execute(
            select(UploadedFile).where(UploadedFile.id == file_id),
        )
        record = result.scalar_one_or_none()
        if not record:
            raise HTTPException(status_code=404, detail='文件记录不存在')

        if record.status in ('uploaded', 'error'):
            # 启动后台切片
            asyncio.create_task(run_chunking(file_id))
            logger.info('后台切片已启动: file_id=%s, prev_status=%s', file_id, record.status)
            return ChunkResult(status='chunking', chunk_count=0)

        # 返回当前状态及切片数
        chunk_count_result = await db.execute(
            select(func.count(BiographyText.id)).where(
                BiographyText.file_id == file_id,
            ),
        )
        chunk_count = chunk_count_result.scalar() or 0

        return ChunkResult(status=record.status, chunk_count=chunk_count)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception('触发切片失败: %s', file_id)
        raise HTTPException(status_code=500, detail=f'切片操作失败：{str(e)}')


# ============================================================================
# 6. GET /api/uploaded-files/{file_id}/chunks — 切片列表
# ============================================================================

@router.get(
    '/api/uploaded-files/{file_id}/chunks',
    response_model=ChunkListResponse,
)
async def list_chunks(
    file_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    查询文件的切片列表（不含 raw_text 全文），按 chunk_index 排序。
    """
    try:
        # 确认文件存在
        file_result = await db.execute(
            select(UploadedFile.id).where(UploadedFile.id == file_id),
        )
        if not file_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail='文件记录不存在')

        # 查询切片
        result = await db.execute(
            select(BiographyText)
            .where(BiographyText.file_id == file_id)
            .order_by(BiographyText.chunk_index),
        )
        chunks = result.scalars().all()

        items = [
            ChunkItem(
                id=c.id,
                file_id=c.file_id,
                chunk_index=c.chunk_index,
                text_length=len(c.raw_text),
                page=c.page,
                created_at=c.created_at,
            )
            for c in chunks
        ]

        return ChunkListResponse(items=items, total=len(items))

    except HTTPException:
        raise
    except Exception as e:
        logger.exception('查询切片列表失败: %s', file_id)
        raise HTTPException(status_code=500, detail=f'查询失败：{str(e)}')


# ============================================================================
# 7. GET /api/biography-texts/{biography_id} — 切片文本详情
# ============================================================================

@router.get(
    '/api/biography-texts/{biography_id}',
    response_model=ChunkTextResponse,
)
async def get_chunk_text(
    biography_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    查询单条切片全文（含 raw_text）。
    """
    try:
        bt = await db.get(BiographyText, biography_id)
        if not bt:
            raise HTTPException(status_code=404, detail='切片文本不存在')

        return ChunkTextResponse(
            id=bt.id,
            chunk_index=bt.chunk_index,
            raw_text=bt.raw_text,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception('查询切片文本失败: %s', biography_id)
        raise HTTPException(status_code=500, detail=f'查询失败：{str(e)}')


# ============================================================================
# 8. POST /api/uploaded-files/{file_id}/extract — 触发事件抽取
# ============================================================================

@router.post(
    '/api/uploaded-files/{file_id}/extract',
    response_model=FileExtractResponse,
)
async def trigger_extract(
    file_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    触发文件级 AI 事件抽取：
    - status ∈ {chunked, completed} → 启动后台抽取
    - status = extracting → 返回当前状态
    - status ∈ {uploaded, chunking, error} → 返回 400（需先完成切片）
    """
    try:
        result = await db.execute(
            select(UploadedFile).where(UploadedFile.id == file_id),
        )
        record = result.scalar_one_or_none()
        if not record:
            raise HTTPException(status_code=404, detail='文件记录不存在')

        if record.status in ('chunked', 'completed'):
            # 启动后台抽取
            asyncio.create_task(run_extraction_for_file(file_id))
            logger.info(
                '后台抽取已启动: file_id=%s, prev_status=%s',
                file_id, record.status,
            )
            return FileExtractResponse(file_id=file_id, status='extracting', result=None)

        if record.status == 'extracting':
            return FileExtractResponse(file_id=file_id, status='extracting', result=None)

        # status ∈ {uploaded, chunking, error}
        raise HTTPException(
            status_code=400,
            detail=f'当前状态为 {record.status}，请先完成切片后再抽取',
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception('触发抽取失败: %s', file_id)
        raise HTTPException(status_code=500, detail=f'抽取操作失败：{str(e)}')
