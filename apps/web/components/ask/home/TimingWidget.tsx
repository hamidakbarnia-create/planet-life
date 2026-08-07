import type { AskHomeTimingState } from '@/lib/ask-home';
import styles from './ask-home.module.css';

const HEIGHT_CLASS: Record<number, string> = {
  10: styles.h10,
  20: styles.h20,
  30: styles.h30,
  40: styles.h40,
  50: styles.h50,
  60: styles.h60,
  70: styles.h70,
  80: styles.h80,
  90: styles.h90,
  100: styles.h100,
};

function heightClass(score: number, maxScore: number): string {
  const pct = Math.max(10, Math.min(100, Math.round((score / maxScore) * 100)));
  const band = Math.ceil(pct / 10) * 10;
  return HEIGHT_CLASS[band] ?? styles.h50;
}

export function TimingWidget({
  title,
  bestWindowPrefix,
  state,
}: {
  title: string;
  bestWindowPrefix: string;
  state: AskHomeTimingState;
}) {
  const maxScore = Math.max(1, ...state.points.map((point) => point.score));

  return (
    <aside className={styles.widget} aria-labelledby="ask-timing-title">
      <h2 id="ask-timing-title" className={`fc ${styles.widgetTitle}`}>
        {title}
      </h2>

      {state.loading || state.points.length === 0 ? (
        <p className={`fi ${styles.widgetBody}`}>{state.emptyLabel}</p>
      ) : (
        <div
          className={styles.timeline}
          role="img"
          aria-label={`${title}. ${bestWindowPrefix}: ${state.bestWindowLabel}`}
        >
          {state.points.map((point) => (
            <div
              key={point.hour}
              className={`${styles.timelineBar} ${heightClass(point.score, maxScore)} ${
                point.isBest ? styles.timelineBarBest : ''
              }`.trim()}
              title={`${point.label} · ${point.score}`}
            />
          ))}
        </div>
      )}

      <p className={`fi ${styles.widgetMeta}`}>
        {bestWindowPrefix}: {state.bestWindowLabel}
      </p>
    </aside>
  );
}
