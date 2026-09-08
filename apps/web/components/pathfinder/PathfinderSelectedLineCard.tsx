'use client';

import {
  PATHFINDER_SUN_ANGLE_COLORS,
  PATHFINDER_SUN_LINE_COPY,
  PATHFINDER_SUN_LINE_PROVENANCE,
  PATHFINDER_SUN_LINE_STATUS,
  type PathfinderSunAngle,
} from '@/lib/pathfinder-geometry-demo';

export type PathfinderSelectedLineCardVariant = 'desktop-panel' | 'mobile-sheet';

export function PathfinderSelectedLineCard({
  angle,
  variant,
}: {
  angle: PathfinderSunAngle;
  variant: PathfinderSelectedLineCardVariant;
}) {
  const copy = PATHFINDER_SUN_LINE_COPY[angle];
  const color = PATHFINDER_SUN_ANGLE_COLORS[angle];
  const compact = variant === 'mobile-sheet';

  return (
    <div
      data-testid={
        variant === 'desktop-panel' ? 'pathfinder-selected-line-panel' : 'pathfinder-geometry-demo-info'
      }
      data-selected-line-variant={variant}
      className={compact ? 'rounded-2xl px-3 py-2.5' : 'rounded-2xl px-4 py-3'}
      style={{
        background: compact ? 'rgba(8,12,22,0.94)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${color}66`,
        boxShadow: compact ? '0 12px 28px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={`fi font-semibold text-white ${compact ? 'text-xs' : 'text-sm'}`}>{copy.title}</p>
        <span
          className="fi shrink-0 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-amber-100"
          style={{ background: 'rgba(251,191,36,0.16)', border: '1px solid rgba(251,191,36,0.35)' }}
        >
          Experimental
        </span>
      </div>
      <p className={`fi mt-1.5 leading-relaxed text-white/70 ${compact ? 'text-[11px]' : 'text-xs'}`}>
        {copy.meaning}
      </p>
      <details data-testid="pathfinder-geometry-demo-provenance" className="mt-2">
        <summary className="fi cursor-pointer text-[10px] text-white/45">Technical provenance</summary>
        <p className="fi mt-1.5 text-[10px] leading-relaxed text-amber-200/80">{PATHFINDER_SUN_LINE_STATUS}</p>
        <p className="fi mt-1 text-[10px] leading-relaxed text-white/50">{PATHFINDER_SUN_LINE_PROVENANCE}</p>
      </details>
    </div>
  );
}
