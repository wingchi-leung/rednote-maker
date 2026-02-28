export function PaletteIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="2" fill="currentColor" />
      <path
        d="M10 4V2M10 18V16M16 10H18M4 10H2M14.14 5.86L15.56 4.44M5.86 14.14L4.44 15.56M14.14 14.14L15.56 15.56M5.86 5.86L4.44 4.44"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
