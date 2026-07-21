'use client';

/**
 * Isolates LTR technical fragments inside RTL (or any) text flow.
 * Use for emails, URLs, plan codes, chart abbreviations (MC/AC/DC/IC), scores.
 */
export function LtrIsolate({
  children,
  className = '',
  as: Tag = 'span',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'code' | 'a';
}) {
  return (
    <Tag
      className={className}
      dir="ltr"
      style={{ unicodeBidi: 'isolate' }}
    >
      {children}
    </Tag>
  );
}

/** Common chart angle abbreviations — always LTR. */
export function ChartAbbrev({ code }: { code: 'MC' | 'AC' | 'DC' | 'IC' | string }) {
  return <LtrIsolate className="tabular-nums">{code}</LtrIsolate>;
}
