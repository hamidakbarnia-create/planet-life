import type { PopularDecision } from '@/lib/ask-home';
import styles from './ask-home.module.css';

export function PopularDecisionGrid({
  title,
  items,
  seeAllLabel,
  availableBadge,
  unavailableBadge,
  onSeeAll,
  onSelect,
}: {
  title: string;
  items: readonly PopularDecision[];
  seeAllLabel: string;
  availableBadge: string;
  unavailableBadge: string;
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
        {items.map((item) => {
          const badge =
            item.capability === 'available' ? availableBadge : unavailableBadge;
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`fi ${styles.popularCard} ${
                  item.capability === 'unavailable'
                    ? styles.popularCardUnavailable
                    : ''
                }`}
                aria-label={item.label}
                data-testid={`ask-popular-${item.id}`}
                data-capability={item.capability}
                data-decision-type={item.decisionTypeId ?? ''}
                onClick={() => onSelect(item)}
              >
                <span className={styles.popularCardBody}>
                  <span>{item.label}</span>
                  <span
                    className={
                      item.capability === 'available'
                        ? styles.popularBadgeAvailable
                        : styles.popularBadgeUnavailable
                    }
                    data-testid={`ask-popular-badge-${item.id}`}
                  >
                    {badge}
                  </span>
                </span>
                <span className={styles.popularCardMark} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
