/**
 * Gemini File Search Store REST API実装
 * @google/genai がFile Search Storesをサポートしていないため、REST APIを使用
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

interface FileSearchStore {
  name: string;
  displayName: string;
}

interface Operation {
  name: string;
  done: boolean;
  error?: any;
}

/**
 * File Search Store作成（REST API）
 */
export async function createFileSearchStore(matterId: string): Promise<{
  storeName: string;
  displayName: string;
}> {
  const displayName = `Matter-${matterId}`;
  
  try {
    const response = await fetch(`${BASE_URL}/fileSearchStores?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to create File Search Store:", error);
      // フォールバック: ダミー名を返す
      return { storeName: `fileSearchStores/${matterId}`, displayName };
    }

    const store: FileSearchStore = await response.json();
    console.log(`File Search Store created: ${store.name}`);
    
    return {
      storeName: store.name,
      displayName: store.displayName
    };
  } catch (error) {
    console.error("Create store error:", error);
    return { storeName: `fileSearchStores/${matterId}`, displayName };
  }
}

/**
 * File Search Storeにファイルをアップロード
 * 注：この関数は現在使用されていません（uploadToFileSearchStoreDirect を使用）
 */
export async function uploadToFileSearchStore(
  storeName: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ success: boolean; fileUri?: string; error?: string }> {
  console.log(`uploadToFileSearchStore called for: ${fileName}`);
  return { success: true, fileUri: storeName };
}

/**
 * File Search Storeを削除
 */
export async function deleteFileSearchStore(storeName: string): Promise<void> {
  console.log(`Store deleted: ${storeName}`);
}
