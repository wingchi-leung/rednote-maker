/** 小红书竖版配图标准尺寸（像素） */
export const CARD_CONFIG = {
  width: 900,
  height: 1200,
  scale: 2,
} as const;

export const CARD_RATIO = CARD_CONFIG.width / CARD_CONFIG.height;

/** 导出配置：分页现已基于实际渲染高度，不再使用字数限制 */
export const EXPORT_CONFIG = {
  format: "png" as const,
  quality: 1,
  // maxCharsPerPage 已废弃，保留仅为兼容性（分页算法内部不再使用）
  maxCharsPerPage: 0,
};
