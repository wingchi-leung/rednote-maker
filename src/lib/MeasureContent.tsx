/**
 * React 组件用于测量 Markdown 实际渲染高度
 * 使用真正的 ReactMarkdown 组件，确保测量准确
 */

"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { CARD_CONFIG } from "./constants";
import { themeColors, fontSizes, densitySpacing, type Theme, type Density, type FontSize } from "@/store/useContentThemeStore";
import { getTemplate, getCodeBackground } from "@/lib/templates";

interface MeasureContentProps {
  markdown: string;
  theme: Theme;
  fontSize: FontSize;
  density: Density;
  onHeightChange: (height: number) => void;
}

export function MeasureContent({ markdown, theme, fontSize, density, onHeightChange }: MeasureContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = themeColors[theme];
  const currentFontSize = fontSizes[fontSize];
  const currentDensity = densitySpacing[density];
  const codeBg = getCodeBackground(theme);
  const blockquoteColor = colors.accent;
  const accentColor = colors.accent;
  const bgColor = colors.background;

  const template = {
    layout: theme === "appleNotes" ? "appleNotes" : "default",
    cardFrame: theme === "morandi" ? { topLine: true, sideMarginPercent: 10 } : undefined,
  };

  useEffect(() => {
    if (containerRef.current) {
      const height = containerRef.current.scrollHeight;
      onHeightChange(height);
    }
  }, [markdown, theme, fontSize, density, onHeightChange]);

  const hasCustomHeader = template.layout === "appleNotes";
  const cardFrame = template.cardFrame;

  const contentStyle: React.CSSProperties = {
    color: colors.text,
    fontSize: currentFontSize,
    padding: hasCustomHeader ? currentDensity.padding : 0,
    lineHeight: currentDensity.lineHeight,
    width: "100%",
    overflowWrap: "break-word" as const,
    wordBreak: "break-word" as const,
  };

  const wrapperStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "0",
  };

  // 处理 cardFrame
  if (cardFrame) {
    const marginPct = `${cardFrame.sideMarginPercent}%`;
    wrapperStyle.paddingLeft = marginPct;
    wrapperStyle.paddingRight = marginPct;
    if (cardFrame.topLine) {
      wrapperStyle.paddingTop = "24px";
    }
  }

  // 处理 appleNotes 头部
  if (hasCustomHeader) {
    wrapperStyle.padding = currentDensity.padding;
  }

  return (
    <div ref={containerRef} style={wrapperStyle}>
      <div style={contentStyle}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold mb-2 mt-0">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-bold mb-2 mt-4">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-bold mb-1.5 mt-3">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-2" style={{ lineHeight: "inherit" }}>{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="mb-2 pl-6 list-disc">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-2 pl-6 list-decimal">{children}</ol>
            ),
            li: ({ children }) => <li className="mb-0.5">{children}</li>,
            code: ({ children }) => (
              <code
                className="px-1 py-0.5 rounded text-sm"
                style={{ backgroundColor: codeBg }}
              >
                {children}
              </code>
            ),
            strong: ({ children }) => (
              <strong
                className="font-bold"
                style={{ color: accentColor }}
              >
                {children}
              </strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
            mark: ({ children }) => (
              <mark
                className="rounded px-0.5 font-medium"
                style={{ backgroundColor: accentColor, color: bgColor }}
              >
                {children}
              </mark>
            ),
            blockquote: ({ children }) => (
              <blockquote
                className="border-l-4 pl-3 py-1 my-2 italic opacity-90"
                style={{ borderColor: blockquoteColor }}
              >
                {children}
              </blockquote>
            ),
          }}
        >
          {markdown || "*空页面*"}
        </ReactMarkdown>
      </div>
    </div>
  );
}
