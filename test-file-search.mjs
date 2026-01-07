/**
 * Gemini File Search 完全テスト
 * 公式ドキュメント準拠の動作確認スクリプト
 */
import dotenv from 'dotenv';
import fs from 'fs';
import FormData from 'form-data';

dotenv.config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY が設定されていません');
  process.exit(1);
}

async function main() {
  try {
    console.log('🚀 Gemini File Search テスト開始\n');

    // 1. File Search Store作成
    console.log('📦 File Search Store作成中...');
    const createStoreRes = await fetch(`${BASE_URL}/fileSearchStores?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'test-store-' + Date.now() })
    });

    if (!createStoreRes.ok) {
      const error = await createStoreRes.text();
      throw new Error(`Store作成失敗: ${createStoreRes.status} ${error}`);
    }

    const store = await createStoreRes.json();
    console.log(`✅ Store作成完了: ${store.name}\n`);

    // 2. ファイルをFile Search Storeに直接アップロード（REST API）
    const testFilePath = './sample-contract.pdf';
    
    if (!fs.existsSync(testFilePath)) {
      console.error(`❌ テストファイルが見つかりません: ${testFilePath}`);
      process.exit(1);
    }

    console.log(`📤 ファイルアップロード中: ${testFilePath}`);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: 'sample-contract.pdf',
      contentType: 'application/pdf'
    });

    const uploadRes = await fetch(
      `${BASE_URL}/${store.name}:uploadToFileSearchStore?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      }
    );

    console.log(`   Status: ${uploadRes.status}`);
    
    const uploadText = await uploadRes.text();
    console.log(`   Response: ${uploadText.substring(0, 200)}`);

    if (!uploadRes.ok) {
      console.error(`アップロード失敗: ${uploadRes.status}`);
      throw new Error('Upload failed');
    }

    let operation;
    try {
      operation = JSON.parse(uploadText);
    } catch (e) {
      console.error('JSONパースエラー:', e.message);
      throw new Error('Invalid JSON response');
    }

    console.log(`📋 Operation: ${JSON.stringify(operation, null, 2).substring(0, 300)}`);

    // 3. Operation完了待ち
    let attempts = 0;
    while (!operation.done && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const opRes = await fetch(`${BASE_URL}/${operation.name}?key=${GEMINI_API_KEY}`);
      if (opRes.ok) {
        operation = await opRes.json();
        process.stdout.write('.');
      }
      attempts++;
    }
    console.log('');

    if (!operation.done) {
      throw new Error('⏱️ タイムアウト（120秒）');
    }

    if (operation.error) {
      throw new Error(`Operation failed: ${JSON.stringify(operation.error)}`);
    }

    console.log(`✅ ファイル登録完了\n`);

    // 4. File Searchで質問
    console.log('💬 質問中: "この資料の内容を要約してください"');

    const chatRes = await fetch(
      `${BASE_URL}/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "この資料の内容を日本語で簡潔に要約してください" }]
          }],
          tools: [{
            file_search: {
              file_search_store_names: [store.name]
            }
          }]
        })
      }
    );

    if (!chatRes.ok) {
      const error = await chatRes.text();
      throw new Error(`Chat失敗: ${chatRes.status} ${error}`);
    }

    const chatResult = await chatRes.json();
    const answer = chatResult.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer';

    console.log('\n📝 回答:');
    console.log(answer);
    console.log('\n🎉 テスト成功！');

    // 5. Groundingメタデータ確認
    const grounding = chatResult.candidates?.[0]?.groundingMetadata;
    if (grounding) {
      console.log('\n📚 Citations:', JSON.stringify(grounding, null, 2));
    }

  } catch (error) {
    console.error('\n❌ エラー:', error.message);
    process.exit(1);
  }
}

main();
