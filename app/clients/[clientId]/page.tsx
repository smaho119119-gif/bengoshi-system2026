import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import ClientDetail from "./ClientDetail";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const { clientId } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // クライアント情報取得
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (clientError || !client) {
    notFound();
  }

  // 案件一覧取得
  const { data: matters } = await supabase
    .from("matters")
    .select("*")
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userEmail={user.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClientDetail
          client={client}
          initialMatters={matters || []}
          userId={user.id}
        />
      </main>
    </div>
  );
}
