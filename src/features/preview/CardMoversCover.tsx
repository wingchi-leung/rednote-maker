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

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function parseMoversCoverContent(markdown: string): MoversCoverContent {
  const lines = markdown.split("\n").map((l) => l.trim());

  let title = "";
  const bodyLines: string[] = [];

  for (const line of lines) {
    if (/^#+\s/.test(line)) {
      title = stripMarkdown(line.replace(/^#+\s+/, ""));
    } else if (line.length > 0) {
      bodyLines.push(line);
    }
  }

  const sepIdx = bodyLines.indexOf("@@@");
  const subtitlePart = sepIdx >= 0 ? bodyLines.slice(0, sepIdx) : bodyLines.slice(0, 3);
  const featurePart = sepIdx >= 0 ? bodyLines.slice(sepIdx + 1) : [];

  const subtitle = subtitlePart
    .map(stripMarkdown)
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
      <path d="M4 10 L8 14 L16 6" />
      <circle cx="10" cy="10" r="8.5" />
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

export function CardMoversCover({ accentColor, textColor, markdown }: CardMoversCoverProps) {
  const { title, subtitle, features } = parseMoversCoverContent(markdown);
  const BG = "#EDE8F7";
  const taglineColor = "rgba(80,70,110,0.65)";
  const subtitleColor = "rgba(60,50,90,0.72)";
  const featureDescColor = "rgba(80,70,110,0.65)";

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
      {/* Background illustration — multiply blend fuses white to lavender, keeps ink lines */}
      <img
        src="/movers_bg.png"
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top center",
          mixBlendMode: "multiply",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />

      {/* Content zone */}
      <div
        style={{
          position: "absolute",
          top: 185,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          padding: "0 32px",
        }}
      >
        {/* Tagline */}
        <div
          style={{
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: taglineColor,
            marginBottom: 10,
            marginTop: 2,
          }}
        >
          KEEP LEARNING, KEEP MOVING.
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: textColor,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: 14,
            flexShrink: 0,
          }}
        >
          {title || "AI 时代前10%的人在做什么"}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              fontSize: 12,
              color: subtitleColor,
              lineHeight: 1.7,
              marginBottom: 14,
              flexShrink: 0,
            }}
          >
            {subtitle}
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
          THE FUTURE BELONGS TO THE MOVERS.
        </div>
      </div>
    </div>
  );
}
