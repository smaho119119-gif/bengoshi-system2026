/**
 * Gemini Files API シンプルテスト
 * File Search Store不要版（Files APIのみ使用）
 */
import dotenv from 'dotenv';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY が設定されていません');
  process.exit(1);
}

async function main() {
  try {
    console.log('🚀 Gemini Files API テスト開始\n');

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // 1. ファイルをFiles APIにアップロード
    const testFilePath = './sample-contract.pdf';
    
    if (!fs.existsSync(testFilePath)) {
      console.error(`❌ テストファイルが見つかりません: ${testFilePath}`);
      console.log('sample-contract.pdf を同じディレクトリに配置してください');
      process.exit(1);
    }

    console.log(`📤 Files APIにアップロード中: ${testFilePath}`);

    const fileBuffer = fs.readFileSync(testFilePath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    const file = new File([blob], 'sample-contract.pdf', { type: 'application/pdf' });

    const uploadedFile = await ai.files.upload({
      file: file,
      config: { displayName: 'sample-contract.pdf' }
    });

    console.log(`✅ アップロード完了`);
    console.log(`   name: ${uploadedFile.name}`);
    console.log(`   uri: ${uploadedFile.uri}`);
    console.log(`   mimeType: ${uploadedFile.mimeType}\n`);

    // 2. アップロードしたファイルを参照してチャット
    console.log('💬 質問中: "このPDFの内容を要約してください"');

    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          text: 'あなたは弁護士事務所のアシスタントです。提供されたPDFファイルの内容を読み、日本語で簡潔に要約してください。'
        },
        {
          fileData: {
            fileUri: uploadedFile.uri,
            mimeType: uploadedFile.mimeType
          }
        }
      ]
    });

    const answer = result.text || "回答を生成できませんでした";

    console.log('\n📝 回答:');
    console.log('─'.repeat(60));
    console.log(answer);
    console.log('─'.repeat(60));
    console.log('\n🎉 テスト成功！');

  } catch (error) {
    console.error('\n❌ エラー:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
