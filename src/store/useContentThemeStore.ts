import { create } from "zustand";
import { getDefaultStrongTextColor, type Theme } from "@/lib/templates";

export type { Theme } from "@/lib/templates";
export { STRONG_TEXT_COLOR_PALETTE, themeColors } from "@/lib/templates";

export type FontSize = "sm" | "md" | "lg";
export type Density = "compact" | "comfortable" | "spacious";
export type Alignment = "left" | "center" | "justify";

interface ThemeConfig {
  theme: Theme;
  fontSize: FontSize;
  density: Density;
  alignment: Alignment;
  strongTextColorOverrides: Partial<Record<Theme, string>>;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
  setDensity: (density: Density) => void;
  setAlignment: (alignment: Alignment) => void;
  setStrongTextColor: (theme: Theme, color: string) => void;
  resetStrongTextColor: (theme: Theme) => void;
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

export function getStrongTextColor(
  theme: Theme,
  overrides: Partial<Record<Theme, string>>
): string {
  return overrides[theme] ?? getDefaultStrongTextColor(theme);
}

export const useContentThemeStore = create<ThemeConfig>((set) => ({
  theme: "classic",
  fontSize: "lg",
  density: "comfortable",
  alignment: "left",
  strongTextColorOverrides: {},
  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
  setDensity: (density) => set({ density }),
  setAlignment: (alignment) => set({ alignment }),
  setStrongTextColor: (theme, color) =>
    set((state) => ({
      strongTextColorOverrides: {
        ...state.strongTextColorOverrides,
        [theme]: color,
      },
    })),
  resetStrongTextColor: (theme) =>
    set((state) => {
      const nextOverrides = { ...state.strongTextColorOverrides };
      delete nextOverrides[theme];
      return { strongTextColorOverrides: nextOverrides };
    }),
}));
