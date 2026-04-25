"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useContentThemeStore = exports.densitySpacing = exports.fontSizes = exports.themeColors = exports.STRONG_TEXT_COLOR_PALETTE = void 0;
exports.getStrongTextColor = getStrongTextColor;
const zustand_1 = require("zustand");
const templates_1 = require("@/lib/templates");
var templates_2 = require("@/lib/templates");
Object.defineProperty(exports, "STRONG_TEXT_COLOR_PALETTE", { enumerable: true, get: function () { return templates_2.STRONG_TEXT_COLOR_PALETTE; } });
Object.defineProperty(exports, "themeColors", { enumerable: true, get: function () { return templates_2.themeColors; } });
exports.fontSizes = {
    sm: "14px",
    md: "16px",
    lg: "18px",
};
exports.densitySpacing = {
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
function getStrongTextColor(theme, overrides) {
    return overrides[theme] ?? (0, templates_1.getDefaultStrongTextColor)(theme);
}
exports.useContentThemeStore = (0, zustand_1.create)((set) => ({
    theme: "classic",
    fontSize: "md",
    density: "comfortable",
    alignment: "left",
    strongTextColorOverrides: {},
    setTheme: (theme) => set({ theme }),
    setFontSize: (fontSize) => set({ fontSize }),
    setDensity: (density) => set({ density }),
    setAlignment: (alignment) => set({ alignment }),
    setStrongTextColor: (theme, color) => set((state) => ({
        strongTextColorOverrides: {
            ...state.strongTextColorOverrides,
            [theme]: color,
        },
    })),
    resetStrongTextColor: (theme) => set((state) => {
        const nextOverrides = { ...state.strongTextColorOverrides };
        delete nextOverrides[theme];
        return { strongTextColorOverrides: nextOverrides };
    }),
}));
