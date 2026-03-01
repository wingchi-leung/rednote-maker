import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { renderToStaticMarkup } from "react-dom/server";
import { CARD_CONFIG } from "./constants";
import { getTemplate, type Theme } from "./templates";

export type { ContentBlock };

/** 自定义分页符：文档中单独一行的 --- 会强制在此处分页 */
export const PAGE_BREAK_SEPARATOR = "---";

interface ContentBlock {
  type: "line";
  content: string;
}

export type Density = "compact" | "comfortable" | "spacious";
export type FontSize = "sm" | "md" | "lg";

export interface PaginationOptions {
  density: Density;
  fontSize: FontSize;
  theme: Theme;
}

const DENSITY_CONFIG = {
  compact: { padding: 24, lineHeightRatio: 1.5 },
  comfortable: { padding: 32, lineHeightRatio: 1.75 },
  spacious: { padding: 40, lineHeightRatio: 2.0 },
} as const;

const FONT_SIZE_CONFIG = {
  sm: 14,
  md: 16,
  lg: 18,
} as const;

const TEMPLATE_EXTRA = {
  appleHeader: 50,
  frameTopLine: 1,
  frameTopMargin: 24,
} as const;

interface RenderContext {
  fontSize: number;
  lineHeightRatio: number;
  contentWidth: number;
  contentHeight: number;
}

const isBrowser = typeof document !== "undefined" && typeof window !== "undefined";
let measureContainer: HTMLDivElement | null = null;
const HEIGHT_SAFETY_GAP = 6;

function preprocessHighlight(md: string): string {
  const parts = md.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, i) =>
      i % 2 === 0 ? part.replace(/==([^=]+?)==/g, "<mark>$1</mark>") : part
    )
    .join("");
}

function splitByPageBreak(content: string): string[] {
  const trimmed = content.trim();
  if (!trimmed) return [""];
  const re = new RegExp(
    `\\n\\s*${PAGE_BREAK_SEPARATOR.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n`,
    "g"
  );
  const segments = trimmed
    .split(re)
    .map((s) => s.trim())
    .filter(Boolean);
  return segments.length > 0 ? segments : [""];
}

export function parseMarkdownToBlocks(markdown: string): ContentBlock[] {
  return markdown.split("\n").map((line) => ({ type: "line", content: line }));
}

function getRenderContext(options: PaginationOptions): RenderContext {
  const density = DENSITY_CONFIG[options.density];
  const template = getTemplate(options.theme);
  const fontSize = FONT_SIZE_CONFIG[options.fontSize];

  let contentWidth = CARD_CONFIG.width - density.padding * 2;
  let contentHeight = CARD_CONFIG.height - density.padding * 2;

  if (template.layout === "appleNotes") {
    contentHeight -= TEMPLATE_EXTRA.appleHeader;
  }

  if (template.cardFrame?.topLine) {
    const sideMarginPx = (CARD_CONFIG.width * template.cardFrame.sideMarginPercent) / 100;
    contentWidth -= sideMarginPx * 2;
    contentHeight -= TEMPLATE_EXTRA.frameTopLine + TEMPLATE_EXTRA.frameTopMargin;
  }

  return {
    fontSize,
    lineHeightRatio: density.lineHeightRatio,
    contentWidth: Math.max(120, Math.floor(contentWidth)),
    contentHeight: Math.max(120, Math.floor(contentHeight)),
  };
}

function getMeasureContainer(): HTMLDivElement | null {
  if (!isBrowser) return null;
  if (measureContainer) return measureContainer;

  const el = document.createElement("div");
  el.style.position = "fixed";
  el.style.left = "-99999px";
  el.style.top = "-99999px";
  el.style.visibility = "hidden";
  el.style.pointerEvents = "none";
  el.style.overflow = "visible";
  el.style.boxSizing = "border-box";
  el.style.wordBreak = "break-word";
  el.style.overflowWrap = "break-word";
  el.style.fontFamily =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  document.body.appendChild(el);
  measureContainer = el;
  return el;
}

