"use client";

import { useSettingsPanelStore } from "@/store/useSettingsPanelStore";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { PaletteIcon } from "@/components/icons/PaletteIcon";
import { DownloadIcon } from "@/components/icons/DownloadIcon";
import { ThemeConfigurator } from "./ThemeConfigurator";
import { ExportOptions } from "./ExportOptions";

export function SettingsPanel() {
  const { isOpen, activeTab, setActiveTab, closePanel } = useSettingsPanelStore();

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-apple-border shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-apple-border">
        <h2 className="text-sm font-medium text-gray-700">设置</h2>
        <button
          onClick={closePanel}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-apple-border">
        <button
          onClick={() => setActiveTab("style")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "style"
              ? "text-apple-blue border-b-2 border-apple-blue"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <PaletteIcon />
          样式
        </button>
        <button
          onClick={() => setActiveTab("export")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "export"
              ? "text-apple-blue border-b-2 border-apple-blue"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <DownloadIcon />
          导出
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "style" && <ThemeConfigurator />}
        {activeTab === "export" && <ExportOptions />}
      </div>
    </div>
  );
}
