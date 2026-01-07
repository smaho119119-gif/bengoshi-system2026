import { getGeminiClient, GEMINI_MODEL } from "./client";

/**
 * 案件用のFile Search Store情報を作成（ダミー）
 * 注意: Google Generative AI SDKはFile Search Storeを直接サポートしていないため、
 * 代わりにmatter_idベースの識別子を使用
 */
export async function createFileSearchStore(matterId: string): Promise<{
  storeName: string;
  displayName: string;
}> {
  const displayName = `FS-${matterId}`;
  const storeName = `store-${matterId}`;

  return {
    storeName,
    displayName,
  };
}

/**
 * File Search Storeにファイルを追加（メタデータのみ保存）
 */
export async function uploadToFileSearchStore(
  storeName: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ success: boolean; error?: string }> {
  // ファイルはSupabase Storageに保存されているので、
  // ここでは成功を返すだけ
  console.log(`File indexed: ${fileName} for store: ${storeName}`);
  return { success: true };
}

/**
 * 案件内検索チャット
 * ファイルの内容を取得してGeminiに渡す
 */
export async function chatWithFileSearch(
  storeName: string,
  userMessage: string,
  fileContents?: string[]
): Promise<{ answer: string; error?: string }> {
  const genAI = getGeminiClient();

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // システムプロンプト
    let prompt = `あなたは弁護士事務所のアシスタントです。
案件に関連するファイルの内容に基づいて質問に回答してください。
回答は日本語で、簡潔かつ正確に行ってください。
ファイルに記載がない情報については「この案件のファイルには該当する情報が見つかりませんでした」と回答してください。

`;

    // ファイル内容があれば追加
    if (fileContents && fileContents.length > 0) {
      prompt += `\n以下は案件のファイル内容です:\n\n`;
      fileContents.forEach((content, index) => {
        prompt += `--- ファイル ${index + 1} ---\n${content}\n\n`;
      });
    }

    prompt += `\nユーザーの質問: ${userMessage}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text() || "回答を生成できませんでした。";

    return { answer };
  } catch (error) {
    console.error("Chat with Gemini failed:", error);
    return {
      answer: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * File Search Storeを削除（何もしない）
 */
export async function deleteFileSearchStore(storeName: string): Promise<void> {
  console.log(`Store deleted: ${storeName}`);
}
