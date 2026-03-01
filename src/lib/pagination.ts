/**
 * 基于数学估算 + 真实DOM测量的混合分页算法
 * 用真实测量校准估算系数，解决丢字问题
 */

import { CARD_CONFIG } from "./constants";
import { getTemplate, type Theme } from "./templates";

// 导出类型供外部使用
export type { ContentBlock };

/** 自定义分页符：文档中单独一行的 --- 会强制在此处分页 */
export const PAGE_BREAK_SEPARATOR = "---";

interface ContentBlock {
  type: "heading" | "paragraph" | "list" | "code" | "empty";
  content: string;
  level?: number;
}

// ============================================================================
// 类型定义
// ============================================================================

export type Density = "compact" | "comfortable" | "spacious";
export type FontSize = "sm" | "md" | "lg";

export interface PaginationOptions {
  density: Density;
  fontSize: FontSize;
  theme: Theme;
}

// 密度配置：padding 和 lineHeight
const DENSITY_CONFIG = {
  compact: { padding: 24, lineHeightRatio: 1.5 },
  comfortable: { padding: 32, lineHeightRatio: 1.75 },
  spacious: { padding: 40, lineHeightRatio: 2.0 },
} as const;

// 字号配置：实际像素值
const FONT_SIZE_CONFIG = {
  sm: 14,
  md: 16,
  lg: 18,
} as const;

// 模板额外高度配置（像素）
const TEMPLATE_EXTRA_HEIGHT = {
  appleNotesHeader: 50,
  cardFrameTopMargin: 24,
  cardFrameTopLine: 1,
} as const;

// ============================================================================
// 真实DOM测量（用于校准）
// ============================================================================

const isBrowser = typeof document !== "undefined" && typeof window !== "undefined";

let measureContainer: HTMLElement | null = null;

/**
 * 用真实DOM测量一段简单文本的实际高度
 * 用于校准估算值
 */
function getRealTextHeight(
  padding: number,
  fontSize: number,
  lineHeightRatio: number
): number | null {
  if (!isBrowser) return null;

  try {
    if (!measureContainer) {
      measureContainer = document.createElement("div");
      measureContainer.style.position = "absolute";
      measureContainer.style.visibility = "hidden";
      measureContainer.style.pointerEvents = "none";
      measureContainer.style.top = "0";
      measureContainer.style.left = "0";
      measureContainer.style.width = `${CARD_CONFIG.width}px`;
      measureContainer.style.padding = `${padding}px`;
      measureContainer.style.boxSizing = "border-box";
      measureContainer.style.fontSize = `${fontSize}px`;
      measureContainer.style.lineHeight = lineHeightRatio.toString();
      measureContainer.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      measureContainer.style.overflow = "hidden";
      measureContainer.style.wordBreak = "break-word";
      document.body.appendChild(measureContainer);
    }

    // 测量10行普通文本的高度
    measureContainer.innerHTML = "";
    for (let i = 0; i < 10; i++) {
      const p = document.createElement("p");
      p.style.margin = "0 0 " + (fontSize * 0.5) + "px 0";
      p.textContent = "这是一行测试文字用于测量实际渲染高度";
      measureContainer.appendChild(p);
    }

    return measureContainer.scrollHeight / 10; // 返回单行高度
  } catch (e) {
    return null;
  }
}

// ============================================================================
// 解析相关
// ============================================================================

function splitByPageBreak(content: string): string[] {
  const trimmed = content.trim();
  if (!trimmed) return [""];
  const re = new RegExp(
    `\\n\\s*${PAGE_BREAK_SEPARATOR.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n`,
    "g"
  );
  const segments = trimmed.split(re).map((s) => s.trim()).filter(Boolean);
  return segments.length > 0 ? segments : [""];
}

export function parseMarkdownToBlocks(markdown: string): ContentBlock[] {
  const lines = markdown.split("\n");
  const blocks: ContentBlock[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      blocks.push({ type: "empty", content: "" });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        content: headingMatch[2],
        level: headingMatch[1].length,
      });
      continue;
    }

    if (trimmed.startsWith("```")) {
      blocks.push({ type: "code", content: trimmed });
      continue;
    }

    if (/^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      blocks.push({ type: "list", content: trimmed });
      continue;
    }

    blocks.push({ type: "paragraph", content: line });
  }

  return blocks;
}

function blocksToMarkdown(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return `${"#".repeat(block.level || 1)} ${block.content}`;
        case "empty":
          return "";
        default:
          return block.content;
      }
    })
    .join("\n");
}

// ============================================================================
// 高度计算核心
// ============================================================================

interface RenderContext {
  cardWidth: number;
  cardHeight: number;
  padding: number;
  fontSize: number;
  lineHeight: number;
  lineHeightRatio: number;
  extraTopSpace: number;
  contentWidthReduction: number;
  // 校准系数：从真实测量获得
  calibrationFactor: number;
}

