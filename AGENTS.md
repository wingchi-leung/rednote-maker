# AGENTS.md

## 项目概述

RedNoteMaker 是一个将 Markdown 转换为小红书图文卡片的工具网站。

## 技术栈

- **框架**: Next.js 16 (App Router) + React 19
- **状态管理**: Zustand
- **编辑器**: CodeMirror 6
- **样式**: Tailwind CSS
- **图片导出**: html2canvas + JSZip
- **类型**: TypeScript

## 命令

```bash
# 构建生产版本
npm run build

# 运行 lint 检查
npm run lint

# 自动修复 lint 错误
npm run lint:fix

# 开发服务器（不推荐用于验证，agent 应使用 npm run build）
npm run dev
```

**注意**: 禁止使用 `npm run dev`、`npm run lint:check` 验证代码。只允许使用 `npm run build`。

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
├── components/             # 通用组件（含 icons/ 和 ui/ 子目录）
│   └── icons/              # SVG 图标组件（每个图标单独文件）
├── features/              # 功能模块
│   ├── editor/            # Markdown 编辑器
│   ├── preview/           # 图片预览与导出
│   └── configurator/      # 主题配置面板
├── lib/                   # 工具函数和配置
│   ├── templates.ts       # 模板配置（单一数据源）
│   ├── pagination.ts      # 分页计算逻辑
│   └── constants.ts       # 常量配置
└── store/                 # Zustand 状态管理
```

## 代码风格指南

### 组件规范

- **单组件单文件**: 每个 React 组件必须放在单独文件中，文件名与组件名一致
- **SVG 图标分离**: 每个图标组件单独文件，放置于 `components/icons/`
- **函数式组件**: 使用箭头函数或 function 声明，不使用类组件
- **use client**: 客户端组件在文件顶部添加 `"use client"`

### 命名约定

- **组件名**: PascalCase（如 `MarkdownEditor`、`ImagePreview`）
- **文件名**: PascalCase（如 `useMarkdownContentStore.ts`）
- **图标组件**: 以 `Icon` 结尾（如 `ResetIcon.tsx`）
- **Hooks**: 以 `use` 开头（如 `useImageExport`）
- **Store**: 以 `use` 开头，以 `Store` 结尾（如 `useContentThemeStore`）

### 导入规范

- **路径别名**: 使用 `@/` 前缀（如 `@/store/useMarkdownContentStore`）
- **导入顺序**:
  1. React/Next.js 内置
  2. 第三方库
  3. 项目内部导入（@/ 路径）
  4. 相对路径导入
- **组间空行**: 不同组之间空一行

### TypeScript

- **类型注解**: 显式声明函数参数和返回值类型
- **接口定义**: 使用 `interface` 而非 `type`（除非是联合类型）
- **类型导出**: 需要导出的类型使用 `export type`

```typescript
interface MyComponentProps {
  title: string;
  onSave: () => void;
}

export type Theme = "classic" | "dark";
```

### 状态管理 (Zustand)

- **Store 命名**: `useXxxStore`
- **持久化**: 需要持久化的 store 使用 `persist` middleware
- **类型定义**: 在 store 文件中定义完整的 State 接口

```typescript
interface MyStoreState {
  value: string;
  setValue: (v: string) => void;
}

export const useMyStore = create<MyStoreState>()(
  persist(
    (set) => ({
      value: "default",
      setValue: (value) => set({ value }),
    }),
    { name: "my-store-key" }
  )
);
```

### 性能优化

- **useCallback**: 事件处理函数和传递给子组件的函数使用
- **useMemo**: 复杂计算结果使用
- **Ref**: 需要保持引用但不需要触发重渲染时使用

### 错误处理

- **函数错误**: 使用 `throw new Error()` 抛出明确错误信息
- **异步操作**: 使用 try-catch 包裹，finally 清理资源
- **类型守卫**: 必要时使用类型守卫确保类型安全

### CSS / Tailwind

- **Tailwind优先**: 优先使用 Tailwind 类名
- **自定义样式**: 使用 `style` 属性传入动态样式
- **颜色引用**: 主题颜色从 `useContentThemeStore` 的 `themeColors` 获取

### 代码组织

- **单一职责**: 每个函数、组件只做一件事
- **DRY**: 重复代码抽取为函数或常量
- **KISS**: 优先简单方案，避免过度设计

### 注释

- **中文注释**: 使用中文注释和中文 UI
- **必要注释**: 仅在逻辑复杂或不明显处添加注释
- **JSDoc**: 工具函数可添加 JSDoc 说明参数和返回值

## 核心模块说明

### Store (src/store/)

| Store | 用途 |
|-------|------|
| `useMarkdownContentStore` | Markdown 内容编辑与持久化 |
| `useContentThemeStore` | 主题、字体大小、密度、对齐方式 |
| `useSettingsPanelStore` | 设置面板显示状态 |
| `usePaginationStore` | 分页测量数据 |

### Features

| 模块 | 组件 |
|------|------|
| editor | `MarkdownEditor` - CodeMirror 编辑器 |
| preview | `ImagePreview` - 卡片预览，`MeasureCanvas` - 尺寸测量 |
| configurator | `ThemeConfigurator` - 主题选择，`SettingsPanel` - 设置面板 |

## 模板配置

模板配置是单一数据源，新增/调整模板只需修改 `src/lib/templates.ts`。
