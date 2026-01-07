import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
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
      .select("id, file_name, doc_type, gemini_file_uri, mime_type")
      .eq("matter_id", matterId)
      .order("uploaded_at", { ascending: false });

    if (!documents || documents.length === 0) {
      return NextResponse.json({ 
        ok: false, 
        error: "この案件にはまだファイルがアップロードされていません", 
        requestId 
      }, { status: 400 });
    }

    // Gemini File URIが設定されているドキュメントを取得
    const docsWithGemini = documents.filter(doc => doc.gemini_file_uri);

    // Gemini
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview"
    });

    let prompt: any[];
    
    if (docsWithGemini.length > 0) {
      // ファイルを参照して回答
      prompt = [
        {
          text: `あなたは弁護士事務所のアシスタントです。
提供されたファイルの内容に基づいて質問に回答してください。
回答は日本語で、簡潔かつ正確に行ってください。

ユーザーの質問: ${message.trim()}`
        },
        ...docsWithGemini.map(doc => ({
          fileData: {
            fileUri: doc.gemini_file_uri,
            mimeType: doc.mime_type
          }
        }))
      ];
    } else {
      // ファイルがGeminiに未登録の場合
      const fileList = documents.map((doc, i) => 
        `${i + 1}. ${doc.file_name} (種別: ${doc.doc_type})`
      ).join('\n');
      
      prompt = [{
        text: `あなたは弁護士事務所のアシスタントです。
以下のファイルが案件に登録されていますが、ファイル内容はまだ読み込まれていません：

${fileList}

ファイル名から推測できる範囲で回答し、詳細な内容については「ファイルをダウンロードして確認してください」と案内してください。

ユーザーの質問: ${message.trim()}`
      }];
    }

    const result = await model.generateContent(prompt);
    const response = result.response;
    const answer = response.text() || "回答を生成できませんでした";

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