function createMeasureComponents() {
  return {
    h1: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(
        "h1",
        {
          style: {
            fontSize: "30px",
            lineHeight: "36px",
            fontWeight: 700,
            marginTop: 0,
            marginBottom: 8,
          },
        },
        children
      ),
    h2: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(
        "h2",
        {
          style: {
            fontSize: "24px",
            lineHeight: "32px",
            fontWeight: 700,
            marginTop: 16,
            marginBottom: 8,
          },
        },
        children
      ),
    h3: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(
        "h3",
        {
          style: {
            fontSize: "20px",
            lineHeight: "28px",
            fontWeight: 700,
            marginTop: 12,
            marginBottom: 6,
          },
        },
        children
      ),
    h4: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(
        "h4",
        {
          style: {
            fontSize: "18px",
            lineHeight: "28px",
            fontWeight: 700,
            marginTop: 8,
            marginBottom: 4,
          },
        },
        children
      ),
    h5: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(
        "h5",
        {
          style: {
            fontSize: "16px",
            lineHeight: "24px",
            fontWeight: 700,
            marginTop: 8,
            marginBottom: 4,
          },
        },
        children
      ),
    h6: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(
        "h6",
        {
          style: {
            fontSize: "14px",
            lineHeight: "20px",
            fontWeight: 700,
            marginTop: 6,
            marginBottom: 2,
          },
        },
        children
      ),
    p: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(
        "p",
        {
          style: {
            marginTop: 0,
            marginBottom: 8,
          },
        },
        children
      ),
    ul: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(
        "ul",
        {
          style: {
            marginTop: 0,
            marginBottom: 8,
            paddingLeft: 24,
          },
        },
        children
      ),
    ol: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(
        "ol",
        {
          style: {
            marginTop: 0,
            marginBottom: 8,
            paddingLeft: 24,
          },
        },
        children
      ),
    li: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(
        "li",
        {
          style: {
            marginTop: 0,
            marginBottom: 2,
          },
        },
        children
      ),
    blockquote: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(
        "blockquote",
        {
          style: {
            marginTop: 8,
            marginBottom: 8,
            paddingTop: 4,
            paddingBottom: 4,
            paddingLeft: 12,
            borderLeft: "4px solid currentColor",
            fontStyle: "italic",
          },
        },
        children
      ),
    code: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(
        "code",
        {
          style: {
            padding: "2px 4px",
            borderRadius: 4,
          },
        },
        children
      ),
  };
}

const measureComponents = createMeasureComponents();

function canFitMarkdown(markdown: string, context: RenderContext): boolean {
  const el = getMeasureContainer();
  if (!el) return false;

  el.style.width = `${context.contentWidth}px`;
  el.style.fontSize = `${context.fontSize}px`;
  el.style.lineHeight = context.lineHeightRatio.toString();

  const html = renderToStaticMarkup(
    React.createElement(
      ReactMarkdown,
      {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeRaw],
        components: measureComponents,
      },
      preprocessHighlight(markdown || "*空页面*")
    )
  );

  el.innerHTML = html;
  const measuredHeight = Math.ceil(el.scrollHeight);
  return measuredHeight <= context.contentHeight - HEIGHT_SAFETY_GAP;
}

