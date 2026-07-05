import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  trailing,
  className = '',
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`mio-page-header ${className}`.trim()}>
      <div className="mio-page-header__main">
        {eyebrow && <p className="mio-page-header__eyebrow fi">{eyebrow}</p>}
        <h1 className="mio-page-header__title fc">{title}</h1>
        {subtitle && <p className="mio-page-header__subtitle fi">{subtitle}</p>}
      </div>
      {trailing && <div className="mio-page-header__trailing">{trailing}</div>}
    </header>
  );
}
