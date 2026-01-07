# Gemini File API 完全実装 TODO

## 現在の問題
- ファイルはSupabase Storageに保存されているが、Geminiがファイル内容を読めない
- チャット時にファイル名だけ渡している（内容を参照できない）

## 必要な実装

### 1. ファイルアップロード時
```typescript
// app/api/matters/[matterId]/documents/upload/route.ts
// Supabase Storageアップロード後：

// 1. Storageからファイルを取得
const { data: fileData } = await storage.download(storagePath);

// 2. Gemini Files APIにアップロード
const uploadResult = await fileManager.uploadFile(fileData, {
  mimeType: file.type,
  displayName: file.name
});

// 3. gemini_file_uriをDBに保存
await supabase.from("documents").update({
  gemini_file_uri: uploadResult.file.uri,
  gemini_file_name: uploadResult.file.name
}).eq("id", documentId);
```

### 2. チャット時
```typescript
// app/api/matters/[matterId]/chat/route.ts

// 1. 案件のドキュメント取得（gemini_file_uri付き）
const { data: documents } = await supabase
  .from("documents")
  .select("gemini_file_uri, file_name")
  .eq("matter_id", matterId);

// 2. Geminiにファイルと質問を渡す
const result = await model.generateContent([
  {
    fileData: {
      fileUri: documents[0].gemini_file_uri,
      mimeType: "application/pdf"
    }
  },
  { text: message }
]);
```

### 3. DB変更
```sql
ALTER TABLE documents ADD COLUMN gemini_file_uri TEXT;
ALTER TABLE documents ADD COLUMN gemini_file_name TEXT;
```

## 参考
- https://ai.google.dev/gemini-api/docs/file-api
- ファイルは48時間で削除されるため、定期的な再アップロードが必要
