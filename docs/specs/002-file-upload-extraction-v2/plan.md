# 实现计划 — 文件上传与事件抽取改造 v2

- **阶段编号**: 002
- **功能名称**: file-upload-extraction-v2
- **版本**: 2.0

---

## 1. 技术方案

| 层级 | 技术 | 说明 |
|------|------|------|
| 后端框架 | FastAPI (Python 3.11+) | RESTful API |
| ORM | SQLAlchemy 2.0 | 异步查询支持 |
| 数据库 | PostgreSQL 15+ | 主数据库 |
| LLM 框架 | LangChain | 替代 openai SDK |
| LLM 结构化输出 | ChatOpenAI.with_structured_output() | JSON Schema 约束 |
| 文本切片 | RecursiveCharacterTextSplitter | LangChain 递归字符分割 |
| PDF 提取 | PyMuPDF (fitz) | 保持不变 |
| 异步处理 | asyncio.create_task | 后台任务，不引入 Celery |
| 前端框架 | React 19 + TypeScript + Vite | 保持不变 |
| 状态管理 | Zustand | 新增 upload store |
| UI 组件 | Ant Design 5 | Table / Select / Tag / Button |
| 样式 | Tailwind CSS v4 | 保持不变 |
| 包管理 | pnpm | Monorepo 依赖管理 |

## 2. 数据库变更

### 2.1 新增表: uploaded_files

```sql
CREATE TABLE uploaded_files (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name  VARCHAR(500) NOT NULL,
    file_path      VARCHAR(1000) NOT NULL,
    file_size      BIGINT NOT NULL,
    file_type      VARCHAR(10) NOT NULL CHECK (file_type IN ('txt', 'pdf')),
    person_id      UUID REFERENCES person(id) ON DELETE SET NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'uploaded'
                   CHECK (status IN ('uploaded','chunking','chunked','extracting','completed','error')),
    error_message  TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.2 变更表: biography_text

```sql
ALTER TABLE biography_text
    ADD COLUMN file_id     UUID REFERENCES uploaded_files(id) ON DELETE SET NULL,
    ADD COLUMN file_path   VARCHAR(1000),
    ADD COLUMN chunk_index INT DEFAULT 0;
```

- `person_id` 保持 NOT NULL（上传时必须关联人物）
- 每条 biography_text 记录对应一个切片

## 3. API 设计（8 个端点）

### 3.1 文件上传

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/upload | 上传文件，保存磁盘，创建 uploaded_files，后台异步切片 |

### 3.2 文件管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/uploaded-files | 文件列表（分页 + person_id/status 筛选） |
| GET | /api/uploaded-files/{id} | 文件详情（含切片数量） |
| DELETE | /api/uploaded-files/{id} | 删除记录 + 磁盘文件 + 关联切片 |

### 3.3 切片操作

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/uploaded-files/{id}/chunk | 手动触发切片（可重试） |
| GET | /api/uploaded-files/{id}/chunks | 文件切片列表（按 chunk_index 排序） |
| GET | /api/biography-texts/{id} | 单条切片完整文本 |

### 3.4 AI 事件抽取

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/uploaded-files/{id}/extract | 触发 AI 抽取（后台异步，前端轮询状态） |

## 4. 数据流

```
管理端操作:
上传文件 → 保存到 uploads/ → 写入 uploaded_files(status=uploaded)
       → asyncio.create_task 后台切片
       → 文本提取 → RecursiveCharacterTextSplitter → 写入 biography_text(chunks)
       → 更新 uploaded_files.status=chunked

AI 抽取:
点击抽取按钮 → POST /api/uploaded-files/{id}/extract
       → 更新 status=extracting
       → asyncio.create_task 后台抽取
       → 遍历切片 → LangChain structured_llm → ExtractedEventList
       → _resolve_persons() → 创建/关联人物 → 创建 event + person_event
       → 更新 status=completed

前端:
轮询 GET /api/uploaded-files/{id} → 检测 status === 'completed'
```

## 5. 后端目录结构（变更部分）

```
apps/backend/
├── models/
│   ├── uploaded_file.py      # 新增
│   └── biography_text.py     # 改：新增 3 字段 + relationship
├── schemas/
│   ├── upload.py             # 新增
│   └── biography.py          # 改：新增 ChunkItem 等，ExtractEventItem 加 persons
├── routers/
│   └── upload.py             # 重写：从 4 端点扩展到 8 端点
├── services/
│   ├── chunking_service.py   # 新增：文本提取 + 切片 + 后台任务
│   └── extraction_service.py # 改：OpenAI SDK → LangChain + 人物自动关联
├── config.py                 # 改：新增 upload_dir
└── requirements.txt          # 改：openai → langchain 系列
```

## 6. 前端目录结构（变更部分）

```
apps/frontend/src/
├── api/
│   ├── upload.ts             # 新增：文件/切片/抽取 API
│   └── persons.ts            # 改：移除旧上传相关函数
├── stores/
│   └── upload.ts             # 新增：文件管理状态
├── components/
│   └── PersonSearchSelect.tsx # 新增：人物模糊搜索选择器
├── pages/admin/
│   ├── UploadedFilesPage.tsx  # 新增：文件管理表格页
│   ├── ChunkListPage.tsx      # 新增：切片只读列表页
│   └── UploadPage.tsx         # 删除
├── router/
│   └── index.tsx              # 改：新路由配置
└── layouts/
    └── AdminLayout.tsx        # 不改：侧边栏保持不变
```

## 7. 前端路由设计

```
/admin/upload                  → UploadedFilesPage.tsx    文件管理表格
/admin/upload/:fileId/chunks   → ChunkListPage.tsx        切片只读列表
```

## 8. 并行开发策略

```
第一批（完全并行）：
  Task 1 (SQL 迁移) | Task 2 (配置/依赖) | Task 8 (API 类型)

第二批（依赖第一批，可并行）：
  Task 3 (ORM 模型) | Task 4 (Schemas) | Task 9 (前端 API 层)

第三批（可并行）：
  Task 5 (切片服务) | Task 10 (upload store) | Task 11 (PersonSearchSelect)

第四批（可并行）：
  Task 6 (LangChain 抽取) | Task 12 (UploadedFilesPage)

第五批（串行）：
  Task 7 (上传路由) → Task 13 (ChunkListPage) → Task 14 (路由更新)
```
