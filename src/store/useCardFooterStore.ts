import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DEFAULT_CARD_FOOTER_TEXT =
  "基于 RedNoteMaker 生成 · rednotemaker";

interface CardFooterState {
  isEnabled: boolean;
  text: string;
  setEnabled: (isEnabled: boolean) => void;
  setText: (text: string) => void;
  resetFooter: () => void;
}

export const useCardFooterStore = create<CardFooterState>()(
  persist(
    (set) => ({
      isEnabled: false,
      text: DEFAULT_CARD_FOOTER_TEXT,
      setEnabled: (isEnabled) => set({ isEnabled }),
      setText: (text) => set({ text }),
      resetFooter: () =>
        set({
          isEnabled: false,
          text: DEFAULT_CARD_FOOTER_TEXT,
        }),
    }),
    {
      name: "card-footer",
    }
  )
);
