'use client';

import { SemanticDebugPreview } from '@/components/decision-intelligence/SemanticDebugPreview';
import { PREVIEW_CHROME } from '@/lib/decision-intelligence/preview-copy';
import { asExplanation, explainFromAssessment } from '@/lib/decision-intelligence/explain';
import { isDecisionSemanticsPreviewEnabled } from '@/lib/decision-intelligence/preview-flag';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import type { AppLang } from '@/lib/app-settings';
import type { SemanticPreviewLocale } from '@/lib/decision-intelligence/types';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function PackageSemanticPreview({
  package: pkg,
  lang,
  forceEnabled = false,
}: {
  package: DecisionEvaluationPackage;
  lang: AppLang;
  forceEnabled?: boolean;
}) {
  const enabled = forceEnabled || isDecisionSemanticsPreviewEnabled();
  if (!enabled) return null;

  const locale = lang as SemanticPreviewLocale;
  const chrome = PREVIEW_CHROME[locale] ?? PREVIEW_CHROME.en;
  const shadow = pkg.semantic_shadow;
  const optionLabels: Record<string, string> = {};
  for (const candidate of pkg.timing.candidates) {
    if (candidate.option_id) {
      optionLabels[candidate.option_id] = candidate.label || candidate.date;
    }
  }

  if (pkg.mode === 'compare_dates') {
    const ranked = [...pkg.timing.candidates].sort((a, b) => a.rank - b.rank);
    const assessments = shadow?.assessments ?? [];
    const pairs = shadow?.explanations ?? [];
    const policies = shadow?.policy_pairs ?? [];
    return (
      <div data-testid="package-semantic-preview" data-mode="compare_dates">
        <p className="fi text-[11px] text-white/50 mb-2">{chrome.legacyUnchanged}</p>
        <ol data-testid="semantic-compare-options" className="space-y-2 mb-3">
          {ranked.map((option) => {
            const assessment =
              assessments.find(
                (item) =>
                  asRecord(item)?.option_id === option.option_id ||
                  asRecord(item)?.id === option.option_id
              ) ?? null;
            const explanation = explainFromAssessment(asRecord(assessment));
            return (
              <li
                key={option.option_id ?? option.date}
                data-testid="semantic-compare-option"
                data-option-id={option.option_id}
                data-rank={option.rank}
              >
                <p className="fi text-[12px] text-white/70">
                  {option.rank}. {option.label || option.date} — {option.score}
                </p>
                <SemanticDebugPreview
                  forceEnabled={forceEnabled}
                  explanation={explanation}
                  assessment={asRecord(assessment)}
                  score={option.score}
                  locale={locale}
                />
              </li>
            );
          })}
        </ol>
        {pairs.map((item, index) => (
          <SemanticDebugPreview
            key={`pair-${index}`}
            forceEnabled={forceEnabled}
            explanation={asExplanation(item)}
            policy={asRecord(policies[index])}
            locale={locale}
            displayContext={{ option_labels: optionLabels }}
          />
        ))}
        {!pairs.length && !assessments.length ? (
          <SemanticDebugPreview forceEnabled={forceEnabled} locale={locale} />
        ) : null}
      </div>
    );
  }

  if (pkg.mode === 'find_dates') {
    const windows = [...(pkg.find?.windows ?? [])].sort((a, b) => a.rank - b.rank);
    const windowExplanations = shadow?.window_explanations ?? [];
    const windowPolicies = shadow?.window_policies ?? [];
    return (
      <div data-testid="package-semantic-preview" data-mode="find_dates">
        <p className="fi text-[11px] text-white/50 mb-2">{chrome.legacyUnchanged}</p>
        {windows.map((window) => {
          const policy =
            windowPolicies.find(
              (item) => asRecord(item)?.window_id === window.window_id
            ) ?? null;
          const explanation =
            windowExplanations.find((item) => {
              const args = asRecord(asRecord(item)?.localization_args);
              return args?.window_id === window.window_id;
            }) ?? windowExplanations[window.rank - 1];
          const classes = asRecord(policy)?.dimension_classes;
          return (
            <div
              key={window.window_id}
              data-testid="semantic-find-window"
              data-window-id={window.window_id}
              data-rank={window.rank}
            >
              <p className="fi text-[12px] text-white/70">
                {window.rank}. {window.start_date}–{window.end_date} — {window.peak_score}
              </p>
              <SemanticDebugPreview
                forceEnabled={forceEnabled}
                explanation={asExplanation(explanation)}
                policy={asRecord(policy)}
                score={window.peak_score}
                locale={locale}
                extra={{
                  windowKind:
                    typeof asRecord(policy)?.find_window_kind === 'string'
                      ? String(asRecord(policy)?.find_window_kind)
                      : undefined,
                  daySequence: Array.isArray(classes)
                    ? classes.map(String)
                    : undefined,
                }}
              />
            </div>
          );
        })}
        {!windows.length ? (
          <SemanticDebugPreview forceEnabled={forceEnabled} locale={locale} />
        ) : null}
      </div>
    );
  }

  const explanation =
    asExplanation(shadow?.explanation) ??
    explainFromAssessment(asRecord(shadow?.assessments?.[0]), asRecord(shadow?.policy));
  return (
    <div data-testid="package-semantic-preview" data-mode="evaluate_date">
      <SemanticDebugPreview
        forceEnabled={forceEnabled}
        explanation={explanation}
        policy={asRecord(shadow?.policy)}
        assessment={asRecord(shadow?.assessments?.[0])}
        score={pkg.timing.score}
        locale={locale}
      />
    </div>
  );
}
