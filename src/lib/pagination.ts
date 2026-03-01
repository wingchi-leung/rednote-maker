/**
 * 基于实际渲染参数和模板样式的智能分页算法
 * 彻底解决分页丢字问题
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
  // appleNotes 布局有头部：padding 12px*2 + 内容约 25px = ~50px
  appleNotesHeader: 50,
  // cardFrame 顶部有 marginTop: 24px
  cardFrameTopMargin: 24,
  // cardFrame 顶线：1px
  cardFrameTopLine: 1,
} as const;

// ============================================================================
// 解析相关
// ============================================================================

/**
 * 按自定义分页符 --- 将内容拆成多段
 */
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

/**
 * Parse markdown content into blocks
 */
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
  // 额外减少的高度（模板头部、cardFrame等）
  extraTopSpace: number;
  // 内容宽度缩减（cardFrame 的 sideMargin）
  contentWidthReduction: number;
}

/**
 * 计算渲染上下文：基于用户选择的密度、字号和模板
 */
function getRenderContext(options: PaginationOptions): RenderContext {
  const densityConfig = DENSITY_CONFIG[options.density];
  const fontSize = FONT_SIZE_CONFIG[options.fontSize];
  const lineHeight = fontSize * densityConfig.lineHeightRatio;
  const template = getTemplate(options.theme);

  let extraTopSpace = 0;
  let contentWidthReduction = 0;

  // appleNotes 布局有头部
  if (template.layout === "appleNotes") {
    extraTopSpace += TEMPLATE_EXTRA_HEIGHT.appleNotesHeader;
  }

  // cardFrame 有顶线和上边距
  if (template.cardFrame?.topLine) {
    extraTopSpace += TEMPLATE_EXTRA_HEIGHT.cardFrameTopLine;
    extraTopSpace += TEMPLATE_EXTRA_HEIGHT.cardFrameTopMargin;
    // cardFrame 有左右边距百分比
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
  };
}

/**
 * 计算可用内容高度
 */
function getAvailableContentHeight(context: RenderContext): number {
  return context.cardHeight - context.padding * 2 - context.extraTopSpace;
}

/**
 * 精确估算块的高度（像素）
 * 极度保守，确保不溢出
 */
function estimateBlockHeight(
  block: ContentBlock,
  context: RenderContext
): number {
  const { cardWidth, padding, fontSize, lineHeight, lineHeightRatio, contentWidthReduction } = context;

  // 可用内容宽度（考虑 cardFrame 的左右边距）
  const contentWidth = cardWidth - padding * 2 - contentWidthReduction;

  // 保守估算字符宽度（按较大值计算）
  const avgCharWidth = fontSize * 0.65; // 略大的值，更保守
  const charsPerLine = Math.floor(contentWidth / avgCharWidth);

  switch (block.type) {
    case "heading": {
      const level = block.level || 1;
      // 标题字号更大
      const headingFontSize = fontSize * (level === 1 ? 2 : level === 2 ? 1.75 : 1.5);
      const headingLineHeight = headingFontSize * lineHeightRatio;

      // 估算标题换行（保守估计）
      const headingCharsPerLine = Math.floor(contentWidth / (headingFontSize * 0.65));
      const lines = Math.max(1, Math.ceil(block.content.length / headingCharsPerLine));

      // 标题上下边距（保守估计）
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
          // 保守估算换行
          const textLines = Math.max(1, Math.ceil(line.length / charsPerLine));
          totalHeight += lineHeight * textLines;
        }
      }

      // 段落下边距（保守）
      return totalHeight + fontSize * 0.75;
    }

    case "list": {
      // 列表有左边距
      const listContentWidth = contentWidth - 28; // 略大的左边距
      const listCharsPerLine = Math.floor(listContentWidth / avgCharWidth);
      const lines = Math.max(1, Math.ceil(block.content.length / listCharsPerLine));

      // 列表项间距（保守）
      return lineHeight * lines + fontSize * 0.5;
    }

    case "code": {
      // 代码块用等宽字体，行高略小（保守估计）
      const codeLineHeight = fontSize * 1.5;
      const lines = block.content.split("\n").length;
      return codeLineHeight * lines + fontSize * 0.75;
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

/**
 * 将超高的块拆分成多个可放入单页的块
 * 极度保守的拆分策略
 */
function splitOversizedBlock(
  block: ContentBlock,
  maxAvailableHeight: number,
  context: RenderContext
): ContentBlock[] {
  const blockHeight = estimateBlockHeight(block, context);

  if (blockHeight <= maxAvailableHeight) {
    return [block];
  }

  // 只拆分段落和列表
  if (block.type !== "paragraph" && block.type !== "list") {
    return [block];
  }

  const { cardWidth, padding, fontSize, contentWidthReduction } = context;
  const contentWidth = cardWidth - padding * 2 - contentWidthReduction;
  const avgCharWidth = fontSize * 0.65;
  const charsPerLine = Math.floor(contentWidth / avgCharWidth);

  const content = block.content;
  const chunks: ContentBlock[] = [];

  // 极度保守：每页只放 60% 的理论容量
  const linesPerPage = Math.floor(maxAvailableHeight / (fontSize * 1.75));
  const charsPerPage = Math.floor(charsPerLine * linesPerPage * 0.5);

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

    // 优先在换行符处分割
    const nextNewLine = remaining.indexOf("\n", splitAt);
    if (nextNewLine > 0 && nextNewLine <= remaining.length * 0.85) {
      splitAt = nextNewLine + 1;
    } else {
      // 在标点符号处分割
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

/**
 * 基于高度的分页算法
 * 极度保守，确保不丢字
 */
function calculatePagesByHeight(
  blocks: ContentBlock[],
  context: RenderContext
): ContentBlock[][] {
  const pages: ContentBlock[][] = [];
  const availableHeight = getAvailableContentHeight(context);

  // 极度保守：只使用 70% 的可用高度
  const safeAvailableHeight = availableHeight * 0.7;

  let currentPageBlocks: ContentBlock[] = [];
  let currentPageHeight = 0;

  for (const block of blocks) {
    const blockHeight = estimateBlockHeight(block, context);

    // 如果单个块就超过一页，需要拆分
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

    // 检查加入当前块是否会超出一页
    if (currentPageHeight + blockHeight > safeAvailableHeight && currentPageBlocks.length > 0) {
      // 标题特殊处理
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

/**
 * 计算分页
 * @param markdown - Markdown 内容
 * @param options - 分页选项（密度、字号、主题）
 * @returns 分页后的 Markdown 字符串数组
 */
export function calculatePages(
  markdown: string,
  options?: PaginationOptions | number
): string[] {
  if (!markdown.trim()) {
    return [""];
  }

  // 兼容旧调用
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
