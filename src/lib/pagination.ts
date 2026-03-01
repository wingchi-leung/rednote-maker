/**
 * 基于实际渲染参数的智能分页算法
 * 根据用户选择的密度、字号等设置精确计算每页可容纳的内容
 */

import { CARD_CONFIG } from "./constants";

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

/**
 * 计算渲染上下文：基于用户选择的密度和字号
 */
function getRenderContext(options: PaginationOptions) {
  const densityConfig = DENSITY_CONFIG[options.density];
  const fontSize = FONT_SIZE_CONFIG[options.fontSize];
  const lineHeight = fontSize * densityConfig.lineHeightRatio;

  return {
    cardWidth: CARD_CONFIG.width,
    cardHeight: CARD_CONFIG.height,
    padding: densityConfig.padding,
    fontSize,
    lineHeight,
    lineHeightRatio: densityConfig.lineHeightRatio,
  };
}

/**
 * 计算可用内容高度（减去 padding 后）
 */
function getAvailableContentHeight(context: ReturnType<typeof getRenderContext>): number {
  return context.cardHeight - context.padding * 2;
}

/**
 * 精确估算块的高度（像素）
 * 基于实际的字号、行高、padding设置
 */
function estimateBlockHeight(
  block: ContentBlock,
  context: ReturnType<typeof getRenderContext>
): number {
  const { cardWidth, padding, fontSize, lineHeight, lineHeightRatio } = context;

  // 可用内容宽度
  const contentWidth = cardWidth - padding * 2;

  // 根据字号估算每行容纳字符数（中文按 1.2 倍宽度，英文按 0.6 倍）
  const avgCharWidth = fontSize * 0.6; // 平均字符宽度
  const charsPerLine = Math.floor(contentWidth / avgCharWidth);

  switch (block.type) {
    case "heading": {
      const level = block.level || 1;
      // 标题字号更大：h1 = fontSize * 2, h2 = fontSize * 1.75, h3 = fontSize * 1.5
      const headingFontSize = fontSize * (level === 1 ? 2 : level === 2 ? 1.75 : 1.5);
      const headingLineHeight = headingFontSize * lineHeightRatio;

      // 估算标题换行
      const headingCharsPerLine = Math.floor(contentWidth / (headingFontSize * 0.6));
      const lines = Math.max(1, Math.ceil(block.content.length / headingCharsPerLine));

      // 标题上下边距
      const marginBottom = fontSize * 0.75; // 下边距
      const marginTop = level === 1 ? 0 : fontSize * 1; // h1 无上边距，其他有

      return headingLineHeight * lines + marginBottom + marginTop;
    }

    case "paragraph": {
      const lines = block.content.split("\n");
      let totalHeight = 0;

      for (const line of lines) {
        if (!line.trim()) {
          // 空行占一行
          totalHeight += lineHeight;
        } else {
          // 估算这行文字会占用多少行
          const textLines = Math.max(1, Math.ceil(line.length / charsPerLine));
          totalHeight += lineHeight * textLines;
        }
      }

      // 段落下边距
      return totalHeight + fontSize * 0.5;
    }

    case "list": {
      // 列表有左边距（约 24px）
      const listContentWidth = contentWidth - 24;
      const listCharsPerLine = Math.floor(listContentWidth / avgCharWidth);
      const lines = Math.max(1, Math.ceil(block.content.length / listCharsPerLine));

      // 列表项上下间距略小
      return lineHeight * lines + fontSize * 0.25;
    }

    case "code": {
      // 代码块用等宽字体，行高略小
      const codeLineHeight = fontSize * 1.4;
      const lines = block.content.split("\n").length;
      return codeLineHeight * lines + fontSize * 0.5;
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
 * 只拆分段落和列表
 */
function splitOversizedBlock(
  block: ContentBlock,
  maxAvailableHeight: number,
  context: ReturnType<typeof getRenderContext>
): ContentBlock[] {
  const blockHeight = estimateBlockHeight(block, context);

  if (blockHeight <= maxAvailableHeight) {
    return [block];
  }

  // 只拆分段落和列表
  if (block.type !== "paragraph" && block.type !== "list") {
    // 其他类型如果太高，就让它独占一页（可能会有溢出，但比强行拆分好）
    return [block];
  }

  const { cardWidth, padding, fontSize } = context;
  const contentWidth = cardWidth - padding * 2;
  const avgCharWidth = fontSize * 0.6;
  const charsPerLine = Math.floor(contentWidth / avgCharWidth);

  const content = block.content;
  const chunks: ContentBlock[] = [];

  // 计算每页大概能放多少字符
  // 高度 ÷ 行高 = 可用行数
  const linesPerPage = Math.floor(maxAvailableHeight / (fontSize * 1.75));
  // 每行字符数 × 行数 = 每页字符数（保守估计，乘以 0.8）
  const charsPerPage = Math.floor(charsPerLine * linesPerPage * 0.7);

  if (charsPerPage < 50) {
    // 太小了，不拆分
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
    if (nextNewLine > 0 && nextNewLine <= remaining.length * 0.9) {
      splitAt = nextNewLine + 1;
    } else {
      // 在标点符号处分割
      const punctuation = /[。！？.!?，,；;]/;
      let found = false;
      for (let i = splitAt; i > splitAt - 80 && i > 0; i--) {
        if (punctuation.test(remaining[i])) {
          splitAt = i + 1;
          found = true;
          break;
        }
      }
      // 最后在空格处分割
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
 */
function calculatePagesByHeight(
  blocks: ContentBlock[],
  context: ReturnType<typeof getRenderContext>
): ContentBlock[][] {
  const pages: ContentBlock[][] = [];
  const availableHeight = getAvailableContentHeight(context);

  // 使用保守值：只使用 85% 的可用高度，留足够的安全边距
  const safeAvailableHeight = availableHeight * 0.85;

  let currentPageBlocks: ContentBlock[] = [];
  let currentPageHeight = 0;

  for (const block of blocks) {
    const blockHeight = estimateBlockHeight(block, context);

    // 如果单个块就超过一页，需要拆分
    if (blockHeight > safeAvailableHeight) {
      // 先结束当前页
      if (currentPageBlocks.length > 0) {
        pages.push(currentPageBlocks);
        currentPageBlocks = [];
        currentPageHeight = 0;
      }

      // 拆分超大块
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
      if (block.type === "heading" && currentPageHeight < safeAvailableHeight * 0.5) {
        currentPageBlocks.push(block);
        currentPageHeight += blockHeight;
      } else if (currentPageHeight < safeAvailableHeight * 0.15) {
        // 当前页内容太少，强制放入
        currentPageBlocks.push(block);
        currentPageHeight += blockHeight;
      } else {
        // 结束当前页，开始新页
        pages.push(currentPageBlocks);
        currentPageBlocks = [block];
        currentPageHeight = blockHeight;
      }
    } else {
      currentPageBlocks.push(block);
      currentPageHeight += blockHeight;
    }
  }

  // 添加最后一页
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
 * @param options - 分页选项（密度、字号）
 * @returns 分页后的 Markdown 字符串数组
 */
export function calculatePages(
  markdown: string,
  options?: PaginationOptions | number
): string[] {
  if (!markdown.trim()) {
    return [""];
  }

  // 兼容旧调用：如果传入的是 number，使用默认值
  let paginationOptions: PaginationOptions;
  if (typeof options === "number") {
    paginationOptions = { density: "comfortable", fontSize: "md" };
  } else if (!options) {
    paginationOptions = { density: "comfortable", fontSize: "md" };
  } else {
    paginationOptions = options;
  }

  // 按自定义分页符分段
  const segments = splitByPageBreak(markdown);

  const allPages: string[][] = [];

  // 获取渲染上下文
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
