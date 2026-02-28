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
    </div>
  );
}
