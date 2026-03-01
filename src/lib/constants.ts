/** 小红书竖版配图标准尺寸（像素） */
export const CARD_CONFIG = {
  width: 900,
  height: 1200,
  scale: 2,
} as const;

export const CARD_RATIO = CARD_CONFIG.width / CARD_CONFIG.height;

/** 单页最大字数：偏保守，避免渲染高度超出卡片导致 overflow 裁切丢字 */
export const EXPORT_CONFIG = {
  format: "png" as const,
  quality: 1,
  maxCharsPerPage: 650,
};
