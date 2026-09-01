import {
  AgencyLine,
  ConfidenceIndicator,
  LimitsBlock,
  ResultHeader,
  ResultShell,
  resultShellStyles as styles,
} from '@/components/decision-result/ResultShell';
import { LtrIsolate } from '@/components/ui/LtrIsolate';
import { TimingStrengthText } from '@/components/ui/TimingStrengthText';
import {
  getAskProductCopy,
  localizeConfidence,
  localizeStrength,
} from '@/lib/ask-product';
import type { FindResultViewModel } from '@/lib/decision-frame';
import type { AppLang } from '@/lib/app-settings';
import { useAppLang } from '@/lib/use-app-lang';

function isInterviewFind(model: FindResultViewModel): boolean {
  return model.decision_type_id === 'car-interview';
}

export function FindResultView({
  model,
  lang: langProp,
}: {
  model: FindResultViewModel;
  lang?: AppLang;
}) {
  const [hookLang] = useAppLang();
  const lang = langProp ?? hookLang;
  const copy = getAskProductCopy(lang);
  const interview = isInterviewFind(model);

  const resultTitle = interview
    ? copy.findInterviewResultTitle
    : copy.findResultTitle;
  const headline = interview
    ? model.unique_dominant
      ? copy.findInterviewHeadlineDominant
      : model.windows.length > 0
        ? copy.findInterviewHeadlineComparable
        : copy.findInterviewHeadlineNone
    : model.unique_dominant
      ? copy.findHeadlineDominant
      : model.windows.length > 0
        ? copy.findHeadlineComparable
        : copy.findHeadlineNone;

  const whyNote = interview
    ? model.unique_dominant
      ? copy.findInterviewHonestyDominant
      : model.windows.length > 0
        ? copy.findInterviewHonestyComparable
        : copy.findInterviewHonestyNone
    : model.unique_dominant
      ? copy.findHonestyDominant
      : model.windows.length > 0
        ? copy.findHonestyComparable
        : copy.findHonestyNone;

  const windowsLabel = interview
    ? copy.findInterviewWindowsLabel
    : copy.findWindowsLabel;
  const windowsEmpty = interview
    ? copy.findInterviewWindowsEmpty
    : copy.findWindowsEmpty;

  const confidenceLabel =
    localizeConfidence(lang, model.confidence) ?? copy.confidence.medium;

  return (
    <ResultShell
      testId="find-result-view"
      mode="find_dates"
      dir={copy.dir}
      ariaLabel={resultTitle}
    >
      {/* 1. Recommendation */}
      <ResultHeader
        eyebrow={resultTitle}
        topic={headline}
        topicTestId="find-headline"
        datePrimary={
          model.unique_dominant && model.primary_window_label
            ? model.primary_window_label
            : undefined
        }
      />

      {/* 2. Best window(s) */}
      {model.windows.length > 0 ? (
        <section aria-label={windowsLabel}>
          <p className={`fi ${styles.sectionLabel}`}>{windowsLabel}</p>
          <ul className={styles.findWindows} data-testid="find-windows">
            {model.windows.map((window) => (
              <li
                key={window.window_id}
                className={styles.findWindow}
                data-testid="find-window"
                data-window-id={window.window_id}
                data-band={window.band}
              >
                <p
                  className={`fc ${styles.optionLabel}`}
                  data-testid="find-window-range"
                >
                  <LtrIsolate>{window.range_label}</LtrIsolate>
                </p>
                <p className={`fi ${styles.recommendationDetail}`}>
                  {copy.findPeakLabel}:{' '}
                  {window.peak_labels.length ? (
                    <LtrIsolate>{window.peak_labels.join(', ')}</LtrIsolate>
                  ) : (
                    '—'
                  )}
                </p>
                <p className={`fi ${styles.meaning}`}>
                  {localizeStrength(lang, window.strength) ?? window.strength}
                </p>
                {window.peak_score != null ? (
                  <p
                    className={`fi ${styles.scoreHint}`}
                    data-testid="find-window-score"
                  >
                    <TimingStrengthText
                      formatted={copy.timingScoreOf(window.peak_score)}
                    />
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section aria-label={windowsLabel}>
          <p className={`fi ${styles.sectionLabel}`}>{windowsLabel}</p>
          <p className={`fi ${styles.meaning}`} data-testid="find-windows-empty">
            {windowsEmpty}
          </p>
        </section>
      )}

      {/* 3. Why */}
      <section aria-label={copy.resultWhy}>
        <p className={`fi ${styles.sectionLabel}`}>{copy.resultWhy}</p>
        <p className={`fi ${styles.meaning}`} data-testid="find-honesty">
          {whyNote}
        </p>
      </section>

      {/* 4. Confidence + scanned range (secondary; must not dominate recommendation) */}
      <div className={styles.metaGrid}>
        <div className={styles.metaRow}>
          <p className={`fi ${styles.sectionLabel}`}>{copy.findRangeLabel}</p>
          <p className={`fi ${styles.datePrimary}`} data-testid="find-range">
            {model.range_context ? (
              <LtrIsolate>{model.range_context}</LtrIsolate>
            ) : (
              '—'
            )}
          </p>
        </div>
        <ConfidenceIndicator
          label={copy.resultConfidence}
          value={confidenceLabel}
        />
      </div>

      {/* 5. Limits */}
      <LimitsBlock
        label={copy.limitsLabel}
        limits={model.limitations}
        listTestId="find-limits"
      />

      {model.unknown && model.unknown.length > 0 ? (
        <section aria-label={copy.limitsLabel}>
          <ul className={`fi ${styles.limitsList}`} data-testid="find-unknown">
            {model.unknown.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <AgencyLine text={copy.agencyLine} />
    </ResultShell>
  );
}
