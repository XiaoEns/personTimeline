"""
文件上传与切片相关 Pydantic Schema。
对应 OpenAPI 中 UploadedFileResponse / UploadedFileItem / PaginatedUploadedFiles / ChunkResult。
"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from schemas.common import Pagination


class UploadedFileResponse(BaseModel):
    """上传文件完整响应（含 chunk_count 计算字段）。"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    original_name: str
    file_path: str
    file_size: int
    file_type: str
    person_id: UUID | None = None
    person_name: str | None = None
    status: str
    error_message: str | None = None
    chunk_count: int = 0
    created_at: datetime
    updated_at: datetime


class UploadedFileItem(BaseModel):
    """上传文件列表项（person_name 通过 JOIN person 表获取）。"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    original_name: str
    file_size: int
    file_type: str
    person_id: UUID | None = None
    person_name: str | None = None
    status: str
    error_message: str | None = None
    chunk_count: int = 0
    created_at: datetime


class PaginatedUploadedFiles(Pagination):
    """分页上传文件列表响应。"""
    items: list[UploadedFileItem]


class ChunkResult(BaseModel):
    """切片操作返回结果（触发或查询切片状态）。"""
    status: str
    chunk_count: int
