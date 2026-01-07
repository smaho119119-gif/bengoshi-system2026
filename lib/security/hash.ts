import crypto from "crypto";

/**
 * ファイルのSHA256ハッシュを計算
 */
export function calculateSHA256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * 重複ファイルチェック用
 */
export function generateFileHash(
  buffer: Buffer,
  fileName: string
): { sha256: string; uniqueId: string } {
  const sha256 = calculateSHA256(buffer);
  const timestamp = Date.now();
  const uniqueId = `${sha256.slice(0, 8)}-${timestamp}`;

  return { sha256, uniqueId };
}
