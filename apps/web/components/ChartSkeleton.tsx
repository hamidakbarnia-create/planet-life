'use client';

export function ChartSkeleton({ size = 320 }: { size?: number }) {
  const r = size / 2;
  return (
    <div
      className="flex flex-col items-center"
      style={{ width: size, minHeight: size }}
      aria-hidden
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={r}
          cy={r}
          r={r - 8}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="2"
          style={{ opacity: 0.5 }}
        />
        <circle cx={r} cy={r} r={r * 0.72} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <circle cx={r} cy={r} r={r * 0.42} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = ((deg - 90) * Math.PI) / 180;
          const x2 = r + (r - 12) * Math.cos(rad);
          const y2 = r + (r - 12) * Math.sin(rad);
          return (
            <line
              key={deg}
              x1={r}
              y1={r}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          );
        })}
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const pr = r * 0.55;
          return (
            <circle
              key={i}
              cx={r + pr * Math.cos(a)}
              cy={r + pr * Math.sin(a)}
              r="10"
              className="planet-skeleton"
            />
          );
        })}
      </svg>
      <div className="planet-skeleton w-3/4 h-3 mt-4" />
      <div className="planet-skeleton w-1/2 h-3 mt-2" />
    </div>
  );
}
