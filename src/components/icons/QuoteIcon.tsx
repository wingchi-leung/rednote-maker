/** 引用号图标 "，用于深空灰主题卡片右上角 */
export function QuoteIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M4 2.5C2.5 4 2 5.5 2 7c0 1.5.5 3 2 4.5l1-1C4 9 3.5 8 3.5 7c0-.8.3-1.8 1.2-2.8L4 2.5zM10 2.5C8.5 4 8 5.5 8 7c0 1.5.5 3 2 4.5l1-1C10 9 9.5 8 9.5 7c0-.8.3-1.8 1.2-2.8L10 2.5z"
        fill="currentColor"
        fillOpacity="0.9"
      />
    </svg>
  );
}
