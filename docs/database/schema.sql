-- ============================================================
-- 多人物传记时间轴系统 — 建表脚本
-- 数据库: PostgreSQL 15+
-- ============================================================

-- 人物表
CREATE TABLE person (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(200) NOT NULL,
    birth_date    TIMESTAMPTZ,
    death_date    TIMESTAMPTZ,
    birth_display VARCHAR(100),
    death_display VARCHAR(100),
    avatar_url    VARCHAR(500),
    summary       TEXT,
    status        VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE person IS '人物表';
COMMENT ON COLUMN person.id IS '主键 UUID';
COMMENT ON COLUMN person.name IS '人物姓名';
COMMENT ON COLUMN person.birth_date IS '规范化出生时间，精确到秒，未知时分秒填 00:00:00';
COMMENT ON COLUMN person.death_date IS '规范化逝世时间，精确到秒';
COMMENT ON COLUMN person.birth_display IS '原文中的出生表述，保留原始格式';
COMMENT ON COLUMN person.death_display IS '原文中的逝世表述，保留原始格式';
COMMENT ON COLUMN person.avatar_url IS '头像图片链接';
COMMENT ON COLUMN person.summary IS '人物简介文字';
COMMENT ON COLUMN person.status IS '状态: draft=草稿, published=已发布';
COMMENT ON COLUMN person.created_at IS '记录创建时间';
COMMENT ON COLUMN person.updated_at IS '记录最后更新时间';

CREATE INDEX idx_person_name ON person(name);
CREATE INDEX idx_person_status ON person(status);


-- 标准事件表
CREATE TABLE event (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         VARCHAR(500) NOT NULL,
    description   TEXT,
    start_date    TIMESTAMPTZ NOT NULL,
    end_date      TIMESTAMPTZ NOT NULL,
    display_time  VARCHAR(200),
    time_type     VARCHAR(10) NOT NULL
                    CHECK (time_type IN ('POINT', 'PERIOD', 'FUZZY')),
    sort_date     TIMESTAMPTZ NOT NULL,
    granularity   VARCHAR(10) NOT NULL
                    CHECK (granularity IN ('YEAR', 'MONTH', 'DAY', 'SEASON')),
    event_type    VARCHAR(30) NOT NULL
                    CHECK (event_type IN ('BIRTH','DEATH','EDUCATION','CAREER','CREATION','HISTORICAL','OTHER')),
    location      JSONB NOT NULL DEFAULT '{}',
    persons       JSONB NOT NULL DEFAULT '[]',
    is_inferred   BOOLEAN NOT NULL DEFAULT FALSE,
    source        VARCHAR(1000),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE event IS '标准事件表，独立于人物存储';
COMMENT ON COLUMN event.id IS '主键 UUID';
COMMENT ON COLUMN event.title IS '标准事件标题，去除个人视角差异的统一标题';
COMMENT ON COLUMN event.description IS '事件的公共描述';
COMMENT ON COLUMN event.start_date IS '事件开始时间，精确到秒，时间段事件取起始日 00:00:00';
COMMENT ON COLUMN event.end_date IS '事件结束时间，点事件与 start_date 相同';
COMMENT ON COLUMN event.display_time IS '原文中的时间表述，保留原始格式';
COMMENT ON COLUMN event.time_type IS '时间类型: POINT=时间点, PERIOD=时间段, FUZZY=模糊时段';
COMMENT ON COLUMN event.sort_date IS '排序基准日，用于时间轴排序（时间段取 start_date）';
COMMENT ON COLUMN event.granularity IS '时间粒度: YEAR/MONTH/DAY/SEASON';
COMMENT ON COLUMN event.event_type IS '事件类型分类';
COMMENT ON COLUMN event.location IS '地点 JSON，包含名称和坐标';
COMMENT ON COLUMN event.persons IS '关联人物名字字符串数组，例如 ["曹操", "诸葛亮", "刘备"]';
COMMENT ON COLUMN event.is_inferred IS '是否由 AI 自动推断而非人工确认';
COMMENT ON COLUMN event.source IS '事件信息来源（书名、URL等）';
COMMENT ON COLUMN event.created_at IS '记录创建时间';
COMMENT ON COLUMN event.updated_at IS '记录最后更新时间';

CREATE INDEX idx_event_dates ON event(sort_date, start_date, end_date);
CREATE INDEX idx_event_type ON event(event_type);
CREATE INDEX idx_event_time_type ON event(time_type);


-- 人物-事件关联表
CREATE TABLE person_event (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id           UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    event_id            UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
    role                VARCHAR(100),
    personal_title      VARCHAR(500),
    personal_display_time VARCHAR(200),
    personal_start_date TIMESTAMPTZ,
    personal_end_date   TIMESTAMPTZ,
    is_primary          BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order          INT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(person_id, event_id)
);
COMMENT ON TABLE person_event IS '人物-事件关联表，记录每个人物在事件中的角色和视角';
COMMENT ON COLUMN person_event.id IS '主键 UUID';
COMMENT ON COLUMN person_event.person_id IS '人物 ID，引用 person 表';
COMMENT ON COLUMN person_event.event_id IS '事件 ID，引用 event 表';
COMMENT ON COLUMN person_event.role IS '人物在该事件中的角色（主持/参与/见证/作者等）';
COMMENT ON COLUMN person_event.personal_title IS '该人物视角下的原始事件标题，保留原文表述';
COMMENT ON COLUMN person_event.personal_display_time IS '该人物相关的时间原文表述';
COMMENT ON COLUMN person_event.personal_start_date IS '该人物视角的时间差异，若与标准时间不同可记录';
COMMENT ON COLUMN person_event.personal_end_date IS '该人物视角的结束时间差异';
COMMENT ON COLUMN person_event.is_primary IS '是否为主要相关人物';
COMMENT ON COLUMN person_event.sort_order IS '排序权重，数值越小越靠前';
COMMENT ON COLUMN person_event.created_at IS '记录创建时间';
COMMENT ON COLUMN person_event.updated_at IS '记录最后更新时间';

CREATE INDEX idx_pe_person ON person_event(person_id);
CREATE INDEX idx_pe_event ON person_event(event_id);


-- 人物别名表
CREATE TABLE person_alias (
    alias     VARCHAR(200) NOT NULL,
    person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    PRIMARY KEY (alias)
);
COMMENT ON TABLE person_alias IS '人物别名表，用于 NER 识别和搜索匹配';
COMMENT ON COLUMN person_alias.alias IS '别名/曾用名/字/号等，作为主键';
COMMENT ON COLUMN person_alias.person_id IS '关联的标准人物 ID';

CREATE INDEX idx_alias_person ON person_alias(person_id);


-- 原始传记文本表
CREATE TABLE biography_text (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id      UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    source_file    VARCHAR(500),
    page           INT,
    raw_text       TEXT NOT NULL,
    ocr_confidence REAL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE biography_text IS '原始传记文本存储';
COMMENT ON COLUMN biography_text.id IS '主键 UUID';
COMMENT ON COLUMN biography_text.person_id IS '关联人物 ID';
COMMENT ON COLUMN biography_text.source_file IS '来源文件名';
COMMENT ON COLUMN biography_text.page IS '页码';
COMMENT ON COLUMN biography_text.raw_text IS '原始文本内容';
COMMENT ON COLUMN biography_text.ocr_confidence IS 'OCR 识别置信度 0-1';
COMMENT ON COLUMN biography_text.created_at IS '记录创建时间';

CREATE INDEX idx_bt_person ON biography_text(person_id);


-- 外部人物信息表
CREATE TABLE external_person_info (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id   UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    source_url  VARCHAR(1000),
    source_name VARCHAR(200),
    fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confidence  REAL,
    data        JSONB NOT NULL DEFAULT '{}'
);
COMMENT ON TABLE external_person_info IS '外部自动采集的人物信息';
COMMENT ON COLUMN external_person_info.id IS '主键 UUID';
COMMENT ON COLUMN external_person_info.person_id IS '关联人物 ID';
COMMENT ON COLUMN external_person_info.source_url IS '信息来源 URL';
COMMENT ON COLUMN external_person_info.source_name IS '来源名称';
COMMENT ON COLUMN external_person_info.fetched_at IS '采集时间';
COMMENT ON COLUMN external_person_info.confidence IS '信息置信度 0-1';
COMMENT ON COLUMN external_person_info.data IS '采集的原始数据 JSON';

CREATE INDEX idx_epi_person ON external_person_info(person_id);
