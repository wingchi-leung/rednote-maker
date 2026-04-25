"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFirstSentence = extractFirstSentence;
exports.exportCards = exportCards;
const html2canvas_1 = __importDefault(require("html2canvas"));
const file_saver_1 = require("file-saver");
const jszip_1 = __importDefault(require("jszip"));
const constants_1 = require("@/lib/constants");
const templates_1 = require("@/lib/templates");
function extractFirstSentence(md) {
    const lines = md.split("\n");
    for (const line of lines) {
        let text = line.replace(/^#+\s*/, "").trim();
        if (!text || text === "---" || text.startsWith(">"))
            continue;
        text = text
            .replace(/\*\*/g, "")
            .replace(/\*/g, "")
            .replace(/`/g, "")
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
            .trim();
        if (!text)
            continue;
        const match = text.match(/^[^。！？\n]+[。！？]?/);
        if (match)
            text = match[0];
        text = text.replace(/[\\/:*?"<>|]/g, "");
        if (text.length > 30)
            text = text.slice(0, 30);
        return text || "rednote";
    }
    return "rednote";
}
async function exportCards(params) {
    const { indices, elements, theme, content, onProgress, onComplete } = params;
    const fileNamePrefix = extractFirstSentence(content);
    const backgroundColor = templates_1.themeColors[theme].background;
    await new Promise((resolve) => setTimeout(resolve, 100));
    const blobs = [];
    for (let j = 0; j < indices.length; j++) {
        const pageIndex = indices[j];
        const element = elements[pageIndex];
        if (!element)
            continue;
        const captured = await (0, html2canvas_1.default)(element, {
            scale: constants_1.CARD_CONFIG.scale,
            backgroundColor,
            logging: false,
        });
        const blob = await new Promise((resolve) => {
            captured.toBlob(resolve, "image/png");
        });
        if (blob) {
            blobs.push({ blob, name: `${fileNamePrefix}-${pageIndex + 1}.png` });
        }
        onProgress({ current: j + 1, total: indices.length });
    }
    if (blobs.length <= 3) {
        blobs.forEach(({ blob, name }) => (0, file_saver_1.saveAs)(blob, name));
    }
    else {
        const zip = new jszip_1.default();
        blobs.forEach(({ blob, name }) => zip.file(name, blob));
        const zipBlob = await zip.generateAsync({ type: "blob" });
        (0, file_saver_1.saveAs)(zipBlob, `${fileNamePrefix}.zip`);
    }
    onComplete?.();
}
