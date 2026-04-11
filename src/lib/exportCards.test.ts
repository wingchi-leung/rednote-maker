import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportCards, extractFirstSentence } from "./exportCards";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";

vi.mock("html2canvas", () => ({
  default: vi.fn(() =>
    Promise.resolve({
      toBlob: (cb: (b: Blob | null) => void) =>
        cb(new Blob(["x"], { type: "image/png" })),
    })
  ),
}));

vi.mock("file-saver", () => ({ saveAs: vi.fn() }));

const mockZipFile = vi.fn();
const mockGenerateAsync = vi.fn(() => Promise.resolve(new Blob(["zip"])));
vi.mock("jszip", () => ({
  default: class MockJSZip {
    file = mockZipFile;
    generateAsync = mockGenerateAsync;
  },
}));

// ─── extractFirstSentence ────────────────────────────────────────────────────

describe("extractFirstSentence", () => {
  it("strips heading markers", () => {
    expect(extractFirstSentence("# Hello world")).toBe("Hello world");
  });

  it("strips bold and italic", () => {
    expect(extractFirstSentence("**bold** and *italic*")).toBe("bold and italic");
  });

  it("strips inline code", () => {
    expect(extractFirstSentence("`code` here")).toBe("code here");
  });

  it("skips blank lines", () => {
    expect(extractFirstSentence("\n\nactual content")).toBe("actual content");
  });

  it("skips --- separator lines", () => {
    expect(extractFirstSentence("---\nreal content")).toBe("real content");
  });

  it("skips blockquote lines", () => {
    expect(extractFirstSentence("> quote\nreal content")).toBe("real content");
  });

  it("truncates at 30 characters", () => {
    const long = "a".repeat(40);
    expect(extractFirstSentence(long)).toHaveLength(30);
  });

  it("falls back to 'rednote' for empty input", () => {
    expect(extractFirstSentence("")).toBe("rednote");
    expect(extractFirstSentence("\n\n---\n\n")).toBe("rednote");
  });

  it("strips filename-unsafe characters", () => {
    expect(extractFirstSentence('file/name:test*here"')).not.toMatch(/[/:*?"<>|\\]/);
  });

  it("stops at Chinese sentence-ending punctuation", () => {
    expect(extractFirstSentence("第一句。第二句")).toBe("第一句。");
  });
});

// ─── exportCards ─────────────────────────────────────────────────────────────

describe("exportCards", () => {
  const makeEl = () => document.createElement("div");

  beforeEach(() => {
    vi.mocked(html2canvas).mockClear();
    vi.mocked(saveAs).mockClear();
    mockZipFile.mockClear();
    mockGenerateAsync.mockClear();
  });

  it("calls html2canvas once per index — regression: all pages exported, not just current", async () => {
    const elements = [makeEl(), makeEl(), makeEl()];
    await exportCards({
      indices: [0, 1, 2],
      elements,
      theme: "classic",
      content: "# Test",
      onProgress: vi.fn(),
    });
    expect(vi.mocked(html2canvas)).toHaveBeenCalledTimes(3);
  });

  it("saves individually when ≤3 blobs", async () => {
    const elements = [makeEl(), makeEl(), makeEl()];
    await exportCards({
      indices: [0, 1, 2],
      elements,
      theme: "classic",
      content: "# Test",
      onProgress: vi.fn(),
    });
    expect(vi.mocked(saveAs)).toHaveBeenCalledTimes(3);
    expect(mockGenerateAsync).not.toHaveBeenCalled();
  });

  it("zips when >3 blobs", async () => {
    const elements = [makeEl(), makeEl(), makeEl(), makeEl()];
    await exportCards({
      indices: [0, 1, 2, 3],
      elements,
      theme: "classic",
      content: "# Test",
      onProgress: vi.fn(),
    });
    expect(mockZipFile).toHaveBeenCalledTimes(4);
    expect(mockGenerateAsync).toHaveBeenCalledTimes(1);
    expect(vi.mocked(saveAs)).toHaveBeenCalledTimes(1);
    const [zipBlob, zipName] = vi.mocked(saveAs).mock.calls[0];
    expect(zipName).toMatch(/\.zip$/);
    expect(zipBlob).toBeInstanceOf(Blob);
  });

  it("skips null elements without throwing", async () => {
    const elements = [makeEl(), null, makeEl()];
    await exportCards({
      indices: [0, 1, 2],
      elements,
      theme: "classic",
      content: "# Test",
      onProgress: vi.fn(),
    });
    expect(vi.mocked(html2canvas)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(saveAs)).toHaveBeenCalledTimes(2);
  });

  it("calls onProgress after each page with correct counts", async () => {
    const onProgress = vi.fn();
    const elements = [makeEl(), makeEl(), makeEl()];
    await exportCards({
      indices: [0, 1, 2],
      elements,
      theme: "classic",
      content: "# Test",
      onProgress,
    });
    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenNthCalledWith(1, { current: 1, total: 3 });
    expect(onProgress).toHaveBeenNthCalledWith(2, { current: 2, total: 3 });
    expect(onProgress).toHaveBeenNthCalledWith(3, { current: 3, total: 3 });
  });

  it("calls onComplete after all pages", async () => {
    const onComplete = vi.fn();
    await exportCards({
      indices: [0],
      elements: [makeEl()],
      theme: "classic",
      content: "# Test",
      onProgress: vi.fn(),
      onComplete,
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("passes theme background color to html2canvas", async () => {
    await exportCards({
      indices: [0],
      elements: [makeEl()],
      theme: "dark",
      content: "# Test",
      onProgress: vi.fn(),
    });
    const [, options] = vi.mocked(html2canvas).mock.calls[0];
    expect((options as { backgroundColor: string }).backgroundColor).toBe("#26262A");
  });

  it("uses extractFirstSentence(content) as filename prefix", async () => {
    await exportCards({
      indices: [0],
      elements: [makeEl()],
      theme: "classic",
      content: "# 我的标题",
      onProgress: vi.fn(),
    });
    const [, name] = vi.mocked(saveAs).mock.calls[0];
    expect(name).toBe("我的标题-1.png");
  });
});
