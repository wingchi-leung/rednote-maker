import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Content, List, Root } from "mdast";
import { toMarkdown } from "mdast-util-to-markdown";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { CARD_CONFIG } from "@/lib/constants";
import { getTemplate, type Theme } from "@/lib/templates";
import {
  CARD_FONT_FAMILY,
  CardMarkdownContent,
} from "@/features/preview/CardMarkdownContent";
import { CARD_FOOTER_HEIGHT } from "@/features/preview/CardFooter";

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
  strongTextColor?: string;
  footer?: {
    isEnabled: boolean;
    text: string;
  };
}

interface PaginationUnit {
  markdown: string;
  kind: "block" | "list-item";
  listGroupKey?: string;
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
  accentColor: string;
  strongTextColor: string;
  backgroundColor: string;
  blockquoteColor: string;
  codeBackground: string;
}

interface OffsetPosition {
  start?: { offset?: number | null };
  end?: { offset?: number | null };
}

const isBrowser = typeof document !== "undefined" && typeof window !== "undefined";
const HEIGHT_SAFETY_GAP = 6;
const MEASURE_CACHE_MAX = 200;
const FALLBACK_TEXT_BUDGET = 900;

let measureContainer: HTMLDivElement | null = null;
const measureCache = new Map<string, boolean>();

function createMarkdownProcessor() {
  return unified().use(remarkParse).use(remarkGfm);
}

function normalizeFragment(markdown: string): string {
  return markdown.replace(/^\n+|\n+$/g, "");
}

function contextKey(context: RenderContext): string {
  return [
    context.fontSize,
    context.lineHeightRatio,
    context.contentWidth,
    context.contentHeight,
    context.accentColor,
    context.strongTextColor,
    context.backgroundColor,
    context.blockquoteColor,
    context.codeBackground,
  ].join("|");
}

function simpleHash(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return String(hash);
}

function getCachedFit(markdown: string, context: RenderContext): boolean | undefined {
  const key = `${contextKey(context)}_${simpleHash(markdown)}`;
  const cached = measureCache.get(key);
  if (cached === undefined) {
    return undefined;
  }

  measureCache.delete(key);
  measureCache.set(key, cached);
  return cached;
}

function setCachedFit(markdown: string, context: RenderContext, fits: boolean): void {
  const key = `${contextKey(context)}_${simpleHash(markdown)}`;
  if (measureCache.has(key)) {
    measureCache.delete(key);
  }

  measureCache.set(key, fits);

  while (measureCache.size > MEASURE_CACHE_MAX) {
    const first = measureCache.keys().next().value;
    if (first) {
      measureCache.delete(first);
    }
  }
}

function splitByPageBreak(content: string): string[] {
  const normalizedPageBreakLines = content.replace(
    /(^|\n)(\s*)---([^\s-][^\n]*)/g,
    (_match, prefix: string, indent: string, trailing: string) =>
      `${prefix}${indent}---\n${indent}${trailing}`
  );

  const trimmed = normalizedPageBreakLines.trim();
  if (!trimmed) {
    return [""];
  }

  const re = new RegExp(
    `\\n\\s*${PAGE_BREAK_SEPARATOR.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n`,
    "g"
  );

  const segments = trimmed
    .split(re)
    .map((segment) => segment.trim())
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

  let contentWidth = CARD_CONFIG.previewWidth - density.padding * 2;
  let contentHeight = CARD_CONFIG.previewHeight - density.padding * 2;

  if (template.layout === "appleNotes") {
    contentHeight -= TEMPLATE_EXTRA.appleHeader;
  }

  if (options.footer?.isEnabled && options.footer.text.trim()) {
    contentHeight -= CARD_FOOTER_HEIGHT;
  }

  if (template.cardFrame?.topLine) {
    const sideMarginPx = (CARD_CONFIG.previewWidth * template.cardFrame.sideMarginPercent) / 100;
    contentWidth -= sideMarginPx * 2;
    contentHeight -= TEMPLATE_EXTRA.frameTopLine + TEMPLATE_EXTRA.frameTopMargin;
  }

  return {
    fontSize,
    lineHeightRatio: density.lineHeightRatio,
    contentWidth: Math.max(120, Math.floor(contentWidth)),
    contentHeight: Math.max(120, Math.floor(contentHeight)),
    accentColor: template.colors.accent,
    strongTextColor: options.strongTextColor ?? template.strongTextColor ?? template.colors.accent,
    backgroundColor: template.colors.background,
    blockquoteColor: template.blockquoteColor ?? template.colors.accent,
    codeBackground: template.codeBackground ?? "rgba(0,0,0,0.05)",
  };
}

function getMeasureContainer(): HTMLDivElement | null {
  if (!isBrowser) {
    return null;
  }

  if (measureContainer) {
    return measureContainer;
  }

  const container = document.createElement("div");
  container.className = "card-content";
  container.style.position = "fixed";
  container.style.left = "-99999px";
  container.style.top = "-99999px";
  container.style.visibility = "hidden";
  container.style.pointerEvents = "none";
  container.style.overflow = "visible";
  container.style.boxSizing = "border-box";
  container.style.wordBreak = "break-word";
  container.style.overflowWrap = "break-word";
  container.style.fontFamily = CARD_FONT_FAMILY;

  document.body.appendChild(container);
  measureContainer = container;
  return measureContainer;
}

