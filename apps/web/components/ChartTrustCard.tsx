'use client';

import type { ChartData } from '@/lib/chart-types';
import { getTrustCardLabels, type ProfileLang } from '@/lib/chart-profile-i18n';
import { buildTrustCardRows } from '@/lib/chart-profile-ux';

type Props = {
  chart: ChartData;
  lang: ProfileLang;
};

export function ChartTrustCard({ chart, lang }: Props) {
  const labels = getTrustCardLabels(lang);
  const rows = buildTrustCardRows(chart, lang);
  const rtl = lang === 'fa' || lang === 'ar';

  return (
    <div
      className="w-full mt-4 rounded-xl p-4"
      data-testid="chart-trust-card"
      dir={rtl ? 'rtl' : 'ltr'}
      style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(251,191,36,0.22)' }}
    >
      <div className="fc text-sm tracking-widest" style={{ color: '#fbbf24' }}>
        {labels.title}
      </div>
      <p
        className="fi text-[11px] leading-relaxed mt-2 mb-3"
        style={{ color: 'rgba(255,255,255,0.55)' }}
      >
        {labels.body}
      </p>
      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
            style={{ background: 'rgba(255,255,255,0.03)' }}
            data-testid={`trust-row-${row.key}`}
          >
            <div className="min-w-0">
              <div className="fi text-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>
                {rtl ? `${index + 1}. ${row.label}` : row.label}
              </div>
              <div
                className="fi text-[11px] leading-snug mt-0.5"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                {row.value}
              </div>
            </div>
            {row.verified && (
              <span
                className="fi text-[10px] px-2 py-1 rounded-md whitespace-nowrap shrink-0"
                style={{
                  color: '#86efac',
                  background: 'rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.4)',
                }}
              >
                {labels.verified}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
