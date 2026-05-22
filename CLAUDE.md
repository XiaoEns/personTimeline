# personTimeline 项目说明书

## 项目概述
个人时间线（personTimeline）—— 一款用于记录、管理和可视化个人生活时间线的应用，支持多人物传记时间轴展示。

## 技术栈
- **后端**: Python 3.11+ / FastAPI / PostgreSQL 15+
- **前端**: React 19 + TypeScript + Vite + Zustand + React Router + Ant Design 5
- **可视化**: D3.js (SVG) / @xyflow/react (React Flow)
- **样式**: Tailwind CSS v4
- **包管理**: pnpm

## 项目结构
详见 [README.md](README.md) 中的目录结构说明。

前端（`apps/frontend/`）结构：
```
src/
├── api/              # API 调用层（与后端共享类型）
├── components/       # 复用组件
│   └── react-flow/   # React Flow 画布自定义节点组件
├── data/             # 静态数据文件（测试数据/数据适配层）
├── hooks/            # 自定义 React Hooks
├── layouts/          # 布局组件
├── pages/            # 页面组件
│   ├── admin/        # 管理端页面
│   └── viewer/       # 展示端页面
├── router/           # 路由配置
├── stores/           # Zustand 状态管理
├── styles/           # 样式
├── utils/            # 工具函数（如时间轴布局引擎）
└── mocks/            # MSW 模拟数据
```

## 核心数据模型
- **person** — 人物（含规范化时间+原文表述分离）
- **event** — 标准事件（独立于人物）
- **person_event** — 人物-事件关联（含个人视角差异）
- **person_alias** — 人物别名（NER 匹配用）
- **biography_text** — 原始传记文本
- **external_person_info** — 外部自动采集的人物信息

数据库设计详见 [docs/requirements/database-schema.md](docs/requirements/database-schema.md)

## 开发规范

### 核心原则（可手动编辑维护）
1. **宁简勿繁** — 不要过度设计，能用数组不用类，能用函数不用框架。在遇到三个重复之前不做抽象
2. **约定大于配置** — 遵循项目已有模式，不引入新的架构范式
3. **先跑通再优化** — 第一阶段目标功能可用，不追求性能、扩展性、通用性
4. **每个函数都要写注释** — 说明函数用途、参数含义、返回值，方便团队成员理解

### Commit 规范
- 使用 Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- 提交信息控制在 50 字以内，聚焦 Why 而非 What

### 交互约束
- **修改端口必须询问用户意见**，不得直接修改服务端口或代理目标端口
- **禁止未经询问启动后台服务**（dev server、数据库等），端口被占用时也不得擅自 kill 旧进程或切换端口

### 前后端并行开发
- 窗口 1（后端）：`uvicorn main:app --reload --port 8000`
- 窗口 2（前端）：`cd apps/frontend && pnpm dev`（端口 3000）
- API 契约 → `packages/api-types/`，前端 mock 先行

## 如何让 Claude 理解本项目

在向 Claude 提出开发任务时，建议附上以下上下文：
1. 涉及哪个模块（前端/后端/数据库）
2. 需要改动哪些文件路径
3. 预期行为 vs 当前行为

示例：
> "在后端 apps/backend/src/modules/person/ 中新增人物搜索接口，支持按姓名和别名模糊查询，需要同时更新 OpenAPI 规范和前端 API 调用"

## 相关文档
- 需求文档: [docs/requirements/product-requirements.md](docs/requirements/product-requirements.md)
- 数据库设计: [docs/requirements/database-schema.md](docs/requirements/database-schema.md)
- 建表 SQL: [docs/database/schema.sql](docs/database/schema.sql)
- 架构决策: [docs/decisions/](docs/decisions/)
