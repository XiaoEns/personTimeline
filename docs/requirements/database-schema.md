# 数据库设计文档

## 设计原则

1. `TEXT` 仅用于大文本字段（简介、描述、原始文本），URL/短字符串统一用 `VARCHAR`
2. 所有时间字段用 `TIMESTAMPTZ`（带时区的时间戳），精确到秒，无时间部分填 `00:00:00`
3. 每个字段添加 `COMMENT ON COLUMN` 注释
4. 主键统一使用 `UUID`，由 `gen_random_uuid()` 自动生成

## E-R 关系

```
person ────< person_event >──── event
  │              │
  │              └── role, personal_title, personal_display_time
  │
  ├──< person_alias
  │
  ├──< biography_text
  │
  └──< external_person_info
```

## 表结构

### 1. person — 人物表

存储人物核心信息。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 主键 |
| name | VARCHAR(200) | NOT NULL | 人物姓名 |
| birth_date | TIMESTAMPTZ | | 规范化出生时间，精确到秒 |
| death_date | TIMESTAMPTZ | | 规范化逝世时间，精确到秒 |
| birth_display | VARCHAR(100) | | 原文出生表述，如"约1660年" |
| death_display | VARCHAR(100) | | 原文逝世表述 |
| avatar_url | VARCHAR(500) | | 头像图片链接 |
| summary | TEXT | | 人物简介文字 |
| status | VARCHAR(20) | NOT NULL DEFAULT 'draft', CHECK(draft/published) | 发布状态 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 更新时间 |

索引：`name`、`status`

### 2. event — 标准事件表

独立于人物存储的标准事件，去除个人视角差异。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| title | VARCHAR(500) | NOT NULL | 标准事件标题 |
| description | TEXT | | 公共描述 |
| start_date | TIMESTAMPTZ | NOT NULL | 事件开始时间 |
| end_date | TIMESTAMPTZ | NOT NULL | 事件结束时间（点事件与 start 相同） |
| display_time | VARCHAR(200) | | 原文时间表述 |
| time_type | VARCHAR(10) | NOT NULL, CHECK(POINT/PERIOD/FUZZY) | 时间类型 |
| sort_date | TIMESTAMPTZ | NOT NULL | 排序基准日 |
| granularity | VARCHAR(10) | NOT NULL, CHECK(YEAR/MONTH/DAY/SEASON) | 时间粒度 |
| event_type | VARCHAR(30) | NOT NULL, CHECK(BIRTH/DEATH/EDUCATION/CAREER/CREATION/HISTORICAL/OTHER) | 事件类型 |
| location | JSONB | NOT NULL DEFAULT '{}' | 地点 JSON |
| persons | JSONB | NOT NULL DEFAULT '[]' | 关联人物的名字字符串数组，例如 ["曹操", "诸葛亮"] |
| is_inferred | BOOLEAN | NOT NULL DEFAULT FALSE | 是否 AI 推断 |
| source | VARCHAR(1000) | | 来源说明 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 更新时间 |

索引：`(sort_date, start_date, end_date)`、`event_type`、`time_type`

### 3. person_event — 人物-事件关联表

记录每个人物在事件中的角色和视角差异。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| person_id | UUID | FK → person(id), NOT NULL | 人物 ID |
| event_id | UUID | FK → event(id), NOT NULL | 事件 ID |
| role | VARCHAR(100) | | 角色（主持/参与/见证/作者等） |
| personal_title | VARCHAR(500) | | 个人视角的原始事件标题 |
| personal_display_time | VARCHAR(200) | | 个人视角的时间原文表述 |
| personal_start_date | TIMESTAMPTZ | | 个人视角的起始时间差异 |
| personal_end_date | TIMESTAMPTZ | | 个人视角的结束时间差异 |
| is_primary | BOOLEAN | NOT NULL DEFAULT FALSE | 是否主要人物 |
| sort_order | INT | NOT NULL DEFAULT 0 | 排序权重 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 更新时间 |

唯一约束：`(person_id, event_id)`
索引：`person_id`、`event_id`
级联删除：删除 person 或 event 时自动删除关联记录

### 4. person_alias — 人物别名表

用于 NER 识别时通过别名匹配到标准人物。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| alias | VARCHAR(200) | PK | 别名/字/号，作为主键 |
| person_id | UUID | FK → person(id), NOT NULL | 关联人物 ID |

索引：`person_id`
级联删除：删除人物时自动删除别名

### 5. biography_text — 原始传记文本表

存储上传的传记原始文本及其元数据。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| person_id | UUID | FK → person(id), NOT NULL | 关联人物 ID |
| source_file | VARCHAR(500) | | 来源文件名 |
| page | INT | | 页码 |
| raw_text | TEXT | NOT NULL | 原始文本内容 |
| ocr_confidence | REAL | | OCR 置信度 0-1 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 |

索引：`person_id`
级联删除：删除人物时自动删除关联文本

### 6. external_person_info — 外部人物信息表

存储从维基数据、维基百科等外部来源自动采集的人物信息。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| person_id | UUID | FK → person(id), NOT NULL | 关联人物 ID |
| source_url | VARCHAR(1000) | | 信息来源 URL |
| source_name | VARCHAR(200) | | 来源名称 |
| fetched_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 采集时间 |
| confidence | REAL | | 信息置信度 0-1 |
| data | JSONB | NOT NULL DEFAULT '{}' | 采集的原始数据 |

索引：`person_id`
级联删除：删除人物时自动删除关联外部信息
