/**
 * 基于实际 DOM 渲染测量的精确分页算法
 * 解决数学估算导致的分页丢字问题
 */

import { CARD_CONFIG } from "./constants";
import { getTemplate, type Theme } from "./templates";
import { getCodeBackground } from "@/lib/templates";

// 检查是否在浏览器环境中
const isBrowser = typeof document !== "undefined" && typeof window !== "undefined";

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

/** 自定义分页符：文档中单独一行的 --- 会强制在此处分页 */
export const PAGE_BREAK_SEPARATOR = "---";

// 字号配置
const FONT_SIZE_CONFIG = {
  sm: 14,
  md: 16,
  lg: 18,
} as const;

// 密度配置
const DENSITY_CONFIG = {
  compact: { padding: 24, lineHeight: "1.5" },
  comfortable: { padding: 32, lineHeight: "1.75" },
  spacious: { padding: 40, lineHeight: "2" },
} as const;

// ============================================================================
// DOM 测量容器管理
// ============================================================================

let measureContainer: HTMLElement | null = null;
let measureWrapper: HTMLElement | null = null;

/**
 * 初始化测量容器和包装器（只创建一次，复用样式）
 */
function initMeasureContainer(context: RenderContext): void {
  if (!isBrowser) {
    throw new Error("DOM measurement is only available in browser environment");
  }

  if (!measureContainer) {
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
  }

  // 创建测量包装器（样式与实际卡片完全一致）
  if (!measureWrapper) {
    measureWrapper = document.createElement("div");
    measureWrapper.style.width = "100%";
    measureWrapper.style.boxSizing = "border-box";
    measureWrapper.style.color = context.colors.text;
    measureWrapper.style.fontSize = `${FONT_SIZE_CONFIG[context.fontSize]}px`;
    measureWrapper.style.lineHeight = DENSITY_CONFIG[context.density].lineHeight;
    measureWrapper.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    measureWrapper.style.padding = "0";
    measureWrapper.style.overflowWrap = "break-word";
    measureWrapper.style.wordBreak = "break-word";
    measureWrapper.style.overflowX = "hidden";
    measureWrapper.style.overflowY = "hidden";

    // 处理 cardFrame
    const cardFrame = context.template.cardFrame;
    if (cardFrame) {
      const marginPct = `${cardFrame.sideMarginPercent}%`;
      measureWrapper.style.paddingLeft = marginPct;
      measureWrapper.style.paddingRight = marginPct;
      if (cardFrame.topLine) {
        measureWrapper.style.paddingTop = "24px";
      }
    }

    // 处理 appleNotes 头部
    const hasCustomHeader = context.template.layout === "appleNotes";
    if (hasCustomHeader) {
      measureWrapper.style.padding = `${DENSITY_CONFIG[context.density].padding}px`;
    }

    measureContainer.appendChild(measureWrapper);
  }
}

/**
 * 清理测量容器
 */
export function cleanupMeasureContainer(): void {
  measureWrapper = null;
  if (measureContainer) {
    document.body.removeChild(measureContainer);
    measureContainer = null;
  }
}

// ============================================================================
// 渲染上下文
// ============================================================================

interface RenderContext {
  container: HTMLElement;
  availableHeight: number;
  theme: Theme;
  fontSize: FontSize;
  density: Density;
  colors: { background: string; text: string; accent: string };
  template: ReturnType<typeof getTemplate>;
}

/**
 * 创建渲染上下文
 */
