type BrandMarkProps = {
  size?: "sm" | "md";
  className?: string;
};

const containerSizeMap: Record<NonNullable<BrandMarkProps["size"]>, string> = {
  sm: "h-6 w-6 rounded-md",
  md: "h-8 w-8 rounded-lg",
};

const textSizeMap: Record<NonNullable<BrandMarkProps["size"]>, string> = {
  sm: "text-[10px]",
  md: "text-sm",
};

export function BrandMark({ size = "md", className = "" }: BrandMarkProps) {
  return (
    <div
      className={`relative overflow-hidden border border-zinc-900 bg-zinc-950 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] ${containerSizeMap[size]} ${className}`}
      aria-hidden="true"
    >
      <span
        className={`absolute inset-0 flex items-center justify-center font-black tracking-[-0.08em] ${textSizeMap[size]}`}
      >
        RM
      </span>
      <span className="absolute inset-x-0 bottom-0 h-1 bg-[#ff2442]" />
    </div>
  );
}
