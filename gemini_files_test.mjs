/**
 * Gemini Files API シンプルテスト（公式推奨の書き方）
 * - Blob / Fileは使わず、uploadに「ファイルパス」を渡す
 */
import dotenv from "dotenv";
import path from "node:path";
import { GoogleGenAI, createUserContent, createPartFromUri } from "@google/genai";

dotenv.config({ path: ".env.local" });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY が設定されていません (.env.local)");
  process.exit(1);
}

async function main() {
  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const testFilePath = path.resolve("./sample-contract.pdf");
    console.log("📤 Files APIにアップロード:", testFilePath);

    // ✅公式例：file にパスを渡す（mimeTypeも指定）
    const myfile = await ai.files.upload({
      file: testFilePath,
      config: { mimeType: "application/pdf", displayName: "sample-contract.pdf" },
    });

    console.log("✅ アップロード完了");
    console.log("   uri:", myfile.uri);
    console.log("   mimeType:", myfile.mimeType);

    const prompt = "あなたは弁護士事務所のアシスタントです。提供されたPDFの内容を日本語で簡潔に要約してください。";

    const res = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: createUserContent([
        createPartFromUri(myfile.uri, myfile.mimeType),
        "\n\n",
        prompt,
      ]),
    });

    console.log("\n📝 回答:\n" + (res.text ?? "（空）"));
  } catch (e) {
    // 403の理由が payload に入ることが多いので丸ごと出す
    console.error("❌ エラー:", e?.message ?? e);
    console.error(e);
    process.exit(1);
  }
}

main();
