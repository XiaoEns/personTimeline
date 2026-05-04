"""
事件相关 Pydantic Schema。
对应 OpenAPI 中 Event / EventCreate / EventUpdate / EventListItem / EventDetail。
"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from schemas.common import Pagination


class PersonRef(BaseModel):
    """事件中关联的人物摘要。"""
    id: UUID
    name: str
    role: str | None = None


class Event(BaseModel):
    """事件响应。"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str = Field(max_length=500)
    description: str | None = None
    start_date: datetime
    end_date: datetime
    display_time: str | None = Field(None, max_length=200)
    time_type: str = Field(max_length=10)
    sort_date: datetime
    granularity: str = Field(max_length=10)
    event_type: str = Field(max_length=30)
    location: dict = {}
    is_inferred: bool = False
    source: str | None = Field(None, max_length=1000)
    created_at: datetime
    updated_at: datetime


class EventCreate(BaseModel):
    """创建事件请求。"""
    title: str = Field(max_length=500)
    description: str | None = None
    start_date: datetime
    end_date: datetime
    display_time: str | None = Field(None, max_length=200)
    time_type: str = Field(max_length=10)
    granularity: str = Field(max_length=10)
    event_type: str = Field(max_length=30)
    location: dict | None = None
    source: str | None = Field(None, max_length=1000)
    person_ids: list[UUID] | None = None


class EventUpdate(BaseModel):
    """更新事件请求（所有字段可选）。"""
    title: str | None = Field(None, max_length=500)
    description: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    display_time: str | None = Field(None, max_length=200)
    time_type: str | None = Field(None, max_length=10)
    granularity: str | None = Field(None, max_length=10)
    event_type: str | None = Field(None, max_length=30)
    location: dict | None = None
    source: str | None = Field(None, max_length=1000)


class EventListItem(BaseModel):
    """事件列表项。"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    start_date: datetime
    end_date: datetime
    display_time: str | None = None
    time_type: str
    event_type: str
    sort_date: datetime
    is_inferred: bool = False
    persons: list[PersonRef] = []
    created_at: datetime


class PaginatedEvents(Pagination):
    """分页事件列表响应。"""
    items: list[EventListItem]


class EventDetail(Event):
    """事件详情（含关联人物）。"""
    persons: list[PersonRef] = []


# ---------- 人物-事件关联 ----------

class PersonEventResponse(BaseModel):
    """人物-事件关联响应。"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    person_id: UUID
    event_id: UUID
    role: str | None = Field(None, max_length=100)
    personal_title: str | None = Field(None, max_length=500)
    personal_display_time: str | None = Field(None, max_length=200)
    personal_start_date: datetime | None = None
    personal_end_date: datetime | None = None
    is_primary: bool = False
    sort_order: int = 0
    created_at: datetime
    updated_at: datetime


class PersonEventCreate(BaseModel):
    """关联事件到人物请求。"""
    event_id: UUID
    role: str | None = Field(None, max_length=100)
    personal_title: str | None = Field(None, max_length=500)
    personal_display_time: str | None = Field(None, max_length=200)
    is_primary: bool = False
    sort_order: int = 0


class PersonEventUpdate(BaseModel):
    """更新关联信息请求（所有字段可选）。"""
    role: str | None = Field(None, max_length=100)
    personal_title: str | None = Field(None, max_length=500)
    personal_display_time: str | None = Field(None, max_length=200)
    is_primary: bool | None = None
    sort_order: int | None = None


class PersonEventItem(BaseModel):
    """人物关联的事件列表项。"""
    event_id: UUID
    title: str
    personal_title: str | None = None
    role: str | None = None
    sort_order: int = 0
    start_date: datetime
    end_date: datetime
    time_type: str
    event_type: str


class PersonEventList(BaseModel):
    """人物关联的事件列表响应。"""
    items: list[PersonEventItem]
