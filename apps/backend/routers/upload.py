"""
文件上传与传记文本管理 API 路由。
提供文件上传、传记文本列表查询和删除接口。
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.biography_text import BiographyText
from schemas.biography import BiographyText as BiographyTextSchema
from schemas.biography import BiographyTextItem, BiographyTextList, ExtractRequest, ExtractResult, ExtractEventItem
from services.extraction_service import extract_text, run_extraction
from config import settings

router = APIRouter(tags=['上传与抽取'])

ALLOWED_EXTENSIONS = {'.txt', '.pdf'}


def _validate_file(filename: str) -> None:
    """
    校验文件扩展名是否在允许范围内。
    参数:
        filename: 文件名
    抛出:
        HTTPException 400: 格式不支持
    """
    if not filename:
        raise HTTPException(status_code=400, detail='文件名不能为空')
    ext = filename.lower().rsplit('.', 1)[-1]
    if f'.{ext}' not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f'不支持的文件格式 ".{ext}"，仅支持 .txt 和 .pdf',
        )


@router.post('/api/upload', response_model=BiographyTextSchema, status_code=201)
async def upload_biography(
    file: UploadFile = File(..., description='传记文件（.txt 或 .pdf）'),
    person_id: str = Form(..., description='关联人物 ID'),
    db: AsyncSession = Depends(get_db),
):
    """
    上传传记文件（TXT/PDF），提取文本内容并保存到数据库。
    最大文件大小限制为 10MB。
    """
    _validate_file(file.filename or '')

    content = await file.read()
    if len(content) > settings.max_upload_size:
        raise HTTPException(status_code=400, detail='文件大小超过 10MB 限制')

    try:
        text = extract_text(content, file.filename or '')
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    bt = BiographyText(
        person_id=UUID(person_id),
        source_file=file.filename,
        raw_text=text,
    )
    db.add(bt)
    await db.commit()
    await db.refresh(bt)

    return BiographyTextSchema(
        id=bt.id,
        person_id=bt.person_id,
        source_file=bt.source_file,
        page=bt.page,
        text_length=len(bt.raw_text),
        created_at=bt.created_at,
    )


@router.get(
    '/api/persons/{person_id}/biography',
    response_model=BiographyTextList,
)
async def list_biography_texts(
    person_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    获取人物关联的所有传记文本列表。
    返回每个文本的摘要信息（不含原文）。
    """
    result = await db.execute(
        select(BiographyText)
        .where(BiographyText.person_id == UUID(person_id))
        .order_by(BiographyText.created_at.desc())
    )
    texts = result.scalars().all()
    items = [
        BiographyTextItem(
            id=t.id,
            source_file=t.source_file,
            text_length=len(t.raw_text),
            created_at=t.created_at,
        )
        for t in texts
    ]
    return BiographyTextList(items=items)


@router.delete('/api/biography/{biography_id}', status_code=204)
async def delete_biography(
    biography_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    删除传记文本记录。
    """
    bt = await db.get(BiographyText, UUID(biography_id))
    if not bt:
        raise HTTPException(status_code=404, detail='传记文本不存在')
    await db.delete(bt)
    await db.commit()
    return None


@router.post('/api/persons/{person_id}/extract', response_model=ExtractResult)
async def extract_events(
    person_id: str,
    req: ExtractRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    AI 事件抽取。
    调用大模型从人物的传记文本中提取结构化事件，
    自动创建 Event 和 PersonEvent 记录。
    """
    try:
        events = await run_extraction(
            db, UUID(person_id), req.biography_id, req.model,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except TimeoutError:
        raise HTTPException(status_code=504, detail='AI 服务调用超时')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'AI 抽取失败：{str(e)}')

    items = [
        ExtractEventItem(
            title=e.title,
            description=e.description,
            start_date=e.start_date,
            end_date=e.end_date,
            display_time=e.display_time,
            time_type=e.time_type,
            granularity=e.granularity,
            event_type=e.event_type,
            location=e.location or None,
            event_id=e.id,
            is_inferred=True,
        )
        for e in events
    ]
    return ExtractResult(total=len(items), events=items)
