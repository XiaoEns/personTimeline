"""
人物-事件关联 ORM 模型。
对应 person_event 表，记录每个人物在事件中的角色和个人视角差异。
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import text, String, Boolean, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.person import Person
    from models.event import Event


class PersonEvent(Base):
    """人物-事件关联模型，记录角色、个人视角标题和时间表述差异。"""
    __tablename__ = 'person_event'
    __table_args__ = (
        UniqueConstraint('person_id', 'event_id', name='uq_person_event'),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True,
        server_default=text('gen_random_uuid()'),
        comment='主键 UUID',
    )
    person_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('person.id', ondelete='CASCADE'),
        comment='人物 ID，引用 person 表',
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('event.id', ondelete='CASCADE'),
        comment='事件 ID，引用 event 表',
    )
    role: Mapped[str | None] = mapped_column(
        String(100),
        comment='人物在该事件中的角色（主持/参与/见证/作者等）',
    )
    personal_title: Mapped[str | None] = mapped_column(
        String(500), comment='该人物视角下的原始事件标题，保留原文表述',
    )
    personal_display_time: Mapped[str | None] = mapped_column(
        String(200), comment='该人物相关的时间原文表述',
    )
    personal_start_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        comment='该人物视角的时间差异，若与标准时间不同可记录',
    )
    personal_end_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        comment='该人物视角的结束时间差异',
    )
    is_primary: Mapped[bool] = mapped_column(
        Boolean, default=False,
        comment='是否为主要相关人物',
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, default=0,
        comment='排序权重，数值越小越靠前',
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
    person: Mapped[Person] = relationship('Person', back_populates='person_events')
    event: Mapped[Event] = relationship('Event', back_populates='person_events')
