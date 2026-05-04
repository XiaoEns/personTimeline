"""
别名管理 API 路由。
提供人物别名的增删查接口（GET/POST/DELETE）。
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.alias import Alias, AliasCreate, AliasList
from services.person_service import PersonService

router = APIRouter(prefix='/api/persons/{person_id}/aliases', tags=['别名管理'])


@router.get('', response_model=AliasList)
async def list_aliases(
    person_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    获取人物所有别名。
    返回别名字符串列表。
    """
    aliases = await PersonService.list_aliases(db, UUID(person_id))
    return AliasList(items=[a.alias for a in aliases])


@router.post('', response_model=Alias, status_code=201)
async def create_alias(
    person_id: str,
    data: AliasCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    为人物添加别名。
    若别名已存在则返回 409 冲突。
    """
    try:
        pa = await PersonService.create_alias(db, UUID(person_id), data.alias)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return pa


@router.delete('/{alias}', status_code=204)
async def delete_alias(
    person_id: str,
    alias: str,
    db: AsyncSession = Depends(get_db),
):
    """
    删除人物别名。
    注意 URL 中的别名需进行 URL 编码（中文等特殊字符）。
    """
    deleted = await PersonService.delete_alias(db, UUID(person_id), alias)
    if not deleted:
        raise HTTPException(status_code=404, detail='别名不存在')
    return None
