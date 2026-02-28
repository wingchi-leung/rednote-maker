"use client";

import { MarkdownEditor } from "@/features/editor/MarkdownEditor";
import { ImagePreview } from "@/features/preview/ImagePreview";
import { SettingsToolbar } from "@/components/toolbar/SettingsToolbar";

export default function Home() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-apple-border px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-apple-blue rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">RN</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-800">RedNoteMaker</h1>
      </header>

      {/* Settings Toolbar */}
      <SettingsToolbar />

      {/* Main Content - 卡片式布局 */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden bg-apple-gray6">
        <div className="w-1/2 min-w-0 flex flex-col bg-white rounded-xl shadow-md overflow-hidden">
          <MarkdownEditor />
        </div>
        <div className="w-1/2 min-w-0 flex flex-col bg-white rounded-xl shadow-md overflow-hidden">
          <ImagePreview />
        </div>
      </div>
    </div>
  );
}
