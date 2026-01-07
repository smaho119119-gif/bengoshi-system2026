import { getGeminiClient, GEMINI_MODEL } from "./client";

/**
 * 案件用のFile Search Storeを作成
 */
export async function createFileSearchStore(matterId: string): Promise<{
  storeName: string;
  displayName: string;
}> {
  const ai = getGeminiClient();
  const displayName = `FS-${matterId}`;

  try {
    const store = await ai.fileSearchStores.create({
      displayName,
    });

    return {
      storeName: store.name || "",
      displayName,
    };
  } catch (error) {
    console.error("Failed to create File Search Store:", error);
    throw error;
  }
}

/**
 * File Search Storeにファイルを追加
 */
export async function uploadToFileSearchStore(
  storeName: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ success: boolean; error?: string }> {
  const ai = getGeminiClient();

  try {
    // ファイルをアップロード
    const uploadResult = await ai.files.upload({
      file: new Blob([fileBuffer], { type: mimeType }),
      config: {
        displayName: fileName,
      },
    });

    if (!uploadResult.name) {
      throw new Error("File upload failed - no name returned");
    }

    // File Search Storeに追加
    await ai.fileSearchStores.uploadFileToFileSearchStore({
      fileSearchStoreName: storeName,
      fileName: uploadResult.name,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to upload to File Search Store:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 案件内検索チャット
 */
export async function chatWithFileSearch(
  storeName: string,
  userMessage: string
): Promise<{ answer: string; error?: string }> {
  const ai = getGeminiClient();

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: userMessage,
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [storeName],
            },
          },
        ],
        systemInstruction: `あなたは弁護士事務所のアシスタントです。
案件に関連するファイルの内容に基づいて質問に回答してください。
回答は日本語で、簡潔かつ正確に行ってください。
ファイルに記載がない情報については「この案件のファイルには該当する情報が見つかりませんでした」と回答してください。`,
      },
    });

    const answer = response.text || "回答を生成できませんでした。";

    return { answer };
  } catch (error) {
    console.error("Chat with File Search failed:", error);
    return {
      answer: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * File Search Storeを削除
 */
export async function deleteFileSearchStore(storeName: string): Promise<void> {
  const ai = getGeminiClient();

  try {
    await ai.fileSearchStores.delete({ name: storeName });
  } catch (error) {
    console.error("Failed to delete File Search Store:", error);
    // 削除失敗は無視（すでに存在しない場合など）
  }
}
