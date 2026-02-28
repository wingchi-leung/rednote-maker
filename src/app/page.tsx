"use client";

import { SettingsPanel } from "@/features/configurator/SettingsPanel";
import { SettingsIcon } from "@/components/icons/SettingsIcon";
import { useSettingsPanelStore } from "@/store/useSettingsPanelStore";
import { MarkdownEditor } from "@/features/editor/MarkdownEditor";
import { ImagePreview } from "@/features/preview/ImagePreview";

export default function Home() {
  const { isOpen, togglePanel } = useSettingsPanelStore();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-apple-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-apple-blue rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">RN</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-800">RedNoteMaker</h1>
        </div>
        <button
          onClick={togglePanel}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
            ${
              isOpen
                ? "bg-apple-blue text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }
          `}
        >
          <SettingsIcon />
          {isOpen ? "关闭设置" : "设置"}
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Section */}
        <div className="w-1/2 min-w-0 border-r border-apple-border">
          <MarkdownEditor />
        </div>

        {/* Preview Section */}
        <div className="w-1/2 min-w-0">
          <ImagePreview />
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel />
    </div>
  );
}
