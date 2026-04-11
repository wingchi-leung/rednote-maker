"use client";

interface CardFooterProps {
  text: string;
  accentColor: string;
}

export const CARD_FOOTER_HEIGHT = 52;

export function CardFooter({ text, accentColor }: CardFooterProps) {
  return (
    <div
      className="flex items-center gap-2 pt-3 text-[10px] leading-none opacity-70"
      style={{
        minHeight: `${CARD_FOOTER_HEIGHT}px`,
        color: accentColor,
      }}
    >
      <div className="h-px min-w-6 flex-1 bg-current opacity-35" aria-hidden />
      <span className="shrink-0 whitespace-nowrap">{text}</span>
      <div className="flex items-center gap-1.5 shrink-0" aria-hidden>
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-35" />
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-20" />
      </div>
    </div>
  );
}
