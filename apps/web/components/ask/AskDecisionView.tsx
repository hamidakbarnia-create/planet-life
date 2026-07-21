'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { BAND_STYLES, scoreToBand } from '@/lib/calendar-scores';
import type { AskDecisionResult, ClarificationState } from '@/lib/ask-decision';
import { trackAskDecisionEvent } from '@/lib/ask-decision';

function ScoreMeter({
  label,
  value,
  rationale,
}: {
  label: string;
  value: number;
  rationale: string;
}) {
  const band = scoreToBand(value);
  const style = BAND_STYLES[band];
  return (
    <div
      className="rounded-xl border p-3"
      style={{ borderColor: style.border, background: style.bg }}
      data-testid={`ask-score-${label.toLowerCase()}`}
      aria-label={`${label}: ${value} out of 100. ${rationale}`}
    >
      <div className="fi text-[10px] uppercase tracking-[0.16em]" style={{ color: style.text }}>
        {label}
      </div>
      <div className="fc text-3xl font-semibold mt-1 tabular-nums" style={{ color: style.text }}>
        {value}
      </div>
      <p className="fi text-[11px] mt-1 text-white/55 leading-snug">{rationale}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="fi text-[10px] uppercase tracking-[0.18em] text-white/45 mb-3">
      {children}
    </h3>
  );
}

const LOADING_STAGES = [
  'Framing your decision',
  'Applying your intelligence profile',
  'Checking timing context',
  'Building your recommendation',
] as const;

