import type { FindResultViewModel } from '@/lib/decision-frame';
import styles from './decision-frame.module.css';

export function FindResultView({ model }: { model: FindResultViewModel }) {
  return (
    <article
      className={styles.result}
      data-testid="find-result-view"
      data-operation="find"
      aria-label="Find result"
    >
      <header className={styles.hero}>
        <p className={`fi ${styles.heroLabel}`}>Best date</p>
        <h2 className={`fc ${styles.heroValue}`} data-testid="find-best-date">
          {model.best_date_label}
        </h2>
        <p className={`fi ${styles.value}`}>{model.strength}</p>
      </header>

      <div className={styles.metaGrid}>
        <div className={styles.metaRow}>
          <p className={`fi ${styles.label}`}>Best window</p>
          <p className={`fi ${styles.value}`}>
            {model.best_window ?? 'Unknown'}
          </p>
        </div>
        <div className={styles.metaRow}>
          <p className={`fi ${styles.label}`}>Alternative</p>
          <p className={`fi ${styles.value}`}>
            {model.alternative ?? 'Unknown'}
          </p>
        </div>
        <div className={styles.metaRow}>
          <p className={`fi ${styles.label}`}>Avoid</p>
          <p className={`fi ${styles.value}`}>{model.avoid ?? 'Unknown'}</p>
        </div>
        <div className={styles.metaRow}>
          <p className={`fi ${styles.label}`}>Range</p>
          <p className={`fi ${styles.value}`}>
            {model.range_context ?? 'Unknown'}
          </p>
        </div>
        <div className={styles.metaRow}>
          <p className={`fi ${styles.label}`}>Confidence</p>
          <p className={`fi ${styles.value}`}>{model.confidence}</p>
        </div>
      </div>

      {model.timeline && model.timeline.length > 0 ? (
        <section className={styles.belowFold} aria-label="Timeline">
          <p className={`fi ${styles.label}`}>Timeline</p>
          <ul className={`fi ${styles.value}`}>
            {model.timeline.map((item) => (
              <li key={item.label}>
                {item.label} — {item.strength}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.belowFold} aria-label="Evidence">
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
