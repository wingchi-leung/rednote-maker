"use client";

import {
  themeColors,
  fontSizes,
  densitySpacing,
  useContentThemeStore,
  type Theme,
  type FontSize,
  type Density,
  type Alignment,
} from "@/store/useContentThemeStore";
import { themeLabels, THEME_IDS } from "@/lib/templates";

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
  left: "左对齐",
  center: "居中",
  justify: "两端对齐",
};

export function ThemeConfigurator() {
  const { theme, fontSize, density, alignment, setTheme, setFontSize, setDensity, setAlignment } =
    useContentThemeStore();

  return (
    <div className="space-y-6 p-4">
      {/* Theme Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">主题</label>
        <div className="grid grid-cols-2 gap-2">
          {THEME_IDS.map((key) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  theme === key
                    ? "ring-2 ring-apple-blue bg-white shadow-sm"
                    : "bg-white hover:bg-gray-50"
                }
              `}
              style={{
                backgroundColor: theme === key ? themeColors[key].background : undefined,
                color: theme === key ? themeColors[key].text : undefined,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: themeColors[key].background }}
                />
                {themeLabels[key]}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">字体大小</label>
        <div className="flex gap-2">
          {(Object.keys(fontSizeLabels) as FontSize[]).map((key) => (
            <button
              key={key}
              onClick={() => setFontSize(key)}
              className={`
                flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  fontSize === key
                    ? "bg-apple-blue text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              {fontSizeLabels[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Density */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">间距密度</label>
        <div className="flex gap-2">
          {(Object.keys(densityLabels) as Density[]).map((key) => (
            <button
              key={key}
              onClick={() => setDensity(key)}
              className={`
                flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  density === key
                    ? "bg-apple-blue text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              {densityLabels[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Alignment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">对齐方式</label>
        <div className="flex gap-2">
          {(Object.keys(alignmentLabels) as Alignment[]).map((key) => (
            <button
              key={key}
              onClick={() => setAlignment(key)}
              className={`
                flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  alignment === key
                    ? "bg-apple-blue text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              {alignmentLabels[key]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
