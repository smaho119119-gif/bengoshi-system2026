import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// POST: チャット（Gemini File Search想定）詳しいエラーを返す
export async function POST(request: NextRequest, { params }: { params: { matterId: string } }) {
  const requestId = crypto.randomUUID();
  try {
    const matterId = params.matterId;

    // body
    const body = await request.json().catch(() => null);
    const message = body?.message;
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ ok: false, error: "message is required", requestId }, { status: 400 });
    }

    // env
    const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRole = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const geminiKey = requireEnv("GEMINI_API_KEY");

    // DB (service roleでRLS回避)
    const supabase = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false },
    });

    const { data: storeRow, error: storeErr } = await supabase
      .from("matter_stores")
      .select("store_name")
      .eq("matter_id", matterId)
      .maybeSingle();

    if (storeErr) {
      console.error("[chat]", requestId, "DB storeErr:", storeErr);
      return NextResponse.json({ ok: false, error: "DB error (matter_stores)", requestId }, { status: 500 });
    }

    const storeName = storeRow?.store_name;
    if (!storeName) {
      return NextResponse.json({ ok: false, error: "store_name not found for this matter", requestId }, { status: 400 });
    }

    // 該当案件のドキュメント一覧を取得（gemini_file_uri含む）
    const { data: documents } = await supabase
      .from("documents")
      .select("id, file_name, gemini_file_uri, mime_type")
      .eq("matter_id", matterId)
      .order("uploaded_at", { ascending: false });

    // Gemini Files APIにアップロード済みのファイル
    const docsWithGemini = documents?.filter(doc => doc.gemini_file_uri) || [];

    // Gemini
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    console.log('[chat] Using File Search with store:', storeName);

    // File Search Store を使用（公式ドキュメント準拠）
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `あなたは弁護士事務所のアシスタントです。
提供されたファイルの内容に基づいて質問に回答してください。
回答は日本語で、簡潔かつ正確に行ってください。

ユーザーの質問: ${message.trim()}`,
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [storeName]
            }
          }
        ]
      }
    });

    const answer = result.text || "回答を生成できませんでした";
    console.log('[chat] Answer generated:', answer.substring(0, 100));

    // チャット履歴をDBに保存（service role）
    const serviceClient = createServiceRoleClient();
    await serviceClient.from("chat_messages").insert([
      {
        matter_id: matterId,
        role: "user",
        content: message.trim(),
        user_id: null,
      },
      {
        matter_id: matterId,
        role: "assistant",
        content: answer,
        user_id: null,
      },
    ]);

    return NextResponse.json({ ok: true, answer, requestId });
  } catch (e: any) {
    console.error("[chat]", requestId, e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Internal Server Error", requestId },
      { status: 500 }
    );
  }
}
