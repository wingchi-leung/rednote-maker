"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useMarkdownContentStore } from "@/store/useMarkdownContentStore";
import {
  useContentThemeStore,
  themeColors,
  fontSizes,
  densitySpacing,
} from "@/store/useContentThemeStore";
import { useImageStore } from "@/store/useImageStore";
import { getTemplate, getTemplateLayout, getCodeBackground } from "@/lib/templates";
import { SketchBackground } from "@/features/preview/SketchBackground";
import { calculatePages } from "@/lib/pagination";
import { CARD_CONFIG, EXPORT_CONFIG } from "@/lib/constants";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { ChevronRightIcon } from "@/components/icons/ChevronRightIcon";
import { ViewSingleIcon } from "@/components/icons/ViewSingleIcon";
import { ViewListIcon } from "@/components/icons/ViewListIcon";
import { CardHeaderAppleNotes } from "@/features/preview/CardHeaderAppleNotes";
import { QuoteIcon } from "@/components/icons/QuoteIcon";
import html2canvas from "html2canvas";

/** 将 ==高亮== 转为 <mark>，仅处理代码块外的内容 */
function preprocessHighlight(md: string): string {
  const parts = md.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, i) =>
      i % 2 === 0 ? part.replace(/==([^=]+?)==/g, "<mark>$1</mark>") : part
    )
    .join("");
}

