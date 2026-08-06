import type { ReactNode } from 'react';
import Link from 'next/link';

type AlertVariant = 'warning' | 'info' | 'success';

export function AlertBanner({
  variant = 'warning',
  children,
  actionLabel,
  actionHref,
  className = '',
}: {
  variant?: AlertVariant;
  children: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}) {
  return (
    <div
      className={`mio-alert mio-alert--${variant} fi ${className}`.trim()}
      role="status"
    >
      <span className="mio-alert__text">{children}</span>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mio-alert__action fc">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
