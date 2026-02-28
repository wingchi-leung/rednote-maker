export const CARD_CONFIG = {
  width: 1242,
  height: 1660,
  scale: 2,
} as const;

export const CARD_RATIO = CARD_CONFIG.width / CARD_CONFIG.height;

export const EXPORT_CONFIG = {
  format: "png" as const,
  quality: 1,
  maxCharsPerPage: 1000,
};