/** 从 Markdown 内容中提取第一句话作为文件名 */
function extractFirstSentence(md: string): string {
  // 按行分割，找到第一个非空行
  const lines = md.split("\n");
  for (const line of lines) {
    // 去掉 markdown 标题符号
    let text = line.replace(/^#+\s*/, "").trim();
    // 跳过空行、分割线、引用块开头
    if (!text || text === "---" || text.startsWith(">")) continue;
    // 去掉 markdown 格式符号
    text = text
      .replace(/\*\*/g, "") // 加粗
      .replace(/\*/g, "")   // 斜体
      .replace(/`/g, "")    // 代码
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // 链接，保留文字
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "") // 图片，去掉
      .trim();
    if (!text) continue;
    // 截取第一句话（以句号、问号、感叹号结尾）
    const match = text.match(/^[^。！？\n]+[。！？]?/);
    if (match) {
      text = match[0];
    }
    // 去掉不适合做文件名的字符
    text = text.replace(/[\\/:*?"<>|]/g, "");
    // 限制长度
    if (text.length > 30) {
      text = text.slice(0, 30);
    }
    return text || "rednote";
  }
  return "rednote";
}

function getOrderedListCounterStyle(
  counterName: string,
  start: unknown
): React.CSSProperties | undefined {
  if (typeof start !== "number" || !Number.isFinite(start)) return undefined;
  const normalizedStart = Math.max(1, Math.floor(start));
  return { counterReset: `${counterName} ${normalizedStart - 1}` };
}

type PreviewViewMode = "pagination" | "list";

export function ImagePreview() {
  const { content } = useMarkdownContentStore();
  const { theme, fontSize, density, alignment } = useContentThemeStore();
  const { images } = useImageStore();
  const [currentPage, setCurrentPage] = useState(0);
  // 渲染时直接根据 content 计算页，避免 useEffect 滞后导致预览/导出页数不对
  const pages = useMemo(() => calculatePages(content, { density, fontSize, theme }), [content, density, fontSize, theme]);
  const exportRefs = useRef<(HTMLElement | null)[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<PreviewViewMode>("pagination");
  // 竖排模式下滚动时可见的页码（用于右上角页码显示）
  const [visiblePageInList, setVisiblePageInList] = useState(0);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const listCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 内容变短时把当前页钳在有效范围内
  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, Math.max(0, pages.length - 1)));
  }, [pages.length]);

  // 竖排模式：根据滚动位置计算当前可见页（用于右上角页码）
  const updateVisiblePageFromScroll = useCallback(() => {
    const container = listScrollRef.current;
    if (!container || viewMode !== "list" || pages.length === 0) return;
    const refs = listCardRefs.current;
    const viewportCenter = container.scrollTop + container.clientHeight / 2;
    let bestIndex = 0;
    let bestDistance = Infinity;
    const n = Math.min(refs.length, pages.length);
    for (let i = 0; i < n; i++) {
      const el = refs[i];
      if (!el) continue;
      const cardCenter = el.offsetTop + el.offsetHeight / 2;
      const distance = Math.abs(cardCenter - viewportCenter);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }
    setVisiblePageInList(Math.min(bestIndex, pages.length - 1));
  }, [viewMode, pages.length]);

  useEffect(() => {
    if (viewMode !== "list" || pages.length === 0) return;
    const container = listScrollRef.current;
    if (!container) return;
    const run = () => updateVisiblePageFromScroll();
    run();
    const t = requestAnimationFrame(run); // ref 挂载后再算一次
    container.addEventListener("scroll", updateVisiblePageFromScroll, { passive: true });
    return () => {
      cancelAnimationFrame(t);
      container.removeEventListener("scroll", updateVisiblePageFromScroll);
    };
  }, [viewMode, pages.length, updateVisiblePageFromScroll]);

  // Handle export event: pageIndices 为要导出的页码（0-based），多张时打包为 zip
  useEffect(() => {
    const handleExport = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const {
        pageIndices,
        totalPages,
        onProgress,
        onComplete,
      } = customEvent.detail as {
        pageIndices?: number[];
        totalPages: number;
        onProgress: (p: { current: number; total: number }) => void;
        onComplete?: () => void;
      };
      const indices =
        pageIndices ?? Array.from({ length: totalPages }, (_, i) => i);
      if (indices.length === 0) return;
      setIsExporting(true);

      // 提取第一句话作为文件名前缀
      const fileNamePrefix = extractFirstSentence(content);

      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const blobs: { blob: Blob; name: string }[] = [];
        for (let j = 0; j < indices.length; j++) {
          const pageIndex = indices[j];
          const element = exportRefs.current[pageIndex];
          if (!element) continue;
          const captured = await html2canvas(element, {
            scale: CARD_CONFIG.scale,
            backgroundColor: themeColors[theme].background,
            logging: false,
          });
          const targetW = CARD_CONFIG.width;
          const targetH = CARD_CONFIG.height;
          const canvas =
            captured.width === targetW && captured.height === targetH
              ? captured
              : (() => {
                  const out = document.createElement("canvas");
                  out.width = targetW;
                  out.height = targetH;
                  const ctx = out.getContext("2d");
                  if (ctx) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = "high";
                    ctx.drawImage(
                      captured,
                      0,
                      0,
                      captured.width,
                      captured.height,
                      0,
                      0,
                      targetW,
                      targetH
                    );
                  }
                  return out;
                })();
          const blob = await new Promise<Blob | null>((resolveBlob) => {
            canvas.toBlob(resolveBlob, "image/png");
          });
          if (blob) {
            blobs.push({
              blob,
              name: `${fileNamePrefix}-${pageIndex + 1}.png`,
            });
          }
          onProgress({ current: j + 1, total: indices.length });
        }
        if (blobs.length <= 3) {
          blobs.forEach(({ blob, name }) => saveAs(blob, name));
        } else {
          const zip = new JSZip();
          blobs.forEach(({ blob, name }) => zip.file(name, blob));
          const zipBlob = await zip.generateAsync({ type: "blob" });
          saveAs(zipBlob, `${fileNamePrefix}.zip`);
        }
      } finally {
        setIsExporting(false);
        onComplete?.();
      }
    };

    window.addEventListener("export-cards", handleExport);
    return () => {
      window.removeEventListener("export-cards", handleExport);
    };
  }, [theme, content]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(pages.length - 1, prev + 1));
  }, [pages.length]);

  const currentColors = themeColors[theme];
  const currentFontSize = fontSizes[fontSize];
  const currentDensity = densitySpacing[density];

  // Render a single card; in list mode all cards are visible, in pagination only current
  const renderPage = (
    pageContent: string,
    index: number,
    forceVisible = false
  ) => {
    const isVisible =
      forceVisible || index === currentPage || isExporting;
    const displayStyle = isVisible ? {} : { display: "none" };

    const layout = getTemplateLayout(theme);
    const template = getTemplate(theme);
    const hasCustomHeader = layout === "appleNotes";
    const hasSketchDecoration = template.decoration === "sketch";
    const codeBg = getCodeBackground(theme);
    const blockquoteColor = template.blockquoteColor ?? currentColors.accent;

    const cardContent = (
      <>
        {layout === "appleNotes" && (
          <CardHeaderAppleNotes accentColor={currentColors.accent} />
        )}
        <div
          style={{
            padding: hasCustomHeader ? currentDensity.padding : 0,
            flex: 1,
            overflow: "hidden",
            lineHeight: currentDensity.lineHeight,
            textAlign: alignment,
          }}
        >
          <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-4xl font-bold mb-2 mt-0">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-bold mb-2 mt-4">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-bold mb-1.5 mt-3">{children}</h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-lg font-bold mb-1 mt-2">{children}</h4>
            ),
            h5: ({ children }) => (
              <h5 className="text-base font-bold mb-1 mt-2">{children}</h5>
            ),
            h6: ({ children }) => (
              <h6 className="text-sm font-bold mb-0.5 mt-1.5">{children}</h6>
            ),
            p: ({ children }) => (
              <p className="mb-2" style={{ lineHeight: "inherit" }}>{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="mb-2 list-fixed-bullet">{children}</ul>
            ),
            ol: ({ children, start }) => (
              <ol
                className="mb-2 list-fixed-num"
                style={getOrderedListCounterStyle("list-num", start)}
              >
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="mb-0.5">{children}</li>,
            code: ({ children }) => (
              <code
                className="px-1 py-0.5 rounded text-sm"
                style={{ backgroundColor: codeBg }}
              >
                {children}
              </code>
            ),
            strong: ({ children }) => (
              <strong
                className="font-bold"
                style={{ color: currentColors.accent }}
              >
                {children}
              </strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
            mark: ({ children }) => (
              <mark
                className="rounded px-0.5 font-medium"
                style={{ backgroundColor: currentColors.accent, color: currentColors.background }}
              >
                {children}
              </mark>
            ),
            blockquote: ({ children }) => (
              <blockquote
                className="border-l-4 pl-3 py-1 my-2 italic opacity-90"
                style={{ borderColor: blockquoteColor }}
              >
                {children}
              </blockquote>
            ),
            img: ({ src, alt }) => {
              // Check if src is an image ID from pasted image
              if (typeof src === "string" && src.startsWith("img-")) {
                const pastedImage = images.find((img) => img.id === src);
                if (pastedImage) {
                  return (
                    <img
                      src={pastedImage.dataUrl}
                      alt={alt || pastedImage.name || "Pasted image"}
                      className="my-4 rounded-lg"
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                        objectFit: "contain",
                      }}
                    />
                  );
                }
              }
              // For external images, render as-is
              return (
                <img
                  src={typeof src === "string" ? src : undefined}
                  alt={alt || ""}
                  className="my-4 rounded-lg"
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    objectFit: "contain",
                  }}
                />
              );
            },
          }}
        >
          {preprocessHighlight(pageContent || "*空页面*")}
        </ReactMarkdown>
        </div>
      </>
    );

    const contentStyle: React.CSSProperties = {
      color: currentColors.text,
      fontSize: currentFontSize,
      padding: hasCustomHeader ? 0 : currentDensity.padding,
      lineHeight: currentDensity.lineHeight,
      textAlign: alignment,
      width: "100%",
      minHeight: "100%",
      maxHeight: "100%",
      boxSizing: "border-box",
      overflowWrap: "break-word",
      wordBreak: "break-word",
      overflowX: "hidden",
      overflowY: "hidden",
      display: "flex",
      flexDirection: "column",
      ...displayStyle,
    };

    if (hasSketchDecoration) {
      return (
        <div
          key={index}
          ref={(el) => {
            exportRefs.current[index] = el;
          }}
          className="card-content rounded-lg"
          style={{ position: "relative", ...contentStyle }}
        >
          <div
            className="absolute inset-0 rounded-lg"
            style={{ backgroundColor: currentColors.background, zIndex: 0 }}
            aria-hidden
          />
          <SketchBackground accentColor={currentColors.accent} />
          <div
            style={{
              ...contentStyle,
              position: "relative",
              zIndex: 1,
              backgroundColor: "transparent",
            }}
          >
            {cardContent}
          </div>
        </div>
      );
    }

    const cardFrame = template.cardFrame;
    if (cardFrame) {
      const marginPct = `${cardFrame.sideMarginPercent}%`;
      return (
        <div
          key={index}
          ref={(el) => {
            exportRefs.current[index] = el;
          }}
          className="card-content rounded-lg"
          style={{
            ...contentStyle,
            backgroundColor: currentColors.background,
          }}
        >
          {cardFrame.topLine && (
            <div
              style={{
                height: "1px",
                backgroundColor: currentColors.accent,
                width: "100%",
                flexShrink: 0,
              }}
              aria-hidden
            />
          )}
          <div
            style={{
              marginLeft: marginPct,
              marginRight: marginPct,
              marginTop: cardFrame.topLine ? "24px" : undefined,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {cardContent}
          </div>
        </div>
      );
    }

    const isDefaultDark =
      theme === "dark" && !hasSketchDecoration && !template.cardFrame;
    return (
      <div
        key={index}
        ref={(el) => {
          exportRefs.current[index] = el;
        }}
        className="card-content rounded-lg"
        style={{
          ...contentStyle,
          position: "relative",
          backgroundColor: currentColors.background,
          ...(isDefaultDark && {
            boxShadow: "inset 0 0 0 1px rgba(168,132,238,0.15)",
          }),
        }}
      >
        {isDefaultDark && (
          <span
            className="absolute top-3 right-3"
            style={{ color: blockquoteColor }}
            aria-hidden
          >
            <QuoteIcon />
          </span>
        )}
        {cardContent}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Card Header */}
      <div className="px-3 py-1.5 border-b border-apple-border flex items-center justify-between shrink-0">
        <h2 className="text-sm font-medium text-gray-700">图片预览</h2>
        <div className="flex items-center gap-1">
          <div className="flex items-center rounded-md border border-apple-border overflow-hidden">
            <button
              onClick={() => setViewMode("pagination")}
              className={`p-1.5 transition-colors ${
                viewMode === "pagination"
                  ? "bg-gray-200 text-gray-800"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
              aria-label="翻页模式"
              title="翻页模式"
            >
              <ViewSingleIcon />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 transition-colors ${
                viewMode === "list"
                  ? "bg-gray-200 text-gray-800"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
              aria-label="竖排列表"
              title="竖排列表"
            >
              <ViewListIcon />
            </button>
          </div>
          {viewMode === "pagination" && (
            <>
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 0}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-600"
                aria-label="上一页"
              >
                <ChevronLeftIcon />
              </button>
              <span className="text-xs text-gray-600 min-w-[2.5rem] text-center">
                {pages.length > 0 ? currentPage + 1 : 0} / {pages.length}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage >= pages.length - 1}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-600"
                aria-label="下一页"
              >
                <ChevronRightIcon />
              </button>
            </>
          )}
          {viewMode === "list" && (
            <span className="text-xs text-gray-600">
              共 {pages.length} 页
            </span>
          )}
        </div>
      </div>

      {/* 预览区：固定 450×600 与导出 900×1200 一致（scale 2） */}
      <div
        className={`flex-1 min-h-0 bg-[#F5F5F7] relative ${
          viewMode === "list"
            ? "flex flex-col overflow-hidden"
            : "flex items-center justify-center p-3 overflow-auto"
        }`}
      >
        {viewMode === "list" && !isExporting ? (
          <>
            <div
              ref={listScrollRef}
              className="flex-1 overflow-y-auto p-3"
            >
              <div
                className="flex flex-col items-center gap-4 mx-auto"
                style={{
                  width: `${CARD_CONFIG.width / CARD_CONFIG.scale}px`,
                }}
              >
                {pages.map((pageContent, index) => (
                  <div
                    key={index}
                    ref={(el) => {
                      listCardRefs.current[index] = el;
                    }}
                    className="rounded-xl shadow-md bg-white/80 backdrop-blur-sm border border-apple-border/60 overflow-hidden shrink-0"
                    style={{
                      width: `${CARD_CONFIG.width / CARD_CONFIG.scale}px`,
                      height: `${CARD_CONFIG.height / CARD_CONFIG.scale}px`,
                    }}
                  >
                    {renderPage(pageContent, index, true)}
                  </div>
                ))}
              </div>
            </div>
            {pages.length > 0 && (
              <div
                className="absolute top-2 right-2 z-10 px-2 py-1 rounded-md text-xs font-medium bg-black/50 text-white shadow-sm pointer-events-none"
                aria-live="polite"
              >
                {visiblePageInList + 1} / {pages.length}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-3 overflow-auto min-h-0 w-full">
            <div
              className="rounded-xl shadow-md bg-white/80 backdrop-blur-sm border border-apple-border/60 overflow-hidden shrink-0"
              style={{
                width: `${CARD_CONFIG.width / CARD_CONFIG.scale}px`,
                height: `${CARD_CONFIG.height / CARD_CONFIG.scale}px`,
                position: "relative",
              }}
            >
              {isExporting ? (
            <div className="absolute inset-0">
              {pages.map((page, index) => (
                <div
                  key={index}
                  ref={(el) => {
                    exportRefs.current[index] = el;
                  }}
                  className="absolute inset-0"
                  style={{ width: "100%", height: "100%" }}
                >
                  {renderPage(page, index, true)}
                </div>
              ))}
            </div>
          ) : (
                // Show only current page for preview
                <div className="w-full h-full">
                  {renderPage(pages[currentPage] || "", currentPage)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
