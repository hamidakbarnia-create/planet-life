import type { ReactNode } from 'react';
import styles from './ask-home.module.css';

export function AskHero({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.hero} aria-labelledby="ask-hero-title">
      <h1 id="ask-hero-title" className={`fc ${styles.heroTitle}`}>
        {title}
      </h1>
      <p className={`fi ${styles.heroSubtitle}`}>{subtitle}</p>
      {children}
    </section>
  );
}
