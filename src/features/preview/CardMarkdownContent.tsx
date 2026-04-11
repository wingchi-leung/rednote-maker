"use client";

import type { CSSProperties, ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

export const CARD_FONT_FAMILY =
  '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export interface CardMarkdownImage {
  id: string;
  dataUrl: string;
  name?: string;
}

interface CreateMarkdownComponentsOptions {
  accentColor: string;
  strongTextColor: string;
  backgroundColor: string;
  codeBackground: string;
  blockquoteColor: string;
  images?: CardMarkdownImage[];
}

interface CardMarkdownContentProps extends CreateMarkdownComponentsOptions {
  markdown: string;
}

const BUILTIN_IMAGE_ASSETS: Record<string, string> = {
  "asset:lenny-avatar": "/lenny-avatar.png",
  "asset:lenny-headshot": "/lenny_headshot.png",
};

function getOrderedListCounterStyle(
  counterName: string,
  start: unknown
): CSSProperties | undefined {
  if (typeof start !== "number" || !Number.isFinite(start)) {
    return undefined;
  }

  const normalizedStart = Math.max(1, Math.floor(start));
  return { counterReset: `${counterName} ${normalizedStart - 1}` };
}

function resolveImageSource(
  src: string | undefined,
  images: CardMarkdownImage[] | undefined
): { src?: string; alt: string } | null {
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

export function preprocessHighlight(markdown: string): string {
  const parts = markdown.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, index) =>
      index % 2 === 0 ? part.replace(/==([^=]+?)==/g, "<mark>$1</mark>") : part
    )
    .join("");
}

export function createMarkdownComponents({
  accentColor,
  strongTextColor,
  backgroundColor,
  codeBackground,
  blockquoteColor,
  images,
}: CreateMarkdownComponentsOptions): Components {
  return {
    h1: ({ children }: { children?: ReactNode }) => (
      <h1 className="text-4xl font-bold mb-2 mt-0">{children}</h1>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="text-2xl font-bold mb-2 mt-4">{children}</h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="text-xl font-bold mb-1.5 mt-3">{children}</h3>
    ),
    h4: ({ children }: { children?: ReactNode }) => (
      <h4 className="text-lg font-bold mb-1 mt-2">{children}</h4>
    ),
    h5: ({ children }: { children?: ReactNode }) => (
      <h5 className="text-base font-bold mb-1 mt-2">{children}</h5>
    ),
    h6: ({ children }: { children?: ReactNode }) => (
      <h6 className="text-sm font-bold mb-0.5 mt-1.5">{children}</h6>
    ),
    p: ({ children }: { children?: ReactNode }) => (
      <p className="mb-2" style={{ lineHeight: "inherit" }}>
        {children}
      </p>
    ),
    ul: ({ children }: { children?: ReactNode }) => (
      <ul className="mb-2 list-fixed-bullet">{children}</ul>
    ),
    ol: ({ children, start }: { children?: ReactNode; start?: number }) => (
      <ol
        className="mb-2 list-fixed-num"
        style={getOrderedListCounterStyle("list-num", start)}
      >
        {children}
      </ol>
    ),
    li: ({ children }: { children?: ReactNode }) => <li className="mb-0.5">{children}</li>,
    code: ({ children }: { children?: ReactNode }) => (
      <code
        className="px-1 py-0.5 rounded text-sm"
        style={{ backgroundColor: codeBackground }}
      >
        {children}
      </code>
    ),
    pre: ({ children }: { children?: ReactNode }) => (
      <pre
        className="mb-2 overflow-x-auto rounded-lg p-3"
        style={{ backgroundColor: codeBackground }}
      >
        {children}
      </pre>
    ),
    strong: ({ children }: { children?: ReactNode }) => (
      <strong className="font-bold" style={{ color: strongTextColor }}>
        {children}
      </strong>
    ),
    em: ({ children }: { children?: ReactNode }) => <em className="italic">{children}</em>,
    mark: ({ children }: { children?: ReactNode }) => (
      <mark
        className="rounded px-0.5 font-medium"
        style={{ backgroundColor: accentColor, color: backgroundColor }}
      >
        {children}
      </mark>
    ),
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote
        className="border-l-4 pl-3 py-1 my-2 italic opacity-90"
        style={{ borderColor: blockquoteColor }}
      >
        {children}
      </blockquote>
    ),
    img: ({ src, alt, className, ...props }) => {
      const resolved = resolveImageSource(
        typeof src === "string" ? src : undefined,
        images
      );

      if (!resolved) {
        return null;
      }

      const hasCustomClass = className && className.trim().length > 0;

      return (
        <img
          src={resolved.src}
          alt={alt || resolved.alt}
          className={className || "my-4 rounded-lg"}
          style={
            hasCustomClass
              ? undefined
              : {
                  maxWidth: "100%",
                  height: "auto",
                  objectFit: "contain",
                }
          }
          {...props}
        />
      );
    },
  };
}

export function CardMarkdownContent({
  markdown,
  accentColor,
  strongTextColor,
  backgroundColor,
  codeBackground,
  blockquoteColor,
  images,
}: CardMarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={createMarkdownComponents({
        accentColor,
        strongTextColor,
        backgroundColor,
        codeBackground,
        blockquoteColor,
        images,
      })}
    >
      {preprocessHighlight(markdown || "*空页面*")}
    </ReactMarkdown>
  );
}
