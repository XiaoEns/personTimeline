"""
事件业务逻辑层。
封装事件的增删改查操作，含关联人物处理和筛选逻辑。
"""
from __future__ import annotations

from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.event import Event
from models.person_event import PersonEvent


class EventService:
    """事件 CRUD 操作。"""

    @staticmethod
    async def create(db: AsyncSession, data: dict) -> Event:
        """
        创建事件，若 data 中含 person_ids 则同时创建关联。
        参数:
            db: 数据库会话
            data: 事件字段字典（可含 person_ids）
        返回:
            已持久化的 Event ORM 对象（预加载 person_events）
        """
        person_ids: list[UUID] | None = data.pop('person_ids', None)

        event = Event(**data)
        db.add(event)
        await db.flush()

        if person_ids:
            for pid in person_ids:
                db.add(PersonEvent(person_id=pid, event_id=event.id))
            await db.flush()

        await db.commit()
        # 重新加载关联数据
        result = await db.execute(
            select(Event)
            .options(selectinload(Event.person_events).selectinload(PersonEvent.person))
            .where(Event.id == event.id)
        )
        return result.scalar_one()

    @staticmethod
    async def list(
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20,
        person_id: UUID | None = None,
        event_type: str | None = None,
        time_type: str | None = None,
        search: str | None = None,
        sort: str = 'sort_date',
    ) -> tuple[list[Event], int]:
        """
        事件分页列表，支持多维筛选和排序。
        参数:
            db: 数据库会话
            page: 页码（从 1 开始）
            page_size: 每页条数
            person_id: 按关联人物筛选
            event_type: 按事件类型筛选
            time_type: 按时间类型筛选
            search: 按标题模糊搜索
            sort: 排序字段（加 - 前缀表示降序）
        返回:
            (事件列表, 总记录数)
        """
        query = select(Event).options(selectinload(Event.person_events).selectinload(PersonEvent.person))
        count_query = select(func.count(Event.id))

        # 按关联人物筛选需要联表
        if person_id:
            query = query.join(PersonEvent).where(PersonEvent.person_id == person_id)
            count_query = count_query.join(PersonEvent).where(PersonEvent.person_id == person_id)

        if event_type:
            query = query.where(Event.event_type == event_type)
            count_query = count_query.where(Event.event_type == event_type)
        if time_type:
            query = query.where(Event.time_type == time_type)
            count_query = count_query.where(Event.time_type == time_type)
        if search:
            like = f'%{search}%'
            query = query.where(Event.title.ilike(like))
            count_query = count_query.where(Event.title.ilike(like))

        total = await db.scalar(count_query) or 0

        # 排序
        if sort.startswith('-'):
            field = getattr(Event, sort[1:], Event.sort_date)
            query = query.order_by(field.desc())
        else:
            field = getattr(Event, sort, Event.sort_date)
            query = query.order_by(field)

        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await db.execute(query)
        return list(result.scalars().all()), total

    @staticmethod
    async def get(db: AsyncSession, event_id: UUID) -> Event | None:
        """
        获取事件详情，预加载关联人物。
        参数:
            db: 数据库会话
            event_id: 事件 UUID
        返回:
            Event ORM 对象（预加载 person_events），或 None
        """
        result = await db.execute(
            select(Event)
            .options(selectinload(Event.person_events).selectinload(PersonEvent.person))
            .where(Event.id == event_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update(db: AsyncSession, event_id: UUID, data: dict) -> Event | None:
        """
        更新事件信息，只修改提供的字段。
        参数:
            db: 数据库会话
            event_id: 事件 UUID
            data: 待更新字段字典
        返回:
            更新后的 Event 对象，或 None（不存在时）
        """
        event = await db.get(Event, event_id)
        if not event:
            return None
        for key, value in data.items():
            setattr(event, key, value)
        await db.commit()
        await db.refresh(event)
        return event

    @staticmethod
    async def delete(db: AsyncSession, event_id: UUID) -> bool:
        """
        删除事件（级联删除关联的 person_event 记录）。
        参数:
            db: 数据库会话
            event_id: 事件 UUID
        返回:
            是否成功删除
        """
        event = await db.get(Event, event_id)
        if not event:
            return False
        await db.delete(event)
        await db.commit()
        return True

    # ---------- 人物-事件关联操作 ----------

    @staticmethod
    async def get_person_events(
        db: AsyncSession, person_id: UUID,
    ) -> list[tuple[PersonEvent, Event]]:
        """
        获取人物关联的所有事件（含关联信息）。
        参数:
            db: 数据库会话
            person_id: 人物 UUID
        返回:
            (PersonEvent, Event) 元组列表，按 sort_order 升序
        """
        result = await db.execute(
            select(PersonEvent, Event)
            .options(selectinload(Event.person_events).selectinload(PersonEvent.person))
            .join(Event, PersonEvent.event_id == Event.id)
            .where(PersonEvent.person_id == person_id)
            .order_by(PersonEvent.sort_order, Event.sort_date)
        )
        return result.all()

    @staticmethod
    async def create_person_event(
        db: AsyncSession, person_id: UUID, data: dict,
    ) -> PersonEvent:
        """
        关联事件到人物。若已存在关联则返回 None。
        参数:
            db: 数据库会话
            person_id: 人物 UUID
            data: 关联数据字典（需含 event_id）
        返回:
            新创建的 PersonEvent 对象
        抛出:
            ValueError: 关联已存在或事件/人物不存在
        """
        event_id: UUID = data['event_id']

        # 检查是否已存在关联
        existing = await db.execute(
            select(PersonEvent).where(
                PersonEvent.person_id == person_id,
                PersonEvent.event_id == event_id,
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError('该事件已关联到此人物')

        pe = PersonEvent(person_id=person_id, **data)
        db.add(pe)
        await db.commit()
        await db.refresh(pe)
        return pe

    @staticmethod
    async def update_person_event(
        db: AsyncSession, pe_id: UUID, data: dict,
    ) -> PersonEvent | None:
        """
        更新关联信息。
        参数:
            db: 数据库会话
            pe_id: 关联记录 UUID
            data: 待更新字段字典
        返回:
            更新后的 PersonEvent 对象，或 None（不存在时）
        """
        pe = await db.get(PersonEvent, pe_id)
        if not pe:
            return None
        for key, value in data.items():
            setattr(pe, key, value)
        await db.commit()
        await db.refresh(pe)
        return pe

    @staticmethod
    async def delete_person_event(db: AsyncSession, pe_id: UUID) -> bool:
        """
        解除人物与事件的关联。
        参数:
            db: 数据库会话
            pe_id: 关联记录 UUID
        返回:
            是否成功删除
        """
        pe = await db.get(PersonEvent, pe_id)
        if not pe:
            return False
        await db.delete(pe)
        await db.commit()
        return True
