import type { ReactNode } from 'react';
import styles from './result-shell.module.css';

/** Shared outer layout for EVALUATE / COMPARE / FIND result bodies. */
export function ResultShell({
  children,
  dir,
  testId,
  mode,
  ariaLabel,
}: {
  children: ReactNode;
  dir: 'ltr' | 'rtl';
  testId: string;
  mode?: string;
  ariaLabel: string;
}) {
  return (
    <article
      className={styles.shell}
      data-testid={testId}
      data-mode={mode}
      dir={dir}
      aria-label={ariaLabel}
    >
      {children}
    </article>
  );
}

export function ResultHeader({
  eyebrow,
  topic,
  topicTestId,
  datePrimary,
  dateSecondary,
}: {
  eyebrow?: string;
  topic: string;
  topicTestId?: string;
  datePrimary?: string;
  dateSecondary?: string;
}) {
  return (
    <header className={styles.header}>
      {eyebrow ? <p className={`fi ${styles.eyebrow}`}>{eyebrow}</p> : null}
      <h2 className={`fc ${styles.topic}`} data-testid={topicTestId}>
        {topic}
      </h2>
      {datePrimary ? (
        <p className={`fi ${styles.datePrimary}`} data-testid="result-date-primary">
          {datePrimary}
        </p>
      ) : null}
      {dateSecondary ? (
        <p
          className={`fi ${styles.dateSecondary}`}
          data-testid="result-date-secondary"
        >
          {dateSecondary}
        </p>
      ) : null}
    </header>
  );
}

export function VerdictCard({
  verdict,
  scoreLabel,
  scoreHint,
  meaning,
}: {
  verdict: string;
  scoreLabel?: ReactNode | null;
  scoreHint?: string | null;
  meaning?: string | null;
}) {
  return (
    <div className={styles.verdictCard} data-testid="result-verdict-card">
      <p className={`fc ${styles.verdict}`} data-testid="result-verdict">
        {verdict}
      </p>
      {scoreLabel ? (
        <p className={`fi ${styles.score}`} data-testid="result-score">
          {scoreLabel}
        </p>
      ) : null}
      {scoreHint ? (
        <p className={`fi ${styles.scoreHint}`} data-testid="result-score-honesty">
          {scoreHint}
        </p>
      ) : null}
      {meaning ? (
        <p className={`fi ${styles.meaning}`} data-testid="result-meaning">
          {meaning}
        </p>
      ) : null}
    </div>
  );
}

export function ConfidenceIndicator({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className={styles.confidenceCard}
      data-testid="result-confidence-card"
      aria-label={label}
    >
      <p className={`fi ${styles.confidenceLabel}`}>{label}</p>
      <p className={`fi ${styles.confidenceValue}`} data-testid="result-confidence">
        {value}
      </p>
    </div>
  );
}

export function RecommendationCard({
  label,
  body,
  detail,
}: {
  label: string;
  body: string;
  detail?: string | null;
}) {
  return (
    <section
      className={styles.recommendation}
      aria-label={label}
      data-testid="result-recommendation"
    >
      <p className={`fi ${styles.sectionLabel}`}>{label}</p>
      <p className={`fi ${styles.recommendationBody}`}>{body}</p>
      {detail ? (
        <p className={`fi ${styles.recommendationDetail}`}>{detail}</p>
      ) : null}
    </section>
  );
}

export type ResultEvidenceItem = {
  id: string;
  title: string;
  detail?: string;
};

export function EvidenceDrivers({
  label,
  items,
}: {
  label: string;
  items: ResultEvidenceItem[];
}) {
  if (items.length === 0) return null;
  return (
    <section
      className={styles.evidenceSection}
      aria-label={label}
      data-testid="result-evidence-support"
    >
      <p className={`fi ${styles.sectionLabel}`}>{label}</p>
      <ul className={styles.evidenceList}>
        {items.map((item) => (
          <li key={item.id} className={styles.evidenceItem} data-testid="result-evidence-item">
            <p className={`fi ${styles.evidenceTitle}`}>{item.title}</p>
            {item.detail ? (
              <p className={`fi ${styles.evidenceDetail}`}>{item.detail}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CautionDrivers({
  label,
  items,
}: {
  label: string;
  items: ResultEvidenceItem[];
}) {
  if (items.length === 0) return null;
  return (
    <section
      className={`${styles.evidenceSection} ${styles.cautionSection}`}
      aria-label={label}
      data-testid="result-evidence-caution"
    >
      <p className={`fi ${styles.sectionLabel}`}>{label}</p>
      <ul className={styles.evidenceList}>
        {items.map((item) => (
          <li key={item.id} className={styles.evidenceItem} data-testid="result-caution-item">
            <p className={`fi ${styles.evidenceTitle}`}>{item.title}</p>
            {item.detail ? (
              <p className={`fi ${styles.evidenceDetail}`}>{item.detail}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LimitsBlock({
  label,
  scope,
  limits,
  listTestId,
}: {
  label: string;
  scope?: string | null;
  limits?: readonly string[];
  listTestId?: string;
}) {
  const list = limits?.filter(Boolean) ?? [];
  if (!scope && list.length === 0) return null;
  return (
    <section
      className={styles.limits}
      aria-label={label}
      data-testid="result-limits"
    >
      <p className={`fi ${styles.sectionLabel}`}>{label}</p>
      {scope ? <p className={`fi ${styles.limitsBody}`}>{scope}</p> : null}
      {list.length > 0 ? (
        <ul className={`fi ${styles.limitsList}`} data-testid={listTestId}>
          {list.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function ResultMetricsRow({ children }: { children: ReactNode }) {
  return <div className={styles.metrics}>{children}</div>;
}

export function ResultEvidenceGrid({ children }: { children: ReactNode }) {
  return <div className={styles.evidenceGrid}>{children}</div>;
}

export function NextStepsBlock({
  label,
  steps,
}: {
  label: string;
  steps: readonly string[];
}) {
  if (steps.length === 0) return null;
  return (
    <section className={styles.nextSteps} aria-label={label} data-testid="result-next-steps">
      <p className={`fi ${styles.sectionLabel}`}>{label}</p>
      <ol className={`fi ${styles.nextStepsList}`}>
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}

export function AgencyLine({ text }: { text: string }) {
  return <p className={`fi ${styles.agency}`}>{text}</p>;
}

export { styles as resultShellStyles };
