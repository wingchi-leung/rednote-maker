interface ContentBlock {
  type: "heading" | "paragraph" | "list" | "code" | "empty";
  content: string;
  level?: number;
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
 * Calculate pages for content with semantic-aware pagination
 */
export function calculatePages(
  markdown: string,
  maxCharsPerPage: number = 1000
): string[] {
  const blocks = parseMarkdownToBlocks(markdown);
  const pages: string[] = [];
  let currentPageBlocks: ContentBlock[] = [];
  let currentPageChars = 0;

  for (const block of blocks) {
    const blockChars = estimateBlockChars(block);

    // If adding this block would exceed the limit
    if (currentPageChars + blockChars > maxCharsPerPage && currentPageBlocks.length > 0) {
      // Check if this is a heading - if so, try to keep it with the next page
      if (block.type === "heading" && currentPageChars < maxCharsPerPage * 0.7) {
        // Add current page and start new one with heading
        pages.push(blocksToMarkdown(currentPageBlocks));
        currentPageBlocks = [block];
        currentPageChars = blockChars;
        continue;
      }

      // If current page is too small, force add the block
      if (currentPageChars < maxCharsPerPage * 0.3) {
        currentPageBlocks.push(block);
        currentPageChars += blockChars;
        continue;
      }

      // Finish current page and start new one
      pages.push(blocksToMarkdown(currentPageBlocks));
      currentPageBlocks = [block];
      currentPageChars = blockChars;
    } else {
      currentPageBlocks.push(block);
      currentPageChars += blockChars;
    }
  }

  // Add the last page if it has content
  if (currentPageBlocks.length > 0) {
    const remainingContent = blocksToMarkdown(currentPageBlocks);
    if (remainingContent.trim()) {
      pages.push(remainingContent);
    }
  }

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
