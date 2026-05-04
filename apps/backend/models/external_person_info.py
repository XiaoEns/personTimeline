"""
外部人物信息 ORM 模型。
对应 external_person_info 表，存储从维基数据等外部来源自动采集的人物信息。
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import text, String, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.person import Person


class ExternalPersonInfo(Base):
    """外部人物信息模型，存储自动采集的外部数据。"""
    __tablename__ = 'external_person_info'

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True,
        server_default=text('gen_random_uuid()'),
        comment='主键 UUID',
    )
    person_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('person.id', ondelete='CASCADE'),
        comment='关联人物 ID',
    )
    source_url: Mapped[str | None] = mapped_column(
        String(1000), comment='信息来源 URL',
    )
    source_name: Mapped[str | None] = mapped_column(
        String(200), comment='来源名称',
    )
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text('NOW()'),
        comment='采集时间',
    )
    confidence: Mapped[float | None] = mapped_column(
        Float, comment='信息置信度 0-1',
    )
    data: Mapped[dict] = mapped_column(
        JSONB, server_default=text("'{}'::jsonb"),
        comment='采集的原始数据 JSON',
    )

    # 关系
    person: Mapped[Person] = relationship('Person', back_populates='external_infos')
