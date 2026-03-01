/**
 * 基于真实 React 渲染的精确分页算法
 * 使用真正的 ReactMarkdown 组件测量，自动适配所有模板
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
// 真实DOM测量（使用 React 组件）
// ============================================================================

const isBrowser = typeof document !== "undefined" && typeof window !== "undefined";

let measureContainer: HTMLElement | null = null;
let measureRoot: any = null;
let MeasureComponent: any = null;

/**
 * 初始化测量容器和 React 组件
 */
function initMeasureContainer(): boolean {
  if (!isBrowser) return false;

  if (measureContainer) {
    return true;
  }

  try {
    // 动态导入 React 组件
    import("./MeasureContent").then((module) => {
      MeasureComponent = module.MeasureContent;
    });

    measureContainer = document.createElement("div");
    measureContainer.style.position = "absolute";
    measureContainer.style.visibility = "hidden";
    measureContainer.style.pointerEvents = "none";
    measureContainer.style.top = "0";
    measureContainer.style.left = "0";
    measureContainer.style.width = `${CARD_CONFIG.width}px`;
    measureContainer.style.height = `${CARD_CONFIG.height}px`;
    measureContainer.style.overflow = "hidden";
    measureContainer.style.zIndex = "-1";
    document.body.appendChild(measureContainer);

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 测量 Markdown 的实际渲染高度
 */
function measureMarkdownHeight(
  markdown: string,
  theme: Theme,
  fontSize: FontSize,
  density: Density
): number | null {
  if (!isBrowser || !measureContainer || !MeasureComponent) {
    return null;
  }

  try {
    // 使用 React 渲染组件
    const React = require("react");
    const { createRoot } = require("react-dom/client");

    if (!measureRoot) {
      measureRoot = createRoot(measureContainer);
    }

    let measuredHeight = 0;

    // 渲染测量组件
    measureRoot.render(
      React.createElement(MeasureComponent, {
        markdown,
        theme,
        fontSize,
        density,
        onHeightChange: (height: number) => {
          measuredHeight = height;
        },
      })
    );

    // 强制更新
    measureContainer.offsetHeight;

    // 获取高度
    if (measureContainer.firstElementChild) {
      const height = measureContainer.firstElementChild.scrollHeight;
      return height;
    }

    return null;
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
  theme: Theme;
  density: Density;
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

  return {
    cardWidth: CARD_CONFIG.width,
    cardHeight: CARD_CONFIG.height,
    padding: densityConfig.padding,
    fontSize,
    lineHeight,
    lineHeightRatio: densityConfig.lineHeightRatio,
    extraTopSpace,
    contentWidthReduction,
    theme: options.theme,
    density: options.density,
  };
}

function getAvailableContentHeight(context: RenderContext): number {
  return context.cardHeight - context.padding * 2 - context.extraTopSpace;
}

/**
 * 测量块的实际高度（优先使用真实测量，回退到估算）
 */
function measureBlockHeight(
  block: ContentBlock,
  context: RenderContext
): number {
  // 尝试使用真实 DOM 测量
  const markdown = blocksToMarkdown([block]);
  const measuredHeight = measureMarkdownHeight(markdown, context.theme, (context.fontSize === 14 ? "sm" : context.fontSize === 16 ? "md" : "lg"), context.density);

  if (measuredHeight !== null) {
    return measuredHeight;
  }

  // 回退到估算
  return estimateBlockHeight(block, context);
}

/**
 * 估算块的高度（回退方案）
 */
function estimateBlockHeight(
  block: ContentBlock,
  context: RenderContext
): number {
  const { cardWidth, padding, fontSize, lineHeight, lineHeightRatio, contentWidthReduction } = context;

  const contentWidth = cardWidth - padding * 2 - contentWidthReduction;
  const avgCharWidth = fontSize * 0.65;
  const charsPerLine = Math.floor(contentWidth / avgCharWidth);

  switch (block.type) {
    case "heading": {
      const level = block.level || 1;
      const headingFontSize = fontSize * (level === 1 ? 2 : level === 2 ? 1.75 : 1.5);
      const headingLineHeight = headingFontSize * lineHeightRatio;
      const headingCharsPerLine = Math.floor(contentWidth / (headingFontSize * 0.65));
      const lines = Math.max(1, Math.ceil(block.content.length / headingCharsPerLine));
      const marginBottom = fontSize;
      const marginTop = level === 1 ? fontSize * 0.5 : fontSize * 1.2;
      return headingLineHeight * lines + marginBottom + marginTop;
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
      return totalHeight + fontSize * 0.9;
    }

    case "list": {
      const listContentWidth = contentWidth - 28;
      const listCharsPerLine = Math.floor(listContentWidth / avgCharWidth);
      const lines = Math.max(1, Math.ceil(block.content.length / listCharsPerLine));
      return lineHeight * lines + fontSize * 0.5;
    }

    case "code": {
      const codeLineHeight = fontSize * 1.5;
      const lines = block.content.split("\n").length;
      return codeLineHeight * lines + fontSize * 0.9;
    }

    case "empty": {
      return lineHeight;
    }

    default:
      return lineHeight;
  }
}

// ============================================================================
// 分页算法
// ============================================================================

function splitOversizedBlock(
  block: ContentBlock,
  maxAvailableHeight: number,
  context: RenderContext
): ContentBlock[] {
  const blockHeight = measureBlockHeight(block, context);

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

  // 使用 70% 的可用高度作为安全边距（使用真实测量后可以更精确）
  const safeAvailableHeight = availableHeight * 0.70;

  let currentPageBlocks: ContentBlock[] = [];
  let currentPageHeight = 0;

  for (const block of blocks) {
    if (block.type === "empty") {
      continue;
    }

    const blockHeight = measureBlockHeight(block, context);

    if (blockHeight > safeAvailableHeight) {
      if (currentPageBlocks.length > 0) {
        pages.push(currentPageBlocks);
        currentPageBlocks = [];
        currentPageHeight = 0;
      }

      const splitChunks = splitOversizedBlock(block, safeAvailableHeight, context);

      for (const chunk of splitChunks) {
        const chunkHeight = measureBlockHeight(chunk, context);
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

  // 初始化测量容器
  initMeasureContainer();

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
  if (measureRoot) {
    try {
      measureRoot.unmount();
    } catch (e) {}
    measureRoot = null;
  }
  if (measureContainer && measureContainer.parentNode) {
    measureContainer.parentNode.removeChild(measureContainer);
  }
  measureContainer = null;
}
