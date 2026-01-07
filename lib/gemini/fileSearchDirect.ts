/**
 * Gemini File Search Store REST API 直接実装
 * @google/genai がまだサポートしていないため、REST APIを使用
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

interface FileSearchStore {
  name: string;
  displayName: string;
  createTime: string;
  updateTime: string;
}

interface Operation {
  name: string;
  done: boolean;
  metadata?: any;
  response?: any;
  error?: any;
}

/**
 * File Search Store作成
 */
export async function createFileSearchStoreDirect(displayName: string): Promise<FileSearchStore> {
  const response = await fetch(`${BASE_URL}/fileSearchStores?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create File Search Store: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * File Search Storeにファイルをインポート（Files APIからのインポート）
 */
export async function importFileToSearchStore(
  fileSearchStoreName: string,
  fileName: string
): Promise<Operation> {
  const response = await fetch(
    `${BASE_URL}/${fileSearchStoreName}:importFile?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to import file: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Operation状態チェック
 */
export async function checkOperation(operationName: string): Promise<Operation> {
  const response = await fetch(`${BASE_URL}/${operationName}?key=${GEMINI_API_KEY}`);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to check operation: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Operation完了まで待機
 */
export async function waitForOperation(operationName: string, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const operation = await checkOperation(operationName);
    
    if (operation.done) {
      if (operation.error) {
        console.error('Operation failed:', operation.error);
        return false;
      }
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return false; // timeout
}
