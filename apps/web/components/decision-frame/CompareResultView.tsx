import { getAskProductCopy } from '@/lib/ask-product';
import type { CompareResultViewModel } from '@/lib/decision-frame';
import { useAppLang } from '@/lib/use-app-lang';
import styles from './decision-frame.module.css';

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

  return (
    <article
      className={styles.result}
      data-testid="compare-result-view"
      data-operation="compare"
      aria-label={copy.compareResultTitle}
      dir={copy.dir}
    >
      <header className={styles.hero}>
        <p className={`fi ${styles.heroLabel}`}>
          {model.unique_winner
            ? copy.compareWinnerLabel
            : copy.compareTiedLabel}
        </p>
        <h2 className={`fc ${styles.heroValue}`} data-testid="compare-winner">
          {model.unique_winner ? model.winner_label : copy.compareTiedLabel}
        </h2>
      </header>

      <div className={styles.compareCols} data-testid="compare-options">
        {model.options.map((option) => (
          <div
            key={option.option_id ?? option.label}
            className={styles.compareCard}
            data-testid="compare-option"
            data-option-id={option.option_id}
            data-rank={option.rank}
          >
            <p className={`fi ${styles.label}`}>
              {option.rank != null ? `#${option.rank}` : ''}
            </p>
            <p className={`fc ${styles.heroValue}`} style={{ fontSize: '1.2rem' }}>
              {option.label}
            </p>
            {option.date ? (
              <p className={`fi ${styles.value}`}>{option.date}</p>
            ) : null}
            <p className={`fi ${styles.value}`}>{option.strength}</p>
            {option.score != null ? (
              <p className={`fi ${styles.value}`}>
                {copy.resultScoreOf(option.score)}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {model.relative_explanation ? (
        <div className={styles.metaRow} data-testid="compare-relative-why">
          <p className={`fi ${styles.label}`}>{copy.compareRelativeWhy}</p>
          <p className={`fi ${styles.value}`}>{model.relative_explanation}</p>
        </div>
      ) : null}

      {model.advantages.length > 0 ? (
        <div className={styles.metaGrid}>
          {model.advantages.map((item) => (
            <div
              key={`${item.option_label}-${item.advantage}`}
              className={styles.metaRow}
            >
              <p className={`fi ${styles.label}`}>{item.option_label}</p>
              <p className={`fi ${styles.value}`}>{item.advantage}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className={styles.metaRow}>
        <p className={`fi ${styles.label}`}>{copy.resultConfidence}</p>
        <p className={`fi ${styles.value}`}>{model.confidence}</p>
      </div>

      {model.limitations && model.limitations.length > 0 ? (
        <section className={styles.belowFold} aria-label={copy.resultScope}>
          <p className={`fi ${styles.label}`}>{copy.resultScope}</p>
          <ul className={`fi ${styles.value}`}>
            {model.limitations.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className={`fi ${styles.notice}`}>{copy.agencyLine}</p>
    </article>
  );
}
