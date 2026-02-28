"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMarkdownContentStore } from "@/store/useMarkdownContentStore";
import {
  useContentThemeStore,
  themeColors,
  fontSizes,
  densitySpacing,
} from "@/store/useContentThemeStore";
import { calculatePages } from "@/lib/pagination";
import { CARD_CONFIG } from "@/lib/constants";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { ChevronRightIcon } from "@/components/icons/ChevronRightIcon";
import html2canvas from "html2canvas";

export function ImagePreview() {
  const { content } = useMarkdownContentStore();
  const { theme, fontSize, density, alignment } = useContentThemeStore();
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState<string[]>([]);
  const exportRefs = useRef<(HTMLElement | null)[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Recalculate pages when content changes
  useEffect(() => {
    const newPages = calculatePages(content, 1000);
    setPages(newPages);
    setCurrentPage(0);
  }, [content]);

  // Handle export event
  useEffect(() => {
    const handleExport = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { pages: pagesToExport, onProgress, onComplete } = customEvent.detail;
      setIsExporting(true);

      try {
        // Wait for DOM to update with all pages rendered
        await new Promise((resolve) => setTimeout(resolve, 100));

        for (let i = 0; i < pagesToExport.length; i++) {
          const element = exportRefs.current[i];
          if (!element) continue;

          const canvas = await html2canvas(element, {
            scale: CARD_CONFIG.scale,
            backgroundColor: themeColors[theme].background,
            logging: false,
          });

          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.download = `rednote-card-${i + 1}.png`;
              link.href = url;
              link.click();
              URL.revokeObjectURL(url);
            }
          });

          onProgress({ current: i + 1, total: pagesToExport.length });
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
  }, [theme]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(pages.length - 1, prev + 1));
  }, [pages.length]);

  const currentColors = themeColors[theme];
  const currentFontSize = fontSizes[fontSize];
  const currentDensity = densitySpacing[density];

  // Render all pages for export, but only show current page
  const renderPage = (pageContent: string, index: number) => {
    const isVisible = index === currentPage || isExporting;
    const displayStyle = isVisible ? {} : { display: "none" };

    return (
      <div
        key={index}
        ref={(el) => {
          exportRefs.current[index] = el;
        }}
        className="card-content"
        style={{
          backgroundColor: currentColors.background,
          color: currentColors.text,
          fontSize: currentFontSize,
          padding: currentDensity.padding,
          lineHeight: currentDensity.lineHeight,
          textAlign: alignment,
          width: "100%",
          minHeight: "100%",
          boxSizing: "border-box",
          ...displayStyle,
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold mb-4 mt-0">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-bold mb-3 mt-6">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-bold mb-2 mt-4">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-4 leading-relaxed">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="mb-4 pl-6 list-disc">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-4 pl-6 list-decimal">{children}</ol>
            ),
            li: ({ children }) => <li className="mb-1">{children}</li>,
            code: ({ children }) => (
              <code
                className="px-1 py-0.5 rounded text-sm"
                style={{
                  backgroundColor:
                    theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                }}
              >
                {children}
              </code>
            ),
            strong: ({ children }) => (
              <strong className="font-bold">{children}</strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
          }}
        >
          {pageContent || "*空页面*"}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-apple-border bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">预览</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 0}
              className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon />
            </button>
            <span className="text-sm text-gray-600">
              {pages.length > 0 ? currentPage + 1 : 0} / {pages.length}
            </span>
            <button
              onClick={goToNextPage}
              disabled={currentPage >= pages.length - 1}
              className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto bg-gray-100">
        <div
          className="shadow-lg"
          style={{
            width: "100%",
            maxWidth: "400px",
            aspectRatio: `${CARD_CONFIG.width} / ${CARD_CONFIG.height}`,
            position: "relative",
          }}
        >
          {isExporting ? (
            // Render all pages for export
            <div className="absolute inset-0">
              {pages.map((page, index) => (
                <div
                  key={index}
                  ref={(el) => {
                    exportRefs.current[index] = el;
                  }}
                  className="card-content"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: currentColors.background,
                    color: currentColors.text,
                    fontSize: currentFontSize,
                    padding: currentDensity.padding,
                    lineHeight: currentDensity.lineHeight,
                    textAlign: alignment,
                    boxSizing: "border-box",
                    overflow: "hidden",
                  }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-3xl font-bold mb-4 mt-0">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-2xl font-bold mb-3 mt-6">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xl font-bold mb-2 mt-4">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-4 leading-relaxed">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-4 pl-6 list-disc">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-4 pl-6 list-decimal">{children}</ol>
                      ),
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      code: ({ children }) => (
                        <code
                          className="px-1 py-0.5 rounded text-sm"
                          style={{
                            backgroundColor:
                              theme === "dark"
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(0,0,0,0.05)",
                          }}
                        >
                          {children}
                        </code>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold">{children}</strong>
                      ),
                      em: ({ children }) => <em className="italic">{children}</em>,
                    }}
                  >
                    {page || "*空页面*"}
                  </ReactMarkdown>
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
    </div>
  );
}
