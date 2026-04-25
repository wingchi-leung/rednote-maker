import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import {
  TEMPLATES,
  getTemplate,
  getTemplateLayout,
  getCodeBackground,
  getDefaultStrongTextColor,
  type Theme,
} from "@/lib/templates";
import { CARD_CONFIG } from "@/lib/constants";
import type { FontSize, Density, Alignment } from "@/store/useContentThemeStore";
import { calculatePages } from "@/lib/pagination";

export interface GenerateImagesOptions {
  markdown: string;
  theme: Theme;
  fontSize: FontSize;
  density: Density;
  alignment: Alignment;
  footerText?: string;
  outputDir: string;
  debug?: boolean;
}

const FONT_SIZE_MAP: Record<FontSize, number> = {
  sm: 14,
  md: 16,
  lg: 18,
};

const DENSITY_CONFIG: Record<Density, { padding: string; lineHeight: string }> = {
  compact: { padding: "24px", lineHeight: "1.5" },
  comfortable: { padding: "32px", lineHeight: "1.75" },
  spacious: { padding: "40px", lineHeight: "2" },
};

export async function generateImages(options: GenerateImagesOptions): Promise<string[]> {
  const { markdown, theme, fontSize, density, alignment, footerText, outputDir, debug } =
    options;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    const template = getTemplate(theme);
    const strongTextColor = getDefaultStrongTextColor(theme);
    const footerConfig = {
      isEnabled: !!footerText && footerText.trim().length > 0,
      text: footerText || "",
    };

    const htmlContent = buildHtmlPage({
      markdown,
      theme,
      fontSize,
      density,
      alignment,
      footerText,
      template,
      strongTextColor,
      footerConfig,
    });

    if (debug) {
      const debugPath = path.join(outputDir, "debug-render.html");
      fs.writeFileSync(debugPath, htmlContent, "utf-8");
      console.log(`[DEBUG] 临时 HTML 已保存到: ${debugPath}`);
    }

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    await page.setViewport({
      width: CARD_CONFIG.previewWidth,
      height: CARD_CONFIG.previewHeight * 10,
      deviceScaleFactor: CARD_CONFIG.scale,
    });

    const pageCount = await page.evaluate(() => {
      const cards = document.querySelectorAll(".card-page");
      return cards.length;
    });

    if (pageCount === 0) {
      throw new Error("没有生成任何卡片页面");
    }

    const outputFiles: string[] = [];
    const fileNamePrefix = extractFirstSentence(markdown);

    for (let i = 0; i < pageCount; i++) {
      const cardSelector = `.card-page:nth-child(${i + 1})`;

      const element = await page.$(cardSelector);
      if (!element) {
        console.warn(`[警告] 找不到第 ${i + 1} 页的元素`);
        continue;
      }

      const screenshotBuffer = await element.screenshot({
        type: "png",
      });

      const outputPath = path.join(outputDir, `${fileNamePrefix}-${i + 1}.png`);
      fs.writeFileSync(outputPath, screenshotBuffer);
      outputFiles.push(outputPath);

      await element.dispose();
    }

    return outputFiles;
  } finally {
    if (!debug) {
      await browser.close();
    }
  }
}

interface BuildHtmlPageOptions {
  markdown: string;
  theme: Theme;
  fontSize: FontSize;
  density: Density;
  alignment: Alignment;
  footerText?: string;
  template: ReturnType<typeof getTemplate>;
  strongTextColor: string;
  footerConfig: { isEnabled: boolean; text: string };
}

