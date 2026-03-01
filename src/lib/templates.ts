/**
 * 模板单一数据源：新增/调整模板只需改这里。
 * - id: 唯一标识，也是 store 中的 theme 值
 * - label: 主题选择器显示名称
 * - colors: 背景、正文、强调色
 * - layout: 卡片布局类型，决定是否渲染顶栏等
 * - codeBackground: 可选，代码块背景色（不填则用默认浅色）
 */

export type TemplateLayout = "default" | "appleNotes";

export interface TemplateColors {
  background: string;
  text: string;
  accent: string;
}

export interface TemplateConfig {
  id: string;
  label: string;
  colors: TemplateColors;
  layout: TemplateLayout;
  codeBackground?: string;
}

export const TEMPLATES: readonly TemplateConfig[] = [
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
      background: "#1C1C1E",
      text: "#F5F5F7",
      accent: "#0A84FF",
    },
    layout: "default",
    codeBackground: "rgba(255,255,255,0.1)",
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
      background: "#E8E4E0",
      text: "#4A4642",
      accent: "#9B8B7E",
    },
    layout: "default",
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
] as const;

/** 由模板列表推导：新增模板后类型自动包含 */
export type Theme = (typeof TEMPLATES)[number]["id"];

/** 供 store 与预览使用 */
export const themeColors: Record<Theme, TemplateColors> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t.colors])
) as Record<Theme, TemplateColors>;

/** 供主题选择 UI 使用，单一数据源无需多处维护 */
export const themeLabels: Record<Theme, string> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t.label])
) as Record<Theme, string>;

export const THEME_IDS = TEMPLATES.map((t) => t.id) as Theme[];

export function getTemplate(theme: Theme): TemplateConfig {
  const t = TEMPLATES.find((x) => x.id === theme);
  if (!t) throw new Error(`Unknown theme: ${theme}`);
  return t;
}

export function getTemplateLayout(theme: Theme): TemplateLayout {
  return getTemplate(theme).layout;
}

export function getCodeBackground(theme: Theme): string {
  const t = getTemplate(theme);
  return t.codeBackground ?? "rgba(0,0,0,0.05)";
}
