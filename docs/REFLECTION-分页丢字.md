# 分页丢字问题技术分析

## 问题描述

文字转图片时，某些段落没有出现在下一页，也没有出现在当前页——在界面上看起来就是「这一大段文字不在下一页，直接没了」。

## 根本原因

**卡片使用固定高度 + `overflow: hidden`，当分页估算不准确时，超出部分被静默裁切。**

预览区域和导出用的卡片都是固定尺寸（900×1200px），内容区使用了 `overflow: hidden`，超出部分会被裁掉。

---

## 当前实现（2025 年本次修复后）

### 核心思想

**不再依赖数学估算，改为「真实 DOM 测量 + 二分找每页最大可容纳内容」**，从机制上避免超出部分被 `overflow: hidden` 裁切导致丢字。

### 关键流程

1. **真实测量**：用与预览一致的 `ReactMarkdown`（remarkGfm、rehypeRaw）在隐藏容器中渲染候选内容，通过 `scrollHeight` 判断是否能在当前页放下；测量容器宽度/字号/行高与模板（appleNotes 头部、cardFrame 边距等）一致。

2. **按行二分分页**：对每个 `---` 分段，用二分法找「最多能放多少行」；分割时优先在空行、标题、列表前等自然断点，且不在 fenced code block（\`\`\`）中间切断。

3. **超长单行处理**：当「连一行都放不下」时，对该行做行内二分切割（`splitSingleOverlongLine`），在标点/空白处断开，避免整段被裁掉导致页数暴减（如 2580 字只出 4 页）。

4. **文本预算兜底**：在测量分页之后，用加权字数预算（`enforceTextBudget`）再拆一次，防止测量偏乐观时仍出现裁字。

5. **减少留白**：用 `pickBalancedSplitIndex` 限制断点回退范围；用 `rebalancePages` 在不超过测量与预算的前提下，把下一页开头能放下的内容回填到上一页，减少页尾大面积空白。

6. **性能**：对 `canFitMarkdown` 的结果做 LRU 缓存（约 180 条），避免二分与 rebalance 时重复渲染测量；rebalance 仅对「未装满」的页执行，且每页最多尝试拉回 12 行。

7. **空白页**：rebalance 后过滤掉所有空字符串页，避免末尾多出一页空白。

### 代码位置

- 分页算法：`src/lib/pagination.ts`
- 调用方：
  - `src/features/preview/ImagePreview.tsx`
  - `src/components/toolbar/SettingsToolbar.tsx`
  - `src/features/configurator/ExportOptions.tsx`

---

## 已知限制

1. **仍然是估算，非实际测量**
   - 算法基于数学模型估算高度，而非渲染后测量 DOM
   - 极端情况下（如嵌套引用、复杂表格）可能有偏差

2. **30% 安全边距**
   - 保守策略确保不丢字，但可能导致每页内容偏少
   - 可在未来根据实际渲染测量动态调整

3. **sketch 装饰**
   - 轻线条主题的有机线条+网格装饰占用空间很小，当前未计算

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


 

在「方案二混合校准」仍存在约 10 字丢字、且方案一/方案三分别出现页数暴减或 React 报错的前提下，本次采用**彻底重写分页内核**的方式，用真实测量替代估算，并顺带解决留白、空白页和长文性能问题。

### 1. 根因与思路

- **根因**：卡片固定高度 + `overflow: hidden`，分页若高估单页容量，多出的内容会被静默裁掉。
- **思路**：分页时不再「估一个安全高度再塞内容」，而是「先定候选内容，再测是否真的放得下」；测量用与预览一致的 ReactMarkdown 在隐藏 DOM 中渲染，保证与最终展示一致。

### 2. 实现要点

| 步骤 | 做法 |
|------|------|
| 测量 | 隐藏容器内用 `ReactMarkdown` + `remarkGfm` + `rehypeRaw` 渲染，`scrollHeight` 与模板扣除后的可用高度比较，留 6px 安全间隙。 |
| 分页 | 按 `---` 分段后，对每段按「行」二分找最大可放行数；断点优先选自然边界（空行、标题、列表前），且不拆代码块。 |
| 超长单行 | 当连一行都放不下时，对该行做行内二分 + 标点/空白处切割，避免整段被裁导致页数从 10 页跌到 4 页。 |
| 兜底 | 测量后再按「加权字数」做单页预算拆分，防止个别情况下测量偏乐观。 |
| 留白 | 断点只在 bestFit 附近回退（如 8 行内）；rebalance 阶段把下一页能放下的内容回填到上一页，仅对「未装满」的页执行且每页最多拉 12 行。 |
| 性能 | `canFitMarkdown` 结果按「上下文 + 内容哈希」做 LRU 缓存（约 180 条），减少重复渲染。 |
| 空白页 | rebalance 后过滤掉所有空页，不再保留「最后一页即使为空」。 |

### 3. 遇到的问题与修正

- **页数暴减（如 2580 字只出 4 页）**：因未处理「单行超长」：一行单独都放不下时仍整行塞进一页被裁掉。通过行内二分切割 + 安全断点解决。
- **前一张页尾大片留白**：断点回退过多 + 未做页间回填。通过 `pickBalancedSplitIndex` 限制回退、`rebalancePages` 回填解决。
- **长文渲染变慢**：测量调用次数多。通过测量结果 LRU 缓存 + rebalance 条件与行数上限解决。
- **末尾多出一页空白**：rebalance 把最后一页内容全拉到前一页后，原逻辑仍保留「最后一页」导致空页。改为只保留有内容的页。

### 4. 小结

本次修复不再依赖各模板的安全系数调参，而是用**同一套真实测量 + 二分 + 预算兜底 + 回填**流程，在保证不丢字的前提下减轻留白、去掉末尾空白页并控制长文性能。代码集中在 `src/lib/pagination.ts`，对外接口 `calculatePages(markdown, options)` 不变。
