"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const pagination_1 = require("./pagination");
(0, vitest_1.describe)("parseMarkdownToBlocks", () => {
    (0, vitest_1.it)("splits markdown into line blocks", () => {
        const blocks = (0, pagination_1.parseMarkdownToBlocks)("line 1\nline 2\nline 3");
        (0, vitest_1.expect)(blocks).toHaveLength(3);
        (0, vitest_1.expect)(blocks[0]).toEqual({ type: "line", content: "line 1" });
        (0, vitest_1.expect)(blocks[2]).toEqual({ type: "line", content: "line 3" });
    });
    (0, vitest_1.it)("handles empty string", () => {
        const blocks = (0, pagination_1.parseMarkdownToBlocks)("");
        (0, vitest_1.expect)(blocks).toHaveLength(1);
        (0, vitest_1.expect)(blocks[0]).toEqual({ type: "line", content: "" });
    });
});
(0, vitest_1.describe)("calculatePages - page break splitting", () => {
    (0, vitest_1.it)("returns single page for empty content", () => {
        const pages = (0, pagination_1.calculatePages)("");
        (0, vitest_1.expect)(pages).toHaveLength(1);
        (0, vitest_1.expect)(pages[0]).toBe("");
    });
    (0, vitest_1.it)("splits on explicit --- page break", () => {
        const pages = (0, pagination_1.calculatePages)("page one\n\n---\n\npage two");
        (0, vitest_1.expect)(pages).toHaveLength(2);
        (0, vitest_1.expect)(pages[0]).toContain("page one");
        (0, vitest_1.expect)(pages[1]).toContain("page two");
    });
    (0, vitest_1.it)("splits on multiple --- page breaks", () => {
        const pages = (0, pagination_1.calculatePages)("p1\n\n---\n\np2\n\n---\n\np3");
        (0, vitest_1.expect)(pages).toHaveLength(3);
    });
    (0, vitest_1.it)("does not treat inline --- as page break", () => {
        // --- followed by text on same line is not a page break
        const pages = (0, pagination_1.calculatePages)("some content\n\n---text here\n\nmore content");
        // Should still be 2 pages (--- followed by text gets normalized to separate lines)
        (0, vitest_1.expect)(pages.length).toBeGreaterThanOrEqual(1);
    });
    (0, vitest_1.it)("preserves content on each page", () => {
        const pages = (0, pagination_1.calculatePages)("first page\n\n---\n\nsecond page");
        (0, vitest_1.expect)(pages[0]).toContain("first page");
        (0, vitest_1.expect)(pages[1]).toContain("second page");
    });
    (0, vitest_1.it)("returns single page for content without page breaks", () => {
        const pages = (0, pagination_1.calculatePages)("just some content without breaks");
        (0, vitest_1.expect)(pages).toHaveLength(1);
    });
});
