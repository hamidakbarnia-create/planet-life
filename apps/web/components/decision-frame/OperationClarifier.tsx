import type { DecisionFrameV1 } from '@/lib/decision-frame';
import styles from './decision-frame.module.css';

export function OperationClarifier({
  frame,
  onChooseOperation,
  onChooseOpenEndedAxis,
}: {
  frame: DecisionFrameV1;
  onChooseOperation: (op: 'evaluate' | 'compare' | 'find') => void;
  onChooseOpenEndedAxis: (axis: 'whether' | 'where' | 'when') => void;
}) {
  if (frame.pending_clarification === 'open_ended_axis') {
    return (
      <section
        className={styles.clarifier}
        data-testid="open-ended-clarifier"
        aria-label="Open-ended intent clarification"
      >
        <p className={`fc ${styles.clarifierPrompt}`}>
          What do you want to decide first?
        </p>
        <div className={styles.choices}>
          <button
            type="button"
            className={`fi ${styles.choice}`}
            data-testid="clarify-whether"
            onClick={() => onChooseOpenEndedAxis('whether')}
          >
            Whether
          </button>
          <button
            type="button"
            className={`fi ${styles.choice}`}
            data-testid="clarify-where"
            onClick={() => onChooseOpenEndedAxis('where')}
          >
            Where
          </button>
          <button
            type="button"
            className={`fi ${styles.choice}`}
            data-testid="clarify-when"
            onClick={() => onChooseOpenEndedAxis('when')}
          >
            When
          </button>
        </div>
        <p className={`fi ${styles.notice}`}>
          Open-ended intent is structured before any recommendation.
        </p>
      </section>
    );
  }

  if (frame.pending_clarification === 'operation') {
    return (
      <section
        className={styles.clarifier}
        data-testid="operation-clarifier"
        aria-label="Operation clarification"
      >
        <p className={`fc ${styles.clarifierPrompt}`}>
          What do you want METIORO to do?
        </p>
        <div className={styles.choices}>
          <button
            type="button"
            className={`fi ${styles.choice}`}
            data-testid="clarify-evaluate"
            onClick={() => onChooseOperation('evaluate')}
          >
            Check a date
          </button>
          <button
            type="button"
            className={`fi ${styles.choice}`}
            data-testid="clarify-compare"
            onClick={() => onChooseOperation('compare')}
          >
            Compare dates
          </button>
          <button
            type="button"
            className={`fi ${styles.choice}`}
            data-testid="clarify-find"
            onClick={() => onChooseOperation('find')}
          >
            Find stronger timing windows
          </button>
        </div>
      </section>
    );
  }

  if (frame.pending_clarification === 'time') {
    return (
      <section
        className={styles.clarifier}
        data-testid="time-clarifier"
        aria-label="Time clarification"
      >
        <p className={`fc ${styles.clarifierPrompt}`}>
          {frame.operation === 'compare'
            ? 'Which dates should METIORO compare?'
            : frame.operation === 'find'
              ? 'What date range should METIORO search?'
              : 'Which date should METIORO evaluate?'}
        </p>
        <p className={`fi ${styles.notice}`}>
          Time is never assumed to be today. Add an explicit date or range.
        </p>
      </section>
    );
  }

  return null;
}
