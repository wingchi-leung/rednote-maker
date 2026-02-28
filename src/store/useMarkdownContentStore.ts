import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MarkdownContentState {
  content: string;
  setContent: (content: string) => void;
}

export const useMarkdownContentStore = create<MarkdownContentState>()(
  persist(
    (set) => ({
      content: "# 欢迎使用 RedNoteMaker\n\n这是一个极简主义的 Markdown 转小红书卡片工具。\n\n## 功能特点\n\n- 实时预览\n- 智能分页\n- 多主题支持\n- 一键导出\n\n开始编辑你的内容吧！",
      setContent: (content) => set({ content }),
    }),
    {
      name: "markdown-content",
    }
  )
);
