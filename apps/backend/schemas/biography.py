"""
传记文本相关 Pydantic Schema。
对应 OpenAPI 中 BiographyText / BiographyTextItem / BiographyTextList / ChunkItem / ChunkTextResponse。
"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class BiographyText(BaseModel):
    """传记文本响应（不含原始文本内容）。"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    person_id: UUID | None = None
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


# ---------- 文件切片 ----------

class ChunkItem(BaseModel):
    """切片列表项（不含 raw_text 全文，仅含元数据）。"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    file_id: UUID | None = None
    chunk_index: int = 0
    text_length: int = 0
    page: int | None = None
    created_at: datetime


class ChunkListResponse(BaseModel):
    """切片列表响应。"""
    items: list[ChunkItem]
    total: int


class ChunkTextResponse(BaseModel):
    """单个切片完整文本响应。"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    chunk_index: int = 0
    raw_text: str


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
    persons: list[str] = []


class ExtractResult(BaseModel):
    """AI 事件抽取结果。"""
    total: int
    events: list[ExtractEventItem]


class FileExtractResponse(BaseModel):
    """文件级事件抽取响应（触发抽取或查询抽取状态）。"""
    file_id: UUID
    status: str
    result: ExtractResult | None = None
