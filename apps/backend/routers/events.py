"""
事件管理 API 路由。
提供事件的增删改查接口（POST/GET/GET/PUT/DELETE）。
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.event import Event
from schemas.event import (
    EventCreate,
    EventDetail,
    EventListItem,
    EventUpdate,
    PaginatedEvents,
    PersonRef,
)
from services.event_service import EventService

router = APIRouter(prefix='/api/events', tags=['事件管理'])


def _build_person_refs(event: Event) -> list[PersonRef]:
    """
    从事件的 person_events 关联中提取关联人物列表。
    参数:
        event: 已预加载 person_events 的 Event 对象
    返回:
        PersonRef 列表
    """
    refs = []
    for pe in event.person_events or []:
        refs.append(PersonRef(
            id=pe.person_id,
            name=pe.person.name if pe.person else '',
            role=pe.role,
        ))
    return refs


def _build_detail(event: Event) -> EventDetail:
    """
    将 Event ORM 对象组装为 EventDetail 响应。
    """
    return EventDetail(
        id=event.id,
        title=event.title,
        description=event.description,
        start_date=event.start_date,
        end_date=event.end_date,
        display_time=event.display_time,
        time_type=event.time_type,
        sort_date=event.sort_date,
        granularity=event.granularity,
        event_type=event.event_type,
        location=event.location or {},
        is_inferred=event.is_inferred,
        source=event.source,
        created_at=event.created_at,
        updated_at=event.updated_at,
        persons=_build_person_refs(event),
    )


def _build_list_item(event: Event) -> EventListItem:
    """
    将 Event ORM 对象组装为 EventListItem。
    """
    return EventListItem(
        id=event.id,
        title=event.title,
        start_date=event.start_date,
        end_date=event.end_date,
        display_time=event.display_time,
        time_type=event.time_type,
        event_type=event.event_type,
        sort_date=event.sort_date,
        is_inferred=event.is_inferred,
        persons=_build_person_refs(event),
        created_at=event.created_at,
    )


@router.post('', response_model=EventDetail, status_code=201)
async def create_event(
    data: EventCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    创建事件。
    可选的 person_ids 字段用于在创建时直接关联人物。
    """
    event_data = data.model_dump(exclude_unset=True)
    event = await EventService.create(db, event_data)
    return _build_detail(event)


@router.get('', response_model=PaginatedEvents)
async def list_events(
    page: int = Query(1, ge=1, description='页码，从 1 开始'),
    page_size: int = Query(20, ge=1, le=100, description='每页条数'),
    person_id: str | None = Query(None, description='按关联人物 UUID 筛选'),
    event_type: str | None = Query(None, description='按事件类型筛选'),
    time_type: str | None = Query(None, description='按时间类型筛选'),
    search: str | None = Query(None, max_length=500, description='按标题模糊搜索'),
    sort: str = Query('sort_date', description='排序字段，加 - 前缀降序'),
    db: AsyncSession = Depends(get_db),
):
    """
    事件列表，支持多维筛选、分页和排序。
    """
    pid = UUID(person_id) if person_id else None
    events, total = await EventService.list(
        db, page, page_size, pid, event_type, time_type, search, sort,
    )
    items = [_build_list_item(e) for e in events]
    return PaginatedEvents(items=items, total=total, page=page, page_size=page_size)


@router.get('/{event_id}', response_model=EventDetail)
async def get_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    获取事件详情，包含关联人物列表。
    """
    event = await EventService.get(db, UUID(event_id))
    if not event:
        raise HTTPException(status_code=404, detail='事件不存在')
    return _build_detail(event)


@router.put('/{event_id}', response_model=EventDetail)
async def update_event(
    event_id: str,
    data: EventUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    更新事件信息。所有字段可选，只更新提供的字段。
    """
    updated = await EventService.update(db, UUID(event_id), data.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail='事件不存在')
    # 重新加载关联数据
    event = await EventService.get(db, updated.id)
    if not event:
        raise HTTPException(status_code=404, detail='事件不存在')
    return _build_detail(event)


@router.delete('/{event_id}', status_code=204)
async def delete_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    删除事件。级联删除关联的 person_event 记录。
    """
    deleted = await EventService.delete(db, UUID(event_id))
    if not deleted:
        raise HTTPException(status_code=404, detail='事件不存在')
    return None
