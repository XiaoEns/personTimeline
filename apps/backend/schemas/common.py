"""
通用 Pydantic Schema。
包含分页、错误响应等公用类型。
"""
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """错误响应。"""
    detail: str


class Pagination(BaseModel):
    """分页信息基类。"""
    total: int
    page: int
    page_size: int
