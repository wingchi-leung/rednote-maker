# 分页丢字问题技术分析

## 问题描述

文字转图片时，某些段落没有出现在下一页，也没有出现在当前页——在界面上看起来就是「这一大段文字不在下一页，直接没了」。

## 根本原因

**卡片使用固定高度 + `overflow: hidden`，当分页估算不准确时，超出部分被静默裁切。**

预览区域和导出用的卡片都是固定尺寸（900×1200px），内容区使用了 `overflow: hidden`，超出部分会被裁掉。

---

## 当前实现

### 核心思想

**根据用户实际选择的渲染参数（密度、字号、主题）和模板样式，极度保守地计算每页可容纳的内容高度。**

### 关键改进

1. **接收完整渲染参数**
   ```typescript
   calculatePages(markdown, { density, fontSize, theme })
   ```

2. **根据模板计算额外空间占用**
   - **appleNotes 布局**：有 CardHeaderAppleNotes 头部，额外占用 ~50px
   - **cardFrame 样式**（如 morandi）：有顶线（1px）+ 顶部 marginTop（24px）
   - **cardFrame 左右边距**：减少可用内容宽度，导致更多换行

3. **根据密度计算实际 padding**
   - 紧凑: 24px
   - 舒适: 32px
   - 宽松: 40px

4. **根据字号和密度计算实际行高**
   ```
   lineHeight = fontSize × density.lineHeightRatio
   例如：中号(16px) × 舒适(1.75) = 28px
   ```

5. **极度保守的高度估算**
   - 使用 70% 的可用高度作为安全值（留 30% 安全边距）
   - 字符宽度按 0.65×fontSize 计算（偏大）
   - 拆分超大块时使用 50% 的理论容量
   - 所有边距和间距都按保守值计算

6. **精确估算每个块的渲染高度**
   - 标题：考虑标题字号倍数、换行、边距
   - 段落：根据内容宽度估算换行数
   - 列表：考虑左边距和项目符号
   - 代码块：使用等宽字体行高

7. **高度累加分页**
   ```
   可用高度 = 卡片高度(1200) - padding × 2 - 模板额外高度
   安全高度 = 可用高度 × 70%  // 留 30% 安全边距
   ```

8. **智能拆分超大块**
   - 优先在换行符处分割
   - 其次在标点符号处分割
   - 最后在空格处分割

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

### 方案二：混合校准方案（当前实现 ✅）

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

**调优过程**：
1. 初始版本：丢字 ~100+ 字
2. 调整安全边距：72% → 70% → 65% → 60%
3. 调整拆分系数：50% → 65% → 70% → 75%
4. 增加段落边距：0.75 → 0.9
5. 根据模板调整安全边距：
   - dark: 55% (有 QuoteIcon 占用右上角)
   - sketch: 50% (有装饰占用空间)
   - appleNotes: 58% (有头部)
   - 其他: 60%

**结果**：
- 丢字从 ~100 字减少到 ~10 字
- 有新字符出现，说明边界在优化
- 每个模板丢字情况不同

**用户反馈**：
- "还可以，现在丢了差不多10来个字，有进步，但是还要继续修"
- "很好，现在还是丢了，但是有新的字出现了"
- "苹果备忘录模板有一点丢。轻线条那个丢得挺多的"

**局限性**：
- 仍然是估算，不是真实测量
- 需要为每个模板手动调整安全边距
- 新增模板时需要重新测量调优

---

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

**结果**：**报错！**

```
Error: Render methods should be a pure function of props and state;
triggering nested component updates from render is not allowed
```

**原因**：
- `calculatePages()` 在 render 阶段被调用
- 在 render 阶段动态导入组件和操作 DOM 会导致 React 警告
- React 18 的 createRoot 不允许在 render 中触发副作用

**用户反馈**："报错啦！... 而且字体又丢了。我麻了，你先把最新的改动写到分页丢字的报告里"

**代码位置**：已回滚

---

## 当前状态总结

**实现方式**：方案二（混合校准方案）

**丢字情况**：~10 字左右

**主要问题**：
1. 不同模板丢字程度不同（sketch > appleNotes > 其他）
2. 新增模板需要手动调参
3. 仍然是估算，非真实测量

**可能的改进方向**（待探索）：
1. 在 SSR 友好的方式下进行真实测量
2. 使用 Web Worker 在后台异步测量
3. 建立模板配置文件，让每个模板声明自己的空间占用
4. 使用更精确的数学模型（考虑字体度量、实际行高等）

---

## 未来优化方向

基于上述尝试，可行的优化方向：

1. **SSR 友好的真实测量**
   - 在 useEffect 中进行测量，避免 render 阶段的副作用
   - 先用估算显示，然后用测量结果异步更新
   - 使用 React 19 的 use() API 可能可以更好地处理异步测量

2. **模板自动配置**
   - 在模板配置中添加明确的"空间占用"声明
   - 让模板开发者自己指定头部、装饰、边框的高度
   - 算法自动计算可用空间

3. **渐进式优化**
   - 记录用户实际使用中的丢字反馈
   - 使用 Analytics 收集真实数据
   - 逐步调整每个模板的安全边距

4. **更精确的数学模型**
   - 使用 Canvas API 测量文本实际宽度
   - 考虑不同字体的度量（ascender, descender, line gap）
   - 模拟浏览器的文本换行算法
