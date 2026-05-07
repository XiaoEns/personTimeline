# 任务清单 — 文件上传与事件抽取改造 v2

- **阶段编号**: 002
- **功能名称**: file-upload-extraction-v2
- **预估总工时**: 约 20-30 小时
- **任务粒度**: 每个任务可由一个 agent 独立完成
- **状态**: ⬜ 未开始 字段，实施时可以将 ⬜ 未开始 更新为 🔄 进行中 或 ✅ 已完成，执行过程中需要修改任务状态。
---

## 任务执行顺序总览

```
第一批并行 (无依赖):
  Task 1 ─┬──────────────────────────────────────────┐
          │                                          │
  Task 2 ─┤  后端基础设施                              │
          │                                          │
  Task 8 ─┘  前端类型定义                              │
                                                      │
第二批并行 (依赖第一批):                                │
  Task 3 ─┬─ 后端模型/Schema                          │
  Task 4 ─┤                                          │
  Task 9 ─┘  前端 API 层                              │
                                                      │
第三批并行 (依赖第二批):                                │
  Task 5  ─  切片服务                                  │
  Task 10 ─┬─ 前端状态/组件                           │
  Task 11 ─┘                                          │
                                                      │
第四批并行 (依赖第三批):                                │
  Task 6  ─  LangChain 抽取服务                        │
  Task 12 ─  UploadedFilesPage                        │
                                                      │
第五批串行 (依赖第四批):                                │
  Task 7  →  Task 13  →  Task 14                      │
  上传路由    切片列表页    路由更新                     │
```

---

## 第一批（完全并行，可 3 窗口同时执行）

### Task 1: 数据库迁移 SQL 脚本

- **状态**: ✅ 未开始
- **文件**: 
  - `docs/database/schema.sql`（追加）
  - `docs/database/migration_v2.sql`（新建）
- **描述**: 
  1. 编写 `CREATE TABLE uploaded_files` 完整 SQL（字段、CHECK 约束、索引、注释）
  2. 编写 `ALTER TABLE biography_text` 新增 3 字段 + 索引 + 注释
  3. 更新 `docs/database/schema.sql` 末尾追加新表定义
  4. 创建独立的 `migration_v2.sql` 迁移脚本（可重复执行，使用 IF NOT EXISTS/IF EXISTS）
- **前置依赖**: 无
- **验收**: 在 PostgreSQL 中执行 SQL 无报错，表结构符合设计

### Task 2: 后端配置与依赖更新

- **状态**: ✅ 未开始
- **文件**:
  - `apps/backend/config.py`
  - `apps/backend/requirements.txt`
- **描述**:
  1. `config.py` Settings 新增 `upload_dir: str` 字段，默认值 `./uploads`
  2. 确保 uploads 目录在启动时自动创建（在 main.py 或 config 中处理）
  3. `requirements.txt` 替换 `openai>=1.14.0` 为：
     - `langchain>=0.3.0`
     - `langchain-openai>=0.2.0`
     - `langchain-text-splitters>=0.3.0`
     - `langchain-core>=0.3.0`
  4. 保留 `openai` 作为 langchain-openai 的底层依赖（langchain-openai 需要它）
- **前置依赖**: 无
- **验收**: `pip install -r requirements.txt` 成功无冲突，import langchain 模块无报错

### Task 8: 共享 API 类型定义 (TypeScript)

- **状态**: ✅ 未开始
- **文件**: 
  - `packages/api-types/index.ts`
- **描述**:
  1. 新增 `FileStatus` 类型：`'uploaded' | 'chunking' | 'chunked' | 'extracting' | 'completed' | 'error'`
  2. 新增 `UploadedFileItem` 接口（id, original_name, file_size, file_type, person_id, person_name?, status, error_message?, chunk_count, created_at）
  3. 新增 `UploadedFileDetail` 接口（extends UploadedFileItem，加 file_path, updated_at）
  4. 新增 `PaginatedUploadedFiles` 接口
  5. 新增 `ChunkItem` 接口（id, file_id, chunk_index, text_length, page?, created_at）
  6. 新增 `ChunkListResponse` 接口
  7. 新增 `ChunkTextResponse` 接口
  8. 更新 `ExtractEventItem` 增加 `persons: string[]` 字段
  9. 新增 `FileExtractResponse` 接口
  10. 新增 `ListUploadedFilesParams` 接口（page?, page_size?, person_id?, status?）
- **前置依赖**: 无（但需与 Task 4 后端 Schema 保持一致结构，应按设计文档编写）
- **验收**: TypeScript 编译无错误，类型定义与后端 Pydantic Schema 字段对应

