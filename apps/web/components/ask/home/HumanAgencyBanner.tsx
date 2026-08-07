import styles from './ask-home.module.css';

export function HumanAgencyBanner({
  line1,
  line2,
}: {
  line1: string;
  line2: string;
}) {
  return (
    <div className={styles.agency} role="note">
      <p className={`fc ${styles.agencyLine1}`}>{line1}</p>
      <p className={`fi ${styles.agencyLine2}`}>{line2}</p>
    </div>
  );
}
