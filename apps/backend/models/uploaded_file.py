"""
上传文件 ORM 模型。
对应 uploaded_files 表，记录文件上传、切片、抽取全流程的状态。
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import text, String, Text, BigInteger, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.person import Person
    from models.biography_text import BiographyText


class UploadedFile(Base):
    """上传文件模型，追踪文件从上传到事件抽取完成的全生命周期状态。"""
    __tablename__ = 'uploaded_files'

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True,
        server_default=text('gen_random_uuid()'),
        comment='主键 UUID',
    )
    original_name: Mapped[str] = mapped_column(
        String(500), comment='原始文件名（含扩展名）',
    )
    file_path: Mapped[str] = mapped_column(
        String(1000), comment='文件在磁盘上的存储路径',
    )
    file_size: Mapped[int] = mapped_column(
        BigInteger, comment='文件大小（字节）',
    )
    file_type: Mapped[str] = mapped_column(
        String(10), comment='文件类型: txt / pdf',
    )
    person_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('person.id', ondelete='SET NULL'),
        comment='关联人物 ID，允许为空',
    )
    status: Mapped[str] = mapped_column(
        String(20), default='uploaded',
        comment='状态: uploaded / chunking / chunked / extracting / completed / error',
    )
    error_message: Mapped[str | None] = mapped_column(
        Text, comment='错误信息，仅在 status=error 时有值',
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text('NOW()'),
        comment='记录创建时间',
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text('NOW()'),
        onupdate=text('NOW()'), comment='记录最后更新时间',
    )

    # 关系
    person: Mapped[Person | None] = relationship(
        'Person', back_populates='uploaded_files',
    )
    biographies: Mapped[list[BiographyText]] = relationship(
        'BiographyText', back_populates='uploaded_file',
        cascade='all, delete-orphan',
    )
