"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";

interface Props {
  systemInfo: {
    clients: number;
    matters: number;
    documents: number;
    stores: number;
    geminiRegistered: number;
  };
  stores: any[];
  recentDocs: any[];
  userEmail: string;
}

export default function AdminPanel({ systemInfo, stores, recentDocs, userEmail }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "config" | "logs" | "files">("overview");

  return (
    <>
      <Header userEmail={userEmail} />
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">管理画面</h1>
            <p className="text-gray-500">システム設定・ログ・ファイル管理</p>
          </div>

          {/* タブ */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === "overview"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              概要
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === "config"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              設定
            </button>
            <button
              onClick={() => setActiveTab("files")}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === "files"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              ファイル一覧
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === "logs"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              ログ
            </button>
          </div>

          {/* 概要 */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="card">
                <h3 className="text-sm font-medium text-gray-500 mb-1">クライアント数</h3>
                <p className="text-3xl font-bold text-gray-900">{systemInfo.clients}</p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-500 mb-1">案件数</h3>
                <p className="text-3xl font-bold text-gray-900">{systemInfo.matters}</p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-500 mb-1">ドキュメント数</h3>
                <p className="text-3xl font-bold text-gray-900">{systemInfo.documents}</p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-500 mb-1">File Search Stores</h3>
                <p className="text-3xl font-bold text-gray-900">{systemInfo.stores}</p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Gemini登録済み</h3>
                <p className="text-3xl font-bold text-gray-900">{systemInfo.geminiRegistered}</p>
                <p className="text-xs text-gray-400 mt-1">
                  / {systemInfo.documents}件中
                </p>
              </div>
            </div>
          )}

          {/* 設定 */}
          {activeTab === "config" && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">環境変数</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">NEXT_PUBLIC_SUPABASE_URL</p>
                    <p className="text-sm text-gray-500 font-mono">
                      {process.env.NEXT_PUBLIC_SUPABASE_URL || '未設定'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">GEMINI_API_KEY</p>
                    <p className="text-sm text-gray-500 font-mono">
                      {process.env.GEMINI_API_KEY ? '●●●●●●●●' + process.env.GEMINI_API_KEY.slice(-4) : '未設定'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">使用モデル</p>
                    <p className="text-sm text-gray-500 font-mono">gemini-3-flash-preview</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">ストレージ設定</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Supabase Storage Bucket</p>
                    <p className="text-sm text-gray-500">matter-files (private)</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">最大ファイルサイズ</p>
                    <p className="text-sm text-gray-500">200 MB</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">対応形式</p>
                    <p className="text-sm text-gray-500">PDF, Word, Excel, 画像</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">File Search Stores</h2>
                <div className="space-y-2">
                  {stores.length === 0 ? (
                    <p className="text-sm text-gray-500">登録されたストアがありません</p>
                  ) : (
                    stores.map((store) => (
                      <div key={store.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-sm text-gray-900">{store.store_name}</p>
                        <p className="text-xs text-gray-500">
                          作成日: {new Date(store.created_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ファイル一覧 */}
          {activeTab === "files" && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">最近のファイル (20件)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-700">ファイル名</th>
                      <th className="text-left p-3 font-medium text-gray-700">案件</th>
                      <th className="text-left p-3 font-medium text-gray-700">サイズ</th>
                      <th className="text-left p-3 font-medium text-gray-700">Gemini登録</th>
                      <th className="text-left p-3 font-medium text-gray-700">アップロード日時</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDocs.map((doc: any) => (
                      <tr key={doc.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{doc.file_name}</td>
                        <td className="p-3">
                          {doc.matters ? (
                            <Link 
                              href={`/matters/${doc.matters.id}`}
                              className="text-primary-600 hover:underline"
                            >
                              {doc.matters.title}
                            </Link>
                          ) : '-'}
                        </td>
                        <td className="p-3">
                          {doc.file_size ? (doc.file_size / 1024 / 1024).toFixed(2) + ' MB' : '-'}
                        </td>
                        <td className="p-3">
                          {doc.gemini_file_uri ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-gray-500">
                          {new Date(doc.uploaded_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ログ */}
          {activeTab === "logs" && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">システムログ</h2>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto h-96 overflow-y-auto">
                <p>[{new Date().toISOString()}] Admin panel loaded</p>
                <p>[{new Date().toISOString()}] System info: {JSON.stringify(systemInfo)}</p>
                <p className="text-yellow-400 mt-2">💡 Vercel Runtime Logsを確認するには:</p>
                <p className="text-gray-400 ml-4">Vercel Dashboard → Deployments → Latest → Logs</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
