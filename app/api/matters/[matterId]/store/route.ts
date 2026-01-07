import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { createFileSearchStore } from "@/lib/gemini/fileSearch";

interface RouteContext {
  params: Promise<{ matterId: string }>;
}

// POST: Gemini File Search Storeを作成
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { matterId } = await context.params;
    const supabase = await createServerSupabaseClient();

    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 案件存在チェック
    const { data: matter, error: matterError } = await supabase
      .from("matters")
      .select("id")
      .eq("id", matterId)
      .single();

    if (matterError || !matter) {
      return NextResponse.json({ error: "Matter not found" }, { status: 404 });
    }

    // 既存のStore確認
    const { data: existingStore } = await supabase
      .from("matter_stores")
      .select("*")
      .eq("matter_id", matterId)
      .single();

    if (existingStore) {
      return NextResponse.json({
        store: existingStore,
        message: "Store already exists",
      });
    }

    // Gemini File Search Storeを作成
    const { storeName, displayName } = await createFileSearchStore(matterId);

    // DBに保存（サービスロールを使用）
    const serviceClient = createServiceRoleClient();
    const { data: newStore, error: insertError } = await serviceClient
      .from("matter_stores")
      .insert([
        {
          matter_id: matterId,
          store_name: storeName,
          store_display_name: displayName,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Failed to save store:", insertError);
      return NextResponse.json(
        { error: "Failed to save store" },
        { status: 500 }
      );
    }

    return NextResponse.json({ store: newStore });
  } catch (error) {
    console.error("Store creation failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