---

## 第二批（依赖第一批，可 3 窗口并行）

### Task 3: ORM 模型定义

- **状态**: ⬜ 未开始
- **文件**:
  - `apps/backend/models/uploaded_file.py`（新建）
  - `apps/backend/models/biography_text.py`（修改）
  - `apps/backend/models/__init__.py`（修改）
- **描述**:
  1. 新建 `uploaded_file.py`：定义 `UploadedFile` ORM 模型
     - 所有字段 Mapped 定义
     - `person` relationship（back_populates 或 backref）
     - `biographies` relationship（back_populates to BiographyText）
     - `__tablename__ = 'uploaded_files'`
  2. 修改 `biography_text.py`：
     - 新增 `file_id` (UUID FK→uploaded_files, nullable=True, ondelete SET NULL)
     - 新增 `file_path` (String(1000), nullable=True)
     - 新增 `chunk_index` (Integer, default=0)
     - 新增 `uploaded_file` relationship
  3. 修改 `__init__.py`：导出 `UploadedFile`
- **前置依赖**: Task 1（表结构）、Task 2（数据库连接可用）
- **验收**: SQLAlchemy 能正确建表，import 所有模型无报错

### Task 4: Pydantic Schemas

- **状态**: ⬜ 未开始
- **文件**:
  - `apps/backend/schemas/upload.py`（新建）
  - `apps/backend/schemas/biography.py`（修改）
  - `apps/backend/schemas/__init__.py`（修改，可选）
- **描述**:
  1. 新建 `upload.py`：
     - `UploadedFileResponse` — 完整响应（含 chunk_count 计算字段）
     - `UploadedFileItem` — 列表项（person_name 可选，拼 person 表）
     - `PaginatedUploadedFiles` — 继承 Pagination
     - `ChunkResult` — 切片操作返回（status, chunk_count）
  2. 修改 `biography.py`：
     - 新增 `ChunkItem`（id, file_id, chunk_index, text_length, page, created_at）
     - 新增 `ChunkListResponse`（items, total）
     - 新增 `ChunkTextResponse`（id, chunk_index, raw_text）
     - 更新 `ExtractEventItem` 增加 `persons: list[str] = []`
     - 新增 `FileExtractResponse`（file_id, status, result?）
- **前置依赖**: Task 3（需知 ORM 字段名和类型）
- **验收**: Pydantic 模型可正常实例化，model_validate 测试通过

### Task 9: 前端 API 层更新

- **状态**: ⬜ 未开始
- **文件**:
  - `apps/frontend/src/api/upload.ts`（新建）
  - `apps/frontend/src/api/persons.ts`（修改）
- **描述**:
  1. 新建 `upload.ts`，导出以下函数：
     - `uploadFile(file: File, personId: string)` → POST /api/upload (multipart/form-data)
     - `listUploadedFiles(params?)` → GET /api/uploaded-files
     - `getUploadedFile(fileId)` → GET /api/uploaded-files/{fileId}
     - `deleteUploadedFile(fileId)` → DELETE /api/uploaded-files/{fileId}
     - `triggerChunk(fileId)` → POST /api/uploaded-files/{fileId}/chunk
     - `getChunks(fileId)` → GET /api/uploaded-files/{fileId}/chunks
     - `getChunkText(biographyId)` → GET /api/biography-texts/{biographyId}
     - `extractFileEvents(fileId, data?)` → POST /api/uploaded-files/{fileId}/extract
  2. 修改 `persons.ts`：移除 `uploadBiography`、`deleteBiography`、`listBiographyTexts` 函数（这些已迁移到 upload.ts）
  3. 保留 `extractEvents` 函数但添加 `@deprecated` JSDoc 注释
- **前置依赖**: Task 8（需 TypeScript 类型）
- **验收**: TypeScript 编译无错误，API 函数签名与后端端点对应

---

## 第三批（依赖第二批，可 3 窗口并行）

### Task 5: 文件切片服务

- **状态**: ⬜ 未开始
- **文件**: 
  - `apps/backend/services/chunking_service.py`（新建）
