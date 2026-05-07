"""
应用配置管理。
从环境变量加载配置项，提供统一的 Settings 对象供各模块使用。
"""
import logging
import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

# 加载 .env 文件（相对于本文件的路径）
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# 全局日志初始化（DEBUG 模式时输出调试日志）
_log_level = logging.DEBUG if os.getenv('DEBUG', 'false').lower() == 'true' else logging.INFO
logging.basicConfig(
    level=_log_level,
    format='%(asctime)s | %(levelname)-7s | %(name)s | %(message)s',
    datefmt='%H:%M:%S',
    force=True,  # 覆盖 uvicorn 的日志配置
)


@dataclass
class Settings:
    """应用配置集合，所有配置项从环境变量读取并设合理的默认值。"""
    # 数据库
    database_url: str = os.getenv(
        'DATABASE_URL',
        'postgresql+asyncpg://postgres:postgres@localhost:5432/persontimeline'
    )
    # LLM API（AI 事件抽取）
    llm_api_key: str | None = os.getenv('LLM_API_KEY')
    llm_api_base: str = os.getenv('LLM_API_BASE', 'https://api.openai.com/v1')
    llm_model: str = os.getenv('LLM_MODEL', 'gpt-4o-mini')
    # 应用
    app_name: str = 'personTimeline'
    debug: bool = os.getenv('DEBUG', 'false').lower() == 'true'
    cors_origins: list[str] = field(default_factory=lambda:
        os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(','),
    )
    # 文件上传目录
    upload_dir: str = os.getenv('UPLOAD_DIR', './uploads')
    # 上传限制（10MB）
    max_upload_size: int = 10 * 1024 * 1024


settings = Settings()
