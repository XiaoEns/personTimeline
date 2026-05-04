"""
SQLAlchemy 异步引擎和会话管理。
提供数据库引擎初始化、会话工厂及 FastAPI 依赖注入函数。
"""
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from config import settings


engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """所有 ORM 模型的基类。"""


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI 依赖：获取异步数据库会话。
    请求结束后自动关闭会话。
    """
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
