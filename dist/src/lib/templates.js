"use strict";
/**
 * 模板单一数据源：新增/调整模板只需改这里。
 * - id: 唯一标识，也是 store 中的 theme 值
 * - label: 主题选择器显示名称
 * - colors: 背景、正文、强调色
 * - layout: 卡片布局类型，决定是否渲染顶栏等
 * - codeBackground: 可选，代码块背景色（不填则用默认浅色）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRONG_TEXT_COLOR_PALETTE = exports.LENNY_THEME_IDS = exports.PUBLIC_THEME_IDS = exports.THEME_IDS = exports.themeLabels = exports.themeColors = exports.TEMPLATES = void 0;
exports.getTemplate = getTemplate;
exports.getTemplateLayout = getTemplateLayout;
exports.getCodeBackground = getCodeBackground;
exports.getDefaultStrongTextColor = getDefaultStrongTextColor;
exports.TEMPLATES = [
    {
        id: "classic",
        label: "经典白",
        colors: {
            background: "#FFFFFF",
            text: "#1D1D1F",
            accent: "#0071E3",
        },
        layout: "default",
    },
    {
        id: "dark",
        label: "深空灰",
        colors: {
            background: "#26262A",
            text: "#E2E2E8",
            accent: "#5E9EFF",
        },
        layout: "default",
        codeBackground: "rgba(255,255,255,0.08)",
    },
    {
        id: "parchment",
        label: "羊皮纸",
        colors: {
            background: "#F5F1E8",
            text: "#3D3A34",
            accent: "#8B5A2B",
        },
        layout: "default",
    },
    {
        id: "morandi",
        label: "莫兰迪",
        colors: {
            background: "#FFFEF9",
            text: "#3D3935",
            accent: "#A8988A",
        },
        layout: "default",
        cardFrame: { topLine: true, sideMarginPercent: 10 },
    },
    {
        id: "lennyCover",
        label: "人物模板",
        colors: {
            background: "#FFFFFF",
            text: "#1A1A1A",
            accent: "#E85D3F",
        },
        layout: "lennyCover",
        blockquoteColor: "#F59E0B",
        codeBackground: "rgba(232,93,63,0.08)",
    },
    {
        id: "appleNotes",
        label: "苹果备忘录",
        colors: {
            background: "#FFFFFF",
            text: "#1D1D1F",
            accent: "#E5B107",
        },
        layout: "appleNotes",
    },
    {
        id: "sketchGreen",
        label: "轻线条·紫",
        colors: {
            background: "#FFFFFF",
            text: "#1D1D1F",
            accent: "#C1A7F3",
        },
        layout: "default",
        decoration: "sketch",
    },
    {
        id: "sketchCyan",
        label: "轻线条·青",
        colors: {
            background: "#FFFFFF",
            text: "#1D1D1F",
            accent: "#6BB5BA",
        },
        layout: "default",
        decoration: "sketch",
    },
    {
        id: "sketchPink",
        label: "轻线条·粉",
        colors: {
            background: "#FFFFFF",
            text: "#1D1D1F",
            accent: "#D99AAF",
        },
        layout: "default",
        decoration: "sketch",
    },
];
/** 供 store 与预览使用 */
exports.themeColors = Object.fromEntries(exports.TEMPLATES.map((t) => [t.id, t.colors]));
/** 供主题选择 UI 使用，单一数据源无需多处维护 */
exports.themeLabels = Object.fromEntries(exports.TEMPLATES.map((t) => [t.id, t.label]));
exports.THEME_IDS = exports.TEMPLATES.map((t) => t.id);
exports.PUBLIC_THEME_IDS = exports.THEME_IDS.filter((id) => id !== "lennyCover");
exports.LENNY_THEME_IDS = exports.THEME_IDS;
exports.STRONG_TEXT_COLOR_PALETTE = [
    "#0071E3",
    "#E85D3F",
    "#E5B107",
    "#8B5A2B",
    "#6BB5BA",
    "#C1A7F3",
    "#D99AAF",
    "#2F855A",
    "#1D4ED8",
    "#B83280",
];
function getTemplate(theme) {
    const t = exports.TEMPLATES.find((x) => x.id === theme);
    if (!t)
        throw new Error(`Unknown theme: ${theme}`);
    return t;
}
function getTemplateLayout(theme) {
    return getTemplate(theme).layout;
}
function getCodeBackground(theme) {
    const t = getTemplate(theme);
    return t.codeBackground ?? "rgba(0,0,0,0.05)";
}
function getDefaultStrongTextColor(theme) {
    const t = getTemplate(theme);
    return t.strongTextColor ?? t.colors.accent;
}
