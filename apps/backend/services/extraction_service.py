"""
文件文本提取服务 + AI 事件抽取服务。
支持 TXT/PDF 文本提取（同步），以及调用大模型从传记文本中提取结构化事件（异步）。
"""
import json
from uuid import UUID

import fitz
from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config import settings
from models.biography_text import BiographyText
from models.event import Event
from models.person_event import PersonEvent

# LLM 事件抽取系统提示词
EXTRACTION_PROMPT = (
    '你是一个专业的历史人物事件抽取助手。从给定的传记文本中提取所有可识别的事件，'
    '以 JSON 格式返回。\n\n'
    '每个事件需要包含以下字段：\n'
    '- title: 事件标题（简洁，10-30 字）\n'
    '- description: 事件描述（可选，1-3 句话）\n'
    '- start_date: 事件开始时间（ISO 8601 格式，如 "1660-01-01T00:00:00Z"）\n'
    '- end_date: 事件结束时间（与 start_date 相同则为点事件）\n'
    '- display_time: 原文中的时间表述（可选）\n'
    '- time_type: 时间类型（"POINT"/"PERIOD"/"FUZZY"）\n'
    '- granularity: 时间粒度（"YEAR"/"MONTH"/"DAY"/"SEASON"）\n'
    '- event_type: 事件类型（"BIRTH"/"DEATH"/"EDUCATION"/"CAREER"/"CREATION"/"HISTORICAL"/"OTHER"）\n'
    '- location: 地点信息（可选，包含 name 字段的对象）\n\n'
    '注意事项：\n'
    '1. 只提取文本中明确提到的事件，不要编造\n'
    '2. 标题保留原文中的关键人物和动作\n'
    '3. 若时间信息不完整，time_type 设为 FUZZY，start_date 用年份 01-01\n'
    '4. 按照文本中出现的时间顺序排列事件\n\n'
    '请以如下 JSON 格式返回（不要用 markdown 代码块包裹）：\n'
    '{"events": [...]}'
)


def extract_text(content: bytes, filename: str) -> str:
    """
    从文件中提取纯文本内容，根据文件扩展名选择提取方式。
    参数:
        content: 文件二进制内容
        filename: 文件名（用于判断格式）
    返回:
        提取的纯文本
    抛出:
        ValueError: 不支持的文件格式
    """
    lower_name = filename.lower()

    if lower_name.endswith('.txt'):
        return content.decode('utf-8')

    if lower_name.endswith('.pdf'):
        doc = fitz.open(stream=content, filetype='pdf')
        parts = []
        for page in doc:
            parts.append(page.get_text())
        doc.close()
        return '\n'.join(parts)

    raise ValueError('不支持的文件格式，仅支持 .txt 和 .pdf')


async def extract_events_from_llm(
    text: str,
    model_choice: str = 'default',
) -> list[dict]:
    """
    调用大模型从传记文本中提取事件列表。
    参数:
        text: 传记文本
        model_choice: 模型选择（default/gpt/qwen）
    返回:
        事件字典列表
    抛出:
        TimeoutError: API 超时
        ValueError: 响应解析失败
    """
    client = AsyncOpenAI(
        api_key=settings.llm_api_key,
        base_url=settings.llm_api_base,
    )

    model_map = {
        'default': settings.llm_model,
        'gpt': 'gpt-4o-mini',
        'qwen': 'qwen-plus',
    }
    model_name = model_map.get(model_choice, settings.llm_model)

    response = await client.chat.completions.create(
        model=model_name,
        messages=[
            {'role': 'system', 'content': EXTRACTION_PROMPT},
            {'role': 'user', 'content': text},
        ],
        temperature=0.1,
        timeout=60,
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError('LLM 返回为空')

    # 清理可能存在的 markdown 代码块包裹
    content = content.strip()
    if content.startswith('```'):
        # 移除开头的 ```json 或 ``` 和结尾的 ```
        content = content.split('\n', 1)[-1] if '\n' in content else content
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()

    data = json.loads(content)
    events = data.get('events', [])
    if not isinstance(events, list):
        raise ValueError('LLM 响应格式错误：events 字段不是数组')
    return events


async def run_extraction(
    db: AsyncSession,
    person_id: UUID,
    biography_id: UUID | None = None,
    model_choice: str = 'default',
) -> list[Event]:
    """
    执行完整的 AI 事件抽取流程：
      1. 获取传记文本
      2. 调用 LLM 提取结构化事件
      3. 自动创建 Event 和 PersonEvent 记录
    参数:
        db: 数据库会话
        person_id: 人物 ID
        biography_id: 指定传记文本 ID（为 None 则使用所有文本）
        model_choice: 模型选择
    返回:
        已创建的 Event 对象列表（预加载 person_events）
    抛出:
        ValueError: 未找到传记文本
    """
    # 1. 获取传记文本
    query = select(BiographyText).where(BiographyText.person_id == person_id)
    if biography_id:
        query = query.where(BiographyText.id == biography_id)
    query = query.order_by(BiographyText.created_at)

    result = await db.execute(query)
    texts = list(result.scalars().all())

    if not texts:
        raise ValueError('未找到传记文本，请先上传文件')

    combined = '\n---\n'.join(t.raw_text for t in texts)

    # 2. 调用 LLM
    raw_events = await extract_events_from_llm(combined, model_choice)

    # 3. 创建 Event + PersonEvent 记录
    created_events = []
    for ev in raw_events:
        location = ev.get('location') or {}

        event = Event(
            title=ev['title'],
            description=ev.get('description'),
            start_date=ev['start_date'],
            end_date=ev['end_date'],
            display_time=ev.get('display_time'),
            time_type=ev['time_type'],
            sort_date=ev['start_date'],
            granularity=ev['granularity'],
            event_type=ev['event_type'],
            location=location,
            is_inferred=True,
            source='AI 抽取',
        )
        db.add(event)
        await db.flush()

        pe = PersonEvent(person_id=person_id, event_id=event.id)
        db.add(pe)
        created_events.append(event)

    await db.commit()

    # 重新加载以获取关联数据
    if created_events:
        result = await db.execute(
            select(Event)
            .options(selectinload(Event.person_events))
            .where(Event.id.in_([e.id for e in created_events]))
        )
        return list(result.scalars().all())

    return []
