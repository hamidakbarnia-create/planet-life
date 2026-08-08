'use client';

import { useMemo, useState } from 'react';
import type { AppLang } from '@/lib/app-settings';
import { getAskProductCopy } from '@/lib/ask-product';
import {
  CANONICAL_WEDDING_DATE_FIELD_IDS,
  weddingHasFirstRequiredAnswer,
  weddingMissingRequiredFields,
  weddingRequiredFieldIdsForMode,
  weddingRequiredFieldsPresent,
  type WeddingDateIntake,
  type WeddingDateSlotId,
} from '@/lib/decision-case/wedding-date-form';

const FIELD_COPY_KEY: Record<
  WeddingDateSlotId,
  | 'intakeFieldWeddingDate'
  | 'intakeFieldCeremonyType'
  | 'intakeFieldPartnerName'
  | 'intakeFieldVenue'
> = {
  target_date: 'intakeFieldWeddingDate',
  ceremony_type: 'intakeFieldCeremonyType',
  partner_name: 'intakeFieldPartnerName',
  venue: 'intakeFieldVenue',
};

const CEREMONY_TYPE_OPTIONS = [
  'civil',
  'religious',
  'reception',
  'destination',
  'other',
] as const;

export function WeddingDateIntakeForm({
  lang,
  initialIntake,
  caseMode,
  submitting,
  onSubmitAnswers,
  onComplete,
}: {
  lang: AppLang;
  initialIntake?: WeddingDateIntake;
  /** Case mode — compare_dates hides target_date requirement. */
  caseMode?: string | null;
  submitting?: boolean;
  onSubmitAnswers: (
    answers: Partial<WeddingDateIntake>
  ) => void | Promise<void>;
  onComplete: (answers: Partial<WeddingDateIntake>) => void | Promise<void>;
}) {
  const copy = getAskProductCopy(lang);
  const [draft, setDraft] = useState<WeddingDateIntake>(initialIntake ?? {});
  const isCompare = caseMode === 'compare_dates';
  const missingRequired = useMemo(
    () => weddingMissingRequiredFields(draft, caseMode),
    [draft, caseMode]
  );
  const requiredPresent = useMemo(
    () => weddingRequiredFieldsPresent(draft, caseMode),
    [draft, caseMode]
  );
  const canSave = useMemo(
    () => weddingHasFirstRequiredAnswer(draft, caseMode),
    [draft, caseMode]
  );

  const setField = (slotId: WeddingDateSlotId, value: string) => {
    setDraft((prev) => ({ ...prev, [slotId]: value }));
  };

  const requiredSet = new Set<string>(weddingRequiredFieldIdsForMode(caseMode));
  const visibleFields = CANONICAL_WEDDING_DATE_FIELD_IDS.filter(
    (slotId) => !(isCompare && slotId === 'target_date')
  );

  return (
    <form
      className="space-y-5"
      data-testid="wedding-date-intake-form"
      data-mode={caseMode ?? 'evaluate_date'}
      dir={copy.dir}
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmitAnswers(draft);
      }}
    >
      <div className="space-y-4">
        {visibleFields.map((slotId) => {
          const value = draft[slotId] ?? '';
          const missing = missingRequired.includes(slotId);
          const required = requiredSet.has(slotId);
          const label = copy[FIELD_COPY_KEY[slotId]];
          const isSelect = slotId === 'ceremony_type';
          return (
            <label key={slotId} className="block space-y-1.5">
              <span className="fi text-sm text-white/75">
                {label}
                {required ? (
                  <span className="text-amber-300/90"> *</span>
                ) : (
                  <span className="text-white/35"> ({copy.intakeOptional})</span>
                )}
              </span>
              {isSelect ? (
                <select
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 fi text-sm text-white outline-none focus-visible:border-amber-400/50"
                  value={value}
                  onChange={(event) => setField(slotId, event.target.value)}
                  data-testid={`intake-${slotId}`}
                >
                  <option value="">{copy.intakeSelect}</option>
                  {CEREMONY_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={slotId === 'target_date' ? 'date' : 'text'}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 fi text-sm text-white outline-none focus-visible:border-amber-400/50"
                  value={value}
                  onChange={(event) => setField(slotId, event.target.value)}
                  data-testid={`intake-${slotId}`}
                  aria-invalid={missing}
                />
              )}
            </label>
          );
        })}
      </div>

      <p className="fi text-xs text-white/45" data-testid="intake-status">
        {requiredPresent
          ? copy.intakeRequiredFilled
          : copy.intakeRequiredRemaining(
              missingRequired
                .map((id) => copy[FIELD_COPY_KEY[id as WeddingDateSlotId]])
                .filter(Boolean)
                .join(', ') || '—'
            )}
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting || !canSave}
          className="fc rounded-xl px-4 py-2.5 text-sm font-medium text-[#0a0f1c] disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #f2cf75, #d4af37)',
          }}
          data-testid="intake-save"
        >
          {copy.intakeSave}
        </button>
        <button
          type="button"
          disabled={submitting || !requiredPresent}
          onClick={() => {
            void onComplete(draft);
          }}
          className="fc rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/85 disabled:cursor-not-allowed disabled:opacity-40"
          data-testid="intake-complete"
        >
          {copy.intakeComplete}
        </button>
      </div>
    </form>
  );
}
