import { create } from "zustand";

export interface PastedImage {
  id: string;
  dataUrl: string;
  name?: string;
}

interface ImageState {
  images: PastedImage[];
  coverImage: PastedImage | null;
  addImage: (image: PastedImage) => void;
  setCoverImage: (image: PastedImage) => void;
  clearCoverImage: () => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
}

export const useImageStore = create<ImageState>()((set) => ({
  images: [],
  coverImage: null,
  addImage: (image) =>
    set((state) => ({ images: [...state.images, image] })),
  setCoverImage: (image) => set({ coverImage: image }),
  clearCoverImage: () => set({ coverImage: null }),
  removeImage: (id) =>
    set((state) => ({ images: state.images.filter((img) => img.id !== id) })),
  clearImages: () => set({ images: [] }),
}));
