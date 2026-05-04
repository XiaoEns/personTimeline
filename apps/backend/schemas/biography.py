"""
传记文本相关 Pydantic Schema。
对应 OpenAPI 中 BiographyText / BiographyTextItem / BiographyTextList。
"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class BiographyText(BaseModel):
    """传记文本响应（不含原始文本内容）。"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    person_id: UUID
    source_file: str | None = Field(None, max_length=500)
    page: int | None = None
    text_length: int = 0
    created_at: datetime


class BiographyTextItem(BaseModel):
    """传记文本列表项。"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    source_file: str | None = Field(None, max_length=500)
    text_length: int = 0
    created_at: datetime


class BiographyTextList(BaseModel):
    """传记文本列表响应。"""
    items: list[BiographyTextItem]


# ---------- AI 抽取 ----------

class ExtractRequest(BaseModel):
    """AI 事件抽取请求。"""
    biography_id: UUID | None = None
    model: str = 'default'


class ExtractEventItem(BaseModel):
    """抽取结果中的单个事件项。"""
    title: str
    description: str | None = None
    start_date: datetime
    end_date: datetime
    display_time: str | None = None
    time_type: str
    granularity: str
    event_type: str
    location: dict | None = None
    event_id: UUID
    is_inferred: bool = True


class ExtractResult(BaseModel):
    """AI 事件抽取结果。"""
    total: int
    events: list[ExtractEventItem]