function getRenderContext(options: PaginationOptions): RenderContext {
  const densityConfig = DENSITY_CONFIG[options.density];
  const fontSize = FONT_SIZE_CONFIG[options.fontSize];
  const lineHeight = fontSize * densityConfig.lineHeightRatio;
  const template = getTemplate(options.theme);

  let extraTopSpace = 0;
  let contentWidthReduction = 0;

  if (template.layout === "appleNotes") {
    extraTopSpace += TEMPLATE_EXTRA_HEIGHT.appleNotesHeader;
  }

  if (template.cardFrame?.topLine) {
    extraTopSpace += TEMPLATE_EXTRA_HEIGHT.cardFrameTopLine;
    extraTopSpace += TEMPLATE_EXTRA_HEIGHT.cardFrameTopMargin;
    const sideMarginPercent = template.cardFrame.sideMarginPercent || 0;
    contentWidthReduction = (CARD_CONFIG.width * sideMarginPercent * 2) / 100;
  }

  const context: RenderContext = {
    cardWidth: CARD_CONFIG.width,
    cardHeight: CARD_CONFIG.height,
    padding: densityConfig.padding,
    fontSize,
    lineHeight,
    lineHeightRatio: densityConfig.lineHeightRatio,
    extraTopSpace,
    contentWidthReduction,
    calibrationFactor: 1.0, // 默认值
  };

  // 用真实测量校准
  const realHeight = getRealTextHeight(densityConfig.padding, fontSize, densityConfig.lineHeightRatio);
  if (realHeight) {
    const estimatedHeight = lineHeight + fontSize * 0.5;
    context.calibrationFactor = realHeight / estimatedHeight;
    // 限制校准系数在合理范围 [0.8, 1.3]
    context.calibrationFactor = Math.max(0.8, Math.min(1.3, context.calibrationFactor));
  }

  return context;
}

function getAvailableContentHeight(context: RenderContext): number {
  return context.cardHeight - context.padding * 2 - context.extraTopSpace;
}

function estimateBlockHeight(
  block: ContentBlock,
  context: RenderContext
): number {
  const { cardWidth, padding, fontSize, lineHeight, lineHeightRatio, contentWidthReduction, calibrationFactor } = context;

  const contentWidth = cardWidth - padding * 2 - contentWidthReduction;
  const avgCharWidth = fontSize * 0.65;
  const charsPerLine = Math.floor(contentWidth / avgCharWidth);

  let estimatedHeight = 0;

  switch (block.type) {
    case "heading": {
      const level = block.level || 1;
      const headingFontSize = fontSize * (level === 1 ? 2 : level === 2 ? 1.75 : 1.5);
      const headingLineHeight = headingFontSize * lineHeightRatio;
      const headingCharsPerLine = Math.floor(contentWidth / (headingFontSize * 0.65));
      const lines = Math.max(1, Math.ceil(block.content.length / headingCharsPerLine));
      const marginBottom = fontSize;
      const marginTop = level === 1 ? fontSize * 0.5 : fontSize * 1.2;
      estimatedHeight = headingLineHeight * lines + marginBottom + marginTop;
      break;
    }

    case "paragraph": {
      const lines = block.content.split("\n");
      let totalHeight = 0;
      for (const line of lines) {
        if (!line.trim()) {
          totalHeight += lineHeight;
        } else {
          const textLines = Math.max(1, Math.ceil(line.length / charsPerLine));
          totalHeight += lineHeight * textLines;
        }
      }
      estimatedHeight = totalHeight + fontSize * 0.9;
      break;
    }

    case "list": {
      const listContentWidth = contentWidth - 28;
      const listCharsPerLine = Math.floor(listContentWidth / avgCharWidth);
      const lines = Math.max(1, Math.ceil(block.content.length / listCharsPerLine));
      estimatedHeight = lineHeight * lines + fontSize * 0.5;
      break;
    }

    case "code": {
      const codeLineHeight = fontSize * 1.5;
      const lines = block.content.split("\n").length;
      estimatedHeight = codeLineHeight * lines + fontSize * 0.9;
      break;
    }

    case "empty": {
      estimatedHeight = lineHeight;
      break;
    }

    default:
      estimatedHeight = lineHeight;
  }

  // 应用校准系数
  return estimatedHeight * calibrationFactor;
}

// ============================================================================
// 分页算法
// ============================================================================

