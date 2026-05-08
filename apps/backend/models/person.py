"""
人物 ORM 模型。
对应 person 表，存储人物核心信息（姓名、生卒时间、简介等）。
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import text, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.person_event import PersonEvent
    from models.person_alias import PersonAlias
    from models.biography_text import BiographyText
    from models.external_person_info import ExternalPersonInfo
    from models.uploaded_file import UploadedFile


class Person(Base):
    """人物模型，包含规范化和原文两种时间表述。"""
    __tablename__ = 'person'

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True,
        server_default=text('gen_random_uuid()'),
        comment='主键 UUID',
    )
    name: Mapped[str] = mapped_column(String(200), comment='人物姓名')
    birth_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), comment='规范化出生时间，精确到秒',
    )
    death_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), comment='规范化逝世时间，精确到秒',
    )
    birth_display: Mapped[str | None] = mapped_column(
        String(100), comment='原文中的出生表述，保留原始格式',
    )
    death_display: Mapped[str | None] = mapped_column(
        String(100), comment='原文中的逝世表述，保留原始格式',
    )
    avatar_url: Mapped[str | None] = mapped_column(
        String(500), comment='头像图片链接',
    )
    summary: Mapped[str | None] = mapped_column(Text, comment='人物简介文字')
    status: Mapped[str] = mapped_column(
        String(20), default='draft',
        comment='状态: draft=草稿, published=已发布',
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
    person_events: Mapped[list[PersonEvent]] = relationship(
        'PersonEvent', back_populates='person',
        cascade='all, delete-orphan',
    )
    aliases: Mapped[list[PersonAlias]] = relationship(
        'PersonAlias', back_populates='person',
        cascade='all, delete-orphan',
    )
    biographies: Mapped[list[BiographyText]] = relationship(
        'BiographyText', back_populates='person',
    )
    external_infos: Mapped[list[ExternalPersonInfo]] = relationship(
        'ExternalPersonInfo', back_populates='person',
        cascade='all, delete-orphan',
    )
    uploaded_files: Mapped[list[UploadedFile]] = relationship(
        'UploadedFile', back_populates='person',
    )
