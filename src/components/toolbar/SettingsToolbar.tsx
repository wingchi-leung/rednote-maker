"use client";

import { useState, useRef, useEffect } from "react";
import {
  themeColors,
  useContentThemeStore,
  type Theme,
  type FontSize,
  type Density,
  type Alignment,
} from "@/store/useContentThemeStore";
import { useMarkdownContentStore } from "@/store/useMarkdownContentStore";
import { calculatePages } from "@/lib/pagination";
import { DownloadIcon } from "@/components/icons/DownloadIcon";

const themeLabels: Record<Theme, string> = {
  classic: "经典白",
  dark: "深空灰",
  parchment: "羊皮纸",
  morandi: "莫兰迪",
  appleNotes: "苹果备忘录",
};

const fontSizeLabels: Record<FontSize, string> = {
  sm: "小",
  md: "中",
  lg: "大",
};

const densityLabels: Record<Density, string> = {
  compact: "紧凑",
  comfortable: "舒适",
  spacious: "宽松",
};

const alignmentLabels: Record<Alignment, string> = {
  left: "左",
  center: "中",
  justify: "双",
};

export function SettingsToolbar() {
  const { theme, fontSize, density, alignment, setTheme, setFontSize, setDensity, setAlignment } =
    useContentThemeStore();
  const { content } = useMarkdownContentStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  const pages = calculatePages(content, 1000);
  const totalPages = pages.length;

  // 同步：当页数变化时，默认全选
  useEffect(() => {
    setSelectedIndices(Array.from({ length: totalPages }, (_, i) => i));
  }, [totalPages]);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(e.target as Node)
      ) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleIndex = (i: number) => {
    setSelectedIndices((prev) =>
      prev.includes(i)
        ? prev.filter((x) => x !== i)
        : [...prev, i].sort((a, b) => a - b)
    );
  };
  const selectAll = () => {
    setSelectedIndices(Array.from({ length: totalPages }, (_, i) => i));
  };
  const selectNone = () => {
    setSelectedIndices([]);
  };
  const allSelected = selectedIndices.length === totalPages && totalPages > 0;
  const noneSelected = selectedIndices.length === 0;

  const handleExport = () => {
    if (selectedIndices.length === 0) return;
    setExportDropdownOpen(false);
    setIsExporting(true);
    setExportProgress({ current: 0, total: selectedIndices.length });
    const event = new CustomEvent("export-cards", {
      detail: {
        pageIndices: selectedIndices,
        totalPages,
        onProgress: setExportProgress,
        onComplete: () => setIsExporting(false),
      },
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="bg-white border-b border-apple-border px-4 py-2 flex items-center gap-6 flex-wrap">
      {/* Theme Selection */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">主题</span>
        <div className="flex gap-1">
          {(Object.keys(themeLabels) as Theme[]).map((key) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className={`
                px-2 py-1 rounded text-xs font-medium transition-all
                ${
                  theme === key
                    ? "ring-2 ring-apple-blue"
                    : "hover:bg-gray-100"
                }
              `}
              style={{
                backgroundColor:
                  theme === key ? themeColors[key].background : undefined,
                color: theme === key ? themeColors[key].text : "#374151",
                border: `1px solid ${themeColors[key].accent}`,
              }}
            >
              {themeLabels[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-6 bg-apple-border" />

      {/* Font Size */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">字号</span>
        <div className="flex gap-1">
          {(Object.keys(fontSizeLabels) as FontSize[]).map((key) => (
            <button
              key={key}
              onClick={() => setFontSize(key)}
              className={`
                w-7 h-7 rounded text-xs font-medium transition-all flex items-center justify-center
                ${
                  fontSize === key
                    ? "bg-apple-blue text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              {fontSizeLabels[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-6 bg-apple-border" />

      {/* Density */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">间距</span>
        <div className="flex gap-1">
          {(Object.keys(densityLabels) as Density[]).map((key) => (
            <button
              key={key}
              onClick={() => setDensity(key)}
              className={`
                px-2 py-1 rounded text-xs font-medium transition-all
                ${
                  density === key
                    ? "bg-apple-blue text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              {densityLabels[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-6 bg-apple-border" />

      {/* Alignment */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">对齐</span>
        <div className="flex gap-1">
          {(Object.keys(alignmentLabels) as Alignment[]).map((key) => (
            <button
              key={key}
              onClick={() => setAlignment(key)}
              className={`
                w-7 h-7 rounded text-xs font-medium transition-all flex items-center justify-center
                ${
                  alignment === key
                    ? "bg-apple-blue text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              {alignmentLabels[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* Export Progress */}
      {isExporting && (
        <div className="flex items-center gap-3 mr-4">
          <div className="text-xs text-gray-500">
            {exportProgress.current} / {exportProgress.total}
          </div>
          <div className="w-24 bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-apple-blue h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${(exportProgress.current / exportProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Export Dropdown */}
      <div className="relative" ref={exportDropdownRef}>
        <button
          type="button"
          onClick={() => pages.length > 0 && setExportDropdownOpen((o) => !o)}
          disabled={isExporting || pages.length === 0}
          className={`
            px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2
            ${
              isExporting || pages.length === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-apple-blue text-white hover:bg-blue-600"
            }
          `}
        >
          <DownloadIcon />
          {isExporting ? "导出中..." : "导出"}
        </button>
        {exportDropdownOpen && pages.length > 0 && (
          <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-apple-border bg-white shadow-lg py-2">
            <div className="px-3 pb-2 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-500">选择要导出的页</span>
            </div>
            <div className="max-h-44 overflow-y-auto py-1">
              {pages.map((_, i) => (
                <label
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedIndices.includes(i)}
                    onChange={() => toggleIndex(i)}
                    className="rounded border-gray-300 text-apple-blue focus:ring-apple-blue"
                  />
                  第 {i + 1} 张
                </label>
              ))}
            </div>
            <div className="flex gap-1 px-2 pt-1 border-t border-gray-100">
              <button
                type="button"
                onClick={allSelected ? selectNone : selectAll}
                className="text-xs text-apple-blue hover:underline px-2 py-1"
              >
                {allSelected ? "取消全选" : "全选"}
              </button>
            </div>
            <div className="px-2 pt-1">
              <button
                type="button"
                onClick={handleExport}
                disabled={selectedIndices.length === 0}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-apple-blue text-white hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                导出 {selectedIndices.length > 0 ? `(${selectedIndices.length} 张)` : ""}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
