import Link from 'next/link';
import type { AskHomeEnergyState } from '@/lib/ask-home';
import styles from './ask-home.module.css';

const RING_SIZE = 120;
const STROKE = 8;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function EnergyWidget({
  title,
  description,
  bestWindowPrefix,
  seeDetailsLabel,
  state,
}: {
  title: string;
  description: string;
  bestWindowPrefix: string;
  seeDetailsLabel: string;
  state: AskHomeEnergyState;
}) {
  const progress =
    state.score == null ? 0 : Math.max(0, Math.min(100, state.score));
  const dashOffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;
  const display =
    state.loading ? '…' : state.score != null ? String(state.score) : '—';

  return (
    <aside className={styles.widget} aria-labelledby="ask-energy-title">
      <h2 id="ask-energy-title" className={`fc ${styles.widgetTitle}`}>
        {title}
      </h2>
      <div className={styles.energyRingWrap}>
        <div
          className={styles.energyRing}
          role="img"
          aria-label={
            state.loading
              ? title
              : state.score != null
                ? `${title}: ${state.score}`
                : title
          }
        >
          <svg
            className={styles.energySvg}
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            aria-hidden
          >
            <circle
              className={styles.energyTrack}
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
            />
            <circle
              className={styles.energyProgress}
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </svg>
          <div className={`fc ${styles.energyCenter}`}>
            <span className={styles.energyValue}>{display}</span>
            <span className={`fi ${styles.energyUnit}`}>/100</span>
          </div>
        </div>
      </div>
      <p className={`fi ${styles.widgetBody}`}>{description}</p>
      <p className={`fi ${styles.widgetMeta}`}>
        {bestWindowPrefix}: {state.bestWindowLabel}
      </p>
      <Link href={state.detailsHref} className={`fi ${styles.widgetCta}`}>
        {seeDetailsLabel}
      </Link>
    </aside>
  );
}
