"""
别名相关 Pydantic Schema。
对应 OpenAPI 中 Alias / AliasCreate / AliasList。
"""
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class Alias(BaseModel):
    """别名响应。"""
    model_config = ConfigDict(from_attributes=True)

    alias: str
    person_id: UUID


class AliasCreate(BaseModel):
    """添加别名请求。"""
    alias: str = Field(max_length=200)


class AliasList(BaseModel):
    """别名列表响应。"""
    items: list[str]
