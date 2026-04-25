"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useImageStore = void 0;
const zustand_1 = require("zustand");
exports.useImageStore = (0, zustand_1.create)()((set) => ({
    images: [],
    coverImage: null,
    addImage: (image) => set((state) => ({ images: [...state.images, image] })),
    setCoverImage: (image) => set({ coverImage: image }),
    clearCoverImage: () => set({ coverImage: null }),
    removeImage: (id) => set((state) => ({ images: state.images.filter((img) => img.id !== id) })),
    clearImages: () => set({ images: [] }),
}));
