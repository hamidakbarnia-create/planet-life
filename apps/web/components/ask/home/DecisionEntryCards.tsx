import type { DecisionEntryMode, DecisionEntryModeId } from '@/lib/ask-home';
import styles from './ask-home.module.css';

export function DecisionEntryCards({
  title,
  modes,
  activeMode,
  onSelect,
}: {
  title: string;
  modes: readonly DecisionEntryMode[];
  activeMode: DecisionEntryModeId | null;
  onSelect: (modeId: DecisionEntryModeId) => void;
}) {
  return (
    <section className={styles.section} aria-labelledby="ask-entry-title">
      <div className={styles.sectionHead}>
        <h2 id="ask-entry-title" className={`fc ${styles.sectionTitle}`}>
          {title}
        </h2>
      </div>
      <div className={styles.entryGrid}>
        {modes.map((mode) => {
          const active = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              className={`${styles.entryCard} ${active ? styles.entryCardActive : ''}`.trim()}
              onClick={() => onSelect(mode.id)}
              aria-pressed={active}
              aria-label={mode.title}
            >
              <h3 className={`fc ${styles.entryCardTitle}`} aria-hidden="true">
                {mode.title}
              </h3>
              <p className={`fi ${styles.entryCardBody}`}>{mode.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