function splitOversizedBlock(
  block: ContentBlock,
  maxAvailableHeight: number,
  context: RenderContext
): ContentBlock[] {
  const blockHeight = estimateBlockHeight(block, context);

  if (blockHeight <= maxAvailableHeight) {
    return [block];
  }

  if (block.type !== "paragraph" && block.type !== "list") {
    return [block];
  }

  const { cardWidth, padding, fontSize, contentWidthReduction } = context;
  const contentWidth = cardWidth - padding * 2 - contentWidthReduction;
  const avgCharWidth = fontSize * 0.65;
  const charsPerLine = Math.floor(contentWidth / avgCharWidth);

  const content = block.content;
  const chunks: ContentBlock[] = [];

  const linesPerPage = Math.floor(maxAvailableHeight / (fontSize * context.lineHeightRatio));
  const charsPerPage = Math.floor(charsPerLine * linesPerPage * 0.75);

  if (charsPerPage < 30) {
    return [block];
  }

  let remaining = content;

  while (remaining.length > 0) {
    if (remaining.length <= charsPerPage) {
      chunks.push({ ...block, content: remaining });
      break;
    }

    let splitAt = charsPerPage;

    const nextNewLine = remaining.indexOf("\n", splitAt);
    if (nextNewLine > 0 && nextNewLine <= remaining.length * 0.85) {
      splitAt = nextNewLine + 1;
    } else {
      const punctuation = /[。！？.!?，,；;]/;
      let found = false;
      for (let i = splitAt; i > splitAt - 100 && i > 0; i--) {
        if (punctuation.test(remaining[i])) {
          splitAt = i + 1;
          found = true;
          break;
        }
      }
      if (!found) {
        const space = remaining.lastIndexOf(" ", splitAt);
        if (space > splitAt / 2) {
          splitAt = space + 1;
        }
      }
    }

    const chunk = remaining.slice(0, splitAt).trim();
    if (chunk) {
      chunks.push({ ...block, content: chunk });
    }
    remaining = remaining.slice(splitAt).trimStart();
  }

  return chunks.length > 0 ? chunks : [block];
}

function calculatePagesByHeight(
  blocks: ContentBlock[],
  context: RenderContext
): ContentBlock[][] {
  const pages: ContentBlock[][] = [];
  const availableHeight = getAvailableContentHeight(context);

  // 使用 60% 的可用高度（继续减少丢字）
  const safeAvailableHeight = availableHeight * 0.60;

  let currentPageBlocks: ContentBlock[] = [];
  let currentPageHeight = 0;

  for (const block of blocks) {
    const blockHeight = estimateBlockHeight(block, context);

    if (blockHeight > safeAvailableHeight) {
      if (currentPageBlocks.length > 0) {
        pages.push(currentPageBlocks);
        currentPageBlocks = [];
        currentPageHeight = 0;
      }

      const splitChunks = splitOversizedBlock(block, safeAvailableHeight, context);

      for (const chunk of splitChunks) {
        const chunkHeight = estimateBlockHeight(chunk, context);
        if (currentPageHeight + chunkHeight > safeAvailableHeight && currentPageBlocks.length > 0) {
          pages.push(currentPageBlocks);
          currentPageBlocks = [chunk];
          currentPageHeight = chunkHeight;
        } else {
          currentPageBlocks.push(chunk);
          currentPageHeight += chunkHeight;
        }
      }
      continue;
    }

    if (currentPageHeight + blockHeight > safeAvailableHeight && currentPageBlocks.length > 0) {
      if (block.type === "heading" && currentPageHeight < safeAvailableHeight * 0.4) {
        currentPageBlocks.push(block);
        currentPageHeight += blockHeight;
      } else if (currentPageHeight < safeAvailableHeight * 0.1) {
        currentPageBlocks.push(block);
        currentPageHeight += blockHeight;
      } else {
        pages.push(currentPageBlocks);
        currentPageBlocks = [block];
        currentPageHeight = blockHeight;
      }
    } else {
      currentPageBlocks.push(block);
      currentPageHeight += blockHeight;
    }
  }

  if (currentPageBlocks.length > 0) {
    pages.push(currentPageBlocks);
  }

  return pages;
}

// ============================================================================
// 主入口
// ============================================================================

export function calculatePages(
  markdown: string,
  options?: PaginationOptions | number
): string[] {
  if (!markdown.trim()) {
    return [""];
  }

  let paginationOptions: PaginationOptions;
  if (typeof options === "number") {
    paginationOptions = { density: "comfortable", fontSize: "md", theme: "classic" };
  } else if (!options) {
    paginationOptions = { density: "comfortable", fontSize: "md", theme: "classic" };
  } else {
    paginationOptions = options;
  }

  const segments = splitByPageBreak(markdown);
  const allPages: string[][] = [];
  const context = getRenderContext(paginationOptions);

  for (const segment of segments) {
    const blocks = parseMarkdownToBlocks(segment);
    const pageBlocks = calculatePagesByHeight(blocks, context);
    const pageStrings = pageBlocks.map((blocks) => blocksToMarkdown(blocks));
    allPages.push(pageStrings);
  }

  const result = allPages.flat();
  return result.length > 0 ? result : [""];
}

/**
 * 清理测量容器
 */
export function cleanupMeasureContainer(): void {
  if (measureContainer && measureContainer.parentNode) {
    measureContainer.parentNode.removeChild(measureContainer);
  }
  measureContainer = null;
}
