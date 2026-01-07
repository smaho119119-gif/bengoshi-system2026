import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { chatWithFileSearch } from "@/lib/gemini/fileSearch";

interface RouteContext {
  params: Promise<{ matterId: string }>;
}

// POST: チャット（Gemini File Search）
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { matterId } = await context.params;
    const supabase = await createServerSupabaseClient();

    // 環境確認ログ（Runtime Logs で確認する用）
    console.log("[chat] matterId:", matterId);
    console.log("[chat] GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
    console.log("[chat] SUPABASE_URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);

    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // リクエストボディ取得
    const { message } = await request.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Store情報取得
    const { data: store, error: storeError } = await supabase
      .from("matter_stores")
      .select("store_name")
      .eq("matter_id", matterId)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { error: "この案件のAI検索は準備中です" },
        { status: 400 }
      );
    }

    // Gemini File Searchで回答生成
    const { answer, error: chatError } = await chatWithFileSearch(
      store.store_name,
      message.trim()
    );

    if (chatError) {
      console.error("Chat error:", chatError);
      return NextResponse.json(
        { error: "回答の生成に失敗しました", detail: chatError },
        { status: 500 }
      );
    }

    // チャット履歴をDBに保存
    const serviceClient = createServiceRoleClient();

    // ユーザーメッセージ保存
    const { data: userMessage, error: userMsgError } = await serviceClient
      .from("chat_messages")
      .insert([
        {
          matter_id: matterId,
          role: "user",
          content: message.trim(),
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (userMsgError) {
      console.error("Failed to save user message:", userMsgError);
    }

    // アシスタントメッセージ保存
    const { data: assistantMessage, error: assistantMsgError } =
      await serviceClient
        .from("chat_messages")
        .insert([
          {
            matter_id: matterId,
            role: "assistant",
            content: answer,
            user_id: null,
          },
        ])
        .select()
        .single();

    if (assistantMsgError) {
      console.error("Failed to save assistant message:", assistantMsgError);
    }

    return NextResponse.json({
      answer,
      userMessageId: userMessage?.id,
      assistantMessageId: assistantMessage?.id,
    });
  } catch (error) {
    console.error("Chat failed:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
