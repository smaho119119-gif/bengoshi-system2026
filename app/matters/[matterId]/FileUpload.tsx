"use client";

import { useRef, useState } from "react";

interface FileUploadProps {
  matterId: string;
  onUploadComplete: (document: any) => void;
}

export default function FileUpload({ matterId, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(`アップロード中: ${file.name}`);

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`/api/matters/${matterId}/documents/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || error.message || "アップロード失敗");
        }

        const { document } = await response.json();
        onUploadComplete(document);
      }

      setProgress("完了！");
      setTimeout(() => setProgress(""), 2000);
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "アップロードに失敗しました");
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
        id={`file-input-${matterId}`}
      />
      
      <label
        htmlFor={`file-input-${matterId}`}
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
                PDF, Word, Excel, 画像 (最大100MB) | 複数選択可能
              </p>
            </>
          )}
        </div>
      </label>
    </div>
  );
}