function renderMarkdownForMeasurement(markdown: string, context: RenderContext): string {
  return renderToStaticMarkup(
    React.createElement(CardMarkdownContent, {
      markdown,
      accentColor: context.accentColor,
      strongTextColor: context.strongTextColor,
      backgroundColor: context.backgroundColor,
      codeBackground: context.codeBackground,
      blockquoteColor: context.blockquoteColor,
    })
  );
}

function canFitMarkdown(markdown: string, context: RenderContext): boolean {
  const normalized = normalizeFragment(markdown);
  const cached = getCachedFit(normalized, context);
  if (cached !== undefined) {
    return cached;
  }

  const container = getMeasureContainer();
  if (!container) {
    return false;
  }

  container.style.width = `${context.contentWidth}px`;
  container.style.fontSize = `${context.fontSize}px`;
  container.style.lineHeight = context.lineHeightRatio.toString();
  container.innerHTML = renderMarkdownForMeasurement(normalized || "*空页面*", context);

  const measuredHeight = Math.ceil(container.scrollHeight);
  const maxHeight = context.contentHeight - HEIGHT_SAFETY_GAP;
  const fits = measuredHeight <= maxHeight;
  setCachedFit(normalized, context, fits);
  return fits;
}

export function doesMarkdownFit(
  markdown: string,
  options: PaginationOptions
): boolean {
  if (!isBrowser) {
    return true;
  }

  return canFitMarkdown(markdown, getRenderContext(options));
}

function sliceNodeMarkdown(source: string, node: Content): string {
  const position = node.position as OffsetPosition | undefined;
  const start = position?.start?.offset;
  const end = position?.end?.offset;

  if (typeof start === "number" && typeof end === "number") {
    return normalizeFragment(source.slice(start, end));
  }

  return normalizeFragment(toMarkdown(node));
}

function buildListItemUnit(list: List, itemIndex: number): PaginationUnit {
  const item = list.children[itemIndex];
  const listMarkdown = toMarkdown({
    type: "list",
    ordered: list.ordered,
    start: list.ordered ? (list.start ?? 1) + itemIndex : undefined,
    spread: list.spread,
    children: [item],
  });

  return {
    markdown: normalizeFragment(listMarkdown),
    kind: "list-item",
    listGroupKey: JSON.stringify({
      ordered: !!list.ordered,
      spread: !!list.spread,
      checked: "checked" in item ? item.checked ?? null : null,
    }),
  };
}

function segmentToUnits(segment: string): PaginationUnit[] {
  const processor = createMarkdownProcessor();
  const parsed = processor.parse(segment) as Root;
  const tree = processor.runSync(parsed) as Root;
  const units: PaginationUnit[] = [];

  for (const child of tree.children) {
    if (child.type === "list") {
      child.children.forEach((_, itemIndex) => {
        units.push(buildListItemUnit(child, itemIndex));
      });
      continue;
    }

    units.push({
      markdown: sliceNodeMarkdown(segment, child),
      kind: "block",
    });
  }

  return units.filter((unit) => unit.markdown.trim().length > 0);
}

function extractComparableText(markdown: string): string {
  const processor = createMarkdownProcessor();
  const parsed = processor.parse(markdown) as Root;
  const tree = processor.runSync(parsed) as Root;
  return toString(tree).replace(/\s+/g, " ").trim();
}

function joinUnits(units: PaginationUnit[]): string {
  if (units.length === 0) {
    return "";
  }

  let combined = units[0].markdown;
  for (let i = 1; i < units.length; i++) {
    const previous = units[i - 1];
    const current = units[i];
    const separator =
      previous.kind === "list-item" &&
      current.kind === "list-item" &&
      previous.listGroupKey === current.listGroupKey
        ? "\n"
        : "\n\n";

    combined += `${separator}${current.markdown}`;
  }

  return combined;
}

function splitPlainText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const result: string[] = [];
  for (const paragraph of paragraphs) {
    const sentences = paragraph.match(/[^。！？!?]+[。！？!?]?|.+$/g);
    if (!sentences || sentences.length <= 1) {
      result.push(paragraph);
      continue;
    }

    result.push(...sentences.map((sentence) => sentence.trim()).filter(Boolean));
  }

  return result;
}

function splitByCharacters(text: string, size = 80): string[] {
  const normalized = text.trim();
  if (!normalized) {
    return [];
  }

  const chunks: string[] = [];
  for (let index = 0; index < normalized.length; index += size) {
    chunks.push(normalized.slice(index, index + size));
  }

  return chunks.filter(Boolean);
}

