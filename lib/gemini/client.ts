import { GoogleGenerativeAI } from "@google/generative-ai";

let genAIInstance: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
}

// 使用するモデル
export const GEMINI_MODEL = "gemini-1.5-flash";
