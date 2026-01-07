"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Client, Matter } from "@/lib/supabase/types";

interface Props {
  client: Client;
  initialMatters: Matter[];
  userId: string;
}

export default function ClientDetail({ client, initialMatters, userId }: Props) {
  const [matters, setMatters] = useState<Matter[]>(initialMatters);
  const [showMatterModal, setShowMatterModal] = useState(false);
  const [matterForm, setMatterForm] = useState({
    title: "",
    matter_type: "",
    status: "active" as "active" | "hold" | "closed",
    description: "",
    court_name: "",
    case_number: "",
    opponent_name: "",
    deadline: "",
  });
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // 案件作成
  async function handleCreateMatter(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. 案件を作成
      const { data: matter, error: matterError } = await supabase
        .from("matters")
        .insert([
          {
            ...matterForm,
            client_id: client.id,
            owner_user_id: userId,
            deadline: matterForm.deadline || null,
          },
        ])
        .select()
        .single();

      if (matterError) throw matterError;

      // 2. Gemini File Search Storeを作成（API経由）
      const storeResponse = await fetch(`/api/matters/${matter.id}/store`, {
        method: "POST",
      });

      if (!storeResponse.ok) {
        console.error("Failed to create File Search Store");
        // Store作成失敗は警告のみ（後で再試行可能）
      }

      setMatters([matter, ...matters]);
      setShowMatterModal(false);
      setMatterForm({
        title: "",
        matter_type: "",
        status: "active",
        description: "",
        court_name: "",
        case_number: "",
        opponent_name: "",
        deadline: "",
      });

      // 案件詳細ページへ遷移
      router.push(`/matters/${matter.id}`);
    } catch (error) {
      console.error("Failed to create matter:", error);
      alert("案件の作成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* パンくず */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/clients" className="hover:text-gray-700">
          クライアント
        </Link>
        <span>/</span>
        <span className="text-gray-900">{client.name}</span>
      </div>

      {/* クライアント情報 */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              <span
                className={`px-2 py-0.5 text-xs rounded ${
                  client.client_type === "corporate"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {client.client_type === "corporate" ? "法人" : "個人"}
              </span>
            </div>
            {client.name_kana && (
              <p className="text-gray-500 mb-3">{client.name_kana}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {client.phone && (
                <p>
                  <span className="text-gray-500">電話:</span> {client.phone}
                </p>
              )}
              {client.email && (
                <p>
                  <span className="text-gray-500">メール:</span> {client.email}
                </p>
              )}
              {client.address && (
                <p className="sm:col-span-2">
                  <span className="text-gray-500">住所:</span> {client.address}
                </p>
              )}
            </div>
          </div>
        </div>
        {client.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">{client.notes}</p>
          </div>
        )}
      </div>

      {/* 案件一覧 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">案件一覧</h2>
          <button
            onClick={() => setShowMatterModal(true)}
            className="btn btn-primary text-sm"
          >
            + 新規案件
          </button>
        </div>

        {matters.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>案件がまだありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {matters.map((matter) => (
              <Link
                key={matter.id}
                href={`/matters/${matter.id}`}
                className="block p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{matter.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      {matter.matter_type && <span>{matter.matter_type}</span>}
                      {matter.case_number && (
                        <span>事件番号: {matter.case_number}</span>
                      )}
                    </div>
                  </div>
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
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 案件作成モーダル */}
      {showMatterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">新規案件</h2>

              <form onSubmit={handleCreateMatter} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    案件名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={matterForm.title}
                    onChange={(e) =>
                      setMatterForm({ ...matterForm, title: e.target.value })
                    }
                    required
                    placeholder="例: ○○訴訟事件"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    案件種別
                  </label>
                  <select
                    value={matterForm.matter_type}
                    onChange={(e) =>
                      setMatterForm({
                        ...matterForm,
                        matter_type: e.target.value,
                      })
                    }
                  >
                    <option value="">選択してください</option>
                    <option value="訴訟">訴訟</option>
                    <option value="調停">調停</option>
                    <option value="示談交渉">示談交渉</option>
                    <option value="契約">契約</option>
                    <option value="相談">相談</option>
                    <option value="その他">その他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ステータス
                  </label>
                  <select
                    value={matterForm.status}
                    onChange={(e) =>
                      setMatterForm({
                        ...matterForm,
                        status: e.target.value as "active" | "hold" | "closed",
                      })
                    }
                  >
                    <option value="active">進行中</option>
                    <option value="hold">保留</option>
                    <option value="closed">終了</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    裁判所名
                  </label>
                  <input
                    type="text"
                    value={matterForm.court_name}
                    onChange={(e) =>
                      setMatterForm({
                        ...matterForm,
                        court_name: e.target.value,
                      })
                    }
                    placeholder="例: 東京地方裁判所"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    事件番号
                  </label>
                  <input
                    type="text"
                    value={matterForm.case_number}
                    onChange={(e) =>
                      setMatterForm({
                        ...matterForm,
                        case_number: e.target.value,
                      })
                    }
                    placeholder="例: 令和6年(ワ)第1234号"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    相手方
                  </label>
                  <input
                    type="text"
                    value={matterForm.opponent_name}
                    onChange={(e) =>
                      setMatterForm({
                        ...matterForm,
                        opponent_name: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    期限
                  </label>
                  <input
                    type="date"
                    value={matterForm.deadline}
                    onChange={(e) =>
                      setMatterForm({
                        ...matterForm,
                        deadline: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    概要
                  </label>
                  <textarea
                    value={matterForm.description}
                    onChange={(e) =>
                      setMatterForm({
                        ...matterForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowMatterModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary flex-1"
                  >
                    {loading ? "作成中..." : "作成"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
