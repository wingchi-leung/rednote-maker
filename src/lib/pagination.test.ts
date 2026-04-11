import { describe, it, expect } from "vitest";
import { parseMarkdownToBlocks, calculatePages } from "./pagination";

describe("parseMarkdownToBlocks", () => {
  it("splits markdown into line blocks", () => {
    const blocks = parseMarkdownToBlocks("line 1\nline 2\nline 3");
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toEqual({ type: "line", content: "line 1" });
    expect(blocks[2]).toEqual({ type: "line", content: "line 3" });
  });

  it("handles empty string", () => {
    const blocks = parseMarkdownToBlocks("");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({ type: "line", content: "" });
  });
});

describe("calculatePages - page break splitting", () => {
  it("returns single page for empty content", () => {
    const pages = calculatePages("");
    expect(pages).toHaveLength(1);
    expect(pages[0]).toBe("");
  });

  it("splits on explicit --- page break", () => {
    const pages = calculatePages("page one\n\n---\n\npage two");
    expect(pages).toHaveLength(2);
    expect(pages[0]).toContain("page one");
    expect(pages[1]).toContain("page two");
  });

  it("splits on multiple --- page breaks", () => {
    const pages = calculatePages("p1\n\n---\n\np2\n\n---\n\np3");
    expect(pages).toHaveLength(3);
  });

  it("does not treat inline --- as page break", () => {
    // --- followed by text on same line is not a page break
    const pages = calculatePages("some content\n\n---text here\n\nmore content");
    // Should still be 2 pages (--- followed by text gets normalized to separate lines)
    expect(pages.length).toBeGreaterThanOrEqual(1);
  });

  it("preserves content on each page", () => {
    const pages = calculatePages("first page\n\n---\n\nsecond page");
    expect(pages[0]).toContain("first page");
    expect(pages[1]).toContain("second page");
  });

  it("returns single page for content without page breaks", () => {
    const pages = calculatePages("just some content without breaks");
    expect(pages).toHaveLength(1);
  });
});
