"""
personTimeline API — FastAPI 应用入口。
注册路由、中间件和启动/关闭事件。
"""
import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings

logger = logging.getLogger(__name__)

app = FastAPI(
    title='personTimeline',
    description='多人物传记时间轴系统 — 第一阶段 API',
    version='1.0.0',
    docs_url='/docs',
)

# CORS 中间件（允许前端开发服务器跨域访问）
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


# -------- 全局异常处理器 --------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """捕获所有未处理的异常，记录完整堆栈并返回 500。"""
    logger.exception('未处理的异常: %s %s', request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={'detail': '服务器内部错误'},
    )


# -------- 请求日志中间件 --------

@app.middleware('http')
async def log_requests(request: Request, call_next):
    """记录每个请求的方法、路径、耗时和响应状态码。"""
    start = time.time()
    logger.info('→ %s %s', request.method, request.url.path)

    response = await call_next(request)

    duration = time.time() - start
    logger.info(
        '← %s %s → %d  (%dms)',
        request.method, request.url.path,
        response.status_code, duration * 1000,
    )
    return response


# -------- 路由注册 --------

from routers.persons import router as persons_router
from routers.events import router as events_router
from routers.person_events import router as person_events_router
from routers.aliases import router as aliases_router
from routers.upload import router as upload_router

app.include_router(persons_router)
app.include_router(events_router)
app.include_router(person_events_router)
app.include_router(aliases_router)
app.include_router(upload_router)


@app.get('/health')
async def health_check():
    """健康检查接口，用于确认服务运行正常。"""
    return {'status': 'ok'}
