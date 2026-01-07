"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Client } from "@/lib/supabase/types";

interface ClientListProps {
  initialClients: Client[];
}

export default function ClientList({ initialClients }: ClientListProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    name_kana: "",
    client_type: "individual" as "individual" | "corporate",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  // 検索フィルター
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      (client.name_kana?.toLowerCase() || "").includes(search.toLowerCase())
  );

  // クライアント作成
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("clients")
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      setClients([data, ...clients]);
      setShowModal(false);
      setFormData({
        name: "",
        name_kana: "",
        client_type: "individual",
        phone: "",
        email: "",
        address: "",
        notes: "",
      });
    } catch (error) {
      console.error("Failed to create client:", error);
      alert("クライアントの作成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* 検索・新規作成 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="クライアント名で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary whitespace-nowrap"
        >
          + 新規クライアント
        </button>
      </div>

      {/* クライアント一覧 */}
      {filteredClients.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            {search ? "検索結果がありません" : "クライアントがまだありません"}
          </p>
          {!search && (
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
            >
              最初のクライアントを作成
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredClients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {client.name}
                    </span>
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
                    <p className="text-sm text-gray-500">{client.name_kana}</p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{client.phone || "-"}</p>
                  <p>{client.email || "-"}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 新規作成モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                新規クライアント
              </h2>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名前 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ふりがな
                  </label>
                  <input
                    type="text"
                    value={formData.name_kana}
                    onChange={(e) =>
                      setFormData({ ...formData, name_kana: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    種別
                  </label>
                  <select
                    value={formData.client_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        client_type: e.target.value as "individual" | "corporate",
                      })
                    }
                  >
                    <option value="individual">個人</option>
                    <option value="corporate">法人</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    住所
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    備考
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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
