'use client';

import type { ScoreBreakdown } from '@/lib/score-breakdown';

export type ScoreBreakdownPanelProps = {
  breakdown: ScoreBreakdown | null | undefined;
  compact?: boolean;
  showDebug?: boolean;
};

const LOCATION_MODE_LABELS: Record<string, string> = {
  currentLiving: 'Current living location',
  eventLocation: 'Event location',
  targetSubject: 'Target location',
  birthOnly: 'Birth location',
  birthAndTarget: 'Birth + target location',
};

export function formatLocationModeLabel(mode: string): string {
  return LOCATION_MODE_LABELS[mode] ?? mode;
}

function formatComponentScore(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (rounded > 0) return `+${rounded}`;
  return String(rounded);
}

type RowProps = {
  label: string;
  value: string;
  testId?: string;
  emphasize?: boolean;
};

function DetailRow({ label, value, testId, emphasize }: RowProps) {
  return (
    <div
      className="flex justify-between gap-4 text-[11px]"
      data-testid={testId}
    >
      <span className="fi shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {label}
      </span>
      <span
        className={`fi text-right break-all ${emphasize ? 'fc' : ''}`}
        style={{ color: emphasize ? '#fbbf24' : 'rgba(255,255,255,0.85)' }}
      >
        {value}
      </span>
    </div>
  );
}

export function ScoreBreakdownPanel({
  breakdown,
  compact = false,
  showDebug = false,
}: ScoreBreakdownPanelProps) {
  if (!breakdown) return null;

  const padding = compact ? 'px-3 py-2.5' : 'px-4 py-3';
  const gap = compact ? 'gap-1.5' : 'gap-2';

  return (
    <div
      className={`w-full rounded-xl fi ${padding}`}
      data-testid="score-breakdown-panel"
      style={{
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      <div
        className={`flex flex-col ${gap}`}
        data-testid="score-breakdown-summary"
      >
        <DetailRow
          label="Calculated for"
          value={breakdown.calculatedFor}
          testId="score-breakdown-calculated-for"
        />
        <DetailRow
          label="Location mode"
          value={formatLocationModeLabel(breakdown.locationMode)}
          testId="score-breakdown-location-mode"
        />
        <DetailRow
          label="Location component score"
          value={formatComponentScore(breakdown.locationComponentScore)}
          testId="score-breakdown-location-component"
        />
        <DetailRow
          label="Final score"
          value={String(breakdown.finalScore)}
          testId="score-breakdown-final-score"
          emphasize
        />
      </div>

      <div
        className={`mt-2 pt-2 flex flex-col ${gap} border-t border-white/5`}
        data-testid="score-breakdown-components"
      >
        <div
          className="fi text-[10px] tracking-widest uppercase"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Score components
        </div>
        <DetailRow
          label="Aspect score"
          value={formatComponentScore(breakdown.aspectScore)}
          testId="score-breakdown-aspect"
        />
        <DetailRow
          label="Transit house score"
          value={formatComponentScore(breakdown.transitHouseScore)}
          testId="score-breakdown-transit-house"
        />
        <DetailRow
          label="Transit angular score"
          value={formatComponentScore(breakdown.transitAngularScore)}
          testId="score-breakdown-transit-angular"
        />
        <DetailRow
          label="Retrograde penalty"
          value={formatComponentScore(breakdown.retrogradePenalty)}
          testId="score-breakdown-retrograde"
        />
      </div>

      {showDebug && (
        <div
          className={`mt-2 pt-2 flex flex-col ${gap} border-t border-white/5`}
          data-testid="score-breakdown-debug"
        >
          <div
            className="fi text-[10px] tracking-widest uppercase"
            style={{ color: 'rgba(251,191,36,0.55)' }}
          >
            Debug
          </div>
          <DetailRow
            label="Local datetime"
            value={breakdown.resolvedLocalDatetime}
            testId="score-breakdown-local-datetime"
          />
          <DetailRow
            label="UTC datetime"
            value={breakdown.resolvedUtcDatetime}
            testId="score-breakdown-utc-datetime"
          />
          <DetailRow
            label="Timezone"
            value={breakdown.timezone}
            testId="score-breakdown-timezone"
          />
          <DetailRow
            label="Target time"
            value={breakdown.targetTime}
            testId="score-breakdown-target-time"
          />
          <DetailRow
            label="Natal house bonus"
            value={formatComponentScore(breakdown.natalHouseBonus)}
            testId="score-breakdown-natal-house"
          />
        </div>
      )}
    </div>
  );
}
