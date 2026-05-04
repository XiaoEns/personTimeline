"""
人物业务逻辑层。
封装人物的增删改查操作，返回 ORM 对象供路由层组装响应。
"""
from __future__ import annotations

from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError

from models.person import Person
from models.person_alias import PersonAlias


class PersonService:
    """人物 CRUD 操作。"""

    @staticmethod
    async def create(db: AsyncSession, data: dict) -> Person:
        """
        创建人物。
        参数:
            db: 数据库会话
            data: 人物字段字典
        返回:
            已持久化的 Person ORM 对象
        """
        person = Person(**data)
        db.add(person)
        await db.commit()
        await db.refresh(person)
        return person

    @staticmethod
    async def list(
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        status: str | None = None,
    ) -> tuple[list[Person], int]:
        """
        人物分页列表，支持姓名模糊搜索和状态筛选。
        参数:
            db: 数据库会话
            page: 页码（从 1 开始）
            page_size: 每页条数
            search: 姓名搜索关键词
            status: 状态筛选
        返回:
            (人物列表, 总记录数)
        """
        query = select(Person).options(selectinload(Person.person_events))
        count_query = select(func.count(Person.id))

        if search:
            like = f'%{search}%'
            query = query.where(Person.name.ilike(like))
            count_query = count_query.where(Person.name.ilike(like))
        if status:
            query = query.where(Person.status == status)
            count_query = count_query.where(Person.status == status)

        total = await db.scalar(count_query) or 0

        query = query.order_by(Person.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await db.execute(query)
        return list(result.scalars().all()), total

    @staticmethod
    async def get(db: AsyncSession, person_id: UUID) -> Person | None:
        """
        获取人物详情，预加载关联事件和别名。
        参数:
            db: 数据库会话
            person_id: 人物 UUID
        返回:
            Person ORM 对象，或 None（不存在时）
        """
        result = await db.execute(
            select(Person)
            .options(selectinload(Person.person_events), selectinload(Person.aliases))
            .where(Person.id == person_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update(db: AsyncSession, person_id: UUID, data: dict) -> Person | None:
        """
        更新人物信息，只修改提供的字段。
        参数:
            db: 数据库会话
            person_id: 人物 UUID
            data: 待更新字段字典
        返回:
            更新后的 Person 对象，或 None（不存在时）
        """
        person = await db.get(Person, person_id)
        if not person:
            return None
        for key, value in data.items():
            setattr(person, key, value)
        await db.commit()
        await db.refresh(person)
        return person

    @staticmethod
    async def delete(db: AsyncSession, person_id: UUID) -> bool:
        """
        删除人物（级联删除关联的事件关联、别名、传记文本等）。
        参数:
            db: 数据库会话
            person_id: 人物 UUID
        返回:
            是否成功删除
        """
        person = await db.get(Person, person_id)
        if not person:
            return False
        await db.delete(person)
        await db.commit()
        return True

    # ---------- 别名操作 ----------

    @staticmethod
    async def list_aliases(db: AsyncSession, person_id: UUID) -> list[PersonAlias]:
        """
        获取人物所有别名。
        参数:
            db: 数据库会话
            person_id: 人物 UUID
        返回:
            别名对象列表
        """
        result = await db.execute(
            select(PersonAlias).where(PersonAlias.person_id == person_id)
        )
        return list(result.scalars().all())

    @staticmethod
    async def create_alias(db: AsyncSession, person_id: UUID, alias: str) -> PersonAlias:
        """
        为人物添加别名。
        参数:
            db: 数据库会话
            person_id: 人物 UUID
            alias: 别名文本
        返回:
            新创建的 PersonAlias 对象
        抛出:
            ValueError: 别名已存在
        """
        pa = PersonAlias(person_id=person_id, alias=alias)
        db.add(pa)
        try:
            await db.commit()
            await db.refresh(pa)
            return pa
        except IntegrityError:
            await db.rollback()
            raise ValueError('别名已存在')

    @staticmethod
    async def delete_alias(db: AsyncSession, person_id: UUID, alias: str) -> bool:
        """
        删除人物别名。
        参数:
            db: 数据库会话
            person_id: 人物 UUID
            alias: 别名文本
        返回:
            是否成功删除
        """
        result = await db.execute(
            select(PersonAlias).where(
                PersonAlias.person_id == person_id,
                PersonAlias.alias == alias,
            )
        )
        pa = result.scalar_one_or_none()
        if not pa:
            return False
        await db.delete(pa)
        await db.commit()
        return True
