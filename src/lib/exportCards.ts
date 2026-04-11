import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { CARD_CONFIG } from "@/lib/constants";
import { themeColors } from "@/lib/templates";
import type { Theme } from "@/lib/templates";

export interface ExportCardsParams {
  indices: number[];
  elements: (HTMLElement | null)[];
  theme: Theme;
  content: string;
  onProgress: (p: { current: number; total: number }) => void;
  onComplete?: () => void;
}

export function extractFirstSentence(md: string): string {
  const lines = md.split("\n");
  for (const line of lines) {
    let text = line.replace(/^#+\s*/, "").trim();
    if (!text || text === "---" || text.startsWith(">")) continue;
    text = text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
      .trim();
    if (!text) continue;
    const match = text.match(/^[^。！？\n]+[。！？]?/);
    if (match) text = match[0];
    text = text.replace(/[\\/:*?"<>|]/g, "");
    if (text.length > 30) text = text.slice(0, 30);
    return text || "rednote";
  }
  return "rednote";
}

export async function exportCards(params: ExportCardsParams): Promise<void> {
  const { indices, elements, theme, content, onProgress, onComplete } = params;
  const fileNamePrefix = extractFirstSentence(content);
  const backgroundColor = themeColors[theme].background;

  await new Promise((resolve) => setTimeout(resolve, 100));

  const blobs: { blob: Blob; name: string }[] = [];
  for (let j = 0; j < indices.length; j++) {
    const pageIndex = indices[j];
    const element = elements[pageIndex];
    if (!element) continue;
    const captured = await html2canvas(element, {
      scale: CARD_CONFIG.scale,
      backgroundColor,
      logging: false,
    });
    const blob = await new Promise<Blob | null>((resolve) => {
      captured.toBlob(resolve, "image/png");
    });
    if (blob) {
      blobs.push({ blob, name: `${fileNamePrefix}-${pageIndex + 1}.png` });
    }
    onProgress({ current: j + 1, total: indices.length });
  }

  if (blobs.length <= 3) {
    blobs.forEach(({ blob, name }) => saveAs(blob, name));
  } else {
    const zip = new JSZip();
    blobs.forEach(({ blob, name }) => zip.file(name, blob));
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${fileNamePrefix}.zip`);
  }

  onComplete?.();
}
