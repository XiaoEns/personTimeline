"""
人物相关 Pydantic Schema。
对应 OpenAPI 中 Person / PersonCreate / PersonUpdate / PersonListItem / PersonDetail。
"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from schemas.common import Pagination


class Person(BaseModel):
    """人物响应。"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str = Field(max_length=200)
    birth_date: datetime | None = None
    death_date: datetime | None = None
    birth_display: str | None = Field(None, max_length=100)
    death_display: str | None = Field(None, max_length=100)
    avatar_url: str | None = Field(None, max_length=500)
    summary: str | None = None
    status: str = 'draft'
    created_at: datetime
    updated_at: datetime


class PersonCreate(BaseModel):
    """创建人物请求。"""
    name: str = Field(max_length=200)
    birth_date: datetime | None = None
    death_date: datetime | None = None
    birth_display: str | None = Field(None, max_length=100)
    death_display: str | None = Field(None, max_length=100)
    avatar_url: str | None = Field(None, max_length=500)
    summary: str | None = None


class PersonUpdate(BaseModel):
    """更新人物请求（所有字段可选）。"""
    name: str | None = Field(None, max_length=200)
    birth_date: datetime | None = None
    death_date: datetime | None = None
    birth_display: str | None = Field(None, max_length=100)
    death_display: str | None = Field(None, max_length=100)
    avatar_url: str | None = Field(None, max_length=500)
    summary: str | None = None
    status: str | None = None


class PersonListItem(BaseModel):
    """人物列表项。"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    birth_date: datetime | None = None
    death_date: datetime | None = None
    avatar_url: str | None = None
    summary: str | None = None
    status: str
    event_count: int = 0
    created_at: datetime
    updated_at: datetime


class PaginatedPersons(Pagination):
    """分页人物列表响应。"""
    items: list[PersonListItem]


class PersonDetail(Person):
    """人物详情（含关联事件数和别名）。"""
    event_count: int = 0
    aliases: list[str] = []
