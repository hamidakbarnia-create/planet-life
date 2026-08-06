import type { ReactNode } from 'react';

type GlassVariant = 'primary' | 'secondary' | 'metric' | 'action' | 'technical' | 'signature';

const VARIANT_CLASS: Record<GlassVariant, string> = {
  primary: 'mio-glass mio-glass--primary',
  secondary: 'mio-glass mio-glass--secondary',
  metric: 'mio-glass mio-glass--metric',
  action: 'mio-glass mio-glass--action',
  technical: 'mio-glass mio-glass--technical',
  signature: 'mio-glass mio-glass--signature',
};

export function GlassCard({
  variant = 'primary',
  className = '',
  children,
  title,
  eyebrow,
}: {
  variant?: GlassVariant;
  className?: string;
  children: ReactNode;
  title?: string;
  eyebrow?: string;
}) {
  return (
    <div className={`${VARIANT_CLASS[variant]} ${className}`.trim()}>
      {eyebrow && <h2 className="mio-eyebrow fc">{eyebrow}</h2>}
      {title && !eyebrow && <h2 className="mio-eyebrow fc">{title}</h2>}
      {children}
    </div>
  );
}
