import { create } from "zustand";

interface PaginationResultState {
  pages: string[];
  setPages: (pages: string[]) => void;
  resetPages: () => void;
}

export const usePaginationResultStore = create<PaginationResultState>((set) => ({
  pages: [],
  setPages: (pages) => set({ pages }),
  resetPages: () => set({ pages: [] }),
}));
