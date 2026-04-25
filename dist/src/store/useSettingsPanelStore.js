"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSettingsPanelStore = void 0;
const zustand_1 = require("zustand");
exports.useSettingsPanelStore = (0, zustand_1.create)((set) => ({
    isOpen: false,
    activeTab: "style",
    openPanel: () => set({ isOpen: true }),
    closePanel: () => set({ isOpen: false }),
    togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
    setActiveTab: (activeTab) => set({ activeTab }),
}));
