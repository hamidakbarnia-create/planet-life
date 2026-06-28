'use client';

import type { ChartData } from '@/lib/chart-types';

type Props = {
  chart: ChartData;
  onConfirm: () => void;
  onReject: () => void;
};

export function GeocodeConfirmDialog({ chart, onConfirm, onReject }: Props) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: '#0d1220', border: '1px solid rgba(251,146,60,0.4)' }}
      >
        <div className="fc text-sm tracking-widest mb-2" style={{ color: '#fb923c' }}>
          Confirm geocoded location
        </div>
        <p className="fi text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Your city was resolved by name, not selected from the verified list. Please confirm
          these coordinates before saving the chart.
        </p>
        <dl className="fi flex flex-col gap-2 text-[11px] mb-5">
          <div className="flex justify-between gap-3">
            <dt style={{ color: 'rgba(255,255,255,0.45)' }}>Resolved as</dt>
            <dd style={{ color: 'rgba(255,255,255,0.9)' }}>{chart.location}</dd>
          </div>
          {chart.country && (
            <div className="flex justify-between gap-3">
              <dt style={{ color: 'rgba(255,255,255,0.45)' }}>Country</dt>
              <dd style={{ color: 'rgba(255,255,255,0.9)' }}>{chart.country}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt style={{ color: 'rgba(255,255,255,0.45)' }}>Coordinates</dt>
            <dd style={{ color: 'rgba(255,255,255,0.9)' }}>
              {chart.latitude.toFixed(4)}, {chart.longitude.toFixed(4)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt style={{ color: 'rgba(255,255,255,0.45)' }}>Timezone</dt>
            <dd style={{ color: 'rgba(255,255,255,0.9)' }}>{chart.timezone}</dd>
          </div>
        </dl>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onReject}
            className="fi flex-1 py-2.5 rounded-xl text-xs border"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="fi flex-1 py-2.5 rounded-xl text-xs"
            style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)', color: '#000' }}
          >
            Confirm &amp; use chart
          </button>
        </div>
      </div>
    </div>
  );
}
