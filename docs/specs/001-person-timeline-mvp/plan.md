# 实现计划 — 单人物时间轴 MVP

- **阶段编号**: 001
- **功能名称**: person-timeline-mvp
- **版本**: 1.0

---

## 1. 技术方案

| 层级 | 技术 | 说明 |
|------|------|------|
| 后端框架 | FastAPI (Python 3.11+) | RESTful API |
| ORM | SQLAlchemy 2.0 | 异步查询支持 |
| 数据库 | PostgreSQL 15+ | 主数据库 |
| PDF 提取 | PyMuPDF (fitz) | PDF 文本提取 |
| 大模型 | OpenAI API / Qwen API | AI 事件抽取 |
| 前端框架 | Vue 3 + Vite | Composition API |
| 状态管理 | Pinia | Store 层 |
| 路由 | Vue Router | /admin + /view 分层 |
| 样式 | Tailwind CSS v4 + Headless UI | CSS-First 配置 |
| 可视化 | D3.js | SVG 时间轴渲染 |
| 网络请求 | Axios | API 调用 |
| 包管理 | pnpm | Monorepo 依赖管理 |

## 2. API 设计（16 个端点）

### 2.1 人物管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/persons | 创建人物 |
| GET | /api/persons | 人物列表（分页+搜索） |
| GET | /api/persons/{id} | 人物详情 |
| PUT | /api/persons/{id} | 更新人物 |
| DELETE | /api/persons/{id} | 删除人物 |

### 2.2 事件管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/events | 创建事件（可选关联人物） |
| GET | /api/events | 事件列表（分页+筛选） |
| GET | /api/events/{id} | 事件详情（含关联人物） |
| PUT | /api/events/{id} | 更新事件 |
| DELETE | /api/events/{id} | 删除事件 |

### 2.3 人物-事件关联

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/persons/{id}/events | 获取人物所有事件 |
| POST | /api/persons/{id}/events | 关联事件到人物 |
| PUT | /api/person-events/{id} | 更新关联信息 |
| DELETE | /api/person-events/{id} | 解除关联 |

### 2.4 别名管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/persons/{id}/aliases | 获取别名列表 |
| POST | /api/persons/{id}/aliases | 添加别名 |
| DELETE | /api/persons/{id}/aliases/{alias} | 删除别名 |

### 2.5 上传与 AI 抽取

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/upload | 上传传记文件（multipart） |
| GET | /api/persons/{id}/biography | 获取人物传记文本列表 |
| DELETE | /api/biography/{id} | 删除传记文本 |
| POST | /api/persons/{id}/extract | AI 事件抽取 |

### 2.6 请求/响应格式示例

详见 `spec.md` 各功能模块的字段定义。

**分页通用格式**:
```json
// 请求: GET /api/persons?page=1&page_size=20&search=李白
// 响应:
{
  "items": [...],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```

---

## 3. 数据流

```
管理端操作:
用户交互 → Vue 页面 → Pinia Store → Axios → FastAPI → SQLAlchemy → PostgreSQL
                                                        ↕
                                                    Pydantic Schema

展示端渲染:
页面加载 → Pinia Store → Axios → FastAPI → 返回事件数据 → D3.js 绘制 SVG
```

---

## 4. 后端目录结构

```
apps/backend/
├── main.py                 # FastAPI 应用入口
├── config.py               # 配置管理
├── database.py             # SQLAlchemy 引擎和会话
├── models/                 # ORM 模型
│   ├── __init__.py
│   ├── person.py
│   ├── event.py
│   ├── person_event.py
│   ├── person_alias.py
│   ├── biography_text.py
│   └── external_person_info.py
├── schemas/                # Pydantic 请求/响应
│   ├── __init__.py
│   ├── common.py
│   ├── person.py
│   └── event.py
├── routers/                # API 路由
│   ├── __init__.py
│   ├── persons.py
│   ├── events.py
│   ├── aliases.py
│   └── upload.py
├── services/               # 业务逻辑
│   ├── __init__.py
│   ├── person_service.py
│   ├── event_service.py
│   └── extraction_service.py
├── requirements.txt
└── .env.example
```

## 5. 前端目录结构

```
apps/frontend/
├── src/
│   ├── App.vue
│   ├── main.ts
│   ├── router/
│   │   └── index.ts
│   ├── stores/
│   │   ├── person.ts
│   │   └── event.ts
│   ├── api/
│   │   ├── client.ts
│   │   ├── persons.ts
│   │   └── events.ts
│   ├── layouts/
│   │   ├── AdminLayout.vue
│   │   └── ViewerLayout.vue
│   ├── views/
│   │   ├── admin/
│   │   │   ├── PersonList.vue
│   │   │   ├── PersonDetail.vue
│   │   │   ├── EventList.vue
│   │   │   ├── EventDetail.vue
│   │   │   └── UploadPage.vue
│   │   └── viewer/
│   │       └── PersonTimeline.vue
│   ├── components/
│   │   ├── Timeline.vue
│   │   └── EventCard.vue
│   └── styles/
│       └── main.css
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── package.json
└── .env.example
```

---

## 6. 前端路由设计

```
/admin/persons           → PersonList.vue      人物列表
/admin/persons/new       → PersonDetail.vue    新建人物
/admin/persons/:id       → PersonDetail.vue    编辑人物
/admin/events            → EventList.vue       事件列表
/admin/events/new        → EventDetail.vue     新建事件
/admin/events/:id        → EventDetail.vue     编辑事件
/admin/upload            → UploadPage.vue      上传与抽取
/view/persons/:id        → PersonTimeline.vue  单人物时间轴
```

---

## 7. D3 时间轴渲染方案

**布局计算**:
- SVG 容器，垂直方向映射时间（上 = 最早，下 = 最晚）
- 左侧为时间刻度线（按年/月刻度）
- 右侧泳道区域绘制事件节点

**事件渲染映射**:
| time_type | 视觉元素 | 说明 |
|-----------|----------|------|
| POINT | 实心圆点 (circle, r=6) | 位置在 sort_date 对应 y 坐标 |
| PERIOD | 竖向圆角矩形 (rect) | 从 start_date 到 end_date |
| FUZZY | 虚线边框半透明矩形 | 表示时间不确定 |
| BIRTH/DEATH | 特殊图标 | 羽毛笔/十字 SVG 路径 |

**交互**:
- 悬停: `mouseover`/`mouseout` 事件，显示 tooltip
- 点击: `click` 事件，emit 给 Vue 组件显示 EventCard
- 滚轮缩放: 监听 `wheel` 事件，调整 y 比例尺 domain

---

## 8. 并行开发策略

```
时间线 →
前置: OpenAPI 规范 (Task 1)
       ├── 后端流 (Task 2-9)
       │   ├── 项目初始化 → 模型定义 → Person CRUD → Event CRUD
       │   └── 关联 API → 别名 API → 上传 API → AI 抽取
       │
       └── 前端流 (Task 10-16)
           ├── 项目初始化 → API 层 → 路由布局
           └── 人物页面 → 事件页面 → 上传页面 → D3 时间轴
```
