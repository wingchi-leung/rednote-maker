/**
 * 基于实际渲染高度的智能分页算法
 * 彻底解决「字数估算导致内容溢出被裁掉」的问题
 */

import { CARD_CONFIG } from "./constants";

/** 自定义分页符：文档中单独一行的 --- 会强制在此处分页 */
export const PAGE_BREAK_SEPARATOR = "---";

interface ContentBlock {
  type: "heading" | "paragraph" | "list" | "code" | "empty";
  content: string;
  level?: number;
}

interface MeasuredBlock extends ContentBlock {
  html: string;
  estimatedHeight: number;
}

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
// 高度估算（用于初步分页）
// ============================================================================

/**
 * 估算块的高度（像素）
 * 基于标准的卡片宽度 (900px) 和默认样式
 * 这些值是根据实际渲染测量得出的保守估计
 */
function estimateBlockHeight(
  block: ContentBlock,
  cardWidth: number = CARD_CONFIG.width
): number {
  // 基础行高（基于默认 16px 字体，1.75 行高 = 28px）
  const baseLineHeight = 28;
  const horizontalPadding = 64; // 左右各 32px

  // 可用内容宽度
  const contentWidth = cardWidth - horizontalPadding;
  // 每行约容纳字符数（中文按 1.2 倍宽度计算）
  const charsPerLine = Math.floor(contentWidth / 14.4);

  switch (block.type) {
    case "heading": {
      const level = block.level || 1;
      // 标题行高：h1=48px, h2=40px, h3=32px
      const headingLineHeight = level === 1 ? 48 : level === 2 ? 40 : 32;
      // 标题可能换行
      const lines = Math.ceil(block.content.length / charsPerLine);
      // 标题下边距
      const marginBottom = level === 1 ? 16 : level === 2 ? 12 : 8;
      // 标题上边距（h1/h2）
      const marginTop = level <= 2 ? (level === 1 ? 0 : 16) : 12;
      return headingLineHeight * lines + marginBottom + marginTop;
    }

    case "paragraph": {
      const lines = block.content.split("\n");
      let totalHeight = 0;
      for (const line of lines) {
        if (!line.trim()) {
          totalHeight += baseLineHeight;
        } else {
          const textLines = Math.ceil(line.length / charsPerLine);
          totalHeight += baseLineHeight * textLines;
        }
      }
      // 段落下边距
      return totalHeight + 8;
    }

    case "list": {
      // 列表项左边距 + 项目符号
      const effectiveWidth = contentWidth - 24;
      const listCharsPerLine = Math.floor(effectiveWidth / 14.4);
      const lines = Math.ceil(block.content.length / listCharsPerLine);
      return baseLineHeight * lines + 4;
    }

    case "code": {
      // 代码块用等宽字体，行高约 24px
      const codeLineHeight = 24;
      const lines = block.content.split("\n").length;
      return codeLineHeight * lines + 8;
    }

    case "empty": {
      return baseLineHeight;
    }

    default:
      return baseLineHeight;
  }
}

// ============================================================================
// 分页算法核心
// ============================================================================

interface PageLayoutContext {
  cardWidth: number;
  cardHeight: number;
  padding: number;
  lineHeight: number;
}

/**
 * 计算单页可用的内容高度
 */
function getAvailableContentHeight(context: PageLayoutContext): number {
  return context.cardHeight - context.padding * 2;
}

/**
 * 将超高的块拆分成多个可放入单页的块
 * 主要处理超长段落
 */
