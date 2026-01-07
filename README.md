# 弁護士システム2026版

弁護士向け案件管理システム - Gemini File Searchを活用した案件内文書検索・要約機能

## 技術スタック

- **Frontend/Backend**: Next.js (App Router)
- **Hosting**: Vercel
- **Database/Storage/Auth**: Supabase
- **AI**: Gemini API + File Search Store
- **UI**: shadcn/ui (予定)

## 機能

- クライアント管理
- 案件管理
- 文書管理（PDF/Excel/Word）
- 案件内AI検索・チャット（Gemini File Search）

## セットアップ

```bash
npm install
cp .env.local.example .env.local
# .env.localに環境変数を設定
npm run dev
```

## 環境変数

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

## ディレクトリ構成

```
law-rag/
  app/
    (auth)/login/page.tsx
    dashboard/page.tsx
    clients/
      page.tsx
      [clientId]/page.tsx
    matters/
      [matterId]/
        page.tsx
        documents/upload/route.ts
        chat/route.ts
  lib/
    supabase/
    gemini/
    security/
  sql/
```

## 開発状況

- [ ] Phase 1: 基本機能実装
- [ ] Phase 2: 運用強化機能
