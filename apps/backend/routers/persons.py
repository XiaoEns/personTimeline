"""
人物管理 API 路由。
提供人物的增删改查接口（POST/GET/GET/PUT/DELETE）。
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.person import Person
from schemas.person import (
    PersonCreate,
    PersonDetail,
    PersonListItem,
    PersonUpdate,
    PaginatedPersons,
)
from services.person_service import PersonService

router = APIRouter(prefix='/api/persons', tags=['人物管理'])


def _build_detail(person: Person) -> PersonDetail:
    """
    将 Person ORM 对象组装为 PersonDetail 响应。
    参数:
        person: 已预加载 person_events 和 aliases 的 Person 对象
    返回:
        PersonDetail schema
    """
    return PersonDetail(
        id=person.id,
        name=person.name,
        birth_date=person.birth_date,
        death_date=person.death_date,
        birth_display=person.birth_display,
        death_display=person.death_display,
        avatar_url=person.avatar_url,
        summary=person.summary,
        status=person.status,
        created_at=person.created_at,
        updated_at=person.updated_at,
        event_count=len(person.person_events) if person.person_events else 0,
        aliases=[a.alias for a in person.aliases] if person.aliases else [],
    )


def _build_list_item(person: Person) -> PersonListItem:
    """
    将 Person ORM 对象组装为 PersonListItem。
    """
    return PersonListItem(
        id=person.id,
        name=person.name,
        birth_date=person.birth_date,
        death_date=person.death_date,
        avatar_url=person.avatar_url,
        summary=person.summary,
        status=person.status,
        event_count=len(person.person_events) if person.person_events else 0,
        created_at=person.created_at,
        updated_at=person.updated_at,
    )


@router.post('', response_model=PersonDetail, status_code=201)
async def create_person(
    data: PersonCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    创建人物。
    请求体中的字段除 name 外均为可选。
    """
    try:
        person = await PersonService.create(db, data.model_dump(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return PersonDetail(
        **person.__dict__,
        event_count=0,
        aliases=[],
    )


@router.get('', response_model=PaginatedPersons)
async def list_persons(
    page: int = Query(1, ge=1, description='页码，从 1 开始'),
    page_size: int = Query(20, ge=1, description='每页条数'),
    search: str | None = Query(None, max_length=200, description='按姓名模糊搜索'),
    status: str | None = Query(None, description='按状态筛选'),
    db: AsyncSession = Depends(get_db),
):
    """
    人物列表，支持分页、姓名模糊搜索和状态筛选。
    """
    persons, total = await PersonService.list(db, page, page_size, search, status)
    items = [_build_list_item(p) for p in persons]
    return PaginatedPersons(items=items, total=total, page=page, page_size=page_size)


@router.get('/{person_id}', response_model=PersonDetail)
async def get_person(
    person_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    获取人物详情，包含关联事件数量和别名列表。
    """
    person = await PersonService.get(db, UUID(person_id))
    if not person:
        raise HTTPException(status_code=404, detail='人物不存在')
    return _build_detail(person)


@router.put('/{person_id}', response_model=PersonDetail)
async def update_person(
    person_id: str,
    data: PersonUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    更新人物信息。所有字段可选，只更新提供的字段。
    """
    updated = await PersonService.update(db, UUID(person_id), data.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail='人物不存在')
    # 重新获取以加载关联数据
    person = await PersonService.get(db, updated.id)
    if not person:
        raise HTTPException(status_code=404, detail='人物不存在')
    return _build_detail(person)


@router.delete('/{person_id}', status_code=204)
async def delete_person(
    person_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    删除人物。级联删除关联数据（事件关联、别名、传记文本等）。
    """
    deleted = await PersonService.delete(db, UUID(person_id))
    if not deleted:
        raise HTTPException(status_code=404, detail='人物不存在')
    return None
