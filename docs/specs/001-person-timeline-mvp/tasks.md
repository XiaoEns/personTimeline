# 任务清单 — 单人物时间轴 MVP

- **阶段编号**: 001
- **功能名称**: person-timeline-mvp
- **预估总工时**: 约 40-60 小时

---

## 前置任务

### Task 1: OpenAPI 规范与类型定义
- **文件**: `docs/design/api-spec.yaml`, `packages/api-types/index.ts`
- **描述**: 用 OpenAPI 3.0 定义全部 16 个接口的请求/响应 schema，生成 TypeScript 类型定义
- **输出**: 
  - api-spec.yaml（API 规范文档）
  - packages/api-types/index.ts（共享 TS 类型）
- **前置依赖**: 无

---

## 后端任务（窗口 1）

### Task 2: 后端项目初始化
- **文件**: 
  - `apps/backend/main.py`
  - `apps/backend/config.py`
  - `apps/backend/database.py`
  - `apps/backend/requirements.txt`
  - `apps/backend/.env.example`
- **描述**: 搭建 FastAPI 项目骨架，配置数据库连接，添加 CORS 中间件
- **前置依赖**: 无

### Task 3: 数据库模型定义
- **文件**: 
  - `apps/backend/src/models/__init__.py`
  - `apps/backend/src/models/person.py`
  - `apps/backend/src/models/event.py`
  - `apps/backend/src/models/person_event.py`
  - `apps/backend/src/models/person_alias.py`
  - `apps/backend/src/models/biography_text.py`
  - `apps/backend/src/models/external_person_info.py`
- **描述**: 定义 SQLAlchemy ORM 模型，映射 6 张数据库表
- **前置依赖**: Task 2

### Task 4: Person CRUD API
- **文件**: 
  - `apps/backend/src/schemas/common.py`
  - `apps/backend/src/schemas/person.py`
  - `apps/backend/src/routers/persons.py`
  - `apps/backend/src/services/person_service.py`
- **描述**: 实现人物的增删改查 API，支持分页和模糊搜索
- **前置依赖**: Task 3

### Task 5: Event CRUD API
- **文件**: 
  - `apps/backend/src/schemas/event.py`
  - `apps/backend/src/routers/events.py`
  - `apps/backend/src/services/event_service.py`
- **描述**: 实现事件的增删改查 API，支持按类型、人物、时间筛选
- **前置依赖**: Task 3

### Task 6: 人物-事件关联 API
- **文件**:
  - `apps/backend/src/routers/events.py`（追加）
  - `apps/backend/src/services/event_service.py`（追加）
- **描述**: 实现人物与事件的绑定/解绑/更新，获取人物下所有事件
- **前置依赖**: Task 5

### Task 7: 别名管理 API
- **文件**:
  - `apps/backend/src/routers/aliases.py`
  - `apps/backend/src/services/person_service.py`（追加）
- **描述**: 实现人物别名的增删查 API
- **前置依赖**: Task 3

### Task 8: 文件上传 API
- **文件**:
  - `apps/backend/src/routers/upload.py`
  - `apps/backend/src/services/extraction_service.py`
- **描述**: 实现 TXT/PDF 文件上传和文本提取，支持文件格式校验
- **前置依赖**: Task 3

### Task 9: AI 事件抽取 API
- **文件**:
  - `apps/backend/src/routers/upload.py`（追加）
  - `apps/backend/src/services/extraction_service.py`（追加）
- **描述**: 调用大模型从传记文本中提取结构化事件，自动创建 event + person_event 记录
- **前置依赖**: Task 8

---

## 前端任务（窗口 2）

### Task 10: 前端项目初始化
- **文件**:
  - `apps/frontend/package.json`
  - `apps/frontend/vite.config.ts`
  - `apps/frontend/tsconfig.json`
  - `apps/frontend/tailwind.config.js`
  - `apps/frontend/index.html`
  - `apps/frontend/src/main.ts`
  - `apps/frontend/src/App.vue`
  - `apps/frontend/src/styles/main.css`
  - `apps/frontend/.env.example`
- **描述**: 搭建 Vue 3 + Vite + Tailwind CSS + Headless UI 项目骨架
- **前置依赖**: 无

### Task 11: 前端 API 层
- **文件**:
  - `apps/frontend/src/api/client.ts`
  - `apps/frontend/src/api/persons.ts`
  - `apps/frontend/src/api/events.ts`
- **描述**: 封装 Axios 实例和所有 API 调用函数
- **前置依赖**: Task 10

### Task 12: 路由与布局
- **文件**:
  - `apps/frontend/src/router/index.ts`
  - `apps/frontend/src/layouts/AdminLayout.vue`
  - `apps/frontend/src/layouts/ViewerLayout.vue`
- **描述**: 配置 Vue Router（/admin + /view 分层），实现管理端和展示端布局
- **前置依赖**: Task 11

### Task 13: 人物管理页面
- **文件**:
  - `apps/frontend/src/views/admin/PersonList.vue`
  - `apps/frontend/src/views/admin/PersonDetail.vue`
  - `apps/frontend/src/stores/person.ts`
- **描述**: 人物列表页（搜索+分页表格）和人物编辑页（表单+别名标签管理）
- **前置依赖**: Task 12

### Task 14: 事件管理页面
- **文件**:
  - `apps/frontend/src/views/admin/EventList.vue`
  - `apps/frontend/src/views/admin/EventDetail.vue`
  - `apps/frontend/src/stores/event.ts`
- **描述**: 事件列表页（筛选+表格）和事件编辑页（表单+人物选择器）
- **前置依赖**: Task 12

### Task 15: 上传与抽取页面
- **文件**:
  - `apps/frontend/src/views/admin/UploadPage.vue`
- **描述**: 文件上传页（人物选择+文件拖拽+文本预览+AI 抽取按钮）
- **前置依赖**: Task 12

### Task 16: D3 时间轴组件
- **文件**:
  - `apps/frontend/src/components/Timeline.vue`
  - `apps/frontend/src/components/EventCard.vue`
  - `apps/frontend/src/views/viewer/PersonTimeline.vue`
- **描述**: D3.js 单人物时间轴（泳道图），含悬停浮层和点击详情
- **前置依赖**: Task 12

---

## 执行顺序

```
Task 1 (前置)
  ├── Task 2 → Task 3 → Task 4,5,7 (后端流)
  │                    └── Task 6 → Task 8 → Task 9
  │
  └── Task 10 → Task 11 → Task 12 → Task 13,14,15,16 (前端流)

前后端 Task 4-9 与 Task 13-16 可并行开发
```
