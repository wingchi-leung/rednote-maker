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

/**
 * 获取或创建测量容器
 * 容器使用与实际卡片相同的样式，但不可见
 */
function getMeasureContainer(): HTMLElement {
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
  return measureContainer;
}

/**
 * 清理测量容器
 */
export function cleanupMeasureContainer(): void {
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
  if (!isBrowser) {
    throw new Error("DOM measurement is only available in browser environment");
  }
  const container = getMeasureContainer();
  const template = getTemplate(options.theme);
  const colors = template.colors;

  // 计算可用高度（考虑 padding 和模板头部）
  const layout = template.layout;
  const hasCustomHeader = layout === "appleNotes";
  const cardFrame = template.cardFrame;

  let availableHeight = CARD_CONFIG.height;
  let extraTopSpace = 0;

  // appleNotes 布局头部高度
  if (hasCustomHeader) {
    const headerPadding = DENSITY_CONFIG[options.density].padding;
    extraTopSpace += headerPadding * 2 + 25; // 25px 是头部内容高度
  }

  // cardFrame 顶线和上边距
  if (cardFrame?.topLine) {
    extraTopSpace += 1; // 顶线
    extraTopSpace += 24; // marginTop
  }

  // 内容区域的 padding
  const contentPadding = hasCustomHeader ? 0 : DENSITY_CONFIG[options.density].padding;
  availableHeight -= contentPadding * 2;
  availableHeight -= extraTopSpace;

  return {
    container,
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
 * 将 Markdown 转换为简单的 HTML（用于测量）
 * 这是一个简化的转换器，专注于保持与实际渲染相同的视觉效果
 */
function markdownToSimpleHTML(markdown: string, context: RenderContext): string {
  const { colors, template } = context;
  const codeBg = getCodeBackground(context.theme);
  const blockquoteColor = template.blockquoteColor || colors.accent;
  const accentColor = colors.accent;
  const bgColor = colors.background;

  let html = markdown;

  // 处理代码块 ```...```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = escapeHtml(code.trim());
    return `<pre style="background: rgba(0,0,0,0.05); padding: 12px; border-radius: 6px; overflow-x: auto; margin-bottom: 8px; font-size: 14px; line-height: 1.5;"><code>${escaped}</code></pre>`;
  });

  // 处理行内代码 `...`
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    const escaped = escapeHtml(code);
    return `<code style="background: ${codeBg}; padding: 2px 6px; border-radius: 4px; font-size: 14px;">${escaped}</code>`;
  });

  // 处理粗体 **...**
  html = html.replace(/\*\*([^*]+)\*\*/g, (_, text) => {
    return `<strong style="color: ${accentColor}; font-weight: bold;">${text}</strong>`;
  });

  // 处理斜体 *...*
  html = html.replace(/\*([^*]+)\*/g, (_, text) => {
    return `<em style="font-style: italic;">${text}</em>`;
  });

  // 处理高亮 ==...==
  html = html.replace(/==([^=]+)==/g, (_, text) => {
    return `<mark style="background: ${accentColor}; color: ${bgColor}; padding: 2px 4px; border-radius: 4px; font-weight: 500;">${text}</mark>`;
  });

  // 处理引用 > ...
  html = html.replace(/^>\s+(.+)$/gm, (_, text) => {
    return `<blockquote style="border-left: 4px solid ${blockquoteColor}; padding-left: 12px; padding-top: 4px; padding-bottom: 4px; margin: 8px 0; font-style: italic; opacity: 0.9;">${text}</blockquote>`;
  });

  // 处理标题 # ...
  html = html.replace(/^#####\s+(.+)$/gm, (_, text) => {
    return `<h3 style="font-size: 20px; font-weight: bold; margin-bottom: 6px; margin-top: 12px;">${text}</h3>`;
  });
  html = html.replace(/^####\s+(.+)$/gm, (_, text) => {
    return `<h3 style="font-size: 20px; font-weight: bold; margin-bottom: 6px; margin-top: 12px;">${text}</h3>`;
  });
  html = html.replace(/^###\s+(.+)$/gm, (_, text) => {
    return `<h3 style="font-size: 20px; font-weight: bold; margin-bottom: 6px; margin-top: 12px;">${text}</h3>`;
  });
  html = html.replace(/^##\s+(.+)$/gm, (_, text) => {
    return `<h2 style="font-size: 24px; font-weight: bold; margin-bottom: 8px; margin-top: 16px;">${text}</h2>`;
  });
  html = html.replace(/^#\s+(.+)$/gm, (_, text) => {
    return `<h1 style="font-size: 30px; font-weight: bold; margin-bottom: 8px; margin-top: 0;">${text}</h1>`;
  });

  // 处理无序列表 - ...
  html = html.replace(/^[\*\-]\s+(.+)$/gm, (_, text) => {
    return `<li style="margin-bottom: 2px;">${text}</li>`;
  });

  // 处理有序列表 1. ...
  html = html.replace(/^\d+\.\s+(.+)$/gm, (_, text) => {
    return `<li style="margin-bottom: 2px;">${text}</li>`;
  });

  // 处理段落（连续的非空行）
  const lines = html.split("\n");
  const result: string[] = [];
  let inParagraph = false;
  let paragraphContent = "";

  for (const line of lines) {
    const trimmed = line.trim();

    // 空行结束段落
    if (!trimmed) {
      if (inParagraph && paragraphContent.trim()) {
        result.push(`<p style="margin-bottom: 8px; line-height: inherit;">${paragraphContent}</p>`);
        paragraphContent = "";
      }
      inParagraph = false;
      continue;
    }

    // 检查是否是块级元素
    if (trimmed.match(/^(<[hulp][1-6]?|<pre|<blockquote|<li|<h[1-6])/)) {
      // 块级元素，先结束当前段落
      if (inParagraph && paragraphContent.trim()) {
        result.push(`<p style="margin-bottom: 8px; line-height: inherit;">${paragraphContent}</p>`);
        paragraphContent = "";
      }
      result.push(line);
      inParagraph = false;
    } else {
      // 普通文本，加入段落
      if (inParagraph) {
        paragraphContent += " " + trimmed;
      } else {
        paragraphContent = trimmed;
        inParagraph = true;
      }
    }
  }

  // 处理最后一个段落
  if (inParagraph && paragraphContent.trim()) {
    result.push(`<p style="margin-bottom: 8px; line-height: inherit;">${paragraphContent}</p>`);
  }

  // 处理列表：将连续的 li 包装在 ul/ol 中
  const finalResult: string[] = [];
  let inList = false;
  let listType: "ul" | "ol" = "ul";
  let listItems: string[] = [];

  for (const line of result) {
    if (line.trim().startsWith("<li>")) {
      if (!inList) {
        inList = true;
        // 检测列表类型（根据原始内容）
        listType = "ul";
      }
      listItems.push(line);
    } else {
      if (inList) {
        const listTag = listType;
        finalResult.push(`<${listTag} style="margin-bottom: 8px; padding-left: 24px; list-style-type: ${listType === "ul" ? "disc" : "decimal"};">${listItems.join("")}</${listTag}>`);
        listItems = [];
        inList = false;
      }
      finalResult.push(line);
    }
  }

  if (inList) {
    const listTag = listType;
    finalResult.push(`<${listTag} style="margin-bottom: 8px; padding-left: 24px; list-style-type: ${listTag === "ul" ? "disc" : "decimal"};">${listItems.join("")}</${listTag}>`);
  }

  return finalResult.join("\n");
}

