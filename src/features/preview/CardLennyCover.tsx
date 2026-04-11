"use client";

import { CARD_FONT_FAMILY } from "@/features/preview/CardMarkdownContent";
import type { Alignment } from "@/store/useContentThemeStore";

interface CardLennyCoverProps {
  accentColor: string;
  textColor: string;
  markdown: string;
  fontSize: number;
  alignment: Alignment;
}

interface LennyCoverContent {
  title: string;
  bodyLines: string[];
  summaryLines: string[];
}

function stripMarkdownSyntax(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~`>#-]/g, "")
    .trim();
}

function extractCoverContent(markdown: string): LennyCoverContent {
  const lines = markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const headingLine = lines.find((line) => /^#\s+/.test(line));
  const title = stripMarkdownSyntax(headingLine?.replace(/^#\s+/, "") ?? "");

  const contentLines = lines.filter((line) => !/^#\s+/.test(line));
  const separatorIndex = contentLines.findIndex((line) => line === "@@@");

  const topSectionLines =
    separatorIndex >= 0
      ? contentLines.slice(0, separatorIndex)
      : contentLines.slice(0, 2);
  const bottomSectionLines =
    separatorIndex >= 0
      ? contentLines.slice(separatorIndex + 1)
      : contentLines.slice(2);

  const bodyLines = topSectionLines
    .map((line) => stripMarkdownSyntax(line))
    .filter((line) => line.length > 0)
    .slice(0, 8);
  const summaryLines = bottomSectionLines
    .map((line) => stripMarkdownSyntax(line))
    .filter((line) => line.length > 0)
    .slice(0, 3);

  return { title, bodyLines, summaryLines };
}

function getTitleFontSize(baseFontSize: number, title: string): number {
  const length = Array.from(title).length;

  if (length <= 8) {
    return Math.round(baseFontSize * 3.4);
  }

  if (length <= 14) {
    return Math.round(baseFontSize * 2.8);
  }

  if (length <= 22) {
    return Math.round(baseFontSize * 2.1);
  }

  return Math.round(baseFontSize * 1.8);
}

export function CardLennyCover({
  accentColor,
  textColor,
  markdown,
  fontSize,
  alignment,
}: CardLennyCoverProps) {
  const { title, bodyLines, summaryLines } = extractCoverContent(markdown);
  const hasTitle = title.length > 0;
  const hasBody = bodyLines.length > 0;
  const hasSummary = summaryLines.length > 0;
  const textAlign = alignment === "justify" ? "left" : alignment;
  const titleFontSize = getTitleFontSize(fontSize, title);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        fontFamily: CARD_FONT_FAMILY,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #FFFDFB 0%, #FFF9F3 36%, #FAECE1 36%, #F7E8DC 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 32,
          left: 34,
          width: 73,
          height: 6,
          borderRadius: 999,
          backgroundColor: accentColor,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 38,
          right: 24,
          fontSize: `${Math.max(10, Math.round(fontSize * 0.5))}px`,
          fontWeight: 300,
          color: "#A6A09A",
          lineHeight: 1.1,
          letterSpacing: "0.04em",
          textAlign: "right",
          whiteSpace: "pre-line",
          zIndex: 3,
        }}
      >
        {"百万订阅作者\n智能知识库"}
      </div>

      {hasTitle && (
        <div
          style={{
            position: "absolute",
            top: 58,
            left: 34,
            right: 34,
            bottom: 290,
            overflow: "hidden",
            zIndex: 3,
          }}
        >
          <div
            style={{
              fontSize: `${Math.round(fontSize * 0.95)}px`,
              fontWeight: 700,
              color: accentColor,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Lenny Podcast
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: `${titleFontSize}px`,
              fontWeight: 800,
              color: textColor,
              lineHeight: 1.1,
              letterSpacing: "-0.05em",
              textAlign,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              wordWrap: "break-word",
            }}
          >
            {title}
          </h1>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          right: 26,
          bottom: 46,
          width: 212,
          height: 212,
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow: "0 24px 48px rgba(42, 30, 20, 0.16)",
          zIndex: 1,
        }}
      >
        <img
          src="/lenny_headshot.png"
          alt="Lenny Rachitsky"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            objectFit: "cover",
            objectPosition: "center top",
            display: "block",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          right: 38,
          top: hasTitle ? 246 : 58,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 6,
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: 44,
            height: 2,
            backgroundColor: accentColor,
            opacity: 0.8,
          }}
        />
        <div
          style={{
            fontSize: `${Math.round(fontSize * 0.9)}px`,
            lineHeight: 1.5,
            color: "#7A746D",
            textAlign: "right",
          }}
        >
          <div style={{ fontWeight: 700, color: "#433F3B" }}>Lenny Rachitsky</div>
          <div>前 Airbnb PM</div>
          <div>Lenny newsletter</div>
        </div>
      </div>

      {hasBody && (
        <div
          style={{
            position: "absolute",
            left: 36,
            top: hasTitle ? 268 : 132,
            bottom: 160,
            width: 176,
            overflow: "hidden",
            zIndex: 3,
          }}
        >
          <div
            style={{
              fontSize: `${Math.round(fontSize * 1.08)}px`,
              lineHeight: 1.86,
              color: "#4A433D",
              fontWeight: 420,
              textAlign: "left",
              whiteSpace: "pre-wrap",
            }}
          >
            {bodyLines.map((line, index) => (
              <p
                key={`${line}-${index}`}
                style={{ margin: index === bodyLines.length - 1 ? 0 : "0 0 12px" }}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      {hasSummary && (
        <div
          style={{
            position: "absolute",
            left: 36,
            right: 220,
            bottom: 72,
            zIndex: 3,
          }}
        >
          <div
            style={{
              width: 60,
              height: 2,
              backgroundColor: accentColor,
              marginBottom: 16,
              opacity: 0.8,
            }}
          />
          <div
            style={{
              maxWidth: 190,
              fontSize: `${Math.round(fontSize * 0.82)}px`,
              lineHeight: 1.76,
              color: "#8E8378",
              fontWeight: 400,
              textAlign,
              whiteSpace: "pre-wrap",
            }}
          >
            {summaryLines.map((line, index) => (
              <p
                key={`${line}-${index}`}
                style={{ margin: index === summaryLines.length - 1 ? 0 : "0 0 10px" }}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
