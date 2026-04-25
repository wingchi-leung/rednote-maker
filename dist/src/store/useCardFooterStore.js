"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCardFooterStore = exports.DEFAULT_CARD_FOOTER_TEXT = void 0;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
exports.DEFAULT_CARD_FOOTER_TEXT = "基于 RedNoteMaker 生成 · rednotemaker";
exports.useCardFooterStore = (0, zustand_1.create)()((0, middleware_1.persist)((set) => ({
    isEnabled: false,
    text: exports.DEFAULT_CARD_FOOTER_TEXT,
    setEnabled: (isEnabled) => set({ isEnabled }),
    setText: (text) => set({ text }),
    resetFooter: () => set({
        isEnabled: false,
        text: exports.DEFAULT_CARD_FOOTER_TEXT,
    }),
}), {
    name: "card-footer",
}));
