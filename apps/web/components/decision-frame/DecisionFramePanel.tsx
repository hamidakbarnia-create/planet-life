import type { DecisionFrameV1 } from '@/lib/decision-frame';
import styles from './decision-frame.module.css';

function display(value: string | undefined, unknownLabel = 'Unknown'): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : unknownLabel;
}

export function DecisionFramePanel({
  frame,
}: {
  frame: DecisionFrameV1;
}) {
  const operationLabel =
    frame.operation === 'unresolved'
      ? 'Unknown'
      : frame.operation.toUpperCase();

  const timeLabel =
    frame.time.scope === 'none'
      ? 'Unknown'
      : frame.time.dates?.length
        ? `${frame.time.scope.replace(/_/g, ' ')} · ${frame.time.dates.join(', ')}`
        : frame.time.scope.replace(/_/g, ' ');

  return (
    <section
      className={styles.panel}
      data-testid="decision-frame-panel"
      aria-labelledby="decision-frame-title"
    >
      <h2 id="decision-frame-title" className={`fc ${styles.title}`}>
        What I understand
      </h2>
      <div className={styles.grid}>
        <div className={styles.row}>
          <p className={`fi ${styles.label}`}>Decision</p>
          <p
            className={`fi ${styles.value} ${!frame.decision_type_id ? styles.unknown : ''}`}
            data-testid="frame-decision"
          >
            {display(frame.decision_type_id, 'Unknown')}
          </p>
        </div>
        <div className={styles.row}>
          <p className={`fi ${styles.label}`}>Intent</p>
          <p className={`fi ${styles.value}`} data-testid="frame-intent">
            {frame.raw_intent}
          </p>
        </div>
        <div className={styles.row}>
          <p className={`fi ${styles.label}`}>Objective</p>
          <p
            className={`fi ${styles.value} ${!frame.objective ? styles.unknown : ''}`}
            data-testid="frame-objective"
          >
            {display(frame.objective)}
          </p>
        </div>
        <div className={styles.row}>
          <p className={`fi ${styles.label}`}>Time</p>
          <p
            className={`fi ${styles.value} ${frame.time.scope === 'none' ? styles.unknown : ''}`}
            data-testid="frame-time"
          >
            {timeLabel}
          </p>
        </div>
        <div className={styles.row}>
          <p className={`fi ${styles.label}`}>Operation</p>
          <p
            className={`fi ${styles.value} ${frame.operation === 'unresolved' ? styles.unknown : ''}`}
            data-testid="frame-operation"
          >
            {operationLabel}
          </p>
        </div>
        {frame.unknowns.length > 0 ? (
          <div className={styles.row}>
            <p className={`fi ${styles.label}`}>Unknown</p>
            <p
              className={`fi ${styles.value} ${styles.unknown}`}
              data-testid="frame-unknowns"
            >
              {frame.unknowns.join(' · ')}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
