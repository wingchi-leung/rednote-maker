/** 小红书竖版配图标准尺寸（像素） */
export const CARD_CONFIG = {
  /** 导出目标尺寸：小红书最佳 1080×1440 */
  width: 1080,
  height: 1440,
  /** 预览卡片 DOM 尺寸（内容样式基于此渲染） */
  previewWidth: 450,
  previewHeight: 600,
  /** html2canvas scale = 导出尺寸 / 预览尺寸，直接输出 1080×1440，无需二次缩放 */
  scale: 2.4,
} as const;

export const CARD_RATIO = CARD_CONFIG.width / CARD_CONFIG.height;

/** 导出配置：分页现已基于实际渲染高度，不再使用字数限制 */
export const EXPORT_CONFIG = {
  format: "png" as const,
  quality: 1,
  // maxCharsPerPage 已废弃，保留仅为兼容性（分页算法内部不再使用）
  maxCharsPerPage: 0,
};
