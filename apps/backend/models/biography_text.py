"""
原始传记文本 ORM 模型。
对应 biography_text 表，存储上传的传记原始文本及其元数据。
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import text, String, Integer, Text, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.person import Person
    from models.uploaded_file import UploadedFile


class BiographyText(Base):
    """原始传记文本模型，存储上传文件提取的纯文本内容。"""
    __tablename__ = 'biography_text'

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True,
        server_default=text('gen_random_uuid()'),
        comment='主键 UUID',
    )
    person_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('person.id', ondelete='SET NULL'),
        nullable=True,
        comment='关联人物 ID，可为空（文件可先于人物上传）',
    )
    source_file: Mapped[str | None] = mapped_column(
        String(500), comment='来源文件名',
    )
    page: Mapped[int | None] = mapped_column(Integer, comment='页码')
    raw_text: Mapped[str] = mapped_column(Text, comment='原始文本内容')
    ocr_confidence: Mapped[float | None] = mapped_column(
        Float, comment='OCR 识别置信度 0-1',
    )
    file_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('uploaded_files.id', ondelete='SET NULL'),
        comment='关联上传文件 ID（切片来源）',
    )
    file_path: Mapped[str | None] = mapped_column(
        String(1000), comment='来源文件磁盘路径',
    )
    chunk_index: Mapped[int] = mapped_column(
        Integer, default=0,
        comment='切片序号，从 0 开始',
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text('NOW()'),
        comment='记录创建时间',
    )

    # 关系
    person: Mapped[Person | None] = relationship('Person', back_populates='biographies')
    uploaded_file: Mapped[UploadedFile | None] = relationship(
        'UploadedFile', back_populates='biographies',
    )
