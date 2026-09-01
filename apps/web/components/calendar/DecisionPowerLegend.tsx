'use client';

import type { AppLang } from '@/lib/app-settings';
import { CALENDAR_PAGE_LANGS } from '@/lib/calendar-page-i18n';
import {
  CALENDAR_UI,
  POWER_BAND_ORDER,
  POWER_BAND_STYLES,
} from '@/lib/calendar-power-presentation';

export type DecisionPowerLegendProps = {
  compact?: boolean;
  lang?: AppLang;
};

/** Horizontal Decision Power Score gradient legend (0 → 100). */
export function DecisionPowerLegend({
  compact = false,
  lang = 'en',
}: DecisionPowerLegendProps) {
  const gradient = `linear-gradient(90deg, ${POWER_BAND_STYLES.low.color}, ${POWER_BAND_STYLES.moderate.color}, ${POWER_BAND_STYLES.good.color}, ${POWER_BAND_STYLES.excellent.color})`;
  const copy = CALENDAR_PAGE_LANGS[lang].insight;
  const title = copy.decisionPowerScore;
  const bandLabels = POWER_BAND_ORDER.map((band) => copy[band]).join(', ');

  return (
    <div
      data-decision-power-legend
      className={compact ? 'min-w-0' : 'min-w-0 w-full'}
    >
      <div
        className="fi text-[9px] uppercase tracking-[0.14em] mb-1.5"
        style={{ color: CALENDAR_UI.textMuted }}
      >
        {title}
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
          {bandLabels}
        </div>
      )}
    </div>
  );
}
