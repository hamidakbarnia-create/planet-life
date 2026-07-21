'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { BAND_STYLES, scoreToBand } from '@/lib/calendar-scores';
import type { AskDecisionResult, ClarificationState } from '@/lib/ask-decision';
import { localizeAskDecisionPresentation } from '@/lib/ask-decision/localize-presentation';
import { trackAskDecisionEvent } from '@/lib/ask-decision';
import type { AppLang } from '@/lib/app-settings';
import {
  getDecisionUi,
  localizeActionPriority,
  localizeAnalysisTitle,
  localizeConfidenceLevel,
  localizeIntent,
  localizeLikelihoodBand,
  localizeRecommendationStatus,
  localizeTimeHorizon,
  localizeUrgency,
} from '@/lib/decision-ui-i18n';
import { localizeStyleTokensInText } from '@/lib/intelligence/intelligence-copy';

function ScoreMeter({
  label,
  value,
  rationale,
  outOf100,
  lang,
}: {
  label: string;
  value: number;
  rationale: string;
  outOf100: string;
  lang: AppLang;
}) {
  const band = scoreToBand(value);
  const style = BAND_STYLES[band];
  const localizedRationale = localizeStyleTokensInText(rationale, lang);
  return (
    <div
      className="rounded-xl border p-3"
      style={{ borderColor: style.border, background: style.bg }}
      data-testid={`ask-score-${label.toLowerCase().replace(/\s+/g, '-')}`}
      aria-label={`${label}: ${value} ${outOf100}. ${localizedRationale}`}
    >
      <div className="fi text-[10px] uppercase tracking-[0.16em]" style={{ color: style.text }}>
        {label}
      </div>
      <div className="fc text-3xl font-semibold mt-1 tabular-nums" style={{ color: style.text }}>
        {value}
      </div>
      <p className="fi text-[11px] mt-1 text-white/55 leading-snug">{localizedRationale}</p>
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
  lang = 'en',
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
  lang?: AppLang;
}) {
  const t = getDecisionUi(lang);
  const summaryRef = useRef<HTMLDivElement>(null);
  const clarifyRef = useRef<HTMLInputElement>(null);
  const loadingStages = t.loadingStages;
  const localizedResult =
    result && lang !== 'en'
      ? localizeAskDecisionPresentation(result, lang)
      : result;

  useEffect(() => {
    if (localizedResult && !loading && !pendingClarification) {
      summaryRef.current?.focus();
    }
  }, [localizedResult, loading, pendingClarification]);

  if (loading) {
    const stage = loadingStage ?? loadingStages[0];
    return (
      <div
        className="rounded-xl border border-white/10 bg-black/20 p-6 mb-6"
        data-testid="ask-decision-loading"
        aria-busy="true"
        aria-live="polite"
        dir={t.dir}
      >
        <p className="fi text-sm text-white/70">{stage}</p>
        <ol className="mt-3 space-y-1">
          {loadingStages.map((label) => (
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
        dir={t.dir}
      >
        <GlassCard variant="signature" className="p-5 space-y-3">
          <SectionTitle>{t.clarificationTitle}</SectionTitle>
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
              {t.yourAnswer}
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
              {t.continueAnalysis}
            </button>
          </form>
          {clarification.canContinueWithAssumptions ? (
            <button
              type="button"
              onClick={() => onContinueWithAssumptions?.()}
              className="fi text-xs text-white/55 underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              {t.continueWithAssumptions}
            </button>
          ) : null}
        </GlassCard>
      </div>
    );
  }

  if (error && !localizedResult) {
    return (
      <div
        className="rounded-xl border border-amber-400/30 bg-black/20 p-6 mb-6 space-y-3"
        data-testid="ask-decision-error"
        role="alert"
        aria-live="assertive"
        dir={t.dir}
      >
        <h2 className="fc text-base text-white">{t.errorTitle}</h2>
        <p className="fi text-sm text-white/70">{error}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="fi text-sm px-3.5 py-2 rounded-xl border border-white/20 text-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            {t.retry}
          </button>
        ) : null}
      </div>
    );
  }

  if (!localizedResult) return null;

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
  } = localizedResult;

  const statusLabel = localizeRecommendationStatus(recommendationStatus, lang);
  const intentLabel = localizeIntent(intent.primaryIntent, lang);

  return (
    <div
      className="mb-6"
      data-testid="ask-decision-engine"
      data-ask-layout="decision-intelligence-v3"
      data-lang={lang}
      dir={t.dir}
    >
      {profileMissing ? (
        <p className="fi text-xs text-[#93B4FF] mb-3" data-testid="ask-profile-hint">
          {t.profileHint}
        </p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
          <div className="space-y-4 order-2 md:order-none" data-testid="ask-card-analysis">
            <SectionTitle>{t.analysis}</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.map((card) => (
                <div key={card.id} data-testid={`ask-reasoning-${card.id}`}>
                  <GlassCard variant="secondary" className="p-4 space-y-2">
                    <h4 className="fc text-sm text-white">
                      {localizeAnalysisTitle(card.id, card.title, lang)}
                    </h4>
                    <p className="fi text-sm text-white/75 leading-relaxed">
                      {localizeStyleTokensInText(card.body, lang)}
                    </p>
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>

          <div data-testid="ask-card-scenarios">
            <SectionTitle>{t.scenarios}</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(
                [
                  [t.bestCase, scenarios.bestCase],
                  [t.mostLikely, scenarios.mostLikely],
                  [t.downside, scenarios.downsideCase],
                ] as const
              ).map(([label, s]) => (
                <GlassCard key={label} variant="technical" className="p-4 space-y-2">
                  <p className="fc text-sm text-white">{label}</p>
                  <p className="fi text-xs text-white/45 uppercase tracking-widest">
                    {localizeLikelihoodBand(s.likelihoodBand, lang)}
                  </p>
                  <p className="fi text-sm text-white/80">
                    {localizeStyleTokensInText(s.outcome, lang)}
                  </p>
                  <p className="fi text-xs text-white/50">
                    {t.mitigation}: {localizeStyleTokensInText(s.mitigation, lang)}
                  </p>
                </GlassCard>
              ))}
            </div>
          </div>

          {alternatives.length > 0 ? (
            <div data-testid="ask-card-alternatives">
              <SectionTitle>{t.alternatives}</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {alternatives.map((alt) => (
                  <GlassCard key={alt.option} variant="technical" className="p-4 space-y-2">
                    <p className="fc text-sm text-white">{localizeStyleTokensInText(alt.option, lang)}</p>
                    <p className="fi text-xs text-[#93B4FF]">
                      {t.bestFor}: {localizeStyleTokensInText(alt.bestFor, lang)}
                    </p>
                    <p className="fi text-xs text-white/60">
                      {t.risk}: {localizeStyleTokensInText(alt.risk, lang)}
                    </p>
                  </GlassCard>
                ))}
              </div>
            </div>
          ) : null}

          <div data-testid="ask-card-assumptions">
            <GlassCard variant="secondary" className="p-4 space-y-2">
              <SectionTitle>{t.assumptionsGaps}</SectionTitle>
              <ul className="space-y-1">
                {assumptions.map((a) => (
                  <li key={a} className="fi text-xs text-white/70">
                    · {localizeStyleTokensInText(a, lang)}
                  </li>
                ))}
                {limitations.slice(0, 3).map((l) => (
                  <li key={l} className="fi text-xs text-white/45">
                    · {localizeStyleTokensInText(l, lang)}
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
                  aria-label={`${t.recommendationStatusAria}: ${statusLabel}`}
                >
                  {statusLabel}
                </span>
                <span
                  className="fi text-[10px] uppercase tracking-widest text-white/45"
                  data-testid="ask-detected-intent"
                >
                  {intentLabel}
                </span>
              </div>
              <SectionTitle>{t.recommendation}</SectionTitle>
              <p className="fi text-sm text-white/90 leading-relaxed">
                {localizeStyleTokensInText(recommendation, lang)}
              </p>
              <p className="fi text-sm text-white/70 leading-relaxed">
                {localizeStyleTokensInText(executiveSummary, lang)}
              </p>
              <div data-testid="ask-card-confidence" className="pt-2 border-t border-white/5">
                <p className="fi text-[10px] uppercase tracking-widest text-white/40">
                  {t.confidence}
                </p>
                <p className="fc text-xl text-white" data-testid="ask-confidence-level">
                  {localizeConfidenceLevel(confidence.level, lang)} · {confidence.score}
                </p>
                <p className="fi text-xs text-white/55 mt-1">
                  {localizeStyleTokensInText(confidence.explanation, lang)}
                </p>
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
              <SectionTitle>{t.actionPlan}</SectionTitle>
              {(
                [
                  [t.now, actionPlan.now],
                  [t.next7Days, actionPlan.next7Days],
                  [t.next30Days, actionPlan.next30Days],
                ] as const
              ).map(([label, items]) => (
                <div key={label}>
                  <p className="fi text-xs uppercase tracking-widest text-amber-400/80 mb-1">
                    {label}
                  </p>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li
                        key={item.action}
                        className="fi text-sm text-white/85 flex items-start gap-2"
                      >
                        <span className="shrink-0 text-white/40 text-[10px] tracking-wide pt-0.5">
                          {localizeActionPriority(item.priority, lang)}
                        </span>
                        <span className="min-w-0 flex-1 leading-relaxed [overflow-wrap:anywhere]">
                          {localizeStyleTokensInText(item.action, lang)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </GlassCard>
          </div>

          <div data-testid="ask-card-scores">
            <SectionTitle>{t.scores}</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <ScoreMeter
                label={t.opportunity}
                value={scores.opportunity.value}
                rationale={scores.opportunity.rationale}
                outOf100={t.outOf100}
                lang={lang}
              />
              <ScoreMeter
                label={t.risk}
                value={scores.risk.value}
                rationale={scores.risk.rationale}
                outOf100={t.outOf100}
                lang={lang}
              />
              <ScoreMeter
                label={t.timing}
                value={scores.timing.value}
                rationale={scores.timing.rationale}
                outOf100={t.outOf100}
                lang={lang}
              />
              <ScoreMeter
                label={t.readiness}
                value={scores.readiness.value}
                rationale={scores.readiness.rationale}
                outOf100={t.outOf100}
                lang={lang}
              />
              <ScoreMeter
                label={t.confidence}
                value={scores.confidence.value}
                rationale={scores.confidence.rationale}
                outOf100={t.outOf100}
                lang={lang}
              />
            </div>
          </div>

          <div data-testid="ask-card-timing">
            <GlassCard variant="primary" className="p-4 space-y-2">
              <SectionTitle>{t.timingSection}</SectionTitle>
              {!timing.applicable ? (
                <p className="fi text-xs text-white/55">{t.timingNotApplicable}</p>
              ) : !timing.available ? (
                <p className="fi text-xs text-white/55">{t.timingUnavailable}</p>
              ) : (
                <>
                  {(
                    [
                      [t.today, timing.today],
                      [t.next7Days, timing.next7Days],
                      [t.bestWindow, timing.bestWindow],
                      [t.caution, timing.cautionWindow],
                    ] as const
                  ).map(([label, w]) =>
                    w ? (
                      <div key={label} className="flex justify-between gap-2 text-sm">
                        <span className="fi text-white/55">{label}</span>
                        <span className="fc tabular-nums text-white">{w.score ?? '—'}</span>
                      </div>
                    ) : null
                  )}
                  <p className="fi text-xs text-white/45">
                    {localizeStyleTokensInText(timing.timingRationale, lang)}
                  </p>
                </>
              )}
            </GlassCard>
          </div>

          {relatedModules.length > 0 ? (
            <div data-testid="ask-card-modules">
              <SectionTitle>{t.relatedModules}</SectionTitle>
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

          {localizedResult.meta?.fallback && onRetry ? (
            <button
              type="button"
              onClick={() => {
                trackAskDecisionEvent('ask_retry', { intent: intent.primaryIntent });
                onRetry();
              }}
              className="w-full fi text-sm py-2.5 rounded-xl border border-white/15 text-white/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
              data-testid="ask-retry"
            >
              {t.retryFull}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5" data-testid="ask-card-followups">
        <GlassCard variant="primary" className="p-5 space-y-2">
          <SectionTitle>{t.followUpQuestions}</SectionTitle>
          <ul className="space-y-2">
            {followUpQuestions.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  className="fi text-sm text-start text-[#93B4FF] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
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
            {t.urgency}: {localizeUrgency(decisionFrame.urgency, lang)} · {t.horizon}:{' '}
            {localizeTimeHorizon(decisionFrame.timeHorizon, lang)}
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
