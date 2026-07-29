'use client';

import type { ScoreReasoning } from '@/lib/score-reasoning';

export type WhyThisTimingLabels = {
  dir: 'ltr' | 'rtl';
  whyTiming: string;
  supportingReasons: string;
};

type Props = {
  labels: WhyThisTimingLabels;
  reasoning: ScoreReasoning | null | undefined;
  className?: string;
};

/**
 * Presentation-only: renders producer ScoreReasoning.summary / reasons when present.
 * Does not invent explanations or expose confidence as platform Confidence.
 */
export function WhyThisTiming({ labels: t, reasoning, className }: Props) {
  const summary = reasoning?.summary?.trim() ? reasoning.summary : null;
  if (!summary) return null;

  const reasons = reasoning?.reasons?.length ? reasoning.reasons : null;

  return (
    <div className={className} data-testid="calendar-why-timing">
      <div
        className="fi text-[10px] uppercase tracking-widest mb-2"
        style={{ color: 'rgba(255,255,255,0.35)' }}
      >
        {t.whyTiming}
      </div>
      <p
        className="fi text-sm leading-relaxed"
        style={{ color: 'rgba(255,255,255,0.78)' }}
        data-testid="calendar-why-timing-summary"
      >
        {summary}
      </p>
      {reasons ? (
        <details
          className="mt-3 rounded-lg px-3 py-2"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          dir={t.dir}
          data-testid="calendar-supporting-reasons"
        >
          <summary
            className="fi text-[11px] cursor-pointer select-none"
            style={{ color: 'rgba(212,175,55,0.85)' }}
          >
            {t.supportingReasons}
          </summary>
          <ul className="mt-2 space-y-2 list-none p-0 m-0">
            {reasons.map((reason, index) => (
              <li
                key={`${reason.category}-${reason.title}-${index}`}
                className="fi text-[11px] leading-snug"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                <span className="fc block" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {reason.title}
                </span>
                {reason.explanation}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
