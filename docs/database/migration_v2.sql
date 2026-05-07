-- ============================================================
-- 迁移脚本 v2：文件上传与事件抽取改造
-- 可重复执行（幂等），使用 IF NOT EXISTS / 列存在检查
-- 数据库: PostgreSQL 15+
-- ============================================================

-- 1. 创建 uploaded_files 表
CREATE TABLE IF NOT EXISTS uploaded_files (
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

-- 表注释（COMMENT ON 本身支持重复执行，会覆盖）
COMMENT ON TABLE uploaded_files IS '文件上传记录表，追踪文件生命周期状态';
COMMENT ON COLUMN uploaded_files.id IS '主键 UUID';
COMMENT ON COLUMN uploaded_files.original_name IS '用户上传时的原始文件名';
COMMENT ON COLUMN uploaded_files.file_path IS '文件在磁盘上的存储路径';
COMMENT ON COLUMN uploaded_files.file_size IS '文件大小（字节）';
COMMENT ON COLUMN uploaded_files.file_type IS '文件类型：txt=纯文本, pdf=PDF文档';
COMMENT ON COLUMN uploaded_files.person_id IS '关联人物 ID，可空';
COMMENT ON COLUMN uploaded_files.status IS '文件处理状态：uploaded=已上传, chunking=切片中, chunked=切片完成, extracting=抽取中, completed=抽取完成, error=错误';
COMMENT ON COLUMN uploaded_files.error_message IS '错误信息，仅在 status=error 时有值';
COMMENT ON COLUMN uploaded_files.created_at IS '记录创建时间';
COMMENT ON COLUMN uploaded_files.updated_at IS '记录最后更新时间';

CREATE INDEX IF NOT EXISTS idx_uf_person ON uploaded_files(person_id);
CREATE INDEX IF NOT EXISTS idx_uf_status ON uploaded_files(status);
CREATE INDEX IF NOT EXISTS idx_uf_created_at ON uploaded_files(created_at);

-- 2. biography_text 新增字段（仅当列不存在时添加）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'biography_text' AND column_name = 'file_id'
    ) THEN
        ALTER TABLE biography_text ADD COLUMN file_id UUID REFERENCES uploaded_files(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'biography_text' AND column_name = 'file_path'
    ) THEN
        ALTER TABLE biography_text ADD COLUMN file_path VARCHAR(1000);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'biography_text' AND column_name = 'chunk_index'
    ) THEN
        ALTER TABLE biography_text ADD COLUMN chunk_index INT DEFAULT 0;
    END IF;
END $$;

-- 列注释
COMMENT ON COLUMN biography_text.file_id IS '来源上传文件 ID，v2 新增';
COMMENT ON COLUMN biography_text.file_path IS '来源文件磁盘路径，v2 新增';
COMMENT ON COLUMN biography_text.chunk_index IS '切片序号（从 0 起），v2 新增';

-- 索引
CREATE INDEX IF NOT EXISTS idx_bt_file ON biography_text(file_id);