- **描述**:
  1. 将现有 `extraction_service.py` 中的 `extract_text()` 迁移过来（TXT/PDF 文本提取）
  2. 实现 `chunk_text(text: str) -> list[str]`：使用 `RecursiveCharacterTextSplitter` 切片
     - chunk_size=500, chunk_overlap=50
     - separators=["\n\n", "\n", "。", "！", "？", "；", ".", "!", "?", ";", " "]
  3. 实现 `run_chunking(file_id: UUID)` 异步后台任务：
     - 获取独立的 db session（使用 async_session 工厂）
     - 更新 uploaded_files.status = 'chunking'
     - 读取磁盘文件 → 提取文本 → 切片
     - 删除该文件旧的 biography_text 记录（如有，支持重新切片）
     - 逐条写入 biography_text 记录（含 file_id, file_path, chunk_index, person_id, raw_text, source_file=original_name, page=PDF页码或NULL）
     - 更新 uploaded_files.status = 'chunked'
     - 异常时设置 status='error' + error_message
  4. 每个函数必须写注释
- **前置依赖**: Task 3（UploadedFile + BiographyText 模型）、Task 4（Schemas）
- **验收**: 单元测试 mock DB，验证切片结果无断裂语义

### Task 10: 前端 upload Zustand Store

- **状态**: ⬜ 未开始
- **文件**: 
  - `apps/frontend/src/stores/upload.ts`（新建）
- **描述**:
  1. 定义 `UploadState` 接口：
     - files, total, page, pageSize, loading, uploading
     - extracting (当前正在抽取的 fileId 或 null)
  2. 实现 actions：
     - `fetchFiles(params?)` — 调用 listUploadedFiles，写入 files/total
     - `uploadFile(file, personId)` — 调用 uploadFile，设置 uploading=true，成功后刷新列表
     - `deleteFile(fileId)` — 调用 deleteUploadedFile，成功后从列表移除
     - `triggerChunk(fileId)` — 调用 triggerChunk，成功后刷新
     - `triggerExtract(fileId)` — 调用 extractFileEvents，设置 extracting=fileId
     - `pollStatus(fileId)` — 定时（3s）调用 getUploadedFile，检查 status 变化，完成时停止轮询并刷新列表
     - `resetExtracting()` — 清空 extracting 状态
  3. 使用 Zustand `create` 创建 store
  4. 每个 action 必须有注释
- **前置依赖**: Task 9（API 函数）
- **验收**: TypeScript 编译无错误，store 可正常导入使用

### Task 11: PersonSearchSelect 组件

- **状态**: ⬜ 未开始
- **文件**: 
  - `apps/frontend/src/components/PersonSearchSelect.tsx`（新建）
- **描述**:
  1. Ant Design `Select` 组件，mode 为单选
  2. `showSearch` 启用，`filterOption={false}`（走服务端搜索）
  3. `onSearch` 使用 300ms debounce，调用 `listPersons({ search: keyword, page_size: 20 })`
  4. 下拉选项格式：`{ label: person.name, value: person.id }`
  5. Props: `value?: string`, `onChange?: (personId: string | undefined) => void`, `placeholder?: string`
  6. 支持清空选择（allowClear）
  7. 显示搜索中的 loading 状态
- **前置依赖**: Task 9（API 层的 listPersons，使用现有函数即可）
- **验收**: 组件渲染正确，搜索响应流畅，选中/清空回调正常

---

## 第四批（依赖第三批，可 2 窗口并行）

### Task 6: LangChain 抽取服务重构

- **状态**: ⬜ 未开始
- **文件**: 
  - `apps/backend/services/extraction_service.py`（重写）
- **描述**:
  1. 移除 `openai` 直接调用的代码
  2. 新增 Pydantic 结构化输出模型（内部定义）：
     - `ExtractedEventItem`（含 persons: list[str] 字段）
     - `ExtractedEventList`（events: list[ExtractedEventItem]）
  3. 重写 `extract_events_from_llm(text: str) -> ExtractedEventList`：
     - 初始化 `ChatOpenAI`（api_key/base_url/model 来自 settings）
     - `structured_llm = llm.with_structured_output(ExtractedEventList, method="json_schema")`
     - `prompt = ChatPromptTemplate.from_messages([...])`
     - `chain = prompt | structured_llm`
     - `result = await chain.ainvoke({"text": text})`
     - 更新系统提示词，加入 persons 抽取指令和无时间信息处理指令
  4. 实现 `_resolve_persons(db, person_names: list[str]) -> list[UUID]`：
     - 遍历每个名字
     - 在 person 表按 name 精确匹配 → 找到则收集 ID
     - 在 person_alias 表按 alias 精确匹配 → 找到则收集对应的 person_id
     - 都未找到 → `create Person(name=name, status='draft')` + `create PersonAlias(alias=name, person_id=new_id)` → 收集新 ID
     - 返回收集到的所有 person_id 列表
  5. 实现 `run_extraction_for_file(file_id: UUID)` 异步后台任务：
     - 获取独立 db session
     - 更新 uploaded_files.status = 'extracting'
     - 查询该文件所有 biography_text 切片（按 chunk_index 排序）
     - 对每个切片调用 extract_events_from_llm()
     - 合并所有事件 → 按 title + start_date 去重
     - 对每个事件的 persons → 调用 _resolve_persons()
     - 创建 Event（is_inferred=True, source='AI 抽取', persons=名单）
     - 创建 PersonEvent 关联（批量）
     - 更新 uploaded_files.status = 'completed'
     - 异常时设置 status='error' + error_message
  6. 保留并适配 `run_extraction(db, person_id)` 函数，内部改为对人物所有文件调用 run_extraction_for_file
  7. 每个函数必须写注释
