"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CARD_FONT_FAMILY = void 0;
exports.preprocessHighlight = preprocessHighlight;
exports.createMarkdownComponents = createMarkdownComponents;
exports.CardMarkdownContent = CardMarkdownContent;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_markdown_1 = __importDefault(require("react-markdown"));
const rehype_raw_1 = __importDefault(require("rehype-raw"));
const remark_gfm_1 = __importDefault(require("remark-gfm"));
exports.CARD_FONT_FAMILY = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const BUILTIN_IMAGE_ASSETS = {
    "asset:lenny-avatar": "/lenny-avatar.png",
    "asset:lenny-headshot": "/lenny_headshot.png",
};
function getOrderedListCounterStyle(counterName, start) {
    if (typeof start !== "number" || !Number.isFinite(start)) {
        return undefined;
    }
    const normalizedStart = Math.max(1, Math.floor(start));
    return { counterReset: `${counterName} ${normalizedStart - 1}` };
}
function resolveImageSource(src, images) {
    if (!src) {
        return { src: undefined, alt: "" };
    }
    const builtinAsset = BUILTIN_IMAGE_ASSETS[src];
    if (builtinAsset) {
        return { src: builtinAsset, alt: "" };
    }
    if (!src.startsWith("img-")) {
        return { src, alt: "" };
    }
    const pastedImage = images?.find((image) => image.id === src);
    if (!pastedImage) {
        return null;
    }
    return {
        src: pastedImage.dataUrl,
        alt: pastedImage.name || "Pasted image",
    };
}
function preprocessHighlight(markdown) {
    const parts = markdown.split(/(```[\s\S]*?```)/g);
    return parts
        .map((part, index) => index % 2 === 0 ? part.replace(/==([^=]+?)==/g, "<mark>$1</mark>") : part)
        .join("");
}
function createMarkdownComponents({ accentColor, strongTextColor, backgroundColor, codeBackground, blockquoteColor, images, }) {
    return {
        h1: ({ children }) => ((0, jsx_runtime_1.jsx)("h1", { className: "text-4xl font-bold mb-2 mt-0", children: children })),
        h2: ({ children }) => ((0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-bold mb-2 mt-4", children: children })),
        h3: ({ children }) => ((0, jsx_runtime_1.jsx)("h3", { className: "text-xl font-bold mb-1.5 mt-3", children: children })),
        h4: ({ children }) => ((0, jsx_runtime_1.jsx)("h4", { className: "text-lg font-bold mb-1 mt-2", children: children })),
        h5: ({ children }) => ((0, jsx_runtime_1.jsx)("h5", { className: "text-base font-bold mb-1 mt-2", children: children })),
        h6: ({ children }) => ((0, jsx_runtime_1.jsx)("h6", { className: "text-sm font-bold mb-0.5 mt-1.5", children: children })),
        p: ({ children }) => ((0, jsx_runtime_1.jsx)("p", { className: "mb-2", style: { lineHeight: "inherit" }, children: children })),
        ul: ({ children }) => ((0, jsx_runtime_1.jsx)("ul", { className: "mb-2 list-fixed-bullet", children: children })),
        ol: ({ children, start }) => ((0, jsx_runtime_1.jsx)("ol", { className: "mb-2 list-fixed-num", style: getOrderedListCounterStyle("list-num", start), children: children })),
        li: ({ children }) => (0, jsx_runtime_1.jsx)("li", { className: "mb-0.5", children: children }),
        code: ({ children }) => ((0, jsx_runtime_1.jsx)("code", { className: "px-1 py-0.5 rounded text-sm", style: { backgroundColor: codeBackground }, children: children })),
        pre: ({ children }) => ((0, jsx_runtime_1.jsx)("pre", { className: "mb-2 overflow-x-auto rounded-lg p-3", style: { backgroundColor: codeBackground }, children: children })),
        strong: ({ children }) => ((0, jsx_runtime_1.jsx)("strong", { className: "font-bold", style: { color: strongTextColor }, children: children })),
        em: ({ children }) => (0, jsx_runtime_1.jsx)("em", { className: "italic", children: children }),
        mark: ({ children }) => ((0, jsx_runtime_1.jsx)("mark", { className: "rounded px-0.5 font-medium", style: { backgroundColor: accentColor, color: backgroundColor }, children: children })),
        blockquote: ({ children }) => ((0, jsx_runtime_1.jsx)("blockquote", { className: "border-l-4 pl-3 py-1 my-2 italic opacity-90", style: { borderColor: blockquoteColor }, children: children })),
        img: ({ src, alt, className, ...props }) => {
            const resolved = resolveImageSource(typeof src === "string" ? src : undefined, images);
            if (!resolved) {
                return null;
            }
            const hasCustomClass = className && className.trim().length > 0;
            return ((0, jsx_runtime_1.jsx)("img", { src: resolved.src, alt: alt || resolved.alt, className: className || "my-4 rounded-lg", style: hasCustomClass
                    ? undefined
                    : {
                        maxWidth: "100%",
                        height: "auto",
                        objectFit: "contain",
                    }, ...props }));
        },
    };
}
function CardMarkdownContent({ markdown, accentColor, strongTextColor, backgroundColor, codeBackground, blockquoteColor, images, }) {
    return ((0, jsx_runtime_1.jsx)(react_markdown_1.default, { remarkPlugins: [remark_gfm_1.default], rehypePlugins: [rehype_raw_1.default], components: createMarkdownComponents({
            accentColor,
            strongTextColor,
            backgroundColor,
            codeBackground,
            blockquoteColor,
            images,
        }), children: preprocessHighlight(markdown || "*空页面*") }));
}
