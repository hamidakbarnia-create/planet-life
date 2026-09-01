/**
 * Isolates a numeric interval or fraction as one LTR run inside any parent
 * direction. Use for score bands, hour windows, and timing-strength fractions.
 */
export function LtrNumericSequence({
  children,
  className = '',
  kind = 'sequence',
}: {
  children: React.ReactNode;
  className?: string;
  kind?: 'sequence' | 'interval' | 'fraction';
}) {
  return (
    <bdi
      dir="ltr"
      data-ltr-numeric={kind}
      className={['tabular-nums', 'whitespace-nowrap', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </bdi>
  );
}
