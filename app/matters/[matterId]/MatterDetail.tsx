"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Matter, Document, MatterStore, ChatMessage } from "@/lib/supabase/types";

interface Props {
  matter: Matter & { client?: { id: string; name: string } };
  initialDocuments: Document[];
  store: MatterStore | null;
  initialMessages: ChatMessage[];
  userId: string;
}

export default function MatterDetail({
  matter,
  initialDocuments,
  store,
  initialMessages,
  userId,
}: Props) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [uploading, setUploading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"files" | "chat">("files");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // ファイルアップロード
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`/api/matters/${matter.id}/documents/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "アップロードに失敗しました");
        }

        const { document } = await response.json();
        setDocuments((prev) => [document, ...prev]);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert(error instanceof Error ? error.message : "アップロードに失敗しました");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  // チャット送信
  async function handleChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatLoading(true);

    // ユーザーメッセージを先に表示
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      matter_id: matter.id,
      role: "user",
      content: userMessage,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await fetch(`/api/matters/${matter.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error("チャットに失敗しました");
      }

      const { answer, userMessageId, assistantMessageId } = await response.json();

      // 正式なメッセージに置き換え
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMessage.id);
        return [
          ...filtered,
          {
            id: userMessageId,
            matter_id: matter.id,
            role: "user",
            content: userMessage,
            user_id: userId,
            created_at: new Date().toISOString(),
          },
          {
            id: assistantMessageId,
            matter_id: matter.id,
            role: "assistant",
            content: answer,
            user_id: null,
            created_at: new Date().toISOString(),
          },
        ];
      });

      // スクロール
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Chat failed:", error);
      // エラー時はユーザーメッセージを削除
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      alert("チャットに失敗しました");
    } finally {
      setChatLoading(false);
    }
  }

  // ファイルダウンロード
  async function handleDownload(doc: Document) {
    try {
      const { data, error } = await supabase.storage
        .from(doc.storage_bucket)
        .createSignedUrl(doc.storage_path, 60); // 60秒有効

      if (error) throw error;

      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Download failed:", error);
      alert("ダウンロードに失敗しました");
    }
  }

  // MIMEタイプからアイコン取得
  function getFileIcon(mimeType: string) {
    if (mimeType.includes("pdf")) {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
        </svg>
      );
    }
    if (mimeType.includes("image")) {
      return (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    }
    if (mimeType.includes("word") || mimeType.includes("document")) {
      return (
        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
        </svg>
      );
    }
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
      return (
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
      </svg>
    );
  }

  return (
    <>
      {/* パンくず */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/clients" className="hover:text-gray-700">
          クライアント
        </Link>
        <span>/</span>
        <Link
          href={`/clients/${matter.client?.id}`}
          className="hover:text-gray-700"
        >
          {matter.client?.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{matter.title}</span>
      </div>

      {/* 案件情報 */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{matter.title}</h1>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  matter.status === "active"
                    ? "bg-green-100 text-green-700"
                    : matter.status === "hold"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {matter.status === "active"
                  ? "進行中"
                  : matter.status === "hold"
                  ? "保留"
                  : "終了"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {matter.matter_type && (
                <p>
                  <span className="text-gray-500">種別:</span> {matter.matter_type}
                </p>
              )}
              {matter.case_number && (
                <p>
                  <span className="text-gray-500">事件番号:</span>{" "}
                  {matter.case_number}
                </p>
              )}
              {matter.court_name && (
                <p>
                  <span className="text-gray-500">裁判所:</span> {matter.court_name}
                </p>
              )}
              {matter.opponent_name && (
                <p>
                  <span className="text-gray-500">相手方:</span>{" "}
                  {matter.opponent_name}
                </p>
              )}
              {matter.deadline && (
                <p>
                  <span className="text-gray-500">期限:</span> {matter.deadline}
                </p>
              )}
            </div>
          </div>
        </div>
        {matter.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">{matter.description}</p>
          </div>
        )}
      </div>

      {/* タブ */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setActiveTab("files")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === "files"
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          ファイル ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === "chat"
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          AI検索
        </button>
      </div>

      {/* ファイル一覧 */}
      {activeTab === "files" && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">ファイル一覧</h2>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn btn-primary text-sm"
              >
                {uploading ? "アップロード中..." : "+ ファイルを追加"}
              </button>
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>ファイルがまだありません</p>
              <p className="text-sm mt-1">
                PDF, Word, Excel, 画像ファイルをアップロードできます
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(doc.mime_type)}
                    <div>
                      <p className="font-medium text-gray-900">{doc.file_name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(doc.uploaded_at).toLocaleString("ja-JP")}
                        {doc.file_size && (
                          <> · {(doc.file_size / 1024 / 1024).toFixed(2)} MB</>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="btn btn-secondary text-sm"
                    title="ダウンロード"
                  >
                    開く
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* チャット */}
      {activeTab === "chat" && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            この案件について質問
          </h2>

          {!store ? (
            <div className="text-center py-8 text-gray-500">
              <p>AI検索の準備中です...</p>
              <p className="text-sm mt-1">
                ファイルをアップロードすると検索が可能になります
              </p>
            </div>
          ) : (
            <>
              {/* メッセージ一覧 */}
              <div className="h-96 overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>この案件のファイル内容について質問できます</p>
                    <p className="text-sm mt-1">
                      例: 「契約書の解約条件を教えて」
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === "user"
                            ? "bg-primary-600 text-white"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* 入力フォーム */}
              <form onSubmit={handleChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="質問を入力..."
                  disabled={chatLoading}
                  className="flex-1"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="btn btn-primary"
                >
                  送信
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
