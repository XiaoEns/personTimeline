"""
事件 ORM 模型。
对应 event 表，存储独立于人物的标准事件（标题、时间、类型、地点等）。
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import text, String, Text, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.person_event import PersonEvent


class Event(Base):
    """标准事件模型，独立于人物，去除个人视角差异。"""
    __tablename__ = 'event'

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True,
        server_default=text('gen_random_uuid()'),
        comment='主键 UUID',
    )
    title: Mapped[str] = mapped_column(
        String(500), comment='标准事件标题，去除个人视角差异的统一标题',
    )
    description: Mapped[str | None] = mapped_column(
        Text, comment='事件的公共描述',
    )
    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        comment='事件开始时间，精确到秒，时间段事件取起始日 00:00:00',
    )
    end_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        comment='事件结束时间，点事件与 start_date 相同',
    )
    display_time: Mapped[str | None] = mapped_column(
        String(200), comment='原文中的时间表述，保留原始格式',
    )
    time_type: Mapped[str] = mapped_column(
        String(10),
        comment='时间类型: POINT=时间点, PERIOD=时间段, FUZZY=模糊时段',
    )
    sort_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        comment='排序基准日，用于时间轴排序（时间段取 start_date）',
    )
    granularity: Mapped[str] = mapped_column(
        String(10), comment='时间粒度: YEAR/MONTH/DAY/SEASON',
    )
    event_type: Mapped[str] = mapped_column(
        String(30), comment='事件类型分类',
    )
    location: Mapped[dict] = mapped_column(
        JSONB, server_default=text("'{}'::jsonb"),
        comment='地点 JSON，包含名称和坐标',
    )
    is_inferred: Mapped[bool] = mapped_column(
        Boolean, default=False,
        comment='是否由 AI 自动推断而非人工确认',
    )
    source: Mapped[str | None] = mapped_column(
        String(1000), comment='事件信息来源（书名、URL 等）',
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
        'PersonEvent', back_populates='event',
        cascade='all, delete-orphan',
    )
