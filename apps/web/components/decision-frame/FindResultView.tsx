import {
  AgencyLine,
  ConfidenceIndicator,
  LimitsBlock,
  ResultHeader,
  ResultMetricsRow,
  ResultShell,
  resultShellStyles as styles,
} from '@/components/decision-result/ResultShell';
import { LtrIsolate } from '@/components/ui/LtrIsolate';
import {
  getAskProductCopy,
  localizeConfidence,
  localizeStrength,
} from '@/lib/ask-product';
import type { FindResultViewModel } from '@/lib/decision-frame';
import type { AppLang } from '@/lib/app-settings';
import { useAppLang } from '@/lib/use-app-lang';

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

  const headline = model.unique_dominant
    ? copy.findHeadlineDominant
    : model.windows.length > 0
      ? copy.findHeadlineComparable
      : copy.findHeadlineNone;

  const honestyNote = model.unique_dominant
    ? copy.findHonestyDominant
    : model.windows.length > 0
      ? copy.findHonestyComparable
      : copy.findHonestyNone;

  const confidenceLabel =
    localizeConfidence(lang, model.confidence) ?? copy.confidence.medium;

  return (
    <ResultShell
      testId="find-result-view"
      mode="find_dates"
      dir={copy.dir}
      ariaLabel={copy.findResultTitle}
    >
      <ResultHeader
        eyebrow={copy.findResultTitle}
        topic={headline}
        topicTestId="find-headline"
      />
      <p className={`fi ${styles.scoreHint}`} data-testid="find-honesty">
        {honestyNote}
      </p>

      {model.windows.length > 0 ? (
        <section aria-label={copy.findWindowsLabel}>
          <p className={`fi ${styles.sectionLabel}`}>{copy.findWindowsLabel}</p>
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
                  {window.peak_score != null
                    ? ` · ${copy.timingScoreOf(window.peak_score)}`
                    : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section aria-label={copy.findWindowsLabel}>
          <p className={`fi ${styles.sectionLabel}`}>{copy.findWindowsLabel}</p>
          <p className={`fi ${styles.meaning}`} data-testid="find-windows-empty">
            {copy.findWindowsEmpty}
          </p>
        </section>
      )}

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
        <ResultMetricsRow>
          <ConfidenceIndicator
            label={copy.resultConfidence}
            value={confidenceLabel}
          />
        </ResultMetricsRow>
      </div>

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
