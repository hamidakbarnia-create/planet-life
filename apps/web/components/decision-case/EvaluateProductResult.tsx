'use client';

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
 */
export function EvaluateProductResult({
  lang,
  model,
  narrative = 'full',
}: {
  lang: AppLang;
  model: AskEvaluatePresentation;
  narrative?: 'full' | 'chrome';
}) {
  const copy = getAskProductCopy(lang);
  const full = narrative === 'full';
  return (
    <ResultShell
      testId="evaluate-product-result"
      mode="evaluate_date"
      dir={copy.dir}
      ariaLabel={copy.resultRecommendation}
    >
      {/* 1–2. Recommendation / answer + primary date */}
      <ResultHeader
        eyebrow={copy.resultRecommendation}
        topic={model.topic}
        datePrimary={model.date.primary}
        dateSecondary={model.date.secondary}
      />

      {full ? (
        <RecommendationCard
          label={copy.resultRecommendation}
          body={model.recommendation}
          detail={model.recommendationDetail}
        />
      ) : null}

      <VerdictCard
        verdict={model.verdict}
        scoreLabel={
          model.scoreLabel ? (
            <TimingStrengthText formatted={model.scoreLabel} />
          ) : null
        }
        scoreHint={model.scoreHonestyNote}
        meaning={full ? model.meaning : null}
      />

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
        scope={model.scope}
        limits={model.packageLimits}
      />

      <AgencyLine text={model.agencyLine} />
    </ResultShell>
  );
}
