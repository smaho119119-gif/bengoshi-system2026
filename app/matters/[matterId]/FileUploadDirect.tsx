"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";

// ファイル名を安全なキーに変換（Storage用）
function sanitizeFileName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

interface FileUploadDirectProps {
  matterId: string;
  userId: string;
  onUploadComplete: (document: any) => void;
}

export default function FileUploadDirect({
  matterId,
  userId,
  onUploadComplete,
}: FileUploadDirectProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(`${i + 1}/${files.length}: ${file.name} アップロード中...`);

        // ファイルサイズチェック
        if (file.size > 200 * 1024 * 1024) {
          alert(`${file.name} は200MBを超えています`);
          continue;
        }

        // SHA256計算（簡易版）
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const sha256 = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

        // 重複チェック
        const { data: existing } = await supabase
          .from("documents")
          .select("id, file_name")
          .eq("matter_id", matterId)
          .eq("sha256", sha256)
          .single();

        if (existing) {
          alert(`${file.name} は既にアップロードされています（${existing.file_name}）`);
          continue;
        }

        // ドキュメントID生成
        const documentId = uuidv4();
        const safeFileName = sanitizeFileName(file.name);
        const storagePath = `matters/${matterId}/${documentId}/${safeFileName}`;

        // Supabase Storageに直接アップロード
        const { error: uploadError } = await supabase.storage
          .from("matter-files")
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error("Storage upload failed:", uploadError);
          alert(`${file.name} のアップロードに失敗しました`);
          continue;
        }

        // ドキュメント種別を推定
        let docType = "other";
        const fileName = file.name.toLowerCase();
        if (fileName.includes("契約") || fileName.includes("contract")) {
          docType = "contract";
        } else if (fileName.includes("証拠") || fileName.includes("evidence")) {
          docType = "evidence";
        } else if (fileName.includes("訴状") || fileName.includes("claim")) {
          docType = "claim";
        } else if (fileName.includes("メール") || fileName.includes("mail")) {
          docType = "mail";
        } else if (file.type.startsWith("image/")) {
          docType = "image";
        }

        // DBに保存
        const { data: document, error: insertError } = await supabase
          .from("documents")
          .insert([
            {
              id: documentId,
              matter_id: matterId,
              storage_bucket: "matter-files",
              storage_path: storagePath,
              file_name: file.name,
              mime_type: file.type,
              file_size: file.size,
              sha256,
              doc_type: docType,
              uploaded_by: userId,
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error("Document insert failed:", insertError);
          // Storageから削除（ロールバック）
          await supabase.storage.from("matter-files").remove([storagePath]);
          alert(`${file.name} のDB保存に失敗しました`);
          continue;
        }

        onUploadComplete(document);

        // Gemini索引追加（バックグラウンド）
        fetch(`/api/matters/${matterId}/documents/${documentId}/index`, {
          method: "POST",
        }).catch((err) => console.error("Gemini indexing failed:", err));
      }

      setProgress("完了！");
      setTimeout(() => setProgress(""), 2000);
    } catch (error) {
      console.error("Upload error:", error);
      alert("アップロードに失敗しました");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="mb-4">
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={(e) => uploadFiles(e.target.files)}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
        className="hidden"
        id={`file-input-direct-${matterId}`}
      />

      <label
        htmlFor={`file-input-direct-${matterId}`}
        className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition-all"
      >
        <div className="flex flex-col items-center gap-3">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          {uploading ? (
            <div>
              <p className="text-primary-600 font-medium">アップロード中...</p>
              {progress && <p className="text-sm text-gray-500 mt-1">{progress}</p>}
            </div>
          ) : (
            <>
              <p className="text-gray-700 font-medium text-lg">
                クリックしてファイルを選択
              </p>
              <p className="text-sm text-gray-500">
                PDF, Word, Excel, 画像 (最大200MB) | 複数選択可能
              </p>
            </>
          )}
        </div>
      </label>
    </div>
  );
}
