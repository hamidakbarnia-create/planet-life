import type { CSSProperties } from 'react';

import type { VaultScoreBand } from '@/lib/vault-power-windows';

export type VaultRankedDayChipProps = {
  dateLabel: string;
  score: number;
  band: VaultScoreBand;
  bandLabel: string;
  /** Already-filtered visible rating; omit or null when not shown. */
  rating?: string | null;
  title?: string;
};

export type VaultYesDecisionSlotProps = {
  label: string;
  dateLabel: string;
  score: number;
  band: VaultScoreBand;
  bandLabel: string;
  confidence?: string | null;
  rating?: string | null;
};

function bandTone(band: VaultScoreBand): CSSProperties {
  if (band === 'strongest') {
    return {
      background: 'rgba(212,175,55,0.18)',
      border: '1px solid rgba(212,175,55,0.45)',
      color: '#F2CF75',
    };
  }
  if (band === 'supportive') {
    return {
      background: 'rgba(212,175,55,0.10)',
      border: '1px solid rgba(212,175,55,0.28)',
      color: 'rgba(242,207,117,0.9)',
    };
  }
  return {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(212,175,55,0.14)',
    color: 'rgba(255,255,255,0.72)',
  };
}

/** Ranked calendar-day chip for Power hot / money / ghost. Non-interactive. */
export function VaultRankedDayChip({
  dateLabel,
  score,
  band,
  bandLabel,
  rating,
  title,
}: VaultRankedDayChipProps) {
  return (
    <div
      className="rounded-lg px-2.5 py-1.5"
      style={bandTone(band)}
      title={title}
    >
      <div className="fi text-[11px] leading-tight">{dateLabel}</div>
      <div className="fi text-[10px] leading-tight mt-0.5 opacity-90">
        {score}
        {rating ? ` · ${rating}` : ''}
        {' · '}
        {bandLabel}
      </div>
    </div>
  );
}

/** Yes Day decision slot (Ask / Commit / Sign). Non-interactive. */
export function VaultYesDecisionSlot({
  label,
  dateLabel,
  score,
  band,
  bandLabel,
  confidence,
  rating,
}: VaultYesDecisionSlotProps) {
  return (
    <div className="rounded-lg px-2.5 py-2" style={bandTone(band)}>
      <div
        className="fi text-[10px] tracking-[0.18em] uppercase mb-1"
        style={{ color: 'rgba(212,175,55,0.75)' }}
      >
        {label}
      </div>
      <div className="fi text-[11px] leading-tight">
        {dateLabel}
        {' · '}
        {score}
        {' · '}
        {bandLabel}
        {confidence ? ` · ${confidence}` : ''}
        {rating ? ` · ${rating}` : ''}
      </div>
    </div>
  );
}
