import { create } from "zustand";
import { type Theme } from "@/lib/templates";

export type { Theme } from "@/lib/templates";
export { themeColors } from "@/lib/templates";

export type FontSize = "sm" | "md" | "lg";
export type Density = "compact" | "comfortable" | "spacious";
export type Alignment = "left" | "center" | "justify";

interface ThemeConfig {
  theme: Theme;
  fontSize: FontSize;
  density: Density;
  alignment: Alignment;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
  setDensity: (density: Density) => void;
  setAlignment: (alignment: Alignment) => void;
}

export const fontSizes = {
  sm: "14px",
  md: "16px",
  lg: "18px",
};

export const densitySpacing = {
  compact: {
    padding: "24px",
    lineHeight: "1.5",
  },
  comfortable: {
    padding: "32px",
    lineHeight: "1.75",
  },
  spacious: {
    padding: "40px",
    lineHeight: "2",
  },
};

export const useContentThemeStore = create<ThemeConfig>((set) => ({
  theme: "classic",
  fontSize: "md",
  density: "comfortable",
  alignment: "left",
  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
  setDensity: (density) => set({ density }),
  setAlignment: (alignment) => set({ alignment }),
}));
