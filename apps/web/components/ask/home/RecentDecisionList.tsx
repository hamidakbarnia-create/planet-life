import Link from 'next/link';
import type { RecentDecisionRow } from '@/lib/ask-home';
import type { AskHomeCopy } from '@/lib/ask-home';
import styles from './ask-home.module.css';

export function RecentDecisionList({
  title,
  emptyLabel,
  columns,
  rows,
}: {
  title: string;
  emptyLabel: string;
  columns: AskHomeCopy['recentColumns'];
  rows: readonly RecentDecisionRow[];
}) {
  return (
    <section className={styles.section} aria-labelledby="ask-recent-title">
      <div className={styles.sectionHead}>
        <h2 id="ask-recent-title" className={`fc ${styles.sectionTitle}`}>
          {title}
        </h2>
      </div>

      {rows.length === 0 ? (
        <p className={`fi ${styles.recentEmpty}`}>{emptyLabel}</p>
      ) : (
        <>
          <div className={styles.recentDesktop}>
            <table className={styles.recentTable}>
              <thead>
                <tr>
                  <th scope="col">{columns.title}</th>
                  <th scope="col">{columns.type}</th>
                  <th scope="col">{columns.status}</th>
                  <th scope="col">{columns.confidence}</th>
                  <th scope="col">{columns.date}</th>
                  <th scope="col">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link href={row.href} className={`fi ${styles.recentRow}`}>
                        <span className={styles.recentTitle}>{row.title}</span>
                      </Link>
                    </td>
                    <td className="fi">{row.decisionType}</td>
                    <td className="fi">{row.status}</td>
                    <td className="fi">{row.confidence}%</td>
                    <td className="fi">{row.date}</td>
                    <td>
                      <Link
                        href={row.href}
                        className={styles.recentChevron}
                        aria-label={`${row.title}`}
                      >
                        ›
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.recentMobile}>
            {rows.map((row) => (
              <Link
                key={row.id}
                href={row.href}
                className={`fi ${styles.recentMobileCard}`}
              >
                <span className={styles.recentTitle}>{row.title}</span>
                <span className={styles.recentChevron} aria-hidden>
                  ›
                </span>
                <div className={styles.recentMobileMeta}>
                  <span>{row.decisionType}</span>
                  <span>{row.status}</span>
                  <span>{row.confidence}%</span>
                  <span>{row.date}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
