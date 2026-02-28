RedNoteMaker 最终产品需求文档 (PRD)
版本： 1.0

定位： 极简主义的 Markdown 转小红书卡片工具

核心理念： Content First, Design Second.

1. 功能深度挖掘 (Feature Roadmap)
在原有基础上，我为你补充了几个提升「生产力」的关键细节：

1.1 核心：智能分割算法
字数敏感型分页： 针对小红书 1242*1660 比例，自动计算文本高度。当内容超过单张图片承载量（建议 800-1000 字/张）时，自动切分为「图 1、图 2...」。

语义断点： 智能识别标题层级，尽量不在标题下方立即分页，保持阅读连贯性。

1.2 Markdown 增强支持
各类文档适配：包括notion、obsidian、标准/严格的markdown格式


1.3 样式预设 (Themes)
克制的美感： 提供 3-5 款 Apple 风格的主题（经典白、深空灰、羊皮纸色、低饱和莫兰迪）。

自定义封面： 支持用户上传一张图片作为第 1 张卡片的背景，并自动叠加标题。

交互流程设计 (UX Logic)
2.1 用户旅程粘贴/输入： 
用户进入页面，左侧 CodeMirror 激活。
实时渲染： 右侧 Canvas 容器根据左侧 MD 内容实时更新。
微调样式： 用户在右侧上方工具栏选择：字体大小、行间距、页边距。
一键导出： 点击「导出」，调用 html2canvas 循环处理分页 DOM，生成 .zip 包或多张图片。
3. 技术规范 (Technical Spec)
3.1 关键参数定义参数数值/说明画布尺寸$1242 \times 1660$ px (3:4 比例，高清)渲染倍率$Scale = 2$ (确保在 Retina 屏幕下不模糊)导出格式PNG (Lossless)字体栈SF Pro, Inter, PingFang SC, system-ui


技术难点与方案长图切割： 由于 HTML 元素不能跨 Canvas 切断，我们需要一个「虚拟渲染容器」。先计算总高度 $H_{total}$，根据单张高度 $H_{page}$ 计算出 $N = \lceil H_{total} / H_{page} \rceil$，然后通过 CSS transform: translateY 偏移来截取不同段落。性能优化： 使用 Web Worker 处理图片生成过程，避免在大规模文本转换时导致浏览器 UI 冻结。


4. 详细 UI 规范 (Design Spec)
4.1 颜色系统 (Apple Style)
Background: #F5F5F7 (System Gray 6)

Card: #FFFFFF

Accent: #0071E3 (Apple Blue)

Border: #D2D2D7

4.2 UI 组件库
Editor: 使用 CodeMirror 6，配置 lineWrapping 和 minimalist 主题。

Preview: 使用 aspect-ratio: 3 / 4 的容器，配合 drop-shadow 模拟纸张质感。
