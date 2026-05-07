# v2 需求文档 — 文件上传与事件抽取改造

## 1. 概述

v2 在 MVP 基础上改造文件上传和 AI 事件抽取流程，核心变化：

- 新增 `uploaded_files` 表，追踪文件从上传到抽取完成的全生命周期
- 文件持久化存储到 `uploads/` 目录
- 文本切片（带重叠）避免语义丢失
- AI 抽取改用 **LangChain** 框架，支持结构化输出
- 抽取结果新增 `persons` 字段，自动关联/创建人物

---

## 2. 后端文件上传改造

### 2.1 文件存储

- 上传文件保存到后端服务根目录下的 `uploads/` 文件夹
- 文件名使用 UUID 生成（`uuid4().hex`），保留原始文件扩展名
- 示例：`uploads/a1b2c3d4e5f6.pdf`

### 2.2 uploaded_files 表

新建 `uploaded_files` 表，存储上传记录并追踪处理状态。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 主键 |
| original_name | VARCHAR(500) | NOT NULL | 用户上传时的原始文件名 |
| file_path | VARCHAR(1000) | NOT NULL | 服务器存储路径（相对 uploads/ 目录） |
| file_size | BIGINT | NOT NULL | 文件大小（字节） |
| file_type | VARCHAR(10) | NOT NULL | txt / pdf |
| person_id | UUID | FK→person(id), ON DELETE SET NULL | 关联人物 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'uploaded' | 处理状态 |
| error_message | TEXT | | 错误信息，仅 status=error 时有值 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 更新时间 |

**状态枚举**：`uploaded` → `chunking` → `chunked` → `extracting` → `completed`，异常时变为 `error`

**状态流转说明**：

```
上传完成 → uploaded
切片开始 → chunking
切片完成 → chunked
抽取开始 → extracting
抽取完成 → completed
任意步骤失败 → error（记录 error_message）
```

### 2.3 文本切片

文件上传后**异步**执行文本切片（`asyncio.create_task` 后台任务）：

| 参数 | 值 | 说明 |
|------|-----|------|
| chunk_size | 500 字符 | 每个切片的字符数上限 |
| chunk_overlap | 50 字符 | 相邻切片重叠字符数，防语义断裂 |
| 分隔符 | `["\n\n", "\n", "。", "！", "？", "；", ".", "!", "?", ";", " "]` | 优先段落→句子→字符 |
| 实现 | `langchain_text_splitters.RecursiveCharacterTextSplitter` | LangChain 递归字符分割器 |

切片结果存入 `biography_text` 表，每条记录对应一个切片。

### 2.4 biography_text 表变更

| 变更 | 字段 | 类型 | 说明 |
|------|------|------|------|
| 新增 | file_id | UUID FK→uploaded_files(id), ON DELETE SET NULL | 来源上传文件 |
| 新增 | file_path | VARCHAR(1000) | 服务器磁盘路径（如 `uploads/abc123.pdf`） |
| 新增 | chunk_index | INT, DEFAULT 0 | 切片序号（从 0 起） |
| 保留 | source_file | VARCHAR(500) | 原始文件名（与 `uploaded_files.original_name` 一致） |
| 保留 | page | INT | PDF 页码（TXT 文件为 NULL） |

- `person_id` 保持 NOT NULL + ON DELETE CASCADE（与现有约束一致）—— 上传时必须关联人物，人物删除时切片级联删除。与 `uploaded_files.person_id`（ON DELETE SET NULL）不同：文件记录在人物删除后仍保留（审计用途），但切片数据随人物清除
- 每条 biography_text 记录对应一个切片（以前是整文件对应一条记录）

---

## 3. 事件抽取改造

### 3.1 LangChain 集成

将现有 `openai.AsyncOpenAI` 直接调用替换为 LangChain：

| 组件 | 用途 |
|------|------|
| `langchain_openai.ChatOpenAI` | LLM 客户端 |
| `ChatOpenAI.with_structured_output()` | JSON Schema 约束 + 自动解析 |
| `langchain_core.prompts.ChatPromptTemplate` | Prompt 模板管理 |

**结构化输出模型**：

```python
class ExtractedEventItem(BaseModel):
    title: str           # 事件标题
    description: str     # 事件描述
    start_date: str      # ISO 8601 格式
    end_date: str        # ISO 8601 格式
    display_time: str    # 原文时间表述
    time_type: str       # POINT / PERIOD / FUZZY
    granularity: str     # YEAR / MONTH / DAY / SEASON
    event_type: str      # BIRTH / DEATH / EDUCATION / CAREER / CREATION / HISTORICAL / OTHER
    location: dict       # 地点信息
    persons: list[str]   # 参与人物姓名列表，如 ["曹操", "诸葛亮"]
```

### 3.2 persons 字段抽取

AI 抽取事件时新增 `persons` 字段，输出格式：`["曹操", "诸葛亮", "刘备"]`

抽取后自动执行人物关联：

1. 遍历 `persons` 中每个名字
2. 在 `person` 表中按 `name` 精确匹配 → 找到则使用该人物
3. 在 `person_alias` 表中按 `alias` 精确匹配 → 找到则使用该人物
4. 两者都未找到 → 创建新人物（`name=该名字, status=draft`）并自动添加别名记录
5. 创建 `person_event` 关联记录
6. 将 `persons` 数组写入 `event.persons` 字段

### 3.3 无时间信息处理

AI 抽取时若文本片段不包含时间信息：

- 仍提取事件内容（标题、描述、人物等）
- `time_type` 设为 `FUZZY`
- `start_date` / `end_date` 使用该文件关联人物的 `birth_date` 作为默认参照
- `display_time` 填写 `"时间不详"` 或从上下文推断
- 前端 FUZZY 事件在时间轴右侧卡片区域展示

---

## 4. 上传与抽取页面改造

### 4.1 文件管理页（/admin/upload）

**上方区域**：
- 人物选择改为**搜索框**（Ant Design AutoComplete/Select + search），支持模糊搜索人物姓名
- 上传按钮（支持拖拽 .txt/.pdf 文件）

**数据表格**（展示 uploaded_files 记录）：

| 列 | 说明 |
|------|------|
| 文件名 | original_name |
| 大小 | file_size（格式化 KB/MB） |
| 类型 | file_type（txt/pdf 标签） |
| 状态 | status（颜色标签：uploaded=蓝, chunking=橙, chunked=绿, extracting=紫, completed=成功色, error=红） |
| 关联人物 | 人物姓名 |
| 上传时间 | created_at |

**操作按钮**（每行末尾）：

| 按钮 | 行为 | 可用条件 |
|------|------|----------|
| 事件抽取 | 触发 AI 抽取 | status 为 chunked 或 completed 时可用；extracting 时禁用+Loading |
| 切片 | 跳转切片列表页 | status 为 chunked/completed/extracting 时可用 |
| 删除 | 确认后删除文件+切片 | 始终可用 |

### 4.2 切片列表页（/admin/upload/:fileId/chunks）

- 返回按钮 + 文件信息摘要（文件名、切片总数）
- 数据表格展示 `biography_text` 切片（**只读，无操作按钮**）
- 列：序号（chunk_index）、文本预览（前 100 字符）、长度、创建时间
- 支持展开/抽屉查看完整文本

---

## 5. API 端点

### 5.1 新增/变更端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/upload | 上传文件（multipart），保存到磁盘 + 创建 uploaded_files 记录 + 后台异步切片 |
| GET | /api/uploaded-files | 文件列表（分页，支持 person_id/status 筛选） |
| GET | /api/uploaded-files/{id} | 文件详情（含切片数量） |
| DELETE | /api/uploaded-files/{id} | 删除文件记录 + 物理文件 + 关联切片 |
| POST | /api/uploaded-files/{id}/chunk | 手动触发切片（可用于重试失败的切片） |
| GET | /api/uploaded-files/{id}/chunks | 获取文件的所有切片列表（按 chunk_index 排序） |
| GET | /api/biography-texts/{id} | 获取单条切片的完整文本 |
| POST | /api/uploaded-files/{id}/extract | 触发 AI 事件抽取（后台异步，前端轮询状态） |

### 5.2 废弃端点

| 路径 | 说明 |
|------|------|
| POST /api/persons/{id}/extract | 保留但标记 deprecated，内部转发到新端点 |

---

## 6. 前端路由

```
/admin/upload                 → UploadedFilesPage（文件管理表格）
/admin/upload/:fileId/chunks  → ChunkListPage（切片只读列表）
```

---

## 7. 非功能需求

- **响应时间**：上传/切片 API < 2s（抽取接口异步返回，不在限制内）
- **文件大小限制**：最大 10MB
- **并发**：单文件处理，不引入消息队列
- **编码规范**：每个函数必须注释
- **提交规范**：Conventional Commits（feat:/fix:/refactor:）
- **设计原则**：宁简勿繁，先跑通再优化
