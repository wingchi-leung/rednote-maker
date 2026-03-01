import { create } from "zustand";

export type Theme = "classic" | "dark" | "parchment" | "morandi" | "appleNotes";
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

export const themeColors = {
  classic: {
    background: "#FFFFFF",
    text: "#1D1D1F",
    accent: "#0071E3",
  },
  dark: {
    background: "#1C1C1E",
    text: "#F5F5F7",
    accent: "#0A84FF",
  },
  parchment: {
    background: "#F5F1E8",
    text: "#3D3A34",
    accent: "#8B5A2B",
  },
  morandi: {
    background: "#E8E4E0",
    text: "#4A4642",
    accent: "#9B8B7E",
  },
  appleNotes: {
    background: "#FFFFFF",
    text: "#1D1D1F",
    accent: "#E5B107",
  },
};

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
