import type { EvaluateResultViewModel } from '@/lib/decision-frame';
import styles from './decision-frame.module.css';

export function EvaluateResultView({
  model,
}: {
  model: EvaluateResultViewModel;
}) {
  return (
    <article
      className={styles.result}
      data-testid="evaluate-result-view"
      data-operation="evaluate"
      aria-label="Evaluate result"
    >
      <header className={styles.hero}>
        <p className={`fi ${styles.heroLabel}`}>Recommendation</p>
        <h2 className={`fc ${styles.heroValue}`}>{model.subject_label}</h2>
        <p className={`fi ${styles.value}`} data-testid="evaluate-strength">
          {model.strength}
        </p>
      </header>

      <div className={styles.metaGrid}>
        <div className={styles.metaRow}>
          <p className={`fi ${styles.label}`}>Best window</p>
          <p className={`fi ${styles.value}`}>
            {model.best_window ?? 'Unknown'}
          </p>
        </div>
        <div className={styles.metaRow}>
          <p className={`fi ${styles.label}`}>Watch out</p>
          <p className={`fi ${styles.value}`}>{model.avoid ?? 'Unknown'}</p>
        </div>
        <div className={styles.metaRow}>
          <p className={`fi ${styles.label}`}>Best alternative</p>
          <p className={`fi ${styles.value}`}>
            {model.best_alternative ?? 'Unknown'}
          </p>
        </div>
        <div className={styles.metaRow}>
          <p className={`fi ${styles.label}`}>Confidence</p>
          <p className={`fi ${styles.value}`} data-testid="evaluate-confidence">
            {model.confidence}
          </p>
        </div>
      </div>

      {model.conditions && model.conditions.length > 0 ? (
        <section aria-label="Conditions">
          <p className={`fi ${styles.label}`}>Conditions</p>
          <ul className={`fi ${styles.value}`}>
            {model.conditions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {model.why.length > 0 ? (
        <section className={styles.belowFold} aria-label="Why">
          <p className={`fi ${styles.label}`}>Why</p>
          <ul className={`fi ${styles.value}`}>
            {model.why.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.belowFold} aria-label="Evidence">
        <p className={`fi ${styles.label}`}>Known</p>
        <p className={`fi ${styles.value}`}>
          {(model.known ?? []).join(' · ') || '—'}
        </p>
        <p className={`fi ${styles.label}`}>Inferred</p>
        <p className={`fi ${styles.value}`}>
          {(model.inferred ?? []).join(' · ') || '—'}
        </p>
        <p className={`fi ${styles.label}`}>Unknown</p>
        <p className={`fi ${styles.value} ${styles.unknown}`}>
          {(model.unknown ?? []).join(' · ') || '—'}
        </p>
      </section>

      <p className={`fi ${styles.notice}`}>
        METIORO never decides. The human always decides.
      </p>
    </article>
  );
}
