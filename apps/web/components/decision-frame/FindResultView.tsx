import type { FindResultViewModel } from '@/lib/decision-frame';
import styles from './decision-frame.module.css';

export function FindResultView({ model }: { model: FindResultViewModel }) {
  const honestyNote = model.unique_dominant
    ? 'One stronger timing window stands out inside the scanned range.'
    : model.windows.length > 0
      ? 'These are comparable windows — no clearly dominant window is claimed.'
      : 'No sufficiently strong timing window was found in the scanned range.';

  return (
    <article
      className={styles.result}
      data-testid="find-result-view"
      data-operation="find"
      data-unique-dominant={model.unique_dominant ? 'true' : 'false'}
      aria-label="Find result"
    >
      <header className={styles.hero}>
        <p className={`fi ${styles.heroLabel}`}>Timing windows</p>
        <h2 className={`fc ${styles.heroValue}`} data-testid="find-headline">
          {model.headline}
        </h2>
        <p className={`fi ${styles.value}`} data-testid="find-honesty">
          {honestyNote}
        </p>
      </header>

      {model.windows.length > 0 ? (
        <section className={styles.belowFold} aria-label="Windows">
          <p className={`fi ${styles.label}`}>Windows that deserve attention</p>
          <ul className={`fi ${styles.value}`} data-testid="find-windows">
            {model.windows.map((window) => (
              <li
                key={window.window_id}
                data-testid="find-window"
                data-window-id={window.window_id}
                data-band={window.band}
              >
                <span>
                  {window.start_label} – {window.end_label}
                </span>
                <span>
                  {' '}
                  · peak{' '}
                  {window.peak_labels.length
                    ? window.peak_labels.join(', ')
                    : 'Unknown'}
                </span>
                <span>
                  {' '}
                  · {window.band}/{window.strength}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className={styles.belowFold} aria-label="Windows">
          <p className={`fi ${styles.label}`}>Windows</p>
          <p className={`fi ${styles.value}`} data-testid="find-windows-empty">
            No strong window in range
          </p>
        </section>
      )}

      <div className={styles.metaGrid}>
        <div className={styles.metaRow}>
          <p className={`fi ${styles.label}`}>Range</p>
          <p className={`fi ${styles.value}`} data-testid="find-range">
            {model.range_context ?? 'Unknown'}
          </p>
        </div>
        <div className={styles.metaRow}>
          <p className={`fi ${styles.label}`}>Confidence</p>
          <p className={`fi ${styles.value}`}>{model.confidence}</p>
        </div>
      </div>

      {model.limitations && model.limitations.length > 0 ? (
        <section className={styles.belowFold} aria-label="Limits">
          <p className={`fi ${styles.label}`}>Limits</p>
          <ul className={`fi ${styles.value}`} data-testid="find-limits">
            {model.limitations.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.belowFold} aria-label="Unknown">
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