export function AskDecisionView({
  result,
  loading,
  loadingStage,
  clarification,
  pendingClarification,
  onClarify,
  onContinueWithAssumptions,
  onRetry,
  onFollowUp,
  error,
  profileMissing,
}: {
  result: AskDecisionResult | null;
  loading?: boolean;
  loadingStage?: string;
  clarification?: ClarificationState | null;
  pendingClarification?: boolean;
  onClarify?: (answer: string) => void;
  onContinueWithAssumptions?: () => void;
  onRetry?: () => void;
  onFollowUp?: (question: string) => void;
  error?: string | null;
  profileMissing?: boolean;
}) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const clarifyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (result && !loading && !pendingClarification) {
      summaryRef.current?.focus();
    }
  }, [result, loading, pendingClarification]);

  if (loading && !result) {
    const stage = loadingStage ?? LOADING_STAGES[0];
    return (
      <div
        className="rounded-xl border border-white/10 bg-black/20 p-6 mb-6"
        data-testid="ask-decision-loading"
        aria-busy="true"
        aria-live="polite"
      >
        <p className="fi text-sm text-white/70">{stage}</p>
        <ol className="mt-3 space-y-1">
          {LOADING_STAGES.map((label) => (
            <li
              key={label}
              className={`fi text-xs ${label === stage ? 'text-[#93B4FF]' : 'text-white/35'}`}
            >
              {label}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (pendingClarification && clarification?.question) {
    return (
      <div
        className="mb-6 space-y-4"
        data-testid="ask-clarification"
        aria-live="polite"
      >
        <GlassCard variant="signature" className="p-5 space-y-3">
          <SectionTitle>One clarification</SectionTitle>
          <p className="fi text-sm text-white/85">{clarification.question}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = clarifyRef.current?.value?.trim() ?? '';
              if (value) onClarify?.(value);
            }}
            className="space-y-3"
          >
            <label htmlFor="ask-clarify-input" className="fi text-xs text-white/50 block">
              Your answer
            </label>
            <input
              ref={clarifyRef}
              id="ask-clarify-input"
              className="w-full fi text-sm px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
              maxLength={240}
            />
            <button
              type="submit"
              className="w-full fc py-3 rounded-xl text-sm"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#0a0a0a',
              }}
            >
              Continue analysis
            </button>
          </form>
          {clarification.canContinueWithAssumptions ? (
            <button
              type="button"
              onClick={() => onContinueWithAssumptions?.()}
              className="fi text-xs text-white/55 underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              Continue with assumptions
            </button>
          ) : null}
        </GlassCard>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div
        className="rounded-xl border border-amber-400/30 bg-black/20 p-6 mb-6 space-y-3"
        data-testid="ask-decision-error"
        role="alert"
        aria-live="assertive"
      >
        <h2 className="fc text-base text-white">Decision briefing unavailable</h2>
        <p className="fi text-sm text-white/70">{error}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="fi text-sm px-3.5 py-2 rounded-xl border border-white/20 text-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  if (!result) return null;

  const {
    executiveSummary,
    recommendation,
    recommendationStatus,
    scores,
    analysis,
    timing,
    scenarios,
    actionPlan,
    alternatives,
    assumptions,
    confidence,
    limitations,
    relatedModules,
    followUpQuestions,
    safetyNotice,
    decisionFrame,
    intent,
  } = result;

  return (
    <div
      className="mb-6"
      data-testid="ask-decision-engine"
      data-ask-layout="decision-intelligence-v3"
    >
      {profileMissing ? (
        <p className="fi text-xs text-[#93B4FF] mb-3" data-testid="ask-profile-hint">
          Complete your profile to improve personalisation — Ask still works without it.
        </p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
          {/* Desktop: analysis after summary; Mobile: actions come first via order */}
          <div className="space-y-4 order-2 md:order-none" data-testid="ask-card-analysis">
            <SectionTitle>Analysis</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.map((card) => (
                <div key={card.id} data-testid={`ask-reasoning-${card.id}`}>
                  <GlassCard variant="secondary" className="p-4 space-y-2">
                    <h4 className="fc text-sm text-white">{card.title}</h4>
                    <p className="fi text-sm text-white/75 leading-relaxed">{card.body}</p>
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>

          <div data-testid="ask-card-scenarios">
            <SectionTitle>Scenarios</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(
                [
                  ['Best case', scenarios.bestCase],
                  ['Most likely', scenarios.mostLikely],
                  ['Downside', scenarios.downsideCase],
                ] as const
              ).map(([label, s]) => (
                <GlassCard key={label} variant="technical" className="p-4 space-y-2">
                  <p className="fc text-sm text-white">{label}</p>
                  <p className="fi text-xs text-white/45 uppercase tracking-widest">
                    {s.likelihoodBand}
                  </p>
                  <p className="fi text-sm text-white/80">{s.outcome}</p>
                  <p className="fi text-xs text-white/50">Mitigation: {s.mitigation}</p>
                </GlassCard>
              ))}
            </div>
          </div>

          {alternatives.length > 0 ? (
            <div data-testid="ask-card-alternatives">
              <SectionTitle>Alternatives</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {alternatives.map((alt) => (
                  <GlassCard key={alt.option} variant="technical" className="p-4 space-y-2">
                    <p className="fc text-sm text-white">{alt.option}</p>
                    <p className="fi text-xs text-[#93B4FF]">Best for: {alt.bestFor}</p>
                    <p className="fi text-xs text-white/60">Risk: {alt.risk}</p>
                  </GlassCard>
                ))}
              </div>
            </div>
          ) : null}

          <div data-testid="ask-card-assumptions">
            <GlassCard variant="secondary" className="p-4 space-y-2">
              <SectionTitle>Assumptions & gaps</SectionTitle>
              <ul className="space-y-1">
                {assumptions.map((a) => (
                  <li key={a} className="fi text-xs text-white/70">
                    · {a}
                  </li>
                ))}
                {limitations.slice(0, 3).map((l) => (
                  <li key={l} className="fi text-xs text-white/45">
                    · {l}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </div>

        <div className="space-y-4 order-1 lg:order-2">
          <div
            ref={summaryRef}
            tabIndex={-1}
            data-testid="ask-card-summary"
            className="outline-none"
          >
            <GlassCard variant="signature" className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="fi text-[10px] uppercase tracking-widest px-2 py-1 rounded-md border border-amber-400/30 text-amber-200"
                  data-testid="ask-recommendation-status"
                  aria-label={`Recommendation status: ${recommendationStatus}`}
                >
                  {recommendationStatus.replace(/-/g, ' ')}
                </span>
                <span
                  className="fi text-[10px] uppercase tracking-widest text-white/45"
                  data-testid="ask-detected-intent"
                >
                  {intent.primaryIntent}
                </span>
              </div>
              <SectionTitle>Recommendation</SectionTitle>
              <p className="fi text-sm text-white/90 leading-relaxed">{recommendation}</p>
              <p className="fi text-sm text-white/70 leading-relaxed">{executiveSummary}</p>
              <div data-testid="ask-card-confidence" className="pt-2 border-t border-white/5">
                <p className="fi text-[10px] uppercase tracking-widest text-white/40">Confidence</p>
                <p className="fc text-xl text-white" data-testid="ask-confidence-level">
                  {confidence.level} · {confidence.score}
                </p>
                <p className="fi text-xs text-white/55 mt-1">{confidence.explanation}</p>
              </div>
              {safetyNotice ? (
                <p className="fi text-xs text-amber-200/80" data-testid="ask-safety-notice">
                  {safetyNotice}
                </p>
              ) : null}
            </GlassCard>
          </div>

          <div data-testid="ask-card-actions" className="order-1">
            <GlassCard variant="action" className="p-5 space-y-3">
              <SectionTitle>Action plan</SectionTitle>
              {(
                [
                  ['Now', actionPlan.now],
                  ['Next 7 days', actionPlan.next7Days],
                  ['Next 30 days', actionPlan.next30Days],
                ] as const
              ).map(([label, items]) => (
                <div key={label}>
                  <p className="fi text-xs uppercase tracking-widest text-amber-400/80 mb-1">
                    {label}
                  </p>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li key={item.action} className="fi text-sm text-white/85">
                        <span className="text-white/40 text-[10px] uppercase mr-1">
                          {item.priority}
                        </span>
                        {item.action}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </GlassCard>
          </div>

          <div data-testid="ask-card-scores">
            <SectionTitle>Scores</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <ScoreMeter
                label="Opportunity"
                value={scores.opportunity.value}
                rationale={scores.opportunity.rationale}
              />
              <ScoreMeter label="Risk" value={scores.risk.value} rationale={scores.risk.rationale} />
              <ScoreMeter
                label="Timing"
                value={scores.timing.value}
                rationale={scores.timing.rationale}
              />
              <ScoreMeter
                label="Readiness"
                value={scores.readiness.value}
                rationale={scores.readiness.rationale}
              />
              <ScoreMeter
                label="Confidence"
                value={scores.confidence.value}
                rationale={scores.confidence.rationale}
              />
            </div>
          </div>

          <div data-testid="ask-card-timing">
            <GlassCard variant="primary" className="p-4 space-y-2">
              <SectionTitle>Timing</SectionTitle>
              {!timing.applicable ? (
                <p className="fi text-xs text-white/55">Not applicable for this question.</p>
              ) : !timing.available ? (
                <p className="fi text-xs text-white/55">Timing data unavailable.</p>
              ) : (
                <>
                  {(
                    [
                      ['Today', timing.today],
                      ['Next 7 days', timing.next7Days],
                      ['Best window', timing.bestWindow],
                      ['Caution', timing.cautionWindow],
                    ] as const
                  ).map(([label, w]) =>
                    w ? (
                      <div key={label} className="flex justify-between gap-2 text-sm">
                        <span className="fi text-white/55">{label}</span>
                        <span className="fc tabular-nums text-white">{w.score ?? '—'}</span>
                      </div>
                    ) : null
                  )}
                  <p className="fi text-xs text-white/45">{timing.timingRationale}</p>
                </>
              )}
            </GlassCard>
          </div>

          {relatedModules.length > 0 ? (
            <div data-testid="ask-card-modules">
              <SectionTitle>Related modules</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {relatedModules.map((mod) => (
                  <Link
                    key={mod.module}
                    href={mod.route}
                    className="fi text-sm px-3 py-2 rounded-xl border border-white/15 text-white/80 hover:border-amber-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
                    title={mod.reason}
                    data-testid={`ask-module-${mod.module}`}
                    onClick={() =>
                      trackAskDecisionEvent('ask_module_opened', { module: mod.module })
                    }
                  >
                    {mod.actionLabel}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {result.meta?.fallback && onRetry ? (
            <button
              type="button"
              onClick={() => {
                trackAskDecisionEvent('ask_retry', { intent: intent.primaryIntent });
                onRetry();
              }}
              className="w-full fi text-sm py-2.5 rounded-xl border border-white/15 text-white/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
              data-testid="ask-retry"
            >
              Retry full briefing
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5" data-testid="ask-card-followups">
        <GlassCard variant="primary" className="p-5 space-y-2">
          <SectionTitle>Follow-up questions</SectionTitle>
          <ul className="space-y-2">
            {followUpQuestions.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  className="fi text-sm text-left text-[#93B4FF] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
                  onClick={() => {
                    trackAskDecisionEvent('ask_followup_selected', {
                      intent: intent.primaryIntent,
                    });
                    onFollowUp?.(q);
                  }}
                >
                  · {q}
                </button>
              </li>
            ))}
          </ul>
          <p className="fi text-[10px] text-white/35 pt-2">
            Urgency: {decisionFrame.urgency} · Horizon: {decisionFrame.timeHorizon}
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
