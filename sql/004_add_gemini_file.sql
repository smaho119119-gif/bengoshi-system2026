-- Gemini File API用の列を追加
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS gemini_file_uri TEXT,
ADD COLUMN IF NOT EXISTS gemini_file_name TEXT;

-- インデックス追加（検索高速化）
CREATE INDEX IF NOT EXISTS idx_documents_matter_gemini 
ON documents(matter_id) 
WHERE gemini_file_uri IS NOT NULL;