function buildHtmlPage(options: BuildHtmlPageOptions): string {
  const { markdown, theme, fontSize, density, alignment, template, strongTextColor, footerConfig } =
    options;

  const fontSizePx = FONT_SIZE_MAP[fontSize];
  const densityConfig = DENSITY_CONFIG[density];
  const layout = getTemplateLayout(theme);
  const codeBackground = getCodeBackground(theme);
  const blockquoteColor = template.blockquoteColor ?? template.colors.accent;

  const pages = calculatePages(markdown, {
    density,
    fontSize,
    theme,
    strongTextColor,
    footer: footerConfig,
  });

  let cardsHtml = "";

  for (let i = 0; i < pages.length; i++) {
    const pageContent = pages[i];

    const effectiveTheme = theme === "lennyCover" && i > 0 ? "morandi" : theme;
    const effectiveTemplate = getTemplate(effectiveTheme);
    const effectiveColors = effectiveTemplate.colors;
    const effectiveStrongTextColor =
      effectiveTheme === "morandi" ? getDefaultStrongTextColor("morandi") : strongTextColor;
    const effectiveLayout = getTemplateLayout(effectiveTheme);
    const effectiveCodeBg = getCodeBackground(effectiveTheme);
    const effectiveBlockquoteColor = effectiveTemplate.blockquoteColor ?? effectiveColors.accent;

    const cardContent = renderCardContent({
      pageContent,
      index: i,
      theme: effectiveTheme,
      template: effectiveTemplate,
      colors: effectiveColors,
      strongTextColor: effectiveStrongTextColor,
      layout: effectiveLayout,
      codeBackground: effectiveCodeBg,
      blockquoteColor: effectiveBlockquoteColor,
      fontSizePx,
      densityConfig,
      alignment,
      footerConfig,
    });

    cardsHtml += `
      <div class="card-page" style="
        width: ${CARD_CONFIG.previewWidth}px;
        height: ${CARD_CONFIG.previewHeight}px;
        position: relative;
        overflow: hidden;
        margin-bottom: 20px;
      ">
        ${cardContent}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RedNoteMaker Render</title>
      <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: #f5f5f7;
          padding: 20px;
        }

        .card-content ol.list-fixed-num {
          list-style: none;
          padding-left: 0;
          counter-reset: list-num;
        }
        .card-content ol.list-fixed-num li {
          padding-left: 3.35em;
          position: relative;
        }
        .card-content ol.list-fixed-num li > * {
          margin-left: 0;
          padding-left: 0;
        }
        .card-content ol.list-fixed-num li::before {
          content: counter(list-num) ".";
          counter-increment: list-num;
          position: absolute;
          left: 0;
          width: 3em;
          text-align: right;
        }

        .card-content ul.list-fixed-bullet {
          list-style: none;
          padding-left: 0;
        }
        .card-content ul.list-fixed-bullet li {
          padding-left: 1.75em;
          position: relative;
        }
        .card-content ul.list-fixed-bullet li > * {
          margin-left: 0;
          padding-left: 0;
        }
        .card-content ul.list-fixed-bullet li::before {
          content: "•";
          position: absolute;
          left: 0;
          width: 1.5em;
          text-align: center;
        }
      </style>
    </head>
    <body>
      ${cardsHtml}
    </body>
    </html>
  `;
}

interface RenderCardContentOptions {
  pageContent: string;
  index: number;
  theme: Theme;
  template: ReturnType<typeof getTemplate>;
  colors: { background: string; text: string; accent: string };
  strongTextColor: string;
  layout: string;
  codeBackground: string;
  blockquoteColor: string;
  fontSizePx: number;
  densityConfig: { padding: string; lineHeight: string };
  alignment: Alignment;
  footerConfig: { isEnabled: boolean; text: string };
}

function renderCardContent(options: RenderCardContentOptions): string {
  const {
    pageContent,
    index,
    theme,
    template,
    colors,
    strongTextColor,
    layout,
    codeBackground,
    blockquoteColor,
    fontSizePx,
    densityConfig,
    alignment,
    footerConfig,
  } = options;

  if (layout === "lennyCover") {
    return renderLennyCoverCard(pageContent, colors, fontSizePx, alignment);
  }

  const hasCustomHeader = layout === "appleNotes";
  const hasSketchDecoration = template.decoration === "sketch";
  const hasCardFrame = !!template.cardFrame;

  let innerContent = "";

  if (hasCustomHeader) {
    innerContent += renderAppleNotesHeader(colors.accent);
  }

  innerContent += renderMarkdownContent({
    content: pageContent,
    colors,
    strongTextColor,
    codeBackground,
    blockquoteColor,
    fontSizePx,
    densityConfig,
    alignment,
    hasCustomHeader,
    footerConfig,
  });

  if (hasSketchDecoration) {
    return renderSketchDecorationCard(innerContent, colors, template, fontSizePx, densityConfig);
  }

  if (hasCardFrame) {
    return renderCardFrameCard(innerContent, colors, template, fontSizePx, densityConfig);
  }

  return renderDefaultCard(innerContent, colors, theme, fontSizePx, densityConfig);
}

function renderDefaultCard(
  innerContent: string,
  colors: { background: string; text: string; accent: string },
  theme: Theme,
  fontSizePx: number,
  densityConfig: { padding: string; lineHeight: string }
): string {
  const isDefaultDark = theme === "dark";

  return `
    <div class="card-content rounded-lg" style="
      color: ${colors.text};
      font-size: ${fontSizePx}px;
      font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: ${densityConfig.padding};
      line-height: ${densityConfig.lineHeight};
      text-align: left;
      width: 100%;
      min-height: 100%;
      max-height: 100%;
      box-sizing: border-box;
      overflowWrap: break-word;
      wordBreak: break-word;
      position: relative;
      background-color: ${colors.background};
      ${isDefaultDark ? 'box-shadow: inset 0 0 0 1px rgba(168,132,238,0.15);' : ''}
    ">
      ${isDefaultDark ? `
        <span class="absolute top-3 right-3" style="color: ${colors.accent}">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
          </svg>
        </span>
      ` : ''}
      ${innerContent}
    </div>
  `;
}

function renderCardFrameCard(
  innerContent: string,
  colors: { background: string; text: string; accent: string },
  template: ReturnType<typeof getTemplate>,
  fontSizePx: number,
  densityConfig: { padding: string; lineHeight: string }
): string {
  const cardFrame = template.cardFrame!;
  const marginPct = `${cardFrame.sideMarginPercent}%`;

  return `
    <div class="card-content rounded-lg" style="
      color: ${colors.text};
      font-size: ${fontSizePx}px;
      font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: ${densityConfig.padding};
      line-height: ${densityConfig.lineHeight};
      text-align: left;
      width: 100%;
      min-height: 100%;
      max-height: 100%;
      box-sizing: border-box;
      overflowWrap: break-word;
      wordBreak: break-word;
      background-color: ${colors.background};
    ">
      ${cardFrame.topLine ? `
        <div style="
          height: 1px;
          background-color: ${colors.accent};
          width: 100%;
          flex-shrink: 0;
        "></div>
      ` : ''}
      <div style="
        margin-left: ${marginPct};
        margin-right: ${marginPct};
        margin-top: ${cardFrame.topLine ? '24px' : '0'};
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
      ">
        ${innerContent}
      </div>
    </div>
  `;
}

function renderSketchDecorationCard(
  innerContent: string,
  colors: { background: string; text: string; accent: string },
  template: ReturnType<typeof getTemplate>,
  fontSizePx: number,
  densityConfig: { padding: string; lineHeight: string }
): string {
  return `
    <div class="card-content rounded-lg" style="
      color: ${colors.text};
      font-size: ${fontSizePx}px;
      font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: ${densityConfig.padding};
      line-height: ${densityConfig.lineHeight};
      text-align: left;
      width: 100%;
      min-height: 100%;
      max-height: 100%;
      box-sizing: border-box;
      overflowWrap: break-word;
      wordBreak: break-word;
      position: relative;
    ">
      <div class="absolute inset-0 rounded-lg" style="
        background-color: ${colors.background};
        z-index: 0;
      "></div>
      ${renderSketchBackground(colors.accent)}
      <div style="
        color: ${colors.text};
        font-size: ${fontSizePx}px;
        padding: ${densityConfig.padding};
        line-height: ${densityConfig.lineHeight};
        text-align: left;
        width: 100%;
        min-height: 100%;
        max-height: 100%;
        box-sizing: border-box;
        position: relative;
        z-index: 1;
        background-color: transparent;
      ">
        ${innerContent}
      </div>
    </div>
  `;
}

function renderSketchBackground(accentColor: string): string {
  return `
    <svg aria-hidden class="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 900 1200" preserveAspectRatio="xMidYMid slice" style="z-index: 0">
      <g>
        <line x1="0" y1="0" x2="0" y2="1200" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="56" y1="0" x2="56" y2="1200" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="112" y1="0" x2="112" y2="1200" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="168" y1="0" x2="168" y2="1200" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="224" y1="0" x2="224" y2="1200" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="280" y1="0" x2="280" y2="1200" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="336" y1="0" x2="336" y2="1200" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="392" y1="0" x2="392" y2="1200" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="448" y1="0" x2="448" y2="1200" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="504" y1="0" x2="504" y2="1200" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="560" y1="0" x2="560" y2="1200" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="616" y1="0" x2="616" y2="1200" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="672" y1="0" x2="672" y2="1200" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="728" y1="0" x2="728" y2="1200" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="784" y1="0" x2="784" y2="1200" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="840" y1="0" x2="840" y2="1200" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="896" y1="0" x2="896" y2="1200" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="0" x2="900" y2="0" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="56" x2="900" y2="56" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="112" x2="900" y2="112" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="168" x2="900" y2="168" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="224" x2="900" y2="224" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="280" x2="900" y2="280" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="336" x2="900" y2="336" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="392" x2="900" y2="392" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="448" x2="900" y2="448" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="504" x2="900" y2="504" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="560" x2="900" y2="560" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="616" x2="900" y2="616" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="672" x2="900" y2="672" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="728" x2="900" y2="728" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="784" x2="900" y2="784" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="840" x2="900" y2="840" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="896" x2="900" y2="896" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="952" x2="900" y2="952" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="1008" x2="900" y2="1008" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="1064" x2="900" y2="1064" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="1120" x2="900" y2="1120" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
        <line x1="0" y1="1176" x2="900" y2="1176" stroke="${accentColor}" stroke-opacity="0.16" stroke-width="0.6"/>
      </g>
      <g fill="none" stroke="${accentColor}" stroke-opacity="0.42" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
        <path d="M42 58c-22-24 28-50 72-36 44 14 56 50 30 88-26 38-74 42-112 16-40-28-20-64 10-68Z"/>
        <path d="M62 78c-12-12 18-28 40-18 22 10 28 30 16 48-12 18-40 22-58 10-22-12-8-32 4-40Z"/>
        <path d="M165 72c24 18 12 58-22 86-34 28-82 32-114 12-34-22-24-66 10-94 32-26 98-22 124-4Z"/>
        <path d="M95 165c22-40 78-42 124-14 44 26 44 82 8 128-36 46-100 40-142 4-44-38-24-92 6-118Z"/>
        <path d="M728 485c-4 32 34 52 76 40 42-12 74-52 56-92-18-40-66-58-108-42-42 16-36 54-24 94Z"/>
        <path d="M52 1008c26-14 68 8 82 50 14 42-18 86-62 98-44 12-80-16-94-58-12-40 32-82 74-90Z"/>
        <path d="M88 1034c14-6 36 4 42 28 6 24-4 46-26 52-22 6-42-4-48-28-4-20 18-40 32-52Z"/>
        <path d="M732 938c-48-26-108 6-128 54-20 48 4 98 52 124 48 26 108-6 128-54 20-48-4-98-52-124Z"/>
      </g>
    </svg>
  `;
}

function renderAppleNotesHeader(accentColor: string): string {
  return `
    <div class="shrink-0 flex items-center justify-between" style="
      padding: 12px 16px;
      color: ${accentColor};
    ">
      <div class="flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span style="font-size: 17px; font-weight: 400;">Notes</span>
      </div>
      <div class="flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="19" cy="12" r="1"></circle>
          <circle cx="5" cy="12" r="1"></circle>
        </svg>
      </div>
    </div>
  `;
}

function renderLennyCoverCard(
  markdown: string,
  colors: { background: string; text: string; accent: string },
  fontSizePx: number,
  alignment: Alignment
): string {
  const { title, bodyLines, summaryLines } = extractCoverContent(markdown);
  const hasTitle = title.length > 0;
  const textAlign = alignment === "justify" ? "left" : alignment;
  const titleFontSize = getTitleFontSize(fontSizePx, title);

  return `
    <div style="
      position: absolute;
      inset: 0;
      overflow: hidden;
      background-color: #FFFFFF;
      font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    ">
      <div style="
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, #FFFDFB 0%, #FFF9F3 36%, #FAECE1 36%, #F7E8DC 100%);
      "></div>
      
      <div style="
        position: absolute;
        top: 32px;
        left: 34px;
        width: 73px;
        height: 6px;
        border-radius: 999px;
        background-color: ${colors.accent};
      "></div>
      
      <div style="
        position: absolute;
        top: 38px;
        right: 24px;
        font-size: ${Math.max(10, Math.round(fontSizePx * 0.5))}px;
        font-weight: 300;
        color: #A6A09A;
        line-height: 1.1;
        letter-spacing: 0.04em;
        text-align: right;
        white-space: pre-line;
        z-index: 3;
      ">
        百万订阅作者<br>智能知识库
      </div>
      
      ${hasTitle ? `
        <div style="
          position: absolute;
          top: 58px;
          left: 34px;
          right: 34px;
          bottom: 290px;
          overflow: hidden;
          z-index: 3;
        ">
          <div style="
            font-size: ${Math.round(fontSizePx * 0.95)}px;
            font-weight: 700;
            color: ${colors.accent};
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 14px;
          ">
            Lenny Podcast
          </div>
          <h1 style="
            margin: 0;
            font-size: ${titleFontSize}px;
            font-weight: 800;
            color: ${colors.text};
            line-height: 1.1;
            letter-spacing: -0.05em;
            text-align: ${textAlign};
            white-space: pre-wrap;
            word-break: break-word;
            word-wrap: break-word;
          ">
            ${escapeHtml(title)}
          </h1>
        </div>
      ` : ''}
      
      <div style="
        position: absolute;
        right: 26px;
        bottom: 46px;
        width: 212px;
        height: 212px;
        border-radius: 50%;
        overflow: hidden;
        box-shadow: 0 24px 48px rgba(42, 30, 20, 0.16);
        z-index: 1;
      ">
        <img src="/lenny_headshot.png" alt="Lenny Rachitsky" style="
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          object-position: center top;
          display: block;
        "/>
      </div>
      
      <div style="
        position: absolute;
        right: 38px;
        top: ${hasTitle ? 246 : 58}px;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
        z-index: 2;
      ">
        <div style="
          width: 44px;
          height: 2px;
          background-color: ${colors.accent};
          opacity: 0.8;
        "></div>
        <div style="
          font-size: ${Math.round(fontSizePx * 0.9)}px;
          line-height: 1.5;
          color: #7A746D;
          text-align: right;
        ">
          <div style="font-weight: 700; color: #433F3B;">Lenny Rachitsky</div>
          <div>前 Airbnb PM</div>
          <div>Lenny newsletter</div>
        </div>
      </div>
      
      ${bodyLines.length > 0 ? `
        <div style="
          position: absolute;
          left: 36px;
          top: ${hasTitle ? 268 : 132}px;
          bottom: 160px;
          width: 176px;
          overflow: hidden;
          z-index: 3;
        ">
          <div style="
            font-size: ${Math.round(fontSizePx * 1.08)}px;
            line-height: 1.86;
            color: #4A433D;
            font-weight: 420;
            text-align: left;
            white-space: pre-wrap;
          ">
            ${bodyLines.map((line, index) => `
              <p style="margin: ${index === bodyLines.length - 1 ? 0 : '0 0 12px'}">
                ${escapeHtml(line)}
              </p>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${summaryLines.length > 0 ? `
        <div style="
          position: absolute;
          left: 36px;
          right: 220px;
          bottom: 72px;
          z-index: 3;
        ">
          <div style="
            width: 60px;
            height: 2px;
            background-color: ${colors.accent};
            margin-bottom: 16px;
            opacity: 0.8;
          "></div>
          <div style="
            max-width: 190px;
            font-size: ${Math.round(fontSizePx * 0.82)}px;
            line-height: 1.76;
            color: #8E8378;
            font-weight: 400;
            text-align: ${textAlign};
            white-space: pre-wrap;
          ">
            ${summaryLines.map((line, index) => `
              <p style="margin: ${index === summaryLines.length - 1 ? 0 : '0 0 10px'}">
                ${escapeHtml(line)}
              </p>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

interface RenderMarkdownContentOptions {
  content: string;
  colors: { background: string; text: string; accent: string };
  strongTextColor: string;
  codeBackground: string;
  blockquoteColor: string;
  fontSizePx: number;
  densityConfig: { padding: string; lineHeight: string };
  alignment: Alignment;
  hasCustomHeader: boolean;
  footerConfig: { isEnabled: boolean; text: string };
}

function renderMarkdownContent(options: RenderMarkdownContentOptions): string {
  const {
    content,
    colors,
    strongTextColor,
    codeBackground,
    blockquoteColor,
    fontSizePx,
    densityConfig,
    alignment,
    hasCustomHeader,
    footerConfig,
  } = options;

  const padding = hasCustomHeader ? densityConfig.padding : "0";

  return `
    <div style="
      padding: ${padding};
      flex: 1;
      min-height: 0;
      line-height: ${densityConfig.lineHeight};
      text-align: ${alignment};
      display: flex;
      flex-direction: column;
      overflow: hidden;
    ">
      <div class="min-h-0 flex-1 overflow-hidden">
        ${markdownToHtml(content, {
          colors,
          strongTextColor,
          codeBackground,
          blockquoteColor,
          fontSizePx,
        })}
      </div>
      ${footerConfig.isEnabled ? renderFooter(footerConfig.text, colors.accent) : ''}
    </div>
  `;
}

function renderFooter(text: string, accentColor: string): string {
  return `
    <div class="flex items-center gap-2 pt-3 text-xs leading-none opacity-70" style="
      min-height: 52px;
      color: ${accentColor};
    ">
      <div class="h-px min-w-6 flex-1 bg-current opacity-35"></div>
      <span class="shrink-0 whitespace-nowrap">${escapeHtml(text)}</span>
      <div class="flex items-center gap-1.5 shrink-0">
        <span class="h-1.5 w-1.5 rounded-full bg-current opacity-50"></span>
        <span class="h-1.5 w-1.5 rounded-full bg-current opacity-35"></span>
        <span class="h-1.5 w-1.5 rounded-full bg-current opacity-20"></span>
      </div>
    </div>
  `;
}

interface MarkdownToHtmlOptions {
  colors: { background: string; text: string; accent: string };
  strongTextColor: string;
  codeBackground: string;
  blockquoteColor: string;
  fontSizePx: number;
}

function markdownToHtml(markdown: string, options: MarkdownToHtmlOptions): string {
  const { colors, strongTextColor, codeBackground, blockquoteColor, fontSizePx } = options;

  let html = escapeHtml(markdown || "");

  html = html.replace(/^### (.*$)/gim, `<h3 style="font-size: ${fontSizePx * 1.25}px; font-weight: bold; margin-bottom: 6px; margin-top: 12px;">$1</h3>`);
  html = html.replace(/^## (.*$)/gim, `<h2 style="font-size: ${fontSizePx * 1.5}px; font-weight: bold; margin-bottom: 8px; margin-top: 16px;">$1</h2>`);
  html = html.replace(/^# (.*$)/gim, `<h1 style="font-size: ${fontSizePx * 2.5}px; font-weight: bold; margin-bottom: 8px; margin-top: 0;">$1</h1>`);

  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, `<strong style="color: ${strongTextColor}; font-weight: bold; font-style: italic;">$1</strong>`);
  html = html.replace(/\*\*([^*]+)\*\*/g, `<strong style="color: ${strongTextColor}; font-weight: bold;">$1</strong>`);
  html = html.replace(/\*([^*]+)\*/g, `<em style="font-style: italic;">$1</em>`);

  html = html.replace(/`([^`]+)`/g, `<code style="background-color: ${codeBackground}; padding: 2px 6px; border-radius: 4px; font-size: ${fontSizePx * 0.875}px;">$1</code>`);

  html = html.replace(/```([\s\S]*?)```/g, `<pre style="background-color: ${codeBackground}; padding: 12px; border-radius: 8px; margin-bottom: 8px; overflow-x: auto;"><code>$1</code></pre>`);

  html = html.split(/\n\n/).map((para) => {
    if (para.startsWith("> ")) {
      const content = para.replace(/^> /gm, "");
      return `<blockquote style="border-left: 4px solid ${blockquoteColor}; padding-left: 12px; padding-top: 4px; padding-bottom: 4px; margin: 8px 0; font-style: italic; opacity: 0.9;">${content}</blockquote>`;
    }
    if (para.startsWith("- ") || para.startsWith("* ")) {
      const items = para.split(/\n/).filter((line) => line.startsWith("- ") || line.startsWith("* "));
      const listItems = items.map((item) => `<li style="margin-bottom: 2px;">${item.slice(2)}</li>`).join("");
      return `<ul class="list-fixed-bullet" style="margin-bottom: 8px; list-style: none; padding-left: 0;">${listItems}</ul>`;
    }
    if (/^\d+\. /.test(para)) {
      const items = para.split(/\n/).filter((line) => /^\d+\. /.test(line));
      const listItems = items.map((item) => `<li style="margin-bottom: 2px;">${item.replace(/^\d+\. /, "")}</li>`).join("");
      return `<ol class="list-fixed-num" style="margin-bottom: 8px; list-style: none; padding-left: 0; counter-reset: list-num;">${listItems}</ol>`;
    }
    return `<p style="margin-bottom: 8px;">${para}</p>`;
  }).join("");

  html = html.replace(/\n/g, "<br>");

  return html;
}

function stripMarkdownSyntax(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~`>#-]/g, "")
    .trim();
}

function extractCoverContent(markdown: string): { title: string; bodyLines: string[]; summaryLines: string[] } {
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function extractFirstSentence(md: string): string {
  const lines = md.split("\n");
  for (const line of lines) {
    let text = line.replace(/^#+\s*/, "").trim();
    if (!text || text === "---" || text.startsWith(">")) continue;
    text = text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
      .trim();
    if (!text) continue;
    const match = text.match(/^[^。！？\n]+[。！？]?/);
    if (match) text = match[0];
    text = text.replace(/[\\/:*?"<>|]/g, "");
    if (text.length > 30) text = text.slice(0, 30);
    return text || "rednote";
  }
  return "rednote";
}