function createRenderContext(options: PaginationOptions): RenderContext {
  const template = getTemplate(options.theme);
  const colors = template.colors;

  // 计算可用高度
  const layout = template.layout;
  const hasCustomHeader = layout === "appleNotes";
  const cardFrame = template.cardFrame;

  let availableHeight = CARD_CONFIG.height;

  // cardFrame 顶线和上边距
  if (cardFrame?.topLine) {
    availableHeight -= 1; // 顶线
    availableHeight -= 24; // marginTop
  }

  // appleNotes 头部大约高度
  if (hasCustomHeader) {
    availableHeight -= 50; // 头部高度
  }

  // 内容区域的 padding（测量 wrapper 的 padding）
  const contentPadding = DENSITY_CONFIG[options.density].padding;
  if (hasCustomHeader) {
    // appleNotes 有 padding
    availableHeight -= contentPadding * 2;
  } else if (!cardFrame) {
    // 默认布局也有 padding
    availableHeight -= contentPadding * 2;
  }
  // cardFrame 布局没有额外的上下 padding（只有左右边距）

  return {
    container: null as any,
    availableHeight,
    theme: options.theme,
    fontSize: options.fontSize,
    density: options.density,
    colors,
    template,
  };
}

// ============================================================================
// Markdown 简单渲染器（用于测量）
// ============================================================================

/**
 * HTML 转义
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 将内联 Markdown 转换为 HTML（处理粗体、斜体、代码、高亮等）
 */
