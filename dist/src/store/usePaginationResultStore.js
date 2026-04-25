"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePaginationResultStore = void 0;
const zustand_1 = require("zustand");
exports.usePaginationResultStore = (0, zustand_1.create)((set) => ({
    pages: [],
    setPages: (pages) => set({ pages }),
    resetPages: () => set({ pages: [] }),
}));
