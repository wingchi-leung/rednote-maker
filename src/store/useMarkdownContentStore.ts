import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DEFAULT_CONTENT =
  "# 欢迎使用 RedNoteMaker\n\n" +
  "这是一个适合长文Markdown 转小红书卡片工具，Content First, Design Second。\n\n" +
  "> 在左侧编辑 Markdown，右侧会实时渲染成卡片。支持 **引用**、**加粗**、分割线与智能分页。\n\n" +
  "## 功能特点\n\n" +
  "- **实时预览**：所见即所得\n" +
  "- **多主题支持**：在配置器里切换风格\n" +
  "- **一键导出**：多张卡片打包为 PNG\n" +
  "## 写法示例\n\n" +
  "引用块用 `>` 开头：\n\n" +
  "**强制分页用三个横杆：`---`**\n\n" +
  "---\n\n" +
  "> 金句或重点可以放在引用里，视觉上更突出。\n\n" +
  "加粗用 **两个星号** 包裹，分割线单独一行写 **---** 即可。\n\n" +
  "开始编辑你的内容，导出为小红书长图吧！";

interface MarkdownContentState {
  content: string;
  setContent: (content: string) => void;
  resetContent: () => void;
}

export const useMarkdownContentStore = create<MarkdownContentState>()(
  persist(
    (set) => ({
      content: DEFAULT_CONTENT,
      setContent: (content) => set({ content }),
      resetContent: () => set({ content: DEFAULT_CONTENT }),
    }),
    {
      name: "markdown-content",
    }
  )
);
