-- =============================================
-- 弁護士案件管理システム - RLS設定
-- 全員閲覧可能バージョン（シンプル）
-- =============================================

-- RLSを有効化
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- クライアント: 認証済みユーザーは全員アクセス可能
-- =============================================
CREATE POLICY "clients_select_authenticated" ON clients
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "clients_insert_authenticated" ON clients
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "clients_update_authenticated" ON clients
    FOR UPDATE TO authenticated
    USING (true);

CREATE POLICY "clients_delete_authenticated" ON clients
    FOR DELETE TO authenticated
    USING (true);

-- =============================================
-- 案件: 認証済みユーザーは全員アクセス可能
-- =============================================
CREATE POLICY "matters_select_authenticated" ON matters
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "matters_insert_authenticated" ON matters
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "matters_update_authenticated" ON matters
    FOR UPDATE TO authenticated
    USING (true);

CREATE POLICY "matters_delete_authenticated" ON matters
    FOR DELETE TO authenticated
    USING (true);

-- =============================================
-- 文書: 認証済みユーザーは全員アクセス可能
-- =============================================
CREATE POLICY "documents_select_authenticated" ON documents
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "documents_insert_authenticated" ON documents
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "documents_update_authenticated" ON documents
    FOR UPDATE TO authenticated
    USING (true);

CREATE POLICY "documents_delete_authenticated" ON documents
    FOR DELETE TO authenticated
    USING (true);

-- =============================================
-- Store管理: 認証済みユーザーは全員アクセス可能
-- =============================================
CREATE POLICY "matter_stores_select_authenticated" ON matter_stores
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "matter_stores_insert_authenticated" ON matter_stores
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "matter_stores_update_authenticated" ON matter_stores
    FOR UPDATE TO authenticated
    USING (true);

-- =============================================
-- チャット履歴: 認証済みユーザーは全員アクセス可能
-- =============================================
CREATE POLICY "chat_messages_select_authenticated" ON chat_messages
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "chat_messages_insert_authenticated" ON chat_messages
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- =============================================
-- サービスロール用（バイパス）
-- =============================================
-- サービスロールはRLSをバイパスするため、追加のポリシーは不要
