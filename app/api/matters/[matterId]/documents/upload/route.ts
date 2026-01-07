import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { uploadToFileSearchStore } from "@/lib/gemini/fileSearch";
import { calculateSHA256 } from "@/lib/security/hash";
import { v4 as uuidv4 } from "uuid";

// ファイル名を安全なキーに変換（Storage用）
function sanitizeFileName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

interface RouteContext {
  params: Promise<{ matterId: string }>;
}

// 許可するMIMEタイプ
const ALLOWED_MIME_TYPES = [
  // PDF
  "application/pdf",
  // Word
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Excel
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // 画像
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// POST: ファイルアップロード
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

    // フォームデータ取得
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // MIMEタイプチェック
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "ファイル形式が対応していません",
          allowedTypes: "PDF, Word, Excel, 画像（JPEG, PNG, GIF, WebP）",
        },
        { status: 400 }
      );
    }

    // ファイルサイズチェック（200MB制限）
    if (file.size > 200 * 1024 * 1024) {
      return NextResponse.json(
        { error: "ファイルサイズは200MB以下にしてください" },
        { status: 400 }
      );
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

    // ファイルをBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // SHA256ハッシュ計算
    const sha256 = calculateSHA256(buffer);

    // 重複チェック（レコードなしはOK）
    const { data: existingDoc, error: dupError } = await supabase
      .from("documents")
      .select("id, file_name")
      .eq("matter_id", matterId)
      .eq("sha256", sha256)
      .maybeSingle();

    if (dupError && dupError.code !== "PGRST116") {
      console.error("Duplicate check error:", dupError);
    }

    if (existingDoc) {
      return NextResponse.json(
        {
          error: "このファイルは既にアップロードされています",
          existingFile: existingDoc.file_name,
        },
        { status: 409 }
      );
    }

    // ドキュメントID生成
    const documentId = uuidv4();
    const safeFileName = sanitizeFileName(file.name);
    const storagePath = `matters/${matterId}/${documentId}/${safeFileName}`;

    // Supabase Storageにアップロード
    const serviceClient = createServiceRoleClient();
    const { error: uploadError } = await serviceClient.storage
      .from("matter-files")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload failed:", uploadError);
      return NextResponse.json(
        { error: "ファイルのアップロードに失敗しました" },
        { status: 500 }
      );
    }

    // ドキュメント種別を推定
    let docType = "other";
    const fileName = file.name.toLowerCase();
    if (fileName.includes("契約") || fileName.includes("contract")) {
      docType = "contract";
    } else if (fileName.includes("証拠") || fileName.includes("evidence")) {
      docType = "evidence";
    } else if (fileName.includes("訴状") || fileName.includes("claim")) {
      docType = "claim";
    } else if (fileName.includes("メール") || fileName.includes("mail")) {
      docType = "mail";
    } else if (file.type.startsWith("image/")) {
      docType = "image";
    }

    // DBに保存
    const { data: document, error: insertError } = await serviceClient
      .from("documents")
      .insert([
        {
          id: documentId,
          matter_id: matterId,
          storage_bucket: "matter-files",
          storage_path: storagePath,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          sha256,
          doc_type: docType,
          uploaded_by: user.id,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Document insert failed:", insertError);
      // Storageから削除（ロールバック）
      await serviceClient.storage.from("matter-files").remove([storagePath]);
      return NextResponse.json(
        { error: "ドキュメントの保存に失敗しました" },
        { status: 500 }
      );
    }

    // Gemini Files API + File Search Store への登録
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const { importFileToSearchStore, waitForOperation } = await import("@/lib/gemini/fileSearchDirect");
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      // 1. Files APIにアップロード
      const blob = new Blob([buffer], { type: file.type });
      const geminiFile = new File([blob], file.name, { type: file.type });

      const uploadedFile = await ai.files.upload({
        file: geminiFile,
        config: { displayName: file.name }
      });

      console.log(`Files API upload: ${uploadedFile.name}, URI: ${uploadedFile.uri}`);

      // 2. File Search Storeにインポート
      const { data: store } = await supabase
        .from("matter_stores")
        .select("store_name")
        .eq("matter_id", matterId)
        .maybeSingle();

      if (store?.store_name) {
        console.log(`Importing to File Search Store: ${store.store_name}`);
        
        const operation = await importFileToSearchStore(store.store_name, uploadedFile.name);
        const success = await waitForOperation(operation.name, 30);

        if (success) {
          console.log(`File Search Store import success`);
        } else {
          console.log(`File Search Store import timeout/failed`);
        }
      }

      // 3. file URIをDBに保存
      await serviceClient
        .from("documents")
        .update({
          gemini_file_uri: uploadedFile.uri,
          gemini_file_name: file.name
        })
        .eq("id", documentId);

    } catch (geminiError) {
      console.error("Gemini upload failed (non-critical):", geminiError);
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