- **前置依赖**: Task 5（切片服务）、Task 2（langchain 依赖）
- **验收**: Mock LLM 响应测试，验证 persons 字段解析、人物去重逻辑、自动创建人物+别名

### Task 12: UploadedFilesPage 页面

- **状态**: ⬜ 未开始
- **文件**: 
  - `apps/frontend/src/pages/admin/UploadedFilesPage.tsx`（新建）
- **描述**:
  1. 顶部区域：
     - 左侧 PersonSearchSelect 组件（人物搜索选择器）
     - 右侧上传按钮（Ant Design Button + Upload 包裹）
     - 点击/拖拽上传文件（.txt/.pdf），uploadFile action
  2. 文件列表 Ant Design Table：
     - 列：original_name, file_size（格式化显示）, file_type（Tag：蓝色 TXT/绿色 PDF）, person_name（关联人物）, status（彩色 Tag 标签：uploaded=blue/chunking=orange+hLoading/chunked=green/extracting=purple+Loading/completed=success/error=red）, created_at（格式化）, 操作列
     - 分页支持（onChange 调用 fetchFiles）
     - 支持按 status 筛选（Table 列头 filter）
  3. 操作列按钮：
     - "事件抽取" Button — disabled={status === 'extracting' || status === 'uploaded' || status === 'error'}，loading={status === 'extracting'}
     - "切片" Button — 跳转 navigate(`/admin/upload/${record.id}/chunks`)，disabled={status === 'chunking'}
     - "删除" Popconfirm + Button — 确认后 deleteFile
  4. 抽取完成后自动刷新列表（通过 pollStatus 轮询）
  5. 状态映射：FileStatus → Tag color + 中文文本
  6. 文件上传弹窗/区域内显示上传进度
- **前置依赖**: Task 10（upload store）、Task 11（PersonSearchSelect）
- **验收**: 页面渲染正确，上传/切片/抽取/删除操作流程完整，状态按钮联动正确

---

## 第五批（串行执行，一个完成后再执行下一个）

### Task 7: 上传路由重写

- **状态**: ⬜ 未开始
- **文件**: 
  - `apps/backend/routers/upload.py`（重写）
- **描述**:
  1. POST /api/upload
     - 接收 file + person_id 表单字段
     - 校验文件类型（.txt/.pdf）和大小（10MB）
     - 生成 UUID 文件名，保存到 config.upload_dir
     - 创建 uploaded_files 记录（status=uploaded）
     - asyncio.create_task(run_chunking(file_id)) 启动后台切片
     - 返回 201 + UploadedFileResponse
  2. GET /api/uploaded-files
     - 分页查询（page/page_size）+ 可选 person_id/status 筛选
     - JOIN person 获取 person_name
     - 每条记录计算 chunk_count（子查询 COUNT biography_text WHERE file_id=...)
     - 按 created_at DESC 排序
     - 返回 PaginatedUploadedFiles
  3. GET /api/uploaded-files/{file_id}
     - 查询单条记录 + chunk_count + person_name
     - 404 处理
     - 返回 UploadedFileResponse
  4. DELETE /api/uploaded-files/{file_id}
     - 查询记录 → 获取 file_path
     - 删除磁盘文件（os.remove，异常时记录日志但不阻断）
     - 级联删除 biography_text 切片（或依赖 ON DELETE SET NULL）
     - 删除 uploaded_files 记录 → commit
     - 返回 204
  5. POST /api/uploaded-files/{file_id}/chunk
     - 查询当前文件状态
     - 若 status ∈ {uploaded, error} → 启动后台切片任务 → 返回 ChunkResult
     - 若 status ∈ {chunking, chunked, extracting, completed} → 返回当前状态 + chunk_count
  6. GET /api/uploaded-files/{file_id}/chunks
     - 查询 biography_text WHERE file_id=:id ORDER BY chunk_index
     - 不返回 raw_text 全文，仅返回 ChunkItem（id, chunk_index, text_length, page, created_at）
     - 返回 ChunkListResponse
  7. GET /api/biography-texts/{biography_id}
     - 查询单条 biography_text → 返回 ChunkTextResponse（含 raw_text）
     - 404 处理
  8. POST /api/uploaded-files/{file_id}/extract
     - 查询当前文件状态
     - 若 status ∈ {chunked, completed} → 启动后台抽取 → 返回 FileExtractResponse(status=extracting)
     - 若 status = extracting → 返回当前状态
     - 若 status ∈ {uploaded, chunking, error} → 返回 400 错误（"请先完成切片"）
  9. 所有端点添加 try/except 和适当的 HTTP 异常处理
