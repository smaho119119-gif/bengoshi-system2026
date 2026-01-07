# 弁護士案件管理システム 2026版

弁護士向け案件管理システム - Gemini File Searchを活用した案件内文書検索・要約機能

## 技術スタック

- **Frontend/Backend**: Next.js 14 (App Router)
- **Hosting**: Vercel
- **Database/Storage/Auth**: Supabase
- **AI**: Gemini API + File Search Store
- **UI**: Tailwind CSS

## 機能

### 実装済み
- ✅ ログイン（メール/パスワード + Google）
- ✅ クライアント管理（一覧・作成）
- ✅ 案件管理（一覧・作成・詳細）
- ✅ 文書管理（PDF/Excel/Word/画像）
- ✅ ファイルアップロード（Supabase Storage）
- ✅ 案件内AI検索・チャット（Gemini File Search）
- ✅ 重複ファイル検出（SHA256）

### 対応ファイル形式
- PDF
- Word (.doc, .docx)
- Excel (.xls, .xlsx)
- 画像 (JPEG, PNG, GIF, WebP)

## セットアップ

### 1. 依存関係インストール

```bash
npm install
```

### 2. Supabaseセットアップ

1. [Supabase](https://supabase.com)でプロジェクト作成
2. SQL Editorで以下を順番に実行:
   - `sql/001_init.sql` - テーブル作成
   - `sql/002_rls.sql` - RLSポリシー
   - `sql/003_storage.sql` - Storageバケット

3. Authentication設定:
   - Email/Password: 有効化
   - Google: OAuthを設定（任意）

### 3. 環境変数設定

```bash
cp .env.local.example .env.local
```

`.env.local`を編集:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

## Vercelデプロイ

1. GitHubリポジトリをVercelに接続
2. 環境変数を設定（上記4つ）
3. デプロイ

## ディレクトリ構成

```
├── app/
│   ├── api/
│   │   └── matters/[matterId]/
│   │       ├── store/route.ts        # Store作成API
│   │       ├── documents/upload/route.ts  # アップロードAPI
│   │       └── chat/route.ts         # チャットAPI
│   ├── auth/callback/route.ts        # OAuth callback
│   ├── clients/
│   │   ├── page.tsx                  # クライアント一覧
│   │   └── [clientId]/page.tsx       # クライアント詳細
│   ├── dashboard/page.tsx            # ダッシュボード
│   ├── login/page.tsx                # ログイン
│   └── matters/[matterId]/page.tsx   # 案件詳細
├── components/
│   └── layout/Header.tsx
├── lib/
│   ├── supabase/                     # Supabaseクライアント
│   ├── gemini/                       # Gemini API
│   └── security/                     # SHA256など
├── sql/                              # DBスキーマ
└── middleware.ts                     # 認証ミドルウェア
```

## API仕様

### POST /api/matters/[matterId]/store
案件用のGemini File Search Storeを作成

### POST /api/matters/[matterId]/documents/upload
ファイルをアップロード
- Content-Type: multipart/form-data
- Body: file (File)
- 最大サイズ: 10MB

### POST /api/matters/[matterId]/chat
案件内ファイルを検索してAI回答を生成
- Body: { message: string }

## セキュリティ

- APIキーはサーバーサイドのみで使用
- Storageはprivate設定
- ファイル閲覧は署名URL（60秒有効）
- RLSで認証済みユーザーのみアクセス可能

## 開発状況

- [x] Phase 1: 基本機能実装
- [ ] Phase 2: 運用強化機能
  - [ ] doc_type自動分類
  - [ ] is_latest運用（最新版フラグ）
  - [ ] 最近見た案件・ピン留め

## ライセンス

Private
