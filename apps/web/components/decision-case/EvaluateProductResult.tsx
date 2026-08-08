'use client';

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
  ResultMetricsRow,
  ResultShell,
  VerdictCard,
} from '@/components/decision-result/ResultShell';

/** Consumer Evaluate result — polarity-split evidence, honest timing score. */
export function EvaluateProductResult({
  lang,
  model,
}: {
  lang: AppLang;
  model: AskEvaluatePresentation;
}) {
  const copy = getAskProductCopy(lang);
  return (
    <ResultShell
      testId="evaluate-product-result"
      mode="evaluate_date"
      dir={copy.dir}
      ariaLabel={copy.resultRecommendation}
    >
      <ResultHeader
        eyebrow={copy.resultRecommendation}
        topic={model.topic}
        datePrimary={model.date.primary}
        dateSecondary={model.date.secondary}
      />

      <ResultMetricsRow>
        <VerdictCard
          verdict={model.verdict}
          scoreLabel={model.scoreLabel}
          scoreHint={model.scoreHonestyNote}
          meaning={model.meaning}
        />
        {model.confidence ? (
          <ConfidenceIndicator
            label={copy.resultConfidence}
            value={model.confidence}
          />
        ) : null}
      </ResultMetricsRow>

      <RecommendationCard
        label={copy.resultRecommendation}
        body={model.recommendation}
        detail={model.recommendationDetail}
      />

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

      <LimitsBlock
        label={copy.limitsLabel}
        scope={model.scope}
        limits={model.packageLimits}
      />

      <AgencyLine text={model.agencyLine} />
    </ResultShell>
  );
}
