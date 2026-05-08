"""
应用配置管理。
从环境变量加载配置项，提供统一的 Settings 对象供各模块使用。
"""
import logging
import os
from dataclasses import dataclass, field

import colorlog
from dotenv import load_dotenv

# 加载 .env 文件（相对于本文件的路径）
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# 全局日志初始化（DEBUG 模式时输出调试日志）
_log_level = logging.DEBUG if os.getenv('DEBUG', 'false').lower() == 'true' else logging.INFO

# 确保 logs 目录存在
_logs_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(_logs_dir, exist_ok=True)

# 终端日志格式（带颜色）
_console_formatter = colorlog.ColoredFormatter(
    '%(light_black)s%(asctime)s%(reset)s | '
    '%(log_color)s%(levelname)-7s%(reset)s | '
    '%(cyan)s%(name)s%(reset)s | '
    '%(message)s',
    datefmt='%H:%M:%S',
    log_colors={
        'DEBUG': 'thin_blue',
        'INFO': 'green',
        'WARNING': 'yellow',
        'ERROR': 'red',
        'CRITICAL': 'bold_red',
    },
)

# 文件日志格式（无颜色，带完整时间戳）
_file_formatter = logging.Formatter(
    '%(asctime)s | %(levelname)-7s | %(name)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)

_console_handler = logging.StreamHandler()
_console_handler.setFormatter(_console_formatter)

_file_handler = logging.FileHandler(
    os.path.join(_logs_dir, 'app.log'),
    mode='w',  # 每次启动覆盖旧日志
    encoding='utf-8',
)
_file_handler.setFormatter(_file_formatter)

logging.basicConfig(
    level=_log_level,
    handlers=[_console_handler, _file_handler],
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