function convertInlineMarkdown(text: string, context: RenderContext): string {
  const { colors } = context;
  const codeBg = getCodeBackground(context.theme);
  const accentColor = colors.accent;
  const bgColor = colors.background;

  let result = text;

  // 处理行内代码 `...`（最先处理，避免被其他规则干扰）
  result = result.replace(/`([^`]+)`/g, (_, code) => {
    const escaped = escapeHtml(code);
    return `<code style="background: ${codeBg}; padding: 2px 4px; border-radius: 4px; font-size: 0.875em;">${escaped}</code>`;
  });

  // 处理粗体 **...**
  result = result.replace(/\*\*([^*]+)\*\*/g, (_, text) => {
    return `<strong style="color: ${accentColor}; font-weight: 700;">${text}</strong>`;
  });

  // 处理斜体 *...*（避免匹配到 **）
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_, text) => {
    return `<em style="font-style: italic;">${text}</em>`;
  });

  // 处理高亮 ==...==
  result = result.replace(/==([^=]+)==/g, (_, text) => {
    return `<mark style="background: ${accentColor}; color: ${bgColor}; padding: 2px 4px; border-radius: 4px; font-weight: 500;">${text}</mark>`;
  });

  return result;
}

/**
 * 将 Markdown 转换为简单的 HTML（用于测量）
 * 尽量模拟 ReactMarkdown + Tailwind 的渲染效果
 */
function markdownToSimpleHTML(markdown: string, context: RenderContext): string {
  const { template, colors } = context;
  const codeBg = getCodeBackground(context.theme);
  const blockquoteColor = template.blockquoteColor || colors.accent;

  const lines = markdown.split("\n");
  const result: string[] = [];
  let inCodeBlock = false;
  let codeContent = "";

  for (const line of lines) {
    const trimmed = line.trim();

    // 处理代码块
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        const escaped = escapeHtml(codeContent.trim());
        result.push(`<pre style="background: rgba(0,0,0,0.05); padding: 12px; border-radius: 6px; overflow-x: auto; margin: 0 0 8px 0; font-size: 14px; line-height: 1.5;"><code style="font-family: monospace;">${escaped}</code></pre>`);
        codeContent = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + "\n";
      continue;
    }

    // 空行
    if (!trimmed) {
      continue;
    }

    // 标题
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = convertInlineMarkdown(headingMatch[2], context);
      let style = "";
      if (level === 1) {
        style = "font-size: 30px; font-weight: 700; margin: 0 0 8px 0;";
      } else if (level === 2) {
        style = "font-size: 24px; font-weight: 700; margin: 16px 0 8px 0;";
      } else {
        style = "font-size: 20px; font-weight: 700; margin: 12px 0 6px 0;";
      }
      result.push(`<h${level} style="${style}">${text}</h${level}>`);
      continue;
    }

    // 引用
    if (trimmed.startsWith("> ")) {
      const text = convertInlineMarkdown(trimmed.slice(2), context);
      result.push(`<blockquote style="border-left: 4px solid ${blockquoteColor}; padding-left: 12px; padding-top: 4px; padding-bottom: 4px; margin: 8px 0; font-style: italic; opacity: 0.9;">${text}</blockquote>`);
      continue;
    }

    // 列表项
    const listMatch = trimmed.match(/^[\*\-]\s+(.+)$/);
    const orderedListMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (listMatch || orderedListMatch) {
      const text = convertInlineMarkdown(listMatch ? listMatch[1] : orderedListMatch![1], context);
      result.push(`<li style="margin-bottom: 2px;">${text}</li>`);
      continue;
    }

    // 普通文本行 - 转为段落
    const text = convertInlineMarkdown(trimmed, context);
    result.push(`<p style="margin: 0 0 8px 0; line-height: inherit;">${text}</p>`);
  }

  // 将连续的 li 包装在 ul 中
  const finalResult: string[] = [];
  for (const line of result) {
    if (line.trim().startsWith("<li>")) {
      if (finalResult.length > 0 && finalResult[finalResult.length - 1].startsWith("<ul")) {
        finalResult[finalResult.length - 1] = finalResult[finalResult.length - 1].replace("</ul>", "") + line + "</ul>";
      } else {
        finalResult.push(`<ul style="margin: 0 0 8px 0; padding-left: 24px; list-style-type: disc;">${line}</ul>`);
      }
    } else {
      finalResult.push(line);
    }
  }

  return finalResult.join("");
}

/**
 * 将 Markdown 渲染到测量容器并返回实际高度
 */
function renderMarkdownToMeasure(markdown: string, context: RenderContext): number {
  initMeasureContainer(context);

  if (!measureWrapper) {
    throw new Error("Measure wrapper not initialized");
  }

  measureWrapper.innerHTML = "";
  const html = markdownToSimpleHTML(markdown, context);
  measureWrapper.innerHTML = html || "<p style='line-height: inherit; margin: 0;'>*空页面*</p>";

  measureContainer!.offsetHeight;

  const height = measureWrapper.scrollHeight;
  return height;
}

// ============================================================================
// 分页算法核心
// ============================================================================

interface ContentBlock {
  type: "heading" | "paragraph" | "list" | "code" | "empty";
  content: string;
  level?: number;
  rawLine: string;
}

function parseMarkdownToBlocks(markdown: string): ContentBlock[] {
  const lines = markdown.split("\n");
  const blocks: ContentBlock[] = [];
  let inCodeBlock = false;
  let codeContent = "";

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        blocks.push({ type: "code", content: codeContent.trim(), rawLine: codeContent.trim() });
        codeContent = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + "\n";
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      blocks.push({ type: "empty", content: "", rawLine: "" });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        content: headingMatch[2],
        level: headingMatch[1].length,
        rawLine: line,
      });
      continue;
    }

    if (/^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      blocks.push({ type: "list", content: trimmed, rawLine: line });
      continue;
    }

    blocks.push({ type: "paragraph", content: line, rawLine: line });
  }

  if (inCodeBlock && codeContent.trim()) {
    blocks.push({ type: "code", content: codeContent.trim(), rawLine: codeContent.trim() });
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
          return block.rawLine;
      }
    })
    .join("\n");
}

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

function findSplitPointBinary(
  block: ContentBlock,
  context: RenderContext,
  maxHeight: number
): ContentBlock[] {
  if (block.type !== "paragraph" && block.type !== "list") {
    return [block];
  }

  const lines = block.rawLine.split("\n");
  if (lines.length <= 1) {
    return [block];
  }

  let left = 1;
  let right = lines.length;
  let bestSplit = lines.length;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const testContent = lines.slice(0, mid).join("\n");
    const testBlocks: ContentBlock[] = [
      { ...block, rawLine: testContent, content: testContent },
    ];

    const testMarkdown = blocksToMarkdown(testBlocks);
    const height = renderMarkdownToMeasure(testMarkdown, context);

    if (height <= maxHeight) {
      bestSplit = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  if (bestSplit >= lines.length || bestSplit <= 0) {
    return [block];
  }

  const splitIndex = findBetterSplitPoint(lines, bestSplit);
  const firstPart = lines.slice(0, splitIndex).join("\n");
  const secondPart = lines.slice(splitIndex).join("\n").trimStart();

  const result: ContentBlock[] = [];
  if (firstPart.trim()) {
    result.push({ ...block, rawLine: firstPart, content: firstPart });
  }
  if (secondPart.trim()) {
    result.push({ ...block, rawLine: secondPart, content: secondPart });
  }

  return result;
}

function findBetterSplitPoint(lines: string[], idealIndex: number): number {
  for (let i = idealIndex; i > idealIndex - 3 && i > 0; i--) {
    if (lines[i - 1]?.trim() === "") {
      return i;
    }
  }

  for (let i = idealIndex; i > idealIndex - 5 && i > 0; i--) {
    const line = lines[i - 1] || "";
    if (/[。！？.!?]$/.test(line.trim())) {
      return i;
    }
  }

  for (let i = idealIndex; i > idealIndex - 3 && i > 0; i--) {
    const line = lines[i - 1] || "";
    if (/[，,]$/.test(line.trim())) {
      return i;
    }
  }

  return idealIndex;
}

function paginateByActualHeight(
  markdown: string,
  context: RenderContext
): ContentBlock[][] {
  const blocks = parseMarkdownToBlocks(markdown);
  const pages: ContentBlock[][] = [];
  const { availableHeight } = context;

  // 使用 85% 作为安全边距（更保守）
  const safeHeight = Math.floor(availableHeight * 0.85);

  let currentPageBlocks: ContentBlock[] = [];
  let currentHeight = 0;

  for (const block of blocks) {
    if (block.type === "empty") {
      continue;
    }

    const singleBlockHeight = renderMarkdownToMeasure(
      blocksToMarkdown([block]),
      context
    );

    if (singleBlockHeight > safeHeight) {
      if (currentPageBlocks.length > 0) {
        pages.push(currentPageBlocks);
        currentPageBlocks = [];
        currentHeight = 0;
      }

      const splitChunks = findSplitPointBinary(block, context, safeHeight);

      for (const chunk of splitChunks) {
        const chunkHeight = renderMarkdownToMeasure(
          blocksToMarkdown([chunk]),
          context
        );

        if (currentHeight + chunkHeight > safeHeight && currentPageBlocks.length > 0) {
          pages.push(currentPageBlocks);
          currentPageBlocks = [chunk];
          currentHeight = chunkHeight;
        } else {
          currentPageBlocks.push(chunk);
          currentHeight += chunkHeight;
        }
      }
      continue;
    }

    const testBlocks = [...currentPageBlocks, block];
    const testHeight = renderMarkdownToMeasure(
      blocksToMarkdown(testBlocks),
      context
    );

    if (testHeight > safeHeight && currentPageBlocks.length > 0) {
      if (block.type === "heading" && currentHeight < safeHeight * 0.3) {
        currentPageBlocks.push(block);
        currentHeight = testHeight;
      } else {
        pages.push(currentPageBlocks);
        currentPageBlocks = [block];
        currentHeight = singleBlockHeight;
      }
    } else {
      currentPageBlocks.push(block);
      currentHeight = testHeight;
    }
  }

  if (currentPageBlocks.length > 0) {
    pages.push(currentPageBlocks);
  }

  return pages.length > 0 ? pages : [[]];
}

export function calculatePages(
  markdown: string,
  options?: PaginationOptions | number
): string[] {
  if (!markdown.trim()) {
    return [""];
  }

  if (!isBrowser) {
    const segments = splitByPageBreak(markdown);
    return segments.length > 0 ? segments : [markdown];
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
  const context = createRenderContext(paginationOptions);

  for (const segment of segments) {
    const pageBlocks = paginateByActualHeight(segment, context);
    const pageStrings = pageBlocks.map((blocks) => blocksToMarkdown(blocks));
    allPages.push(pageStrings);
  }

  const result = allPages.flat();
  return result.length > 0 ? result : [""];
}