- **前置依赖**: Task 5（chunking_service）、Task 6（extraction_service）
- **验收**: 使用 curl/Postman 测试全部 8 个端点，状态码和数据格式正确

### Task 13: ChunkListPage 页面

- **状态**: ⬜ 未开始
- **文件**: 
  - `apps/frontend/src/pages/admin/ChunkListPage.tsx`（新建）
- **描述**:
  1. 从 URL 参数获取 fileId（useParams）
  2. 页面顶部：
     - 返回按钮（useNavigate(-1) 或 navigate('/admin/upload')）
     - 文件信息摘要（调用 getUploadedFile 获取 original_name, chunk_count）
  3. Ant Design Table 展示切片：
     - 列：chunk_index（序号, render: index+1）, text_length（长度）, page（页码，可为空）, created_at（创建时间）
     - 数据来源：调用 getChunks(fileId)
     - **无操作按钮列**
  4. 行点击展开（expandable）：
     - 点击行展开显示完整文本
     - 展开时调用 getChunkText(biographyId) 获取 raw_text
     - 在展开区域以 `<pre>` 或 `<Paragraph>` 展示文本
  5. 加载状态处理
- **前置依赖**: Task 12（UploadedFilesPage，因为从该页跳转过来）
- **验收**: 页面渲染正确，切片按序号排列，点击展开查看文本，返回按钮可用

### Task 14: 前端路由与导航更新

- **状态**: ⬜ 未开始
- **文件**: 
  - `apps/frontend/src/router/index.tsx`
  - `apps/frontend/src/pages/admin/UploadPage.tsx`（可能删除）
- **描述**:
  1. 新增 lazy imports：
     - `const UploadedFilesPage = lazy(() => import('@/pages/admin/UploadedFilesPage'))`
     - `const ChunkListPage = lazy(() => import('@/pages/admin/ChunkListPage'))`
  2. 更新路由配置：
     - `/admin/upload` → `UploadedFilesPage`（替换旧的 UploadPage）
     - `/admin/upload/:fileId/chunks` → `ChunkListPage`（新增）
  3. 移除旧的 `UploadPage` lazy import（如果存在）
  4. 可选：删除 `UploadPage.tsx` 文件（如果确认不再需要）
  5. AdminLayout 侧边栏导航不变（"上传与抽取" 菜单项仍指向 /admin/upload）
  6. 确认 `/admin/upload/:fileId/chunks` 路由能正确从 UploadedFilesPage 通过 `navigate()` 跳转
- **前置依赖**: Task 12、Task 13（页面组件）
- **验收**: 所有新路由可正常访问，导航高亮正确，页面间跳转正常，无 404

---

## 验证清单

实施完所有任务后，按以下步骤端到端验证：

1. **数据库**: 执行 migration_v2.sql，确认 uploaded_files 表和 biography_text 新字段存在
2. **后端启动**: `uvicorn main:app --reload --port 8000`，访问 `/docs` 确认 8 个新端点可见
3. **前端启动**: `cd apps/frontend && pnpm dev`，访问 http://localhost:3000
4. **上传流程**: 上传一个 PDF → 表格中出现记录 → 状态从 uploaded → chunking → chunked
5. **切片列表**: 点击"切片"按钮 → 进入切片列表页 → 查看切片详情
6. **事件抽取**: 点击"事件抽取" → 按钮变灰 loading → 状态变为 extracting → 完成变为 completed
7. **人物关联**: 检查 event 表中新创建的记录，确认 persons 字段有值，person_event 关联正确
8. **错误处理**: 上传非 PDF/TXT 文件 → 错误提示；断开 LLM API 后抽取 → status 变为 error
