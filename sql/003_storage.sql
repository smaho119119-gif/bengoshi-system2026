-- =============================================
-- 弁護士案件管理システム - Storage設定
-- Supabase Dashboard の SQL Editor で実行
-- =============================================

-- Storageバケット作成（プライベート）
INSERT INTO storage.buckets (id, name, public)
VALUES ('matter-files', 'matter-files', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Storage RLSポリシー
-- =============================================

-- 認証済みユーザーはアップロード可能
CREATE POLICY "matter_files_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'matter-files');

-- 認証済みユーザーは閲覧可能
CREATE POLICY "matter_files_select" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'matter-files');

-- 認証済みユーザーは削除可能
CREATE POLICY "matter_files_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'matter-files');
