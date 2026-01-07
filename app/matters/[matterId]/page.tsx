import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import MatterDetail from "./MatterDetail";

interface Props {
  params: Promise<{ matterId: string }>;
}

export default async function MatterDetailPage({ params }: Props) {
  const { matterId } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 案件情報取得（クライアント情報含む）
  const { data: matter, error: matterError } = await supabase
    .from("matters")
    .select(
      `
      *,
      client:clients(*)
    `
    )
    .eq("id", matterId)
    .single();

  if (matterError || !matter) {
    notFound();
  }

  // 文書一覧取得
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("matter_id", matterId)
    .order("uploaded_at", { ascending: false });

  // Store情報取得
  const { data: store } = await supabase
    .from("matter_stores")
    .select("*")
    .eq("matter_id", matterId)
    .single();

  // チャット履歴取得
  const { data: chatMessages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("matter_id", matterId)
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userEmail={user.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MatterDetail
          matter={matter}
          initialDocuments={documents || []}
          store={store}
          initialMessages={chatMessages || []}
          userId={user.id}
        />
      </main>
    </div>
  );
}
