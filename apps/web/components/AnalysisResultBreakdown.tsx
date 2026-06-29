'use client';

import { ScoreBreakdownPanel } from '@/components/ScoreBreakdownPanel';
import type { ScoreBreakdown } from '@/lib/score-breakdown';

export type AnalysisResultBreakdownProps = {
  breakdown?: ScoreBreakdown | null;
  compact?: boolean;
};

/** Shared score breakdown slot for Ask and analyze result panels. */
export function AnalysisResultBreakdown({
  breakdown,
  compact = false,
}: AnalysisResultBreakdownProps) {
  return (
    <div
      className={compact ? 'mt-2' : 'mt-3'}
      data-testid="analysis-result-breakdown"
    >
      <ScoreBreakdownPanel breakdown={breakdown} compact={compact} />
    </div>
  );
}
