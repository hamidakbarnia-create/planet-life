import type { HowItWorksStep } from '@/lib/ask-home';
import styles from './ask-home.module.css';

export function HowItWorksWidget({
  title,
  steps,
}: {
  title: string;
  steps: readonly HowItWorksStep[];
}) {
  return (
    <aside className={styles.widget} aria-labelledby="ask-how-title">
      <h2 id="ask-how-title" className={`fc ${styles.widgetTitle}`}>
        {title}
      </h2>
      <ol className={styles.howList}>
        {steps.map((step, index) => (
          <li key={step.id} className={styles.howItem}>
            <span className={`fc ${styles.howIndex}`} aria-hidden>
              {index + 1}
            </span>
            <h3 className={`fc ${styles.howItemTitle}`}>{step.title}</h3>
            <p className={`fi ${styles.howItemBody}`}>{step.description}</p>
          </li>
        ))}
      </ol>
    </aside>
  );
}
