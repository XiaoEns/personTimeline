# personTimeline

个人时间线应用 — 支持多人物传记的时间轴可视化与知识管理系统。

## 项目结构

```
personTimeline/
├── .claude/              # Claude Code 工程化配置
│   ├── commands/         # 自定义斜杠命令
│   ├── skills/           # AI 工程能力定义
│   ├── agents/           # 角色化 AI 专家
│   ├── rules/            # 编码和行为规则
│   ├── hooks/            # AI 工程流程自动化
│   └── settings.json     # AI 行为配置
├── apps/
│   ├── frontend/         # 前端应用（Vue 3 + Vite）
│   │   └── src/
│   │       ├── app/           # 应用配置
│   │       ├── modules/       # 业务模块
│   │       └── shared/        # 共享资源
│   └── backend/          # 后端应用（FastAPI + Python）
│       └── src/
│           ├── modules/       # 业务模块
│           └── shared/        # 共享资源
├── docs/
│   ├── requirements/     # 需求文档
│   ├── design/           # 设计文档
│   ├── specs/            # 规范驱动开发文档
│   └── decisions/        # 架构决策记录 (ADR)
├── packages/
│   ├── api-types/        # API 类型定义（前后端共享）
│   └── constants/        # 跨端常量
├── scripts/              # 辅助脚本
├── tests/                # E2E/集成测试
├── CLAUDE.md             # 项目 AI 说明书
└── constitution.md       # 项目宪法
```

## 快速开始

### 前置要求
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- pnpm

### 1. 创建数据库
```bash
createdb person_timeline
psql -d person_timeline -f docs/database/schema.sql
```

### 2. 启动后端
```bash
cd apps/backend

# 创建虚拟环境
python -m venv venv
# Windows: venv\Scripts\activate
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量（复制并编辑）
cp .env.example .env

# 启动开发服务
uvicorn main:app --reload --port 8000
```

### 3. 启动前端
```bash
cd apps/frontend

# 安装依赖
pnpm install

# 启动开发服务
pnpm dev
# 默认 http://localhost:5173
```

### 4. 同时开发前后端
需要同时开发前后端时，请打开 **两个终端窗口**：

| 窗口 | 命令 |
|------|------|
| 窗口 1（后端） | `cd apps/backend && uvicorn main:app --reload --port 8000` |
| 窗口 2（前端） | `cd apps/frontend && pnpm dev` |

后端 API 默认 `http://localhost:8000`，前端开发服务器自动代理 API 请求。

## 开发规则

详见 [CLAUDE.md](CLAUDE.md) 中的「开发规范」章节。
