"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CARD_FOOTER_HEIGHT = void 0;
exports.CardFooter = CardFooter;
const jsx_runtime_1 = require("react/jsx-runtime");
exports.CARD_FOOTER_HEIGHT = 52;
function CardFooter({ text, accentColor }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 pt-3 text-[10px] leading-none opacity-70", style: {
            minHeight: `${exports.CARD_FOOTER_HEIGHT}px`,
            color: accentColor,
        }, children: [(0, jsx_runtime_1.jsx)("div", { className: "h-px min-w-6 flex-1 bg-current opacity-35", "aria-hidden": true }), (0, jsx_runtime_1.jsx)("span", { className: "shrink-0 whitespace-nowrap", children: text }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5 shrink-0", "aria-hidden": true, children: [(0, jsx_runtime_1.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-current opacity-50" }), (0, jsx_runtime_1.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-current opacity-35" }), (0, jsx_runtime_1.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-current opacity-20" })] })] }));
}
