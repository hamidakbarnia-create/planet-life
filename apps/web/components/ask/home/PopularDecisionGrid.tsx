import type { PopularDecision } from '@/lib/ask-home';
import styles from './ask-home.module.css';

export function PopularDecisionGrid({
  title,
  items,
  seeAllLabel,
  onSeeAll,
  onSelect,
}: {
  title: string;
  items: readonly PopularDecision[];
  seeAllLabel: string;
  onSeeAll: () => void;
  onSelect: (item: PopularDecision) => void;
}) {
  return (
    <section
      className={`${styles.section} ${styles.popularSection}`}
      aria-labelledby="ask-popular-title"
      data-testid="ask-popular-decisions"
    >
      <div className={styles.sectionHead}>
        <h2 id="ask-popular-title" className={`fc ${styles.sectionTitle}`}>
          {title}
        </h2>
        <button
          type="button"
          className={`fi ${styles.sectionAction}`}
          onClick={onSeeAll}
        >
          {seeAllLabel}
        </button>
      </div>
      <ul className={styles.popularGrid}>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`fi ${styles.popularCard}`}
              onClick={() => onSelect(item)}
            >
              <span>{item.label}</span>
              <span className={styles.popularCardMark} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
