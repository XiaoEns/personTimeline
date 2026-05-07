"""
AI 事件抽取服务。
使用 LangChain + 结构化输出从传记文本中提取事件，支持自动人物解析与关联。
"""
import logging
from datetime import datetime
from uuid import UUID

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import async_session
from models.biography_text import BiographyText
from models.event import Event
from models.person import Person
from models.person_alias import PersonAlias
from models.person_event import PersonEvent
from models.uploaded_file import UploadedFile
from services.chunking_service import extract_text  # noqa: F401 已迁移至 chunking_service，保留向后兼容

logger = logging.getLogger(__name__)


# ============================================================================
# Pydantic 结构化输出模型（供 LLM json_schema 使用）
# ============================================================================

class ExtractedEventItem(BaseModel):
    """LLM 提取的单个事件项，用于结构化输出。"""
    title: str = Field(..., description='事件标题（简洁，10-30 字）')
    description: str | None = Field(None, description='事件描述（1-3 句话）')
    start_date: str = Field(..., description='事件开始时间（ISO 8601 格式，如 1660-01-01T00:00:00Z）')
    end_date: str = Field(..., description='事件结束时间（与 start_date 相同则为点事件）')
    display_time: str | None = Field(None, description='原文中的时间表述')
    time_type: str = Field(..., description='时间类型：POINT/PERIOD/FUZZY')
    granularity: str = Field(..., description='时间粒度：YEAR/MONTH/DAY/SEASON')
    event_type: str = Field(..., description='事件类型：BIRTH/DEATH/EDUCATION/CAREER/CREATION/HISTORICAL/OTHER')
    location_name: str | None = Field(None, description='地点名称')
    persons: list[str] = Field(default_factory=list, description='事件涉及的人物姓名列表')


class ExtractedEventList(BaseModel):
    """LLM 事件提取的结构化输出容器。"""
    events: list[ExtractedEventItem]


# ============================================================================
# LLM 提取系统提示词
# ============================================================================

EXTRACTION_SYSTEM_PROMPT = (
    '你是一个专业的历史人物事件抽取助手。从给定的传记文本中提取所有可识别的事件。\n\n'
    '要求：\n'
    '1. 只提取文本中明确提到的事件，不要编造\n'
    '2. 标题保留原文中的关键人物和动作，10-30 字\n'
    '3. 时间字段使用 ISO 8601 格式（如 "1660-01-01T00:00:00Z"）\n'
    '4. 若时间信息不完整，time_type 设为 FUZZY，start_date 用年份 01-01 补齐\n'
    '5. 若文本中完全没有时间信息，仍要提取事件，time_type 设为 FUZZY，'
    'start_date 和 end_date 使用 "0001-01-01T00:00:00Z"\n'
    '6. persons 字段填写事件涉及的所有人物姓名（字符串列表），包括隐含参与者\n'
    '7. 事件类型（event_type）可选值：BIRTH/DEATH/EDUCATION/CAREER/CREATION/HISTORICAL/OTHER\n'
    '8. 按照文本中出现的时间顺序排列事件\n'
    '9. location_name 填写事件发生的地点名称，未知则留空'
)

EXTRACTION_USER_PROMPT = '请从以下传记文本中提取事件：\n\n{text}'


# ============================================================================
# LLM 提取函数
# ============================================================================

async def extract_events_from_llm(text: str) -> ExtractedEventList:
    """
    使用 LangChain ChatOpenAI + 结构化输出（json_schema）从传记文本中提取事件。
    参数:
        text: 传记文本
    返回:
        ExtractedEventList 结构化事件列表
    抛出:
        TimeoutError: API 超时
        Exception: 其他 LLM 调用异常
    """
    llm = ChatOpenAI(
        api_key=settings.llm_api_key,
        base_url=settings.llm_api_base,
        model=settings.llm_model,
        temperature=0.1,
        timeout=60,
    )

    structured_llm = llm.with_structured_output(
        ExtractedEventList, method='json_schema',
    )

    prompt = ChatPromptTemplate.from_messages([
        ('system', EXTRACTION_SYSTEM_PROMPT),
        ('human', EXTRACTION_USER_PROMPT),
    ])

    chain = prompt | structured_llm
    result = await chain.ainvoke({'text': text})
    return result


