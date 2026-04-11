"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MarkdownEditor } from "@/features/editor/MarkdownEditor";
import { ImagePreview } from "@/features/preview/ImagePreview";
import { SettingsToolbar } from "@/components/toolbar/SettingsToolbar";
import { BrandMark } from "@/components/brand/BrandMark";
import { CoffeeGiftHover } from "@/components/coffee/CoffeeGiftHover";
import { useContentThemeStore } from "@/store/useContentThemeStore";
import { type Theme } from "@/lib/templates";

interface EditorWorkspaceProps {
  title: string;
  themeIds: Theme[];
  showLennyTools?: boolean;
  showLennyPreset?: boolean;
  defaultTheme?: Theme;
  backHref?: string;
  backLabel?: string;
}

export function EditorWorkspace({
  title,
  themeIds,
  showLennyTools = false,
  showLennyPreset = false,
  defaultTheme,
  backHref,
  backLabel,
}: EditorWorkspaceProps) {
  const theme = useContentThemeStore((state) => state.theme);
  const setTheme = useContentThemeStore((state) => state.setTheme);

  useEffect(() => {
    if (!defaultTheme) {
      return;
    }

    if (!themeIds.includes(theme)) {
      setTheme(defaultTheme);
    }
  }, [defaultTheme, setTheme, theme, themeIds]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="bg-white border-b border-apple-border px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
            {backHref && backLabel && (
              <Link
                href={backHref}
                className="text-sm text-apple-blue hover:underline"
              >
                {backLabel}
              </Link>
            )}
          </div>
        </div>
        <CoffeeGiftHover />
      </header>

      <SettingsToolbar themeIds={themeIds} showLennyTools={showLennyTools} />

      <div className="flex-1 flex gap-6 p-6 overflow-hidden bg-apple-gray6">
        <div className="w-1/2 min-w-0 flex flex-col bg-white rounded-xl shadow-md overflow-hidden">
          <MarkdownEditor showLennyPreset={showLennyPreset} />
        </div>
        <div className="w-1/2 min-w-0 flex flex-col bg-white rounded-xl shadow-md overflow-hidden">
          <ImagePreview />
        </div>
      </div>
    </div>
  );
}