/**
 * HTML 转义
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 将 Markdown 渲染到测量容器并返回实际高度
 */
function renderMarkdownToMeasure(markdown: string, context: RenderContext): number {
  const {
    container,
    colors,
    template,
  } = context;

  // 清空容器
  container.innerHTML = "";

  // 创建测量包装器
  const wrapper = document.createElement("div");
  wrapper.style.width = "100%";
  wrapper.style.boxSizing = "border-box";
  wrapper.style.color = colors.text;
  wrapper.style.fontSize = `${FONT_SIZE_CONFIG[context.fontSize]}px`;
  wrapper.style.lineHeight = DENSITY_CONFIG[context.density].lineHeight;
  wrapper.style.padding = "0";
  wrapper.style.overflowWrap = "break-word";
  wrapper.style.wordBreak = "break-word";
  wrapper.style.overflowX = "hidden";
  wrapper.style.overflowY = "hidden";

  // 处理 cardFrame
  const cardFrame = template.cardFrame;
  if (cardFrame) {
    const marginPct = `${cardFrame.sideMarginPercent}%`;
    wrapper.style.paddingLeft = marginPct;
    wrapper.style.paddingRight = marginPct;
    if (cardFrame.topLine) {
      wrapper.style.paddingTop = "24px";
    }
  }

  // 处理 appleNotes 头部
  const hasCustomHeader = template.layout === "appleNotes";
  if (hasCustomHeader) {
    wrapper.style.padding = `${DENSITY_CONFIG[context.density].padding}px`;
  }

  // 转换 Markdown 为 HTML 并渲染
  const html = markdownToSimpleHTML(markdown, context);
  wrapper.innerHTML = html || "<p style='line-height: inherit;'>*空页面*</p>";

  container.appendChild(wrapper);

  // 强制浏览器计算布局
  container.offsetHeight;

  // 获取实际高度
  const height = wrapper.scrollHeight;

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

/**
 * 解析 Markdown 为内容块
 */
function parseMarkdownToBlocks(markdown: string): ContentBlock[] {
  const lines = markdown.split("\n");
  const blocks: ContentBlock[] = [];
  let inCodeBlock = false;
  let codeContent = "";

  for (const line of lines) {
    // 处理代码块
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // 结束代码块
        blocks.push({ type: "code", content: codeContent.trim(), rawLine: codeContent.trim() });
        codeContent = "";
        inCodeBlock = false;
      } else {
        // 开始代码块
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

  // 处理未闭合的代码块
  if (inCodeBlock && codeContent.trim()) {
    blocks.push({ type: "code", content: codeContent.trim(), rawLine: codeContent.trim() });
  }

  return blocks;
}

/**
 * 将块转回 Markdown
 */
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

/**
 * 按自定义分页符拆分内容
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
 * 使用二分查找找到最佳拆分点
 * 用于处理单个超大块
 */
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

  // 二分查找找到合适的分割点
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

  if (bestSplit >= lines.length) {
    return [block];
  }

  if (bestSplit <= 0) {
    return [block];
  }

  // 在最佳分割点附近找更好的边界（句子结尾、段落等）
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

/**
 * 在二分结果附近找更好的分割点（句子、段落边界）
 */
function findBetterSplitPoint(lines: string[], idealIndex: number): number {
  // 优先在空行处分割
  for (let i = idealIndex; i > idealIndex - 3 && i > 0; i--) {
    if (lines[i - 1]?.trim() === "") {
      return i;
    }
  }

  // 在句子结尾处分割（中文或英文句号）
  for (let i = idealIndex; i > idealIndex - 5 && i > 0; i--) {
    const line = lines[i - 1] || "";
    if (/[。！？.!?]$/.test(line.trim())) {
      return i;
    }
  }

  // 在逗号处分割
  for (let i = idealIndex; i > idealIndex - 3 && i > 0; i--) {
    const line = lines[i - 1] || "";
    if (/[，,]$/.test(line.trim())) {
      return i;
    }
  }

  return idealIndex;
}

/**
 * 核心分页算法：基于实际渲染高度
 */
function paginateByActualHeight(
  markdown: string,
  context: RenderContext
): ContentBlock[][] {
  const blocks = parseMarkdownToBlocks(markdown);
  const pages: ContentBlock[][] = [];
  const { availableHeight } = context;

  // 留出一点安全边距（5px）
  const safeHeight = availableHeight - 5;

  let currentPageBlocks: ContentBlock[] = [];
  let currentHeight = 0;

  for (const block of blocks) {
    // 先测试当前块是否单独超过一页
    const singleBlockHeight = renderMarkdownToMeasure(
      blocksToMarkdown([block]),
      context
    );

    if (singleBlockHeight > safeHeight) {
      // 当前块太大，需要拆分
      // 先保存当前页（如果有内容）
      if (currentPageBlocks.length > 0) {
        pages.push(currentPageBlocks);
        currentPageBlocks = [];
        currentHeight = 0;
      }

      // 拆分超大块
      const splitChunks = findSplitPointBinary(block, context, safeHeight);

      // 处理拆分后的块
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

    // 测试加入当前块后的总高度
    const testBlocks = [...currentPageBlocks, block];
    const testHeight = renderMarkdownToMeasure(
      blocksToMarkdown(testBlocks),
      context
    );

    if (testHeight > safeHeight && currentPageBlocks.length > 0) {
      // 特殊处理：标题和内容不要分离（如果当前页内容很少）
      if (block.type === "heading" && currentHeight < safeHeight * 0.3) {
        currentPageBlocks.push(block);
        currentHeight = testHeight;
      } else {
        // 开始新的一页
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

  // SSR 环境下返回原始内容（不分页）
  if (!isBrowser) {
    // 按自定义分页符拆分
    const segments = splitByPageBreak(markdown);
    return segments.length > 0 ? segments : [markdown];
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

  // 按自定义分页符拆分
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
