'use client';

import { useState } from 'react';
import type { AppLang } from '@/lib/app-settings';
import {
  checkResponseLanguage,
  isEnglishDominantProse,
} from '@/lib/locale-language-guard';
import type { ScoreReason, ScoreReasoning } from '@/lib/score-reasoning';

export type WhyThisTimingLabels = {
  dir: 'ltr' | 'rtl';
  whyTiming: string;
  whyTimingFallback: string;
  supportingReasons: string;
  seeDetails?: string;
  hideDetails?: string;
};

type Props = {
  labels: WhyThisTimingLabels;
  lang: AppLang;
  reasoning: ScoreReasoning | null | undefined;
  className?: string;
  /** Hide the producer lead and keep full evidence behind disclosure. */
  compact?: boolean;
};

/** True when producer prose is acceptable for the active UI language. */
export function timingProseMatchesUiLang(text: string, lang: AppLang): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (lang === 'en') return true;
  if (isEnglishDominantProse(trimmed)) return false;
  return checkResponseLanguage(trimmed, lang).ok;
}

function localizedReasons(
  reasons: ScoreReason[] | undefined,
  lang: AppLang
): ScoreReason[] | null {
  if (!reasons?.length) return null;
  const kept = reasons.filter((reason) =>
    timingProseMatchesUiLang(`${reason.title}\n${reason.explanation}`, lang)
  );
  return kept.length ? kept : null;
}

export function splitTimingSummary(summary: string): {
  lead: string;
  details: string | null;
} {
  const trimmed = summary.trim();
  const match = trimmed.match(/^(.+?[.!?])\s+([\s\S]+)$/);
  if (!match) return { lead: trimmed, details: null };
  return { lead: match[1].trim(), details: match[2].trim() || null };
}

/**
 * Presentation-only: renders producer ScoreReasoning when it matches UI language.
 * For FA/AR/RU, English (or wrong-script) producer text is replaced by a localized fallback.
 * Does not invent explanations or expose confidence as platform Confidence.
 */
export function WhyThisTiming({
  labels: t,
  lang,
  reasoning,
  className,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const rawSummary = reasoning?.summary?.trim() ? reasoning.summary : null;
  if (!rawSummary) return null;

  const summaryMatches = timingProseMatchesUiLang(rawSummary, lang);
  const summary = summaryMatches ? rawSummary : t.whyTimingFallback;
  const reasons = summaryMatches
    ? localizedReasons(reasoning?.reasons, lang)
    : null;
  const split = summaryMatches ? splitTimingSummary(summary) : null;
  const lead = compact
    ? summaryMatches
      ? null
      : summary
    : (split?.lead ?? summary);
  const detailsText = compact
    ? summaryMatches
      ? summary
      : null
    : split?.details;
  const seeDetails = t.seeDetails ?? t.supportingReasons;
  const hideDetails = t.hideDetails ?? t.supportingReasons;
  const hasDetails = Boolean(detailsText || reasons);

  return (
    <div className={className} data-testid="calendar-why-timing" data-compact={compact ? 'true' : 'false'}>
      <div
        className="fi text-[10px] uppercase tracking-widest mb-2"
        style={{ color: 'rgba(255,255,255,0.35)' }}
      >
        {t.whyTiming}
      </div>
      {lead ? (
        <p
          className="fi text-sm leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.78)' }}
          data-testid="calendar-why-timing-summary"
          data-why-timing-fallback={summaryMatches ? 'false' : 'true'}
        >
          {lead}
        </p>
      ) : null}
      {hasDetails ? (
        <details
          className="mt-3 rounded-lg px-3 py-2"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          dir={t.dir}
          data-testid="calendar-supporting-reasons"
          onToggle={(event) =>
            setOpen((event.currentTarget as HTMLDetailsElement).open)
          }
        >
          <summary
            className="fi text-[11px] cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c5a059]"
            style={{ color: 'rgba(212,175,55,0.85)' }}
          >
            {open ? hideDetails : seeDetails}
          </summary>
          {detailsText ? (
            <p
              className="fi text-[12px] leading-relaxed mt-2"
              style={{ color: 'rgba(255,255,255,0.65)' }}
              data-testid="calendar-why-timing-details"
            >
              {detailsText}
            </p>
          ) : null}
          {reasons ? (
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
          ) : null}
        </details>
      ) : null}
    </div>
  );
}
