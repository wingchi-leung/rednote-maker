"use client";

import { CARD_FONT_FAMILY } from "@/features/preview/CardMarkdownContent";

interface CardMoversCoverProps {
  accentColor: string;
  textColor: string;
  markdown: string;
}

interface MoversCoverContent {
  title: string;
  subtitle: string;
  features: Array<{ title: string; desc: string }>;
}

interface InlineSegment {
  text: string;
  bold: boolean;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function splitBoldSegments(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const pattern = /\*\*([\s\S]+?)\*\*/g;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, index),
        bold: false,
      });
    }

    segments.push({
      text: match[1] ?? "",
      bold: true,
    });

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      bold: false,
    });
  }

  return segments.length > 0 ? segments : [{ text, bold: false }];
}

function renderInlineMarkdown(
  text: string,
  normalStyle: React.CSSProperties,
  boldStyle: React.CSSProperties
): React.ReactNode[] {
  return splitBoldSegments(text).map((segment, index) =>
    segment.bold ? (
      <span key={`${segment.text}-${index}`} style={boldStyle}>
        {segment.text}
      </span>
    ) : (
      <span key={`${segment.text}-${index}`} style={normalStyle}>
        {segment.text}
      </span>
    )
  );
}

function parseMoversCoverContent(markdown: string): MoversCoverContent {
  const lines = markdown.split("\n").map((l) => l.trim());

  let title = "";
  const bodyLines: string[] = [];

  for (const line of lines) {
    if (/^#+\s/.test(line)) {
      title = line.replace(/^#+\s+/, "").trim();
    } else if (line.length > 0) {
      bodyLines.push(line);
    }
  }

  const sepIdx = bodyLines.indexOf("@@@");
  const subtitlePart = sepIdx >= 0 ? bodyLines.slice(0, sepIdx) : bodyLines.slice(0, 3);
  const featurePart = sepIdx >= 0 ? bodyLines.slice(sepIdx + 1) : [];

  const subtitle = subtitlePart
    .map((line) => line.replace(/!\[[^\]]*\]\([^)]+\)/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"))
    .filter((l) => l.length > 0)
    .join(" ");

  const features = featurePart
    .filter((l) => l.length > 0)
    .map((l) => {
      const parts = l.split("|");
      return {
        title: stripMarkdown(parts[0] ?? ""),
        desc: stripMarkdown(parts[1] ?? ""),
      };
    })
    .filter((f) => f.title.length > 0)
    .slice(0, 4);

  return { title, subtitle, features };
}


 

const FEATURE_ICONS: Record<number, React.ReactNode> = {
0: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="8.2" />
      <path d="M10 5.2 V10.1 L13.2 12.4" />
    </svg>
  ),
   
  1: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="8" r="4.5" />
      <path d="M7.5 12.5 L7 17 L10 15.5 L13 17 L12.5 12.5" />
    </svg>
  ),
  2: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16 L6 6 L10 14 L13 8 L16 16" />
    </svg>
  ),
  3: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 10 L15 10 M11 6 L15 10 L11 14" />
    </svg>
  ),
};

export function CardMoversCover({
  accentColor,
  textColor,
  markdown,
}: CardMoversCoverProps) {
  const { title, subtitle, features } = parseMoversCoverContent(markdown);
  const BG = "#faf5f3";
  const TOP_ART_HEIGHT = 150;
  const taglineColor = "rgba(92,74,130,0.68)";
  const subtitleColor = "rgb(88, 88, 88)";
  const featureDescColor = "rgba(84, 84, 84, 0.68)";
  const defaultTitle = "AI时代前10%的人在做什么";
  const leadCopyStyle: React.CSSProperties = {
    width: "min(320px, 100%)",
    minHeight: 108,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 18,
  };
  const leadTextStyle: React.CSSProperties = {
    fontSize: 18,
    color: subtitleColor,
    lineHeight: 1.75,
  };
  const titleTextStyle: React.CSSProperties = {
    fontSize: 40,
    fontWeight: 500,
    color: textColor,
    lineHeight: 1.08,
    letterSpacing: "0.02em",
    marginBottom: 14,
    flexShrink: 0,
    whiteSpace: "pre-wrap",
  };
  const titleBoldStyle: React.CSSProperties = {
    color: accentColor,
    fontWeight: 700,
  };
  const subtitleNormalStyle: React.CSSProperties = {
    color: subtitleColor,
  };
  const subtitleBoldStyle: React.CSSProperties = {
    color: accentColor,
    fontWeight: 700,
  };
  const peopleIllustrationStyle: React.CSSProperties = {
    position: "absolute",
    right: 24,
    bottom: 44,
    width: 220,
    height: "auto",
    pointerEvents: "none",
    userSelect: "none",
    display: "block",
    objectFit: "contain",
    opacity: 0.96,
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor: BG,
        fontFamily: CARD_FONT_FAMILY,
      }}
    >
      <img
        src="/people.png"
        alt=""
        aria-hidden
        style={peopleIllustrationStyle}
      />

      {/* Top art band */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -32,
          left: 0,
          right: 0,
          height: TOP_ART_HEIGHT,
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
        }}
      >
        <img
          src="/movers_bg.png"
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "auto",
            pointerEvents: "none",
            userSelect: "none",
            display: "block",
            opacity: 1,
          }}
        />
      </div>

      {/* Content zone */}
      <div
        style={{
          position: "absolute",
          inset: `${TOP_ART_HEIGHT}px 0px 0px`,
          display: "flex",
          flexDirection: "column",
          padding: "0 32px",
        }}
      >
        {/* Title */}
        <div style={titleTextStyle}>
          {title ? renderInlineMarkdown(title, { color: textColor }, titleBoldStyle) : defaultTitle}
        </div>

        {/* Lead copy */}
        {subtitle && (
          <div style={leadCopyStyle}>
            <div style={leadTextStyle}>
              {renderInlineMarkdown(subtitle, subtitleNormalStyle, subtitleBoldStyle)}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: 0 }} />

        {/* Features strip */}
        {features.length > 0 && (
          <>
            <div
              style={{
                height: 1,
                backgroundColor: accentColor,
                opacity: 0.25,
                marginBottom: 12,
                flexShrink: 0,
              }}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${features.length}, 1fr)`,
                gap: 8,
                marginBottom: 10,
                flexShrink: 0,
              }}
            >
              {features.map((f, i) => (
                <div key={`${f.title}-${i}`} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ color: accentColor }}>{FEATURE_ICONS[i % 4]}</div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: textColor, lineHeight: 1.2 }}>
                    {f.title}
                  </div>
                  {f.desc && (
                    <div style={{ fontSize: 9.5, color: featureDescColor, lineHeight: 1.4 }}>
                      {f.desc}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer line */}
        <div
          style={{
            fontSize: 8,
            fontWeight: 500,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: taglineColor,
            marginBottom: 16,
            flexShrink: 0,
          }}
        >
          FUTURE BELONGS TO BUILDERS.
        </div>
      </div>
    </div>
  );
}