function splitOversizedUnit(
  unit: PaginationUnit,
  context: RenderContext
): PaginationUnit[] {
  if (canFitMarkdown(unit.markdown, context)) {
    return [unit];
  }

  const plainPieces = splitPlainText(unit.markdown);
  if (plainPieces.length > 1) {
    const pages: PaginationUnit[] = [];
    let bucket = "";

    for (const piece of plainPieces) {
      const candidate = bucket ? `${bucket}\n\n${piece}` : piece;
      if (bucket && !canFitMarkdown(candidate, context)) {
        pages.push({ markdown: bucket, kind: "block" });
        bucket = piece;
      } else {
        bucket = candidate;
      }
    }

    if (bucket) {
      pages.push({ markdown: bucket, kind: "block" });
    }

    if (pages.every((page) => canFitMarkdown(page.markdown, context))) {
      return pages;
    }
  }

  const lines = unit.markdown.split("\n");
  if (lines.length > 1) {
    const pieces: PaginationUnit[] = [];
    let bucket: string[] = [];

    for (const line of lines) {
      const candidate = [...bucket, line].join("\n");
      if (bucket.length > 0 && !canFitMarkdown(candidate, context)) {
        pieces.push({ markdown: bucket.join("\n"), kind: "block" });
        bucket = [line];
      } else {
        bucket.push(line);
      }
    }

    if (bucket.length > 0) {
      pieces.push({ markdown: bucket.join("\n"), kind: "block" });
    }

    if (pieces.every((piece) => canFitMarkdown(piece.markdown, context))) {
      return pieces;
    }
  }

  if (!/[#>*`_[\]\-]/.test(unit.markdown)) {
    const chunks = splitByCharacters(unit.markdown);
    if (chunks.length > 1) {
      const pieces: PaginationUnit[] = [];
      let bucket = "";

      for (const chunk of chunks) {
        const candidate = bucket ? `${bucket}${chunk}` : chunk;
        if (bucket && !canFitMarkdown(candidate, context)) {
          pieces.push({ markdown: bucket, kind: "block" });
          bucket = chunk;
        } else {
          bucket = candidate;
        }
      }

      if (bucket) {
        pieces.push({ markdown: bucket, kind: "block" });
      }

      if (pieces.every((piece) => canFitMarkdown(piece.markdown, context))) {
        return pieces;
      }
    }
  }

  return [unit];
}

function paginateUnitsByMeasurement(
  units: PaginationUnit[],
  context: RenderContext
): string[] {
  if (units.length === 0) {
    return [""];
  }

  const pages: string[] = [];
  let pageUnits: PaginationUnit[] = [];

  for (const rawUnit of units) {
    const expandedUnits = splitOversizedUnit(rawUnit, context);

    for (const unit of expandedUnits) {
      const candidateUnits = [...pageUnits, unit];
      if (pageUnits.length === 0 || canFitMarkdown(joinUnits(candidateUnits), context)) {
        pageUnits = candidateUnits;
        continue;
      }

      pages.push(joinUnits(pageUnits));
      pageUnits = [unit];
    }
  }

  if (pageUnits.length > 0) {
    pages.push(joinUnits(pageUnits));
  }

  return pages.length > 0 ? pages : [""];
}

function paginateByCharacterFallback(segment: string): string[] {
  const lines = segment.split("\n");
  const pages: string[] = [];
  let bucket: string[] = [];
  let size = 0;

  for (const line of lines) {
    const nextSize = size + line.length + 1;
    if (nextSize > FALLBACK_TEXT_BUDGET && bucket.length > 0) {
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

export function calculatePages(
  markdown: string,
  options?: PaginationOptions | number
): string[] {
  if (!markdown.trim()) {
    return [""];
  }

  const paginationOptions: PaginationOptions =
    typeof options === "number" || !options
      ? { density: "comfortable", fontSize: "lg", theme: "classic" }
      : options;

  const segments = splitByPageBreak(markdown);
  const context = getRenderContext(paginationOptions);
  const pages: string[] = [];

  for (const segment of segments) {
    if (!segment.trim()) {
      pages.push("");
      continue;
    }

    if (!isBrowser) {
      pages.push(...paginateByCharacterFallback(segment));
      continue;
    }

    const units = segmentToUnits(segment);
    pages.push(...paginateUnitsByMeasurement(units, context));
  }

  const sourceText = extractComparableText(markdown);
  const paginatedText = extractComparableText(pages.join("\n\n"));

  if (sourceText !== paginatedText) {
    console.warn("[Pagination] 分页结果的文本内容与源 Markdown 不一致，请检查当前拆分页逻辑。");
  }

  if (isBrowser) {
    const overflowPageIndex = pages.findIndex((page) => !canFitMarkdown(page, context));
    if (overflowPageIndex >= 0) {
      console.warn(`[Pagination] 第 ${overflowPageIndex + 1} 页分页后仍然超高，当前内容可能需要更细粒度的拆分。`);
    }
  }

  return pages.length > 0 ? pages : [""];
}

export function cleanupMeasureContainer(): void {
  if (measureContainer?.parentNode) {
    measureContainer.parentNode.removeChild(measureContainer);
  }

  measureContainer = null;
  measureCache.clear();
}
