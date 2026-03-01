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
      {/* 有机线：少量等高线式曲线，细而淡 */}
      <g
        fill="none"
        stroke={accentColor}
        strokeOpacity={0.42}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M80 120q100-40 220 20t160 140q-40 100-140 120t-220-40T80 120Z" />
        <path d="M640 180q30 80-40 160t-160 80q-80-20-100-120t60-140q60-40 140 20Z" />
        <path d="M180 480c50-30 140 0 200 80-40 80-120 40-180-20-60-60-20-120 20-100Z" />
        <path d="M520 620c40 30 70 100 40 160-28 55-110 70-170 40-55-28-80-110-50-170 28-55 100-70 140-70Z" />
        <path d="M120 920q90 20 160 100t50 180q-50 70-150 80t-180-60q-70-90-20-200 45-100 140-100Z" />
      </g>
    </svg>
  );
}
