"use client";

/**
 * 轻线条模板背景：白底上的有机轮廓线 + 细微网格，线条色由 accent 控制。
 * 风格：稀疏、手绘等高线感，柔和不抢眼。
 */
interface SketchBackgroundProps {
  accentColor: string;
}

const VIEWBOX_WIDTH = 900;
const VIEWBOX_HEIGHT = 1200;
const GRID_STEP = 56;

export function SketchBackground({ accentColor }: SketchBackgroundProps) {
  const gridLines: React.ReactNode[] = [];
  for (let x = 0; x <= VIEWBOX_WIDTH; x += GRID_STEP) {
    gridLines.push(
      <line
        key={`v-${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={VIEWBOX_HEIGHT}
        stroke={accentColor}
        strokeOpacity={0.16}
        strokeWidth={0.6}
      />
    );
  }
  for (let y = 0; y <= VIEWBOX_HEIGHT; y += GRID_STEP) {
    gridLines.push(
      <line
        key={`h-${y}`}
        x1={0}
        y1={y}
        x2={VIEWBOX_WIDTH}
        y2={y}
        stroke={accentColor}
        strokeOpacity={0.16}
        strokeWidth={0.6}
      />
    );
  }

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ zIndex: 0 }}
    >
      <g>{gridLines}</g>
      {/* 有机线：集中在边缘，上面四个在左上方，中间留白 */}
      <g
        fill="none"
        stroke={accentColor}
        strokeOpacity={0.42}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* 左上方：四个形状聚在左上角 */}
        <path d="M42 58c-22-24 28-50 72-36 44 14 56 50 30 88-26 38-74 42-112 16-40-28-20-64 10-68Z" />
        <path d="M62 78c-12-12 18-28 40-18 22 10 28 30 16 48-12 18-40 22-58 10-22-12-8-32 4-40Z" />
        <path d="M165 72c24 18 12 58-22 86-34 28-82 32-114 12-34-22-24-66 10-94 32-26 98-22 124-4Z" />
        <path d="M95 165c22-40 78-42 124-14 44 26 44 82 8 128-36 46-100 40-142 4-44-38-24-92 6-118Z" />
        {/* 右边缘：一片轮廓 */}
        <path d="M728 485c-4 32 34 52 76 40 42-12 74-52 56-92-18-40-66-58-108-42-42 16-36 54-24 94Z" />
        {/* 下边缘：左下角 */}
        <path d="M52 1008c26-14 68 8 82 50 14 42-18 86-62 98-44 12-80-16-94-58-12-40 32-82 74-90Z" />
        <path d="M88 1034c14-6 36 4 42 28 6 24-4 46-26 52-22 6-42-4-48-28-4-20 18-40 32-52Z" />
        {/* 下边缘：右下角 */}
        <path d="M732 938c-48-26-108 6-128 54-20 48 4 98 52 124 48 26 108-6 128-54 20-48-4-98-52-124Z" />
      </g>
    </svg>
  );
}
