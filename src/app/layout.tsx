import type { Metadata } from "next";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://rednote-maker-two.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "RedNoteMaker - Markdown 转小红书图文卡片",
    template: "%s | RedNoteMaker",
  },
  description:
    "极简、专注的 Markdown 转小红书图文卡片工具，一键生成高质量图文排版。",
  keywords: [
    "RedNoteMaker",
    "小红书",
    "Markdown 转图片",
    "图文卡片生成",
    "内容创作工具",
  ],
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: "RedNoteMaker",
    title: "RedNoteMaker - Markdown 转小红书图文卡片",
    description:
      "极简、专注的 Markdown 转小红书图文卡片工具，一键生成高质量图文排版。",
  },
  alternates: {
    canonical: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "RedNoteMaker - Markdown 转小红书图文卡片",
    description:
      "极简、专注的 Markdown 转小红书图文卡片工具，一键生成高质量图文排版。",
  },
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

