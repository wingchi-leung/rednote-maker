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

function WalkingIllustration({ color }: { color: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 450 185"
      style={{ width: "100%", height: "100%" }}
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Feather/quill icon */}
      <g opacity="0.55" strokeWidth="1.2">
        <path d="M28 148 C24 120 32 88 46 70 C56 57 70 52 80 60 C90 68 86 84 72 93 C64 98 50 100 44 108 L30 158" />
        <path d="M44 108 L30 158" />
        <path d="M52 88 C50 100 46 114 40 130" strokeWidth="0.8" opacity="0.7" />
        <path d="M62 78 C60 90 56 104 52 118" strokeWidth="0.8" opacity="0.6" />
        <path d="M71 70 C69 82 66 94 63 106" strokeWidth="0.7" opacity="0.5" />
      </g>

      {/* Walking figures — 7 people, left to right */}
      <g strokeWidth="1.35" opacity="0.82">

        {/* Figure 1 (smallest) — x=95, ground=164, pose A */}
        <circle cx="95" cy="110" r="6" />
        <line x1="95" y1="116" x2="95" y2="138" />
        <path d="M95,123 L84,131 L81,139" />
        <path d="M95,123 L104,129 L107,137" />
        <path d="M95,138 L84,153 L81,164" />
        <path d="M95,138 L103,151 L106,163" />

        {/* Figure 2 — x=158, ground=162, pose B */}
        <circle cx="158" cy="102" r="7" />
        <line x1="158" y1="109" x2="158" y2="133" />
        <path d="M158,118 L148,127 L144,136" />
        <path d="M158,118 L167,126 L172,134" />
        <path d="M158,133 L167,149 L170,162" />
        <path d="M158,133 L149,147 L145,161" />

        {/* Figure 3 (with bag) — x=220, ground=160, pose A */}
        <circle cx="220" cy="95" r="7.5" />
        <line x1="220" y1="103" x2="220" y2="128" />
        <path d="M220,113 L209,122 L205,131" />
        <path d="M220,113 L229,120 L233,129" />
        <path d="M220,128 L209,144 L206,160" />
        <path d="M220,128 L228,143 L231,160" />
        {/* bag/backpack on back */}
        <path d="M229,110 C236,108 240,114 238,120 C236,126 230,126 228,122" strokeWidth="1.1" />

        {/* Figure 4 (tallest so far) — x=285, ground=158, pose B */}
        <circle cx="285" cy="88" r="8" />
        <line x1="285" y1="96" x2="285" y2="122" />
        <path d="M285,107 L295,116 L300,126" />
        <path d="M285,107 L275,115 L270,124" />
        <path d="M285,122 L295,138 L299,158" />
        <path d="M285,122 L276,137 L272,157" />

        {/* Figure 5 — x=345, ground=160, pose A */}
        <circle cx="345" cy="98" r="7" />
        <line x1="345" y1="105" x2="345" y2="128" />
        <path d="M345,115 L334,124 L330,133" />
        <path d="M345,115 L354,122 L359,130" />
        <path d="M345,128 L334,144 L330,160" />
        <path d="M345,128 L353,143 L357,160" />

        {/* Figure 6 (tallest) — x=400, ground=157, pose B */}
        <circle cx="400" cy="85" r="8.5" />
        <line x1="400" y1="94" x2="400" y2="120" />
        <path d="M400,105 L411,114 L416,124" />
        <path d="M400,105 L390,113 L385,122" />
        <path d="M400,120 L411,138 L415,157" />
        <path d="M400,120 L390,136 L386,156" />

        {/* Figure 7 (small, slight overlap with 6, rightmost) — x=440, ground=163, pose A */}
        <circle cx="440" cy="112" r="6" />
        <line x1="440" y1="118" x2="440" y2="140" />
        <path d="M440,125 L430,133 L426,141" />
        <path d="M440,125 L448,132 L451,140" />
        <path d="M440,140 L430,155 L427,163" />
        <path d="M440,140 L447,154 L449,163" />
      </g>
    </svg>
  );
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
  const figureColor = "rgba(40,30,60,0.72)";
  const taglineColor = "rgba(80,70,110,0.65)";
  const subtitleColor = "rgba(60,50,90,0.72)";
  const featureTitleColor = textColor;
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
      {/* Top illustration area */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 185 }}>
        <WalkingIllustration color={figureColor} />
      </div>

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
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: featureTitleColor, lineHeight: 1.2 }}>
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
