import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { uploadToFileSearchStore } from "@/lib/gemini/fileSearch";

interface RouteContext {
  params: Promise<{ matterId: string; documentId: string }>;
}

// POST: ドキュメントをGemini File Searchに索引追加
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { matterId, documentId } = await context.params;
    const supabase = await createServerSupabaseClient();

    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ドキュメント情報取得
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("matter_id", matterId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
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
        { error: "Store not found. Please create matter store first." },
        { status: 404 }
      );
    }

    // Storageからファイル取得
    const serviceClient = createServiceRoleClient();
    const { data: fileData, error: downloadError } = await serviceClient.storage
      .from(document.storage_bucket)
      .download(document.storage_path);

    if (downloadError || !fileData) {
      console.error("File download failed:", downloadError);
      return NextResponse.json(
        { error: "Failed to download file from storage" },
        { status: 500 }
      );
    }

    // BlobをBufferに変換
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Gemini File Searchに索引追加
    const result = await uploadToFileSearchStore(
      store.store_name,
      buffer,
      document.file_name,
      document.mime_type
    );

    if (!result.success) {
      console.error("Gemini indexing failed:", result.error);
      return NextResponse.json(
        { error: "Failed to index file in Gemini" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "File indexed successfully" });
  } catch (error) {
    console.error("Indexing failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
