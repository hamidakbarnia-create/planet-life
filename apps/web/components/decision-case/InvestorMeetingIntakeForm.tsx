'use client';

import { useMemo, useState } from 'react';
import type { AppLang } from '@/lib/app-settings';
import { getAskProductCopy } from '@/lib/ask-product';
import {
  CANONICAL_INVESTOR_MEETING_FIELD_IDS,
  CANONICAL_INVESTOR_MEETING_REQUIRED_FIELD_IDS,
  investorHasFirstRequiredAnswer,
  investorMissingRequiredFields,
  investorRequiredFieldsPresent,
  type InvestorMeetingIntake,
  type InvestorMeetingSlotId,
} from '@/lib/decision-case/investor-meeting-form';

const FIELD_COPY_KEY: Record<
  InvestorMeetingSlotId,
  | 'intakeFieldMeetingDate'
  | 'intakeFieldMeetingGoal'
  | 'intakeFieldInvestorName'
  | 'intakeFieldMeetingType'
> = {
  target_date: 'intakeFieldMeetingDate',
  meeting_goal: 'intakeFieldMeetingGoal',
  investor_name: 'intakeFieldInvestorName',
  meeting_type: 'intakeFieldMeetingType',
};

const MEETING_TYPE_OPTIONS = ['intro', 'pitch', 'follow_up', 'other'] as const;

export function InvestorMeetingIntakeForm({
  lang,
  initialIntake,
  submitting,
  onSubmitAnswers,
  onComplete,
}: {
  lang: AppLang;
  initialIntake?: InvestorMeetingIntake;
  submitting?: boolean;
  onSubmitAnswers: (
    answers: Partial<InvestorMeetingIntake>
  ) => void | Promise<void>;
  onComplete: (answers: Partial<InvestorMeetingIntake>) => void | Promise<void>;
}) {
  const copy = getAskProductCopy(lang);
  const [draft, setDraft] = useState<InvestorMeetingIntake>(initialIntake ?? {});
  const missingRequired = useMemo(
    () => investorMissingRequiredFields(draft),
    [draft]
  );
  const requiredPresent = useMemo(
    () => investorRequiredFieldsPresent(draft),
    [draft]
  );
  const canSave = useMemo(
    () => investorHasFirstRequiredAnswer(draft),
    [draft]
  );

  const setField = (slotId: InvestorMeetingSlotId, value: string) => {
    setDraft((prev) => ({ ...prev, [slotId]: value }));
  };

  const requiredSet = new Set<string>(
    CANONICAL_INVESTOR_MEETING_REQUIRED_FIELD_IDS
  );

  return (
    <form
      className="space-y-5"
      data-testid="investor-meeting-intake-form"
      dir={copy.dir}
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmitAnswers(draft);
      }}
    >
      <div className="space-y-4">
        {CANONICAL_INVESTOR_MEETING_FIELD_IDS.map((slotId) => {
          const value = draft[slotId] ?? '';
          const missing = missingRequired.includes(slotId);
          const required = requiredSet.has(slotId);
          const label = copy[FIELD_COPY_KEY[slotId]];
          const isSelect = slotId === 'meeting_type';
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
                  {MEETING_TYPE_OPTIONS.map((option) => (
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
                .map((id) => copy[FIELD_COPY_KEY[id as InvestorMeetingSlotId]])
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
