"""
人物别名 ORM 模型。
对应 person_alias 表，用于 NER 识别时通过别名匹配到标准人物。
"""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.person import Person


class PersonAlias(Base):
    """人物别名模型，以别名本身作为主键。"""
    __tablename__ = 'person_alias'

    alias: Mapped[str] = mapped_column(
        String(200), primary_key=True,
        comment='别名/曾用名/字/号等，作为主键',
    )
    person_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('person.id', ondelete='CASCADE'),
        comment='关联的标准人物 ID',
    )

    # 关系
    person: Mapped[Person] = relationship('Person', back_populates='aliases')
