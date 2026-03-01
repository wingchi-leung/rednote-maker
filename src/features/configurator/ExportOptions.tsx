"use client";

import { useState, useMemo } from "react";
import { DownloadIcon } from "@/components/icons/DownloadIcon";
import { useMarkdownContentStore } from "@/store/useMarkdownContentStore";
import { useContentThemeStore } from "@/store/useContentThemeStore";
import { calculatePages } from "@/lib/pagination";
import { CARD_CONFIG } from "@/lib/constants";

export function ExportOptions() {
  const { content } = useMarkdownContentStore();
  const { density, fontSize, theme } = useContentThemeStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

  const pages = useMemo(() => calculatePages(content, { density, fontSize, theme }), [content, density, fontSize, theme]);

  const handleExport = () => {
    if (pages.length === 0) return;
    setIsExporting(true);
    setExportProgress({ current: 0, total: pages.length });
    const event = new CustomEvent("export-cards", {
      detail: {
        totalPages: pages.length,
        onProgress: setExportProgress,
        onComplete: () => setIsExporting(false),
      },
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">导出设置</h3>
        <p className="text-xs text-gray-500">
          分为 {pages.length} 张卡片，每张卡片尺寸为 {CARD_CONFIG.width} ×{" "}
          {CARD_CONFIG.height} 像素
        </p>
      </div>

      {/* Export Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          导出格式
        </label>
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-apple-blue text-white">
            PNG
          </button>
          <button
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 opacity-50 cursor-not-allowed"
            disabled
          >
            ZIP
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {isExporting && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>导出中...</span>
            <span>
              {exportProgress.current} / {exportProgress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-apple-blue h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(exportProgress.current / exportProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting || pages.length === 0}
        className={`
          w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all
          ${
            isExporting || pages.length === 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-apple-blue text-white hover:bg-blue-600"
          }
        `}
      >
        <DownloadIcon />
        {isExporting ? "导出中..." : "导出卡片"}
      </button>
    </div>
  );
}