# ============================================================================
# 人物解析
# ============================================================================

async def _resolve_persons(
    db: AsyncSession,
    person_names: list[str],
) -> list[UUID]:
    """
    根据姓名列表解析人物 ID：
      1. 在 person 表按 name 精确匹配 → 找到则收集 ID
      2. 在 person_alias 表按 alias 精确匹配 → 找到则收集对应的 person_id
      3. 都未找到 → 自动创建 Person(name=name, status='draft')
         + PersonAlias(alias=name, person_id=new_id) → 收集新 ID
    参数:
        db: 数据库会话
        person_names: 人物姓名列表（可能含重复）
    返回:
        去重后的 person_id 列表
    """
    resolved_ids: list[UUID] = []

    for name in person_names:
        if not name or not name.strip():
            continue
        name = name.strip()

        # 1. 精确匹配 person.name
        result = await db.execute(
            select(Person.id).where(Person.name == name),
        )
        person_id = result.scalar_one_or_none()
        if person_id:
            resolved_ids.append(person_id)
            continue

        # 2. 精确匹配 person_alias.alias
        result = await db.execute(
            select(PersonAlias.person_id).where(PersonAlias.alias == name),
        )
        person_id = result.scalar_one_or_none()
        if person_id:
            resolved_ids.append(person_id)
            continue

        # 3. 未找到 → 自动创建 Person + PersonAlias
        new_person = Person(name=name, status='draft')
        db.add(new_person)
        await db.flush()

        new_alias = PersonAlias(alias=name, person_id=new_person.id)
        db.add(new_alias)

        resolved_ids.append(new_person.id)
        logger.info('自动创建人物: name=%s, id=%s', name, new_person.id)

    # 去重保留首次出现顺序
    seen: set[UUID] = set()
    unique_ids: list[UUID] = []
    for pid in resolved_ids:
        if pid not in seen:
            seen.add(pid)
            unique_ids.append(pid)
    return unique_ids


# ============================================================================
# 文件级抽取后台任务
# ============================================================================

