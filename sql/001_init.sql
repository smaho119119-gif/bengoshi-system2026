-- =============================================
-- 弁護士案件管理システム - テーブル定義
-- =============================================

-- UUID拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. クライアントテーブル
-- =============================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_kana TEXT,                    -- ふりがな
    client_type TEXT DEFAULT 'individual', -- individual/corporate
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- =============================================
-- 2. 案件テーブル
-- =============================================
CREATE TABLE IF NOT EXISTS matters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    matter_type TEXT,                  -- 案件種別（訴訟/契約/相談など）
    status TEXT DEFAULT 'active',      -- active/hold/closed
    description TEXT,
    owner_user_id UUID,                -- 主担当
    court_name TEXT,                   -- 裁判所名
    case_number TEXT,                  -- 事件番号
    opponent_name TEXT,                -- 相手方
    deadline DATE,                     -- 期限
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_matters_client_id ON matters(client_id);
CREATE INDEX IF NOT EXISTS idx_matters_status ON matters(status);
CREATE INDEX IF NOT EXISTS idx_matters_updated_at ON matters(updated_at DESC);

-- =============================================
-- 3. 文書テーブル
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    storage_bucket TEXT DEFAULT 'matter-files',
    storage_path TEXT NOT NULL,        -- matters/{matterId}/{docId}/{filename}
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT,                  -- バイト数
    sha256 TEXT,                       -- 重複チェック用
    doc_type TEXT DEFAULT 'other',     -- contract/evidence/claim/mail/image/other
    is_latest BOOLEAN DEFAULT true,
    description TEXT,
    uploaded_by UUID,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_documents_matter_id ON documents(matter_id);
CREATE INDEX IF NOT EXISTS idx_documents_sha256 ON documents(sha256);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at DESC);

-- =============================================
-- 4. Gemini File Search Store管理テーブル
-- =============================================
CREATE TABLE IF NOT EXISTS matter_stores (
    matter_id UUID PRIMARY KEY REFERENCES matters(id) ON DELETE CASCADE,
    store_name TEXT UNIQUE NOT NULL,   -- Gemini側のstore名
    store_display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. チャット履歴テーブル
-- =============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    role TEXT NOT NULL,                -- user/assistant
    content TEXT NOT NULL,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_chat_messages_matter_id ON chat_messages(matter_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- =============================================
-- 更新日時自動更新トリガー
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_matters_updated_at
    BEFORE UPDATE ON matters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
