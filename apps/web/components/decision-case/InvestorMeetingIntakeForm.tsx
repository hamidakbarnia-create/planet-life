'use client';

import { useMemo, useState } from 'react';
import type { AppLang } from '@/lib/app-settings';
import { getAskProductCopy } from '@/lib/ask-product';
import {
  CANONICAL_INVESTOR_MEETING_FIELD_IDS,
  investorHasFirstRequiredAnswer,
  investorMissingRequiredFields,
  investorRequiredFieldIdsForMode,
  investorRequiredFieldsPresent,
  type InvestorMeetingIntake,
  type InvestorMeetingSlotId,
} from '@/lib/decision-case/investor-meeting-form';
import {
  intakeControlClassName,
  intakeLabelClassName,
  intakePrimaryAction,
  intakePrimaryButtonClassName,
  intakePrimaryButtonStyle,
  intakeSecondaryButtonClassName,
} from './intake-field-presentation';

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
  caseMode,
  submitting,
  onSubmitAnswers,
  onComplete,
}: {
  lang: AppLang;
  initialIntake?: InvestorMeetingIntake;
  /** Case mode — compare_dates hides target_date requirement. */
  caseMode?: string | null;
  submitting?: boolean;
  onSubmitAnswers: (
    answers: Partial<InvestorMeetingIntake>
  ) => void | Promise<void>;
  onComplete: (answers: Partial<InvestorMeetingIntake>) => void | Promise<void>;
}) {
  const copy = getAskProductCopy(lang);
  const [draft, setDraft] = useState<InvestorMeetingIntake>(initialIntake ?? {});
  const isCompare = caseMode === 'compare_dates';
  const missingRequired = useMemo(
    () => investorMissingRequiredFields(draft, caseMode),
    [draft, caseMode]
  );
  const requiredPresent = useMemo(
    () => investorRequiredFieldsPresent(draft, caseMode),
    [draft, caseMode]
  );
  const canSave = useMemo(
    () => investorHasFirstRequiredAnswer(draft, caseMode),
    [draft, caseMode]
  );
  const primaryAction = intakePrimaryAction(requiredPresent);
  const focusSlot = missingRequired[0];

  const setField = (slotId: InvestorMeetingSlotId, value: string) => {
    setDraft((prev) => ({ ...prev, [slotId]: value }));
  };

  const requiredSet = new Set<string>(
    investorRequiredFieldIdsForMode(caseMode)
  );
  const visibleFields = CANONICAL_INVESTOR_MEETING_FIELD_IDS.filter(
    (slotId) => !(isCompare && slotId === 'target_date')
  );

  return (
    <form
      className="space-y-5"
      data-testid="investor-meeting-intake-form"
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
          const optional = !required;
          const known =
            slotId === 'target_date' && Boolean(value.trim()) && !missing;
          const focusMissing = focusSlot === slotId;
          const label = copy[FIELD_COPY_KEY[slotId]];
          const isSelect = slotId === 'meeting_type';
          return (
            <label
              key={slotId}
              className="block space-y-1.5"
              data-known={known ? 'true' : undefined}
              data-focus-missing={focusMissing ? 'true' : undefined}
            >
              <span
                className={intakeLabelClassName({
                  known,
                  focusMissing,
                  optional,
                })}
              >
                {label}
                {required ? (
                  <span className="text-amber-300/90"> *</span>
                ) : (
                  <span className="text-white/35"> ({copy.intakeOptional})</span>
                )}
              </span>
              {known ? (
                <p
                  className="fi text-xs text-white/40"
                  data-testid="intake-known-hint"
                >
                  {copy.intakeKnownFromAsk}
                </p>
              ) : null}
              {isSelect ? (
                <select
                  className={intakeControlClassName({
                    known,
                    focusMissing,
                    optional,
                  })}
                  value={value}
                  onChange={(event) => setField(slotId, event.target.value)}
                  data-testid={`intake-${slotId}`}
                  autoFocus={focusMissing}
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
                  className={intakeControlClassName({
                    known,
                    focusMissing,
                    optional,
                  })}
                  value={value}
                  onChange={(event) => setField(slotId, event.target.value)}
                  data-testid={`intake-${slotId}`}
                  aria-invalid={missing}
                  autoFocus={focusMissing}
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
          className={
            primaryAction === 'save'
              ? intakePrimaryButtonClassName()
              : intakeSecondaryButtonClassName()
          }
          style={primaryAction === 'save' ? intakePrimaryButtonStyle : undefined}
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
          className={
            primaryAction === 'complete'
              ? intakePrimaryButtonClassName()
              : intakeSecondaryButtonClassName()
          }
          style={
            primaryAction === 'complete' ? intakePrimaryButtonStyle : undefined
          }
          data-testid="intake-complete"
        >
          {copy.intakeComplete}
        </button>
      </div>
    </form>
  );
}
