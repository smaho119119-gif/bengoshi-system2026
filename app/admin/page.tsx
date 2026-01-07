import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AdminPanel from "./AdminPanel";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // システム情報取得
  const [
    { count: clientsCount },
    { count: mattersCount },
    { count: documentsCount },
    { count: storesCount },
    { data: stores },
    { data: recentDocs }
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("matters").select("*", { count: "exact", head: true }),
    supabase.from("documents").select("*", { count: "exact", head: true }),
    supabase.from("matter_stores").select("*", { count: "exact", head: true }),
    supabase.from("matter_stores").select("*").order("created_at", { ascending: false }).limit(10),
    supabase.from("documents").select(`
      id,
      file_name,
      file_size,
      gemini_file_uri,
      uploaded_at,
      matters (
        id,
        title
      )
    `).order("uploaded_at", { ascending: false }).limit(20)
  ]);

  const systemInfo = {
    clients: clientsCount || 0,
    matters: mattersCount || 0,
    documents: documentsCount || 0,
    stores: storesCount || 0,
    geminiRegistered: recentDocs?.filter(d => d.gemini_file_uri).length || 0
  };

  return (
    <AdminPanel 
      systemInfo={systemInfo}
      stores={stores || []}
      recentDocs={recentDocs || []}
      userEmail={user.email || ""}
    />
  );
}