function buildFenceState(lines: string[]): boolean[] {
  const inFenceAtSplit: boolean[] = new Array(lines.length + 1).fill(false);
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*```/.test(lines[i])) {
      inFence = !inFence;
    }
    inFenceAtSplit[i + 1] = inFence;
  }
  return inFenceAtSplit;
}

function isNaturalBoundary(lines: string[], splitIndex: number): boolean {
  if (splitIndex <= 0 || splitIndex >= lines.length) return true;
  const prev = lines[splitIndex - 1].trim();
  const next = lines[splitIndex].trim();
  if (!prev || !next) return true;
  if (next.startsWith("#")) return true;
  if (/^[-*+]\s/.test(next) || /^\d+\.\s/.test(next)) return true;
  return false;
}

function pickSafeSplitIndex(lines: string[], bestFit: number): number {
  if (bestFit <= 1) return 1;
  const fenceState = buildFenceState(lines);

  for (let i = bestFit; i >= 1; i--) {
    if (fenceState[i]) continue;
    if (isNaturalBoundary(lines, i)) return i;
  }

  for (let i = bestFit; i >= 1; i--) {
    if (!fenceState[i]) return i;
  }

  return 1;
}

function pickInlineSplitAt(line: string, best: number): number {
  const minKeep = Math.min(20, line.length);
  for (let i = best; i >= minKeep; i--) {
    const ch = line[i - 1];
    if (/[。！？.!?，,；;、\s]/.test(ch)) {
      return i;
    }
  }
  return Math.max(1, best);
}

function splitSingleOverlongLine(
  line: string,
  context: RenderContext
): { head: string; tail: string } {
  if (!line) {
    return { head: "", tail: "" };
  }

  let lo = 1;
  let hi = line.length;
  let best = 1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const candidate = line.slice(0, mid);
    if (canFitMarkdown(candidate, context)) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  const splitAt = pickInlineSplitAt(line, best);
  const head = line.slice(0, splitAt).trimEnd();
  const tail = line.slice(splitAt).trimStart();

  if (!head && tail) {
    return { head: line[0], tail: line.slice(1).trimStart() };
  }

  return { head, tail };
}

function paginateSegmentByMeasurement(
  segment: string,
  context: RenderContext
): string[] {
  const pages: string[] = [];
  let lines = segment.split("\n");

  while (lines.length > 0) {
    while (lines.length > 0 && !lines[0].trim()) {
      lines = lines.slice(1);
    }
    if (lines.length === 0) break;

    const full = lines.join("\n");
    if (canFitMarkdown(full, context)) {
      pages.push(full.trimEnd());
      break;
    }

    let lo = 1;
    let hi = lines.length;
    let bestFit = 0;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const candidate = lines.slice(0, mid).join("\n");
      if (canFitMarkdown(candidate, context)) {
        bestFit = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    if (bestFit <= 0) {
      const { head, tail } = splitSingleOverlongLine(lines[0], context);
      pages.push(head || "");
      lines = tail ? [tail, ...lines.slice(1)] : lines.slice(1);
      continue;
    }

    const splitIndex = pickSafeSplitIndex(lines, bestFit);
    const page = lines.slice(0, splitIndex).join("\n").trimEnd();
    pages.push(page || "");
    lines = lines.slice(splitIndex);
  }

  return pages.length > 0 ? pages : [""];
}

function paginateByCharacterFallback(segment: string): string[] {
  const maxCharsPerPage = 900;
  const lines = segment.split("\n");
  const pages: string[] = [];
  let bucket: string[] = [];
  let size = 0;

  for (const line of lines) {
    const nextSize = size + line.length + 1;
    if (nextSize > maxCharsPerPage && bucket.length > 0) {
      pages.push(bucket.join("\n").trimEnd());
      bucket = [line];
      size = line.length + 1;
    } else {
      bucket.push(line);
      size = nextSize;
    }
  }

  if (bucket.length > 0) {
    pages.push(bucket.join("\n").trimEnd());
  }

  return pages.length > 0 ? pages : [""];
}

function getTextBudget(options: PaginationOptions): number {
  const base = 280;
  const fontFactor = options.fontSize === "sm" ? 1.1 : options.fontSize === "lg" ? 0.85 : 1;
  const densityFactor =
    options.density === "compact" ? 1.1 : options.density === "spacious" ? 0.85 : 1;
  return Math.max(180, Math.floor(base * fontFactor * densityFactor));
}

function weightedLength(text: string): number {
  let total = 0;
  for (const ch of text) {
    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(ch)) {
      total += 1;
    } else if (/\s/.test(ch)) {
      total += 0.2;
    } else {
      total += 0.55;
    }
  }
  return total;
}

function enforceTextBudgetForPage(page: string, budget: number): string[] {
  if (weightedLength(page) <= budget) {
    return [page];
  }

  const out: string[] = [];
  let lines = page.split("\n");

  while (lines.length > 0) {
    let lo = 1;
    let hi = lines.length;
    let best = 1;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const candidate = lines.slice(0, mid).join("\n");
      if (weightedLength(candidate) <= budget) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    const split = pickSafeSplitIndex(lines, best);
    out.push(lines.slice(0, split).join("\n").trimEnd());
    lines = lines.slice(split);
  }

  return out.length > 0 ? out : [page];
}

function enforceTextBudget(pages: string[], budget: number): string[] {
  const next: string[] = [];
  for (const page of pages) {
    next.push(...enforceTextBudgetForPage(page, budget));
  }
  return next.length > 0 ? next : [""];
}

export function calculatePages(
  markdown: string,
  options?: PaginationOptions | number
): string[] {
  if (!markdown.trim()) {
    return [""];
  }

  const paginationOptions: PaginationOptions =
    typeof options === "number" || !options
      ? { density: "comfortable", fontSize: "md", theme: "classic" }
      : options;

  const segments = splitByPageBreak(markdown);
  const context = getRenderContext(paginationOptions);
  const budget = getTextBudget(paginationOptions);
  const allPages: string[] = [];

  for (const segment of segments) {
    const rawPages = isBrowser
      ? paginateSegmentByMeasurement(segment, context)
      : paginateByCharacterFallback(segment);
    const pages = enforceTextBudget(rawPages, budget);
    allPages.push(...pages);
  }

  return allPages.length > 0 ? allPages : [""];
}

export function cleanupMeasureContainer(): void {
  if (measureContainer?.parentNode) {
    measureContainer.parentNode.removeChild(measureContainer);
  }
  measureContainer = null;
}
