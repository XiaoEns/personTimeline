"""
人物-事件关联 API 路由。
提供绑定/解绑/更新/查询关联关系接口。
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.event import (
    PersonEventCreate,
    PersonEventItem,
    PersonEventList,
    PersonEventResponse,
    PersonEventUpdate,
)
from services.event_service import EventService

router = APIRouter(tags=['人物-事件关联'])


@router.get(
    '/api/persons/{person_id}/events',
    response_model=PersonEventList,
)
async def list_person_events(
    person_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    获取人物关联的所有事件。
    返回按 sort_order 和事件时间排序的事件列表。
    """
    rows = await EventService.get_person_events(db, UUID(person_id))
    items = [
        PersonEventItem(
            event_id=pe.id,
            title=e.title,
            personal_title=pe.personal_title,
            role=pe.role,
            sort_order=pe.sort_order,
            start_date=e.start_date,
            end_date=e.end_date,
            time_type=e.time_type,
            event_type=e.event_type,
        )
        for pe, e in rows
    ]
    return PersonEventList(items=items)


@router.post(
    '/api/persons/{person_id}/events',
    response_model=PersonEventResponse,
    status_code=201,
)
async def create_person_event(
    person_id: str,
    data: PersonEventCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    关联事件到人物。
    若已存在关联则返回 409 冲突。
    """
    try:
        pe = await EventService.create_person_event(
            db, UUID(person_id), data.model_dump(exclude_unset=True),
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return pe


@router.put(
    '/api/person-events/{person_event_id}',
    response_model=PersonEventResponse,
)
async def update_person_event(
    person_event_id: str,
    data: PersonEventUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    更新关联信息（角色、个人视角标题、排序等）。
    """
    pe = await EventService.update_person_event(
        db, UUID(person_event_id), data.model_dump(exclude_unset=True),
    )
    if not pe:
        raise HTTPException(status_code=404, detail='关联记录不存在')
    return pe


@router.delete(
    '/api/person-events/{person_event_id}',
    status_code=204,
)
async def delete_person_event(
    person_event_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    解除人物与事件的关联。
    """
    deleted = await EventService.delete_person_event(db, UUID(person_event_id))
    if not deleted:
        raise HTTPException(status_code=404, detail='关联记录不存在')
    return None
