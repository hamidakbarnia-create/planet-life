'use client';

import type { AppLang } from '@/lib/app-settings';
import type { AskEvaluatePresentation } from '@/lib/ask-product';
import { getAskProductCopy } from '@/lib/ask-product';
import styles from './evaluate-product-result.module.css';

/** Consumer Evaluate result — no Unknown filler rows, no engine jargon. */
export function EvaluateProductResult({
  lang,
  model,
}: {
  lang: AppLang;
  model: AskEvaluatePresentation;
}) {
  const copy = getAskProductCopy(lang);
  return (
    <article
      className={styles.result}
      data-testid="evaluate-product-result"
      dir={copy.dir}
      aria-label={copy.resultRecommendation}
    >
      <header className={styles.hero}>
        <p className={`fi ${styles.eyebrow}`}>{copy.resultRecommendation}</p>
        <h2 className={`fc ${styles.topic}`}>{model.topic}</h2>
        <p className={`fi ${styles.datePrimary}`} data-testid="result-date-primary">
          {model.date.primary}
        </p>
        {model.date.secondary ? (
          <p
            className={`fi ${styles.dateSecondary}`}
            data-testid="result-date-secondary"
          >
            {model.date.secondary}
          </p>
        ) : null}
        <p className={`fc ${styles.verdict}`} data-testid="result-verdict">
          {model.verdict}
        </p>
        {model.scoreLabel ? (
          <p className={`fi ${styles.score}`} data-testid="result-score">
            {model.scoreLabel}
          </p>
        ) : null}
        <p className={`fi ${styles.meaning}`} data-testid="result-meaning">
          {model.meaning}
        </p>
      </header>

      {model.evidence.length > 0 ? (
        <section aria-label={copy.resultWhy} className={styles.why}>
          <p className={`fi ${styles.label}`}>{copy.resultWhy}</p>
          <ul className={styles.evidenceList}>
            {model.evidence.map((line, index) => (
              <li key={`${line.title}-${index}`} className={styles.evidenceItem}>
                <p className={`fi ${styles.evidenceTitle}`}>{line.title}</p>
                {line.detail ? (
                  <p className={`fi ${styles.evidenceDetail}`}>{line.detail}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label={copy.resultScope} className={styles.scope}>
        <p className={`fi ${styles.label}`}>{copy.resultScope}</p>
        <p className={`fi ${styles.scopeBody}`}>{model.scope}</p>
      </section>

      {model.confidence ? (
        <section aria-label={copy.resultConfidence} className={styles.confidence}>
          <p className={`fi ${styles.label}`}>{copy.resultConfidence}</p>
          <p className={`fi ${styles.confidenceValue}`} data-testid="result-confidence">
            {model.confidence}
          </p>
        </section>
      ) : null}

      <p className={`fi ${styles.agency}`}>{model.agencyLine}</p>
    </article>
  );
}
