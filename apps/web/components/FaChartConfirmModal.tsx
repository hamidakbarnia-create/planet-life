'use client';

import { FA_CHART_CONFIRM } from '@/lib/chart-profile-i18n';
import {
  resolveConfirmDisplayValue,
  type PreConfirmSummary,
} from '@/lib/chart-profile-ux';

type Props = {
  summary: PreConfirmSummary;
  onConfirm: () => void;
  onEdit: () => void;
};

export function FaChartConfirmModal({ summary, onConfirm, onEdit }: Props) {
  const timezoneDisplay = resolveConfirmDisplayValue(summary.timezone, summary.resolving);
  const coordinatesDisplay = resolveConfirmDisplayValue(
    summary.coordinates,
    summary.resolving
  );

  const fields: { label: string; value: string; multiline?: boolean }[] = [
    { label: FA_CHART_CONFIRM.fields.name, value: summary.name },
    { label: FA_CHART_CONFIRM.fields.birthDate, value: summary.birthDate },
    { label: FA_CHART_CONFIRM.fields.birthTime, value: summary.birthTime },
    { label: FA_CHART_CONFIRM.fields.city, value: summary.city },
    { label: FA_CHART_CONFIRM.fields.timezone, value: timezoneDisplay },
    {
      label: FA_CHART_CONFIRM.fields.coordinates,
      value: coordinatesDisplay,
      multiline: !!summary.coordinates?.includes('\n'),
    },
    { label: FA_CHART_CONFIRM.fields.zodiac, value: summary.zodiac },
    { label: FA_CHART_CONFIRM.fields.houseSystem, value: summary.houseSystem },
    { label: FA_CHART_CONFIRM.fields.nodeType, value: summary.nodeType },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)' }}
      data-testid="fa-chart-confirm-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fa-chart-confirm-title"
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        dir="rtl"
        style={{ background: '#0d1220', border: '1px solid rgba(251,191,36,0.35)' }}
      >
        <div
          id="fa-chart-confirm-title"
          className="fc text-sm tracking-widest mb-2"
          style={{ color: '#fbbf24' }}
        >
          {FA_CHART_CONFIRM.title}
        </div>
        <p
          className="fi text-xs leading-relaxed mb-4"
          style={{ color: 'rgba(255,255,255,0.72)' }}
        >
          {FA_CHART_CONFIRM.body}
        </p>

        {summary.showGeocodeWarning && !summary.resolving && (
          <div
            className="rounded-xl px-3 py-2.5 mb-4"
            style={{
              background: 'rgba(251,146,60,0.12)',
              border: '1px solid rgba(251,146,60,0.4)',
            }}
            data-testid="fa-geocode-warning"
          >
            <p
              className="fi text-[11px] leading-relaxed whitespace-pre-line"
              style={{ color: '#fdba74' }}
            >
              {FA_CHART_CONFIRM.geocodeWarning}
            </p>
          </div>
        )}

        <dl className="fi flex flex-col gap-2.5 text-[11px] mb-5">
          {fields.map((field) => (
            <div key={field.label} className="flex justify-between gap-4 items-start">
              <dt className="shrink-0 pt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {field.label}
              </dt>
              <dd
                className={`text-left leading-relaxed ${field.multiline ? 'whitespace-pre-line' : ''}`}
                style={{ color: 'rgba(255,255,255,0.92)' }}
                data-testid={
                  field.label === FA_CHART_CONFIRM.fields.timezone
                    ? 'fa-confirm-timezone'
                    : field.label === FA_CHART_CONFIRM.fields.coordinates
                      ? 'fa-confirm-coordinates'
                      : undefined
                }
              >
                {field.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={onEdit}
            data-testid="fa-chart-confirm-edit"
            className="fi py-2.5 px-4 rounded-xl text-xs border"
            style={{
              borderColor: 'rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            {FA_CHART_CONFIRM.edit}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={summary.resolving}
            data-testid="fa-chart-confirm-submit"
            className="fi py-2.5 px-4 rounded-xl text-xs disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg,#d97706,#f59e0b)',
              color: '#000',
            }}
          >
            {summary.showGeocodeWarning
              ? FA_CHART_CONFIRM.geocodeConfirm
              : FA_CHART_CONFIRM.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
