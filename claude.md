这是一个小红书生成图文卡片的网站，同目录下有一个"痛点文档.txt"代表产品需求 

This file provides guidance to Agent when working with code in this repository.

## Commands

```bash
npm build        # Production build
npm lint:fix     # Fix lint errors
```

## Code Principles (MUST follow strictly)

- **KISS**: Keep it simple, prefer straightforward solutions over clever ones
- **DRY**: Don't repeat yourself, eliminate duplication through abstraction and composition
- **Single Responsibility**: Each function, component, and file should do one thing well
- **Minimal Complexity**: Reduce cognitive load by breaking down complex logic
- **One component per file**: Never put multiple components in one file. SVG icons must also be separate files.

## Test and verify

**禁止使用以下命令验证代码：**

- `npm dev` - 不要启动开发服务器验证
- `npm lint:check` - 不要运行 lint 检查
- `npm lint:fix` - 不要运行 lint 修复

**允许使用：**

- `npm build` - 可以运行构建验证

## 项目结构

```n
src/
├── app/                    # Next.js App Router 页面
├── components/             # 通用组件（含 icons/ 和 ui/ 子目录）
├── features/              # 功能模块（editor、preview、configurator）
├── lib/                   # 工具函数和配置
└── store/                 # Zustand 状态管理
```

## 核心组件说明

### 编辑器 (features/editor)

- `MarkdownEditor`: Markdown 文本编辑器
- 支持实时预览
- 内容持久化到 localStorage

### 预览 (features/preview)

- `ImagePreview`: 图片预览组件
- `useImageExport`: 图片导出 Hook
- 支持单张/批量导出 PNG

### 配置器 (features/configurator)

- 主题选择
- 字体、密度、对齐方式调整
- 样式实时应用

## 状态管理架构

使用 Zustand 进行状态管理：

- `useMarkdownContentStore`: 管理 Markdown 内容和编辑状态
- `useContentThemeStore`: 管理主题和样式配置
- `useSettingsPanelStore`: 管理配置面板显示状态
 
## 任务执行

- 任务执行过程不必确认，每完成一阶段任务自动 commit 并继续下一个任务
- 所有任务执行完成后使用 agent `code-simplifier` 来优化代码