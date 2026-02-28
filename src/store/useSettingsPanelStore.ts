import { create } from "zustand";

type PanelTab = "style" | "export";

interface SettingsPanelState {
  isOpen: boolean;
  activeTab: PanelTab;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  setActiveTab: (tab: PanelTab) => void;
}

export const useSettingsPanelStore = create<SettingsPanelState>((set) => ({
  isOpen: false,
  activeTab: "style",
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
  setActiveTab: (activeTab) => set({ activeTab }),
}));
