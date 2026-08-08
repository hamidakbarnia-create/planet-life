import {
  AgencyLine,
  ConfidenceIndicator,
  LimitsBlock,
  ResultHeader,
  ResultMetricsRow,
  ResultShell,
  resultShellStyles as styles,
} from '@/components/decision-result/ResultShell';
import {
  getAskProductCopy,
  localizeConfidence,
  localizeStrength,
} from '@/lib/ask-product';
import type { CompareResultViewModel } from '@/lib/decision-frame';
import { useAppLang } from '@/lib/use-app-lang';

export function CompareResultView({
  model,
  lang: langProp,
}: {
  model: CompareResultViewModel;
  lang?: 'en' | 'fa' | 'ar' | 'ru';
}) {
  const [hookLang] = useAppLang();
  const lang = langProp ?? hookLang;
  const copy = getAskProductCopy(lang);
  const confidenceLabel =
    localizeConfidence(lang, model.confidence) ?? copy.confidence.medium;

  return (
    <ResultShell
      testId="compare-result-view"
      mode="compare_dates"
      dir={copy.dir}
      ariaLabel={copy.compareResultTitle}
    >
      <ResultHeader
        eyebrow={
          model.unique_winner
            ? copy.compareWinnerLabel
            : copy.compareTiedLabel
        }
        topic={
          model.unique_winner ? model.winner_label : copy.compareTiedLabel
        }
        topicTestId="compare-winner"
      />

      <section aria-label={copy.compareOptionsLabel}>
        <p className={`fi ${styles.sectionLabel}`}>{copy.compareOptionsLabel}</p>
        <div className={styles.compareRankRow} data-testid="compare-options">
          {model.options.map((option) => {
            const isLead =
              model.unique_winner &&
              option.rank === 1 &&
              option.label === model.winner_label;
            return (
              <div
                key={option.option_id ?? option.label}
                className={`${styles.compareOption} ${
                  isLead
                    ? styles.compareOptionLead
                    : !model.unique_winner
                      ? styles.compareOptionTied
                      : ''
                }`}
                data-testid="compare-option"
                data-option-id={option.option_id}
                data-rank={option.rank}
              >
                <p className={`fi ${styles.rank}`}>
                  {option.rank != null ? copy.compareRankOf(option.rank) : ''}
                </p>
                <p className={`fc ${styles.optionLabel}`}>{option.label}</p>
                {option.date ? (
                  <p className={`fi ${styles.datePrimary}`}>{option.date}</p>
                ) : null}
                <p className={`fi ${styles.meaning}`}>
                  {localizeStrength(lang, option.strength) ?? option.strength}
                </p>
                {option.score != null ? (
                  <p className={`fi ${styles.score}`}>
                    {copy.timingScoreOf(option.score)}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {model.relative_explanation ? (
        <section data-testid="compare-relative-why">
          <p className={`fi ${styles.sectionLabel}`}>{copy.compareRelativeWhy}</p>
          <p className={`fi ${styles.recommendationDetail}`}>
            {model.relative_explanation}
          </p>
        </section>
      ) : null}

      {model.advantages.length > 0 ? (
        <div className={styles.metaGrid}>
          {model.advantages.map((item) => (
            <div
              key={`${item.option_label}-${item.advantage}`}
              className={styles.metaRow}
            >
              <p className={`fi ${styles.sectionLabel}`}>{item.option_label}</p>
              <p className={`fi ${styles.recommendationDetail}`}>
                {item.advantage}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <ResultMetricsRow>
        <ConfidenceIndicator
          label={copy.resultConfidence}
          value={confidenceLabel}
        />
      </ResultMetricsRow>

      <LimitsBlock label={copy.limitsLabel} limits={model.limitations} />

      <AgencyLine text={copy.agencyLine} />
    </ResultShell>
  );
}
