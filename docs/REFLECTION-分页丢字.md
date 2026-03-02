# 分页丢字问题技术分析

## 问题描述

文字转图片时，某些段落没有出现在下一页，也没有出现在当前页——在界面上看起来就是「这一大段文字不在下一页，直接没了」。

## 根本原因

**卡片使用固定高度 + `overflow: hidden`，当分页估算不准确时，超出部分被静默裁切。**

预览区域和导出用的卡片都是固定尺寸（900×1200px），内容区使用了 `overflow: hidden`，超出部分会被裁掉。
 

### 代码位置

- 分页算法：`src/lib/pagination.ts`
- 调用方：
  - `src/features/preview/ImagePreview.tsx`
  - `src/components/toolbar/SettingsToolbar.tsx`
  - `src/features/configurator/ExportOptions.tsx`

---

 

## 尝试过的方案与结果

### 方案一：纯 DOM 测量（失败 ❌）

**思路**：使用真实的 DOM 渲染来测量文本高度，完全替代数学估算。

**实现**：
- 创建 `getMeasureContainer()` 创建隐藏的 div 容器
- 使用 `markdownToSimpleHTML()` 将 Markdown 转换为简单 HTML
- 通过 `scrollHeight` 获取真实渲染高度
- 使用二分查找来拆分过大的块

**结果**：**反而更糟了！**
- 原来 2580 字能分 10 页，现在只能分 4 页
- 简单的 HTML 渲染器无法匹配 ReactMarkdown 的实际渲染效果
- 标题、列表、代码块的样式差异巨大

**用户反馈**："卧槽，你这个一修，丢的字体更多了，原本我2580的字，能解析10页，现在只有4页了"

**代码位置**：已回滚

---

### 方案二：混合校准方案（失败）

**思路**：保留数学估算，但使用真实 DOM 测量来校准估算系数。

**实现**：
```typescript
function getRealTextHeight(padding, fontSize, lineHeightRatio): number | null {
  // 创建隐藏容器，测量 10 行普通文本的实际高度
  // 返回校准系数 = 真实高度 / 估算高度
  context.calibrationFactor = Math.max(0.8, Math.min(1.3, realHeight / estimatedHeight));
}

function estimateBlockHeight(block, context): number {
  return estimatedHeight * context.calibrationFactor; // 应用校准系数
}
``` 

### 方案三：React 组件测量（失败 ❌）

**思路**：使用真实的 ReactMarkdown 组件进行测量，确保测量结果与实际渲染一致。

**实现**：
```typescript
// 创建 MeasureContent.tsx 组件
export function MeasureContent({ markdown, theme, fontSize, density, onHeightChange }) {
  return (
    <div ref={containerRef} style={wrapperStyle}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {markdown || "*空页面*"}
      </ReactMarkdown>
    </div>
  );
}
```

 