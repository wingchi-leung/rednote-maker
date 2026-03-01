/** 自定义分页符：文档中单独一行的 --- 会强制在此处分页 */
export const PAGE_BREAK_SEPARATOR = "---";

interface ContentBlock {
  type: "heading" | "paragraph" | "list" | "code" | "empty";
  content: string;
  level?: number;
}

/**
 * 按自定义分页符 --- 将内容拆成多段（每段可再按字数/语义分页）
 */
function splitByPageBreak(content: string): string[] {
  const trimmed = content.trim();
  if (!trimmed) return [""];
  const re = new RegExp(`\\n\\s*${PAGE_BREAK_SEPARATOR.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n`, "g");
  const segments = trimmed.split(re).map((s) => s.trim()).filter(Boolean);
  return segments.length > 0 ? segments : [""];
}

/**
 * Parse markdown content into blocks for intelligent pagination
 */
export function parseMarkdownToBlocks(markdown: string): ContentBlock[] {
  const lines = markdown.split("\n");
  const blocks: ContentBlock[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      blocks.push({ type: "empty", content: "" });
      continue;
    }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        content: headingMatch[2],
        level: headingMatch[1].length,
      });
      continue;
    }

    // Code block
    if (trimmed.startsWith("```")) {
      blocks.push({ type: "code", content: trimmed });
      continue;
    }

    // List item
    if (/^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      blocks.push({ type: "list", content: trimmed });
      continue;
    }

    // Paragraph
    blocks.push({ type: "paragraph", content: line });
  }

  return blocks;
}

/**
 * Estimate character count for a content block
 */
export function estimateBlockChars(block: ContentBlock): number {
  switch (block.type) {
    case "heading":
      return block.content.length + (block.level || 1) * 20;
    case "code":
      return block.content.length * 1.5;
    case "list":
      return block.content.length + 10;
    case "empty":
      return 20;
    default:
      return block.content.length + 10;
  }
}

/**
 * 将超长块按字数拆成多段，避免单页内容溢出卡片
 */
function splitOversizedBlock(
  block: ContentBlock,
  maxCharsPerPage: number
): string[] {
  const blockChars = estimateBlockChars(block);
  if (blockChars <= maxCharsPerPage) {
    return [blocksToMarkdown([block])];
  }
  const content = block.type === "paragraph" || block.type === "list"
    ? block.content
    : blocksToMarkdown([block]);
  const chunks: string[] = [];
  let remaining = content;
  const chunkSize = Math.max(100, maxCharsPerPage - 50);
  while (remaining.length > 0) {
    if (remaining.length <= maxCharsPerPage) {
      chunks.push(remaining.trim());
      break;
    }
    let splitAt = chunkSize;
    const nextNewLine = remaining.indexOf("\n", chunkSize);
    if (nextNewLine > 0 && nextNewLine < maxCharsPerPage) {
      splitAt = nextNewLine + 1;
    } else {
      const space = remaining.lastIndexOf(" ", chunkSize);
      if (space > chunkSize / 2) splitAt = space + 1;
    }
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trimStart();
  }
  return chunks.filter(Boolean);
}

/**
 * 对单段内容按字数与语义计算分页（内部用，不处理 ---）
 */
function calculatePagesFromBlocks(
  blocks: ContentBlock[],
  maxCharsPerPage: number
): string[] {
  const pages: string[] = [];
  let currentPageBlocks: ContentBlock[] = [];
  let currentPageChars = 0;

  for (const block of blocks) {
    const blockChars = estimateBlockChars(block);

    if (blockChars > maxCharsPerPage) {
      if (currentPageBlocks.length > 0) {
        pages.push(blocksToMarkdown(currentPageBlocks));
        currentPageBlocks = [];
        currentPageChars = 0;
      }
      const chunkMarkdowns = splitOversizedBlock(block, maxCharsPerPage);
      chunkMarkdowns.forEach((md) => pages.push(md));
      continue;
    }

    if (currentPageChars + blockChars > maxCharsPerPage && currentPageBlocks.length > 0) {
      if (block.type === "heading" && currentPageChars < maxCharsPerPage * 0.7) {
        pages.push(blocksToMarkdown(currentPageBlocks));
        currentPageBlocks = [block];
        currentPageChars = blockChars;
        continue;
      }
      if (currentPageChars < maxCharsPerPage * 0.3) {
        currentPageBlocks.push(block);
        currentPageChars += blockChars;
        continue;
      }
      pages.push(blocksToMarkdown(currentPageBlocks));
      currentPageBlocks = [block];
      currentPageChars = blockChars;
    } else {
      currentPageBlocks.push(block);
      currentPageChars += blockChars;
    }
  }

  if (currentPageBlocks.length > 0) {
    const remainingContent = blocksToMarkdown(currentPageBlocks);
    if (remainingContent.trim()) {
      pages.push(remainingContent);
    }
  }

  return pages;
}

/**
 * 计算分页：先按自定义分页符 --- 分段，每段再按字数与语义分页
 */
export function calculatePages(
  markdown: string,
  maxCharsPerPage: number = 1000
): string[] {
  const segments = splitByPageBreak(markdown);
  const pages = segments.flatMap((seg) =>
    calculatePagesFromBlocks(parseMarkdownToBlocks(seg), maxCharsPerPage)
  );
  return pages.length > 0 ? pages : [""];
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
