/**
 * Gemini File Search Store REST API実装
 * @google/genai パッケージがまだFile Search Storesをサポートしていないため、REST APIを直接使用
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

/**
 * File Search Storeを作成
 */
export async function createFileSearchStoreRest(displayName: string): Promise<{
  name: string;
  displayName: string;
}> {
  const response = await fetch(`${BASE_URL}/fileSearchStores?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create File Search Store: ${error}`);
  }

  return await response.json();
}

/**
 * File Search Storeに直接アップロード
 */
export async function uploadToFileSearchStoreRest(
  fileSearchStoreName: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: mimeType });
    const file = new File([blob], fileName, { type: mimeType });
    formData.append("file", file);

    const metadata = {
      file: {
        displayName: fileName
      }
    };

    const response = await fetch(
      `${BASE_URL}/${fileSearchStoreName}:uploadToFileSearchStore?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "X-Goog-Upload-Protocol": "multipart",
        },
        body: JSON.stringify({
          file: {
            displayName: fileName
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Upload failed:", error);
      return { success: false, error };
    }

    const operation = await response.json();
    console.log(`File upload operation created: ${operation.name}`);

    // 完了待ち（最大60秒）
    let done = operation.done;
    let attempts = 0;
    let operationName = operation.name;

    while (!done && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const checkResponse = await fetch(
        `${BASE_URL}/${operationName}?key=${GEMINI_API_KEY}`
      );
      
      if (checkResponse.ok) {
        const op = await checkResponse.json();
        done = op.done;
      }
      
      attempts++;
    }

    return { success: done };
  } catch (error) {
    console.error("File upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
