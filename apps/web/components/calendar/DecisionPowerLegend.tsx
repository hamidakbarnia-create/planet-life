'use client';

import {
  CALENDAR_UI,
  POWER_BAND_ORDER,
  POWER_BAND_STYLES,
} from '@/lib/calendar-power-presentation';

export type DecisionPowerLegendProps = {
  compact?: boolean;
};

/** Horizontal Decision Power Score gradient legend (0 → 100). */
export function DecisionPowerLegend({
  compact = false,
}: DecisionPowerLegendProps) {
  const gradient = `linear-gradient(90deg, ${POWER_BAND_STYLES.low.color}, ${POWER_BAND_STYLES.moderate.color}, ${POWER_BAND_STYLES.good.color}, ${POWER_BAND_STYLES.excellent.color})`;

  return (
    <div
      data-decision-power-legend
      className={compact ? 'min-w-0' : 'min-w-0 w-full'}
    >
      <div
        className="fi text-[9px] uppercase tracking-[0.14em] mb-1.5"
        style={{ color: CALENDAR_UI.textMuted }}
      >
        Decision Power Score
      </div>
      <div
        className="h-2 rounded-full w-full"
        style={{
          background: gradient,
          boxShadow: `0 0 12px ${POWER_BAND_STYLES.excellent.glow}`,
        }}
        aria-hidden
      />
      <div
        className="flex justify-between mt-1 fi text-[9px] tabular-nums"
        style={{ color: CALENDAR_UI.textMuted }}
      >
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
      {!compact && (
        <div className="sr-only">
          {POWER_BAND_ORDER.join(', ')}
        </div>
      )}
    </div>
  );
}
