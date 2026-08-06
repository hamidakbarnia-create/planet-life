import type { ReactNode } from 'react';

export function MetricCard({
  icon,
  label,
  value,
  className = '',
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mio-glass mio-glass--metric mio-sig-metric ${className}`.trim()}>
      {icon && (
        <span className="mio-sig-metric__icon" aria-hidden>
          {icon}
        </span>
      )}
      <div className="mio-sig-metric__body">
        <span className="mio-label fi">{label}</span>
        <span className="mio-value fi">{value}</span>
      </div>
    </div>
  );
}
