import type { CompareResultViewModel } from '@/lib/decision-frame';
import styles from './decision-frame.module.css';

export function CompareResultView({
  model,
}: {
  model: CompareResultViewModel;
}) {
  return (
    <article
      className={styles.result}
      data-testid="compare-result-view"
      data-operation="compare"
      aria-label="Compare result"
    >
      <div className={styles.compareCols}>
        {model.options.map((option) => (
          <div key={option.label} className={styles.compareCard}>
            <p className={`fc ${styles.heroValue}`} style={{ fontSize: '1.2rem' }}>
              {option.label}
            </p>
            <p className={`fi ${styles.value}`}>{option.strength}</p>
          </div>
        ))}
      </div>

      <header className={styles.hero}>
        <p className={`fi ${styles.heroLabel}`}>Winner</p>
        <h2 className={`fc ${styles.heroValue}`} data-testid="compare-winner">
          {model.winner_label}
        </h2>
      </header>

      <div className={styles.metaGrid}>
        <div className={styles.metaRow}>
          <p className={`fi ${styles.label}`}>Deciding factor</p>
          <p className={`fi ${styles.value}`}>
            {model.deciding_factor ?? 'Unknown'}
          </p>
        </div>
        {model.advantages.map((item) => (
          <div key={`${item.option_label}-${item.advantage}`} className={styles.metaRow}>
            <p className={`fi ${styles.label}`}>{item.option_label} advantage</p>
            <p className={`fi ${styles.value}`}>{item.advantage}</p>
          </div>
        ))}
        <div className={styles.metaRow}>
          <p className={`fi ${styles.label}`}>Confidence</p>
          <p className={`fi ${styles.value}`}>{model.confidence}</p>
        </div>
      </div>

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
