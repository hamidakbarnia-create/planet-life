'use client';

import type { ReactNode } from 'react';
import { TimingStrengthText } from '@/components/ui/TimingStrengthText';
import type { AppLang } from '@/lib/app-settings';
import type { AskEvaluatePresentation } from '@/lib/ask-product';
import { getAskProductCopy } from '@/lib/ask-product';
import {
  AgencyLine,
  CautionDrivers,
  ConfidenceIndicator,
  EvidenceDrivers,
  LimitsBlock,
  NextStepsBlock,
  RecommendationCard,
  ResultEvidenceGrid,
  ResultHeader,
  ResultShell,
  VerdictCard,
} from '@/components/decision-result/ResultShell';

/**
 * Consumer Evaluate result — polarity-split evidence, honest timing score.
 *
 * `narrative="chrome"` keeps date, score, confidence, limits and agency, and
 * drops the generic recommendation / meaning / evidence / next-step copy.
 * Offer Negotiation uses that mode so its specific panel is the only reading.
 *
 * Optional chrome slots (`insight`, `verdictOverride`, compact limits) are
 * presentation-only and default off so other Decision Types stay unchanged.
 * `omitAgency` is Offer Negotiation only — the panel already has the next step.
 */
export function EvaluateProductResult({
  lang,
  model,
  narrative = 'full',
  insight = null,
  verdictOverride = null,
  omitLimitsScope = false,
  isolateDates = false,
  compact = false,
  omitAgency = false,
}: {
  lang: AppLang;
  model: AskEvaluatePresentation;
  narrative?: 'full' | 'chrome';
  insight?: ReactNode;
  verdictOverride?: string | null;
  omitLimitsScope?: boolean;
  isolateDates?: boolean;
  compact?: boolean;
  omitAgency?: boolean;
}) {
  const copy = getAskProductCopy(lang);
  const full = narrative === 'full';
  const verdict = verdictOverride ?? model.verdict;
  return (
    <ResultShell
      testId="evaluate-product-result"
      mode="evaluate_date"
      dir={copy.dir}
      ariaLabel={copy.resultRecommendation}
      compact={compact}
    >
      {/* 1–2. Recommendation / answer + primary date */}
      <ResultHeader
        eyebrow={copy.resultRecommendation}
        topic={model.topic}
        datePrimary={model.date.primary}
        dateSecondary={model.date.secondary}
        isolateDates={isolateDates}
      />

      {full ? (
        <RecommendationCard
          label={copy.resultRecommendation}
          body={model.recommendation}
          detail={model.recommendationDetail}
        />
      ) : null}

      <VerdictCard
        verdict={verdict}
        extraTestId={verdictOverride ? 'offer-negotiation-headline' : undefined}
        scoreLabel={
          model.scoreLabel ? (
            <TimingStrengthText formatted={model.scoreLabel} />
          ) : null
        }
        scoreHint={model.scoreHonestyNote}
        meaning={full ? model.meaning : null}
      />

      {insight}

      {full ? (
        <>
          {/* 3. Why / evidence */}
          <ResultEvidenceGrid>
            <EvidenceDrivers
              label={copy.evidenceSupportSection}
              items={model.supportiveEvidence.map((line) => ({
                id: line.id,
                title: line.title,
                detail: line.detail,
              }))}
            />
            <CautionDrivers
              label={copy.evidenceCautionSection}
              items={model.cautionaryEvidence.map((line) => ({
                id: line.id,
                title: line.title,
                detail: line.detail,
              }))}
            />
          </ResultEvidenceGrid>

          {model.contextEvidence.length > 0 ? (
            <EvidenceDrivers
              label={copy.evidenceContextSection}
              items={model.contextEvidence.map((line) => ({
                id: line.id,
                title: line.title,
                detail: line.detail,
              }))}
            />
          ) : null}

          <NextStepsBlock label={copy.nextStepsLabel} steps={model.nextSteps} />
        </>
      ) : null}

      {/* 4. Confidence (secondary; must not dominate the answer) */}
      {model.confidence ? (
        <ConfidenceIndicator
          label={copy.resultConfidence}
          value={model.confidence}
        />
      ) : null}

      {/* 5. Limits */}
      <LimitsBlock
        label={copy.limitsLabel}
        scope={omitLimitsScope ? null : model.scope}
        limits={model.packageLimits}
      />

      {omitAgency ? null : <AgencyLine text={model.agencyLine} />}
    </ResultShell>
  );
}
