"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const exportCards_1 = require("./exportCards");
const html2canvas_1 = __importDefault(require("html2canvas"));
const file_saver_1 = require("file-saver");
vitest_1.vi.mock("html2canvas", () => ({
    default: vitest_1.vi.fn(() => Promise.resolve({
        toBlob: (cb) => cb(new Blob(["x"], { type: "image/png" })),
    })),
}));
vitest_1.vi.mock("file-saver", () => ({ saveAs: vitest_1.vi.fn() }));
const mockZipFile = vitest_1.vi.fn();
const mockGenerateAsync = vitest_1.vi.fn(() => Promise.resolve(new Blob(["zip"])));
vitest_1.vi.mock("jszip", () => ({
    default: class MockJSZip {
        constructor() {
            this.file = mockZipFile;
            this.generateAsync = mockGenerateAsync;
        }
    },
}));
// ─── extractFirstSentence ────────────────────────────────────────────────────
(0, vitest_1.describe)("extractFirstSentence", () => {
    (0, vitest_1.it)("strips heading markers", () => {
        (0, vitest_1.expect)((0, exportCards_1.extractFirstSentence)("# Hello world")).toBe("Hello world");
    });
    (0, vitest_1.it)("strips bold and italic", () => {
        (0, vitest_1.expect)((0, exportCards_1.extractFirstSentence)("**bold** and *italic*")).toBe("bold and italic");
    });
    (0, vitest_1.it)("strips inline code", () => {
        (0, vitest_1.expect)((0, exportCards_1.extractFirstSentence)("`code` here")).toBe("code here");
    });
    (0, vitest_1.it)("skips blank lines", () => {
        (0, vitest_1.expect)((0, exportCards_1.extractFirstSentence)("\n\nactual content")).toBe("actual content");
    });
    (0, vitest_1.it)("skips --- separator lines", () => {
        (0, vitest_1.expect)((0, exportCards_1.extractFirstSentence)("---\nreal content")).toBe("real content");
    });
    (0, vitest_1.it)("skips blockquote lines", () => {
        (0, vitest_1.expect)((0, exportCards_1.extractFirstSentence)("> quote\nreal content")).toBe("real content");
    });
    (0, vitest_1.it)("truncates at 30 characters", () => {
        const long = "a".repeat(40);
        (0, vitest_1.expect)((0, exportCards_1.extractFirstSentence)(long)).toHaveLength(30);
    });
    (0, vitest_1.it)("falls back to 'rednote' for empty input", () => {
        (0, vitest_1.expect)((0, exportCards_1.extractFirstSentence)("")).toBe("rednote");
        (0, vitest_1.expect)((0, exportCards_1.extractFirstSentence)("\n\n---\n\n")).toBe("rednote");
    });
    (0, vitest_1.it)("strips filename-unsafe characters", () => {
        (0, vitest_1.expect)((0, exportCards_1.extractFirstSentence)('file/name:test*here"')).not.toMatch(/[/:*?"<>|\\]/);
    });
    (0, vitest_1.it)("stops at Chinese sentence-ending punctuation", () => {
        (0, vitest_1.expect)((0, exportCards_1.extractFirstSentence)("第一句。第二句")).toBe("第一句。");
    });
});
// ─── exportCards ─────────────────────────────────────────────────────────────
(0, vitest_1.describe)("exportCards", () => {
    const makeEl = () => document.createElement("div");
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.mocked(html2canvas_1.default).mockClear();
        vitest_1.vi.mocked(file_saver_1.saveAs).mockClear();
        mockZipFile.mockClear();
        mockGenerateAsync.mockClear();
    });
    (0, vitest_1.it)("calls html2canvas once per index — regression: all pages exported, not just current", async () => {
        const elements = [makeEl(), makeEl(), makeEl()];
        await (0, exportCards_1.exportCards)({
            indices: [0, 1, 2],
            elements,
            theme: "classic",
            content: "# Test",
            onProgress: vitest_1.vi.fn(),
        });
        (0, vitest_1.expect)(vitest_1.vi.mocked(html2canvas_1.default)).toHaveBeenCalledTimes(3);
    });
    (0, vitest_1.it)("saves individually when ≤3 blobs", async () => {
        const elements = [makeEl(), makeEl(), makeEl()];
        await (0, exportCards_1.exportCards)({
            indices: [0, 1, 2],
            elements,
            theme: "classic",
            content: "# Test",
            onProgress: vitest_1.vi.fn(),
        });
        (0, vitest_1.expect)(vitest_1.vi.mocked(file_saver_1.saveAs)).toHaveBeenCalledTimes(3);
        (0, vitest_1.expect)(mockGenerateAsync).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("zips when >3 blobs", async () => {
        const elements = [makeEl(), makeEl(), makeEl(), makeEl()];
        await (0, exportCards_1.exportCards)({
            indices: [0, 1, 2, 3],
            elements,
            theme: "classic",
            content: "# Test",
            onProgress: vitest_1.vi.fn(),
        });
        (0, vitest_1.expect)(mockZipFile).toHaveBeenCalledTimes(4);
        (0, vitest_1.expect)(mockGenerateAsync).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(vitest_1.vi.mocked(file_saver_1.saveAs)).toHaveBeenCalledTimes(1);
        const [zipBlob, zipName] = vitest_1.vi.mocked(file_saver_1.saveAs).mock.calls[0];
        (0, vitest_1.expect)(zipName).toMatch(/\.zip$/);
        (0, vitest_1.expect)(zipBlob).toBeInstanceOf(Blob);
    });
    (0, vitest_1.it)("skips null elements without throwing", async () => {
        const elements = [makeEl(), null, makeEl()];
        await (0, exportCards_1.exportCards)({
            indices: [0, 1, 2],
            elements,
            theme: "classic",
            content: "# Test",
            onProgress: vitest_1.vi.fn(),
        });
        (0, vitest_1.expect)(vitest_1.vi.mocked(html2canvas_1.default)).toHaveBeenCalledTimes(2);
        (0, vitest_1.expect)(vitest_1.vi.mocked(file_saver_1.saveAs)).toHaveBeenCalledTimes(2);
    });
    (0, vitest_1.it)("calls onProgress after each page with correct counts", async () => {
        const onProgress = vitest_1.vi.fn();
        const elements = [makeEl(), makeEl(), makeEl()];
        await (0, exportCards_1.exportCards)({
            indices: [0, 1, 2],
            elements,
            theme: "classic",
            content: "# Test",
            onProgress,
        });
        (0, vitest_1.expect)(onProgress).toHaveBeenCalledTimes(3);
        (0, vitest_1.expect)(onProgress).toHaveBeenNthCalledWith(1, { current: 1, total: 3 });
        (0, vitest_1.expect)(onProgress).toHaveBeenNthCalledWith(2, { current: 2, total: 3 });
        (0, vitest_1.expect)(onProgress).toHaveBeenNthCalledWith(3, { current: 3, total: 3 });
    });
    (0, vitest_1.it)("calls onComplete after all pages", async () => {
        const onComplete = vitest_1.vi.fn();
        await (0, exportCards_1.exportCards)({
            indices: [0],
            elements: [makeEl()],
            theme: "classic",
            content: "# Test",
            onProgress: vitest_1.vi.fn(),
            onComplete,
        });
        (0, vitest_1.expect)(onComplete).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)("passes theme background color to html2canvas", async () => {
        await (0, exportCards_1.exportCards)({
            indices: [0],
            elements: [makeEl()],
            theme: "dark",
            content: "# Test",
            onProgress: vitest_1.vi.fn(),
        });
        const [, options] = vitest_1.vi.mocked(html2canvas_1.default).mock.calls[0];
        (0, vitest_1.expect)(options.backgroundColor).toBe("#26262A");
    });
    (0, vitest_1.it)("uses extractFirstSentence(content) as filename prefix", async () => {
        await (0, exportCards_1.exportCards)({
            indices: [0],
            elements: [makeEl()],
            theme: "classic",
            content: "# 我的标题",
            onProgress: vitest_1.vi.fn(),
        });
        const [, name] = vitest_1.vi.mocked(file_saver_1.saveAs).mock.calls[0];
        (0, vitest_1.expect)(name).toBe("我的标题-1.png");
    });
});