async def run_extraction_for_file(file_id: UUID) -> None:
    """
    异步后台任务：对指定上传文件执行 AI 事件抽取全流程。
    参数:
        file_id: 上传文件记录 ID
    流程:
        1. 获取独立 db session
        2. 更新 uploaded_files.status = 'extracting'
        3. 查询该文件所有 biography_text 切片（按 chunk_index 排序）
        4. 对每个切片调用 extract_events_from_llm()
        5. 合并所有事件 → 按 title + start_date 去重
        6. 对每个事件的 persons → 调用 _resolve_persons()
        7. 创建 Event（persons=名单, is_inferred=True, source='AI 抽取'）
        8. 批量创建 PersonEvent 关联
        9. 更新 uploaded_files.status = 'completed'
        10. 异常时设置 status='error' + error_message
    """
    async with async_session() as db:  # type: AsyncSession
        try:
            # 1. 查询上传文件记录
            result = await db.execute(
                select(UploadedFile).where(UploadedFile.id == file_id),
            )
            record = result.scalar_one_or_none()
            if not record:
                logger.error('文件记录不存在: %s', file_id)
                return

            # 2. 更新状态为 extracting
            record.status = 'extracting'
            await db.commit()

            # 3. 查询所有切片
            result = await db.execute(
                select(BiographyText)
                .where(BiographyText.file_id == file_id)
                .order_by(BiographyText.chunk_index),
            )
            chunks = list(result.scalars().all())

            if not chunks:
                raise ValueError('该文件没有切片记录，请先执行切片')

            # 4. 逐切片调用 LLM 提取
            all_raw_events: list[ExtractedEventItem] = []
            for i, chunk in enumerate(chunks):
                logger.info(
                    '正在抽取切片 %d/%d: file_id=%s',
                    i + 1, len(chunks), file_id,
                )
                extracted = await extract_events_from_llm(chunk.raw_text)
                all_raw_events.extend(extracted.events)

            # 5. 按 title + start_date 去重（保留首次出现）
            seen_keys: set[tuple[str, str]] = set()
            unique_events: list[ExtractedEventItem] = []
            for ev in all_raw_events:
                key = (ev.title, ev.start_date)
                if key not in seen_keys:
                    seen_keys.add(key)
                    unique_events.append(ev)

            # 6-8. 创建 Event + PersonEvent
            for ev in unique_events:
                # 解析人物 ID
                person_ids = await _resolve_persons(db, ev.persons)

                # 解析时间字符串
                try:
                    start_date = datetime.fromisoformat(ev.start_date)
                except ValueError:
                    start_date = datetime(1, 1, 1)
                try:
                    end_date = datetime.fromisoformat(ev.end_date)
                except ValueError:
                    end_date = start_date

                # 构建 location JSON
                location: dict = {}
                if ev.location_name:
                    location = {'name': ev.location_name}

                # 创建 Event
                event = Event(
                    title=ev.title,
                    description=ev.description,
                    start_date=start_date,
                    end_date=end_date,
                    display_time=ev.display_time,
                    time_type=ev.time_type,
                    sort_date=start_date,
                    granularity=ev.granularity,
                    event_type=ev.event_type,
                    location=location,
                    persons=ev.persons,
                    is_inferred=True,
                    source='AI 抽取',
                )
                db.add(event)
                await db.flush()

                # 创建 PersonEvent 关联
                for pid in person_ids:
                    pe = PersonEvent(person_id=pid, event_id=event.id)
                    db.add(pe)

            # 9. 更新状态为 completed
            record.status = 'completed'
            await db.commit()
            logger.info(
                '抽取完成: file_id=%s, original_name=%s, events=%d',
                file_id, record.original_name, len(unique_events),
            )

        except Exception:
            logger.exception('抽取失败: file_id=%s', file_id)
            try:
                result = await db.execute(
                    select(UploadedFile).where(UploadedFile.id == file_id),
                )
                record = result.scalar_one_or_none()
                if record:
                    record.status = 'error'
                    record.error_message = f'抽取失败: {file_id}'
                    await db.commit()
            except Exception:
                logger.exception('更新错误状态失败: file_id=%s', file_id)


# ============================================================================
# 人物级抽取（兼容旧接口，已迁移为对人物所有文件启动后台抽取）
# ============================================================================

async def run_extraction(
    db: AsyncSession,
    person_id: UUID,
    biography_id: UUID | None = None,
    model_choice: str = 'default',
) -> list[Event]:
    """
    对人物的所有已切片文件启动后台 AI 事件抽取。
    参数:
        db: 数据库会话
        person_id: 人物 ID
        biography_id: 保留参数（兼容旧接口，新版本忽略）
        model_choice: 保留参数（兼容旧接口，新版本忽略）
    返回:
        空列表（抽取已转为异步后台任务，通过 polling 获取结果）
    抛出:
        ValueError: 未找到可抽取的文件
    """
    import asyncio

    # 查询该人物所有可抽取的文件
    result = await db.execute(
        select(UploadedFile).where(
            UploadedFile.person_id == person_id,
            UploadedFile.status.in_(['chunked', 'completed']),
        ),
    )
    files = list(result.scalars().all())

    if not files:
        raise ValueError('未找到可抽取的文件，请先上传并切片文件')

    for f in files:
        asyncio.create_task(run_extraction_for_file(f.id))
        logger.info(
            '已启动后台抽取: file_id=%s, person_id=%s, original_name=%s',
            f.id, person_id, f.original_name,
        )

    return []
