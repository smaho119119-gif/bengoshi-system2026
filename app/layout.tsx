import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "弁護士案件管理システム",
  description: "AI支援による案件文書検索・要約システム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
