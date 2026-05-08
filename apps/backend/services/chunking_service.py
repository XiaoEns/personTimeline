"""
文件文本提取与切片服务。
支持 TXT/PDF 文本提取，以及基于 RecursiveCharacterTextSplitter 的智能文本切片。
"""
import logging
import os
from uuid import UUID

import fitz
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import async_session
from models.biography_text import BiographyText
from models.uploaded_file import UploadedFile

logger = logging.getLogger(__name__)

# 切片分隔符：优先在段落/句子/标点符号处切割，避免断裂语义
_CHUNK_SEPARATORS = ["\n\n", "\n", "。", "！", "？", "；", ".", "!", "?", ";", " "]


def extract_text(content: bytes, filename: str) -> str:
    """
    从文件中提取纯文本内容，根据文件扩展名选择提取方式。
    参数:
        content: 文件二进制内容
        filename: 文件名（用于判断格式）
    返回:
        提取的纯文本
    抛出:
        ValueError: 不支持的文件格式
    """
    lower_name = filename.lower()

    if lower_name.endswith('.txt'):
        return content.decode('utf-8')

    if lower_name.endswith('.pdf'):
        doc = fitz.open(stream=content, filetype='pdf')
        parts = []
        for page in doc:
            parts.append(page.get_text())
        doc.close()
        return '\n'.join(parts)

    raise ValueError('不支持的文件格式，仅支持 .txt 和 .pdf')


def chunk_text(text: str) -> list[str]:
    """
    使用 RecursiveCharacterTextSplitter 将长文本切分为有重叠的片段，
    中文友好的分隔符优先级避免在句子中间断裂。
    参数:
        text: 待切片的完整文本
    返回:
        切片后的字符串列表
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=_CHUNK_SEPARATORS,
    )
    return splitter.split_text(text)


async def run_chunking(file_id: UUID) -> None:
    """
    异步后台任务：对指定上传文件执行文本提取+切片全流程。
    参数:
        file_id: 上传文件记录 ID
    流程:
        1. 获取独立 db session
        2. 更新状态为 chunking
        3. 读取磁盘文件 → 提取文本 → 切片
        4. 删除旧切片记录 → 逐条写入新切片
        5. 更新状态为 chunked
        6. 异常时设置 status=error + error_message
    """
    async with async_session() as db:
        try:
            # 1. 查询上传文件记录
            result = await db.execute(
                select(UploadedFile).where(UploadedFile.id == file_id)
            )
            record = result.scalar_one_or_none()
            if not record:
                logger.error('文件记录不存在: %s', file_id)
                return

            # 2. 更新状态为 chunking
            record.status = 'chunking'
            await db.commit()

            # 3. 读取磁盘文件并提取文本
            full_path = os.path.join(
                settings.upload_dir, os.path.basename(record.file_path)
            )
            if not os.path.isfile(full_path):
                # 尝试直接用 file_path（可能是绝对路径）
                full_path = record.file_path
            if not os.path.isfile(full_path):
                raise FileNotFoundError(f'文件不存在: {full_path}')

            with open(full_path, 'rb') as f:
                content = f.read()
            text = extract_text(content, record.original_name)
            chunks = chunk_text(text)

            # 4. 删除该文件旧的传记文本切片记录
            await db.execute(
                delete(BiographyText).where(BiographyText.file_id == file_id)
            )

            # 5. 逐条写入新切片
            for i, chunk in enumerate(chunks):
                bio = BiographyText(
                    person_id=record.person_id,
                    source_file=record.original_name,
                    raw_text=chunk,
                    file_id=file_id,
                    file_path=record.file_path,
                    chunk_index=i,
                )
                db.add(bio)

            # 6. 更新状态为 chunked
            record.status = 'chunked'
            await db.commit()
            logger.info(
                '切片完成: file_id=%s, original_name=%s, chunks=%d',
                file_id, record.original_name, len(chunks),
            )

        except Exception:
            logger.exception('切片失败: file_id=%s', file_id)
            try:
                # 重新查询 record（原 session 已失效）
                result = await db.execute(
                    select(UploadedFile).where(UploadedFile.id == file_id)
                )
                record = result.scalar_one_or_none()
                if record:
                    record.status = 'error'
                    record.error_message = str(f'切片失败: {file_id}')
                    await db.commit()
            except Exception:
                logger.exception('更新错误状态失败: file_id=%s', file_id)
