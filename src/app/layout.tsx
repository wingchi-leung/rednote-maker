import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RedNoteMaker - Markdown to 小红书卡片",
  description: "极简主义的 Markdown 转小红书卡片工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-apple-gray6">{children}</body>
    </html>
  );
}
