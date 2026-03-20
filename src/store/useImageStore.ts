import { create } from "zustand";

export interface PastedImage {
  id: string;
  dataUrl: string;
  name?: string;
}

interface ImageState {
  images: PastedImage[];
  addImage: (image: PastedImage) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
}

export const useImageStore = create<ImageState>()((set) => ({
  images: [],
  addImage: (image) =>
    set((state) => ({ images: [...state.images, image] })),
  removeImage: (id) =>
    set((state) => ({ images: state.images.filter((img) => img.id !== id) })),
  clearImages: () => set({ images: [] }),
}));