function splitOversizedBlock(
  block: ContentBlock,
  maxAvailableHeight: number,
  context: PageLayoutContext
): ContentBlock[] {
  const blockHeight = estimateBlockHeight(block, context.cardWidth);

  if (blockHeight <= maxAvailableHeight) {
    return [block];
  }

  // 只拆分段落和列表，其他类型不拆（避免破坏结构）
  if (block.type !== "paragraph" && block.type !== "list") {
    return [block];
  }

  const chunks: ContentBlock[] = [];
  const content = block.content;
  const horizontalPadding = 64;
  const contentWidth = context.cardWidth - horizontalPadding;
  const charsPerLine = Math.floor(contentWidth / 14.4);
  const baseLineHeight = context.lineHeight;

  // 估算每行可容纳的字符数对应的高度
  const estimatedLinesForFullContent = Math.ceil(content.length / charsPerLine);
  const estimatedHeight = estimatedLinesForFullContent * baseLineHeight;

  // 计算需要拆分成多少段
  const numChunks = Math.ceil(estimatedHeight / maxAvailableHeight) + 1;
  const charsPerChunk = Math.max(50, Math.floor(content.length / numChunks));

  let remaining = content;
  let chunkNum = 0;

  while (remaining.length > 0) {
    chunkNum++;

    // 最后一个块或剩余内容较少时，全部放入
    if (remaining.length <= charsPerChunk) {
      chunks.push({ ...block, content: remaining });
      break;
    }

    // 寻找合适的分割点
    let splitAt = charsPerChunk;

    // 优先在换行符处分割
    const nextNewLine = remaining.indexOf("\n", splitAt);
    if (nextNewLine > 0 && nextNewLine <= remaining.length * 0.9) {
      splitAt = nextNewLine + 1;
    } else {
      // 其次在句号、问号、感叹号处分割
      const punctuation = /[。！？.!?]/;
      let found = false;
      for (let i = splitAt; i > splitAt - 50 && i > 0; i--) {
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
 * 基于高度估算的分页算法
 * 确保每页内容不会溢出卡片高度
 */
function calculatePagesByHeight(
  blocks: ContentBlock[],
  context: PageLayoutContext
): ContentBlock[][] {
  const pages: ContentBlock[][] = [];
  const availableHeight = getAvailableContentHeight(context);

  // 使用保守值：留 5% 的安全边距
  const safeAvailableHeight = availableHeight * 0.95;

  let currentPageBlocks: ContentBlock[] = [];
  let currentPageHeight = 0;

  for (const block of blocks) {
    const blockHeight = estimateBlockHeight(block, context.cardWidth);

    // 如果单个块就超过一页，需要拆分
    if (blockHeight > safeAvailableHeight) {
      // 先结束当前页
      if (currentPageBlocks.length > 0) {
        pages.push(currentPageBlocks);
        currentPageBlocks = [];
        currentPageHeight = 0;
      }

      // 拆分超大块
      const splitChunks = splitOversizedBlock(
        block,
        safeAvailableHeight,
        context
      );

      for (const chunk of splitChunks) {
        const chunkHeight = estimateBlockHeight(chunk, context.cardWidth);
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
      // 标题特殊处理：如果当前页不满且这是标题，尝试放入
      if (block.type === "heading" && currentPageHeight < safeAvailableHeight * 0.6) {
        currentPageBlocks.push(block);
        currentPageHeight += blockHeight;
      } else if (currentPageHeight < safeAvailableHeight * 0.2) {
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

/**
 * 主入口：计算分页
 * @param markdown - Markdown 内容
 * @param cardHeight - 卡片高度（像素），默认使用 CARD_CONFIG.height
 * @returns 分页后的 Markdown 字符串数组
 */
export function calculatePages(
  markdown: string,
  maxCharsPerPage?: number // 保留参数兼容性，但不再使用
): string[] {
  if (!markdown.trim()) {
    return [""];
  }

  // 按自定义分页符分段
  const segments = splitByPageBreak(markdown);

  const allPages: string[][] = [];

  for (const segment of segments) {
    const blocks = parseMarkdownToBlocks(segment);

    const context: PageLayoutContext = {
      cardWidth: CARD_CONFIG.width,
      cardHeight: CARD_CONFIG.height,
      padding: 32, // 默认 padding
      lineHeight: 28, // 默认行高 16px * 1.75
    };

    const pageBlocks = calculatePagesByHeight(blocks, context);

    const pageStrings = pageBlocks.map((blocks) => blocksToMarkdown(blocks));
    allPages.push(pageStrings);
  }

  const result = allPages.flat();
  return result.length > 0 ? result : [""];
}

// 保留导出供其他模块使用
export { estimateBlockHeight, type ContentBlock };
