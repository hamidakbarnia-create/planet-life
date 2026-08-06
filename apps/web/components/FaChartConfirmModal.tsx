'use client';

import {
  getChartConfirmLabels,
  isRtlLang,
  type ProfileLang,
} from '@/lib/chart-profile-i18n';
import {
  resolveConfirmDisplayValue,
  type PreConfirmSummary,
} from '@/lib/chart-profile-ux';

type Props = {
  summary: PreConfirmSummary;
  onConfirm: () => void;
  onEdit: () => void;
  lang?: ProfileLang;
};

export function FaChartConfirmModal({
  summary,
  onConfirm,
  onEdit,
  lang = 'fa',
}: Props) {
  const labels = getChartConfirmLabels(lang);
  const rtl = isRtlLang(lang);

  const timezoneDisplay = resolveConfirmDisplayValue(
    summary.timezone,
    summary.resolving,
    lang
  );
  const coordinatesDisplay = resolveConfirmDisplayValue(
    summary.coordinates,
    summary.resolving,
    lang
  );

  const fields: { label: string; value: string; multiline?: boolean; testId?: string }[] = [
    { label: labels.fields.name, value: summary.name },
    { label: labels.fields.birthDate, value: summary.birthDate },
    { label: labels.fields.birthTime, value: summary.birthTime },
    { label: labels.fields.city, value: summary.city },
    {
      label: labels.fields.timezone,
      value: timezoneDisplay,
      testId: 'fa-confirm-timezone',
    },
    {
      label: labels.fields.coordinates,
      value: coordinatesDisplay,
      multiline: !!summary.coordinates?.includes('\n'),
      testId: 'fa-confirm-coordinates',
    },
    { label: labels.fields.zodiac, value: summary.zodiac },
    { label: labels.fields.houseSystem, value: summary.houseSystem },
    { label: labels.fields.nodeType, value: summary.nodeType },
  ];

  return (
    <div
      className="mio-modal-overlay"
      data-testid="fa-chart-confirm-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fa-chart-confirm-title"
    >
      <div
        className="mio-modal mio-glass mio-glass--primary"
        dir={rtl ? 'rtl' : 'ltr'}
      >
        <p className="mio-modal__eyebrow fc">METIORO</p>
        <h2 id="fa-chart-confirm-title" className="mio-modal__title fc">
          {labels.title}
        </h2>
        <p className="mio-modal__body fi">{labels.body}</p>

        {summary.showGeocodeWarning && !summary.resolving && (
          <div className="mio-modal__notice fi" data-testid="fa-geocode-warning">
            <p className="mio-modal__notice-text">{labels.geocodeWarning}</p>
          </div>
        )}

        <dl className="mio-modal__rows fi">
          {fields.map((field) => (
            <div key={field.label} className="mio-modal__row">
              <dt className="mio-modal__label">{field.label}</dt>
              <dd
                className={`mio-modal__value ${field.multiline ? 'mio-modal__value--multiline' : ''}`}
                data-testid={field.testId}
              >
                {field.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mio-modal__actions">
          <button
            type="button"
            onClick={onEdit}
            data-testid="fa-chart-confirm-edit"
            className="metioro-btn metioro-btn--secondary mio-modal__btn fc"
          >
            {labels.edit}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={summary.resolving}
            data-testid="fa-chart-confirm-submit"
            className="metioro-btn metioro-btn--primary mio-modal__btn fc"
          >
            {summary.showGeocodeWarning ? labels.geocodeConfirm : labels.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
