'use client';

import { useMemo, useState } from 'react';
import type { AppLang } from '@/lib/app-settings';
import { getAskProductCopy } from '@/lib/ask-product';
import {
  CANONICAL_CAR_INTERVIEW_FIELD_IDS,
  carInterviewRequiredFieldIdsForMode,
  demoHasFirstRequiredAnswer,
  demoMissingRequiredFields,
  demoRequiredFieldsPresent,
  type CarInterviewIntake,
  type CarInterviewSlotId,
} from '@/lib/decision-case';
import {
  intakeControlClassName,
  intakeLabelClassName,
  intakePrimaryAction,
  intakePrimaryButtonClassName,
  intakePrimaryButtonStyle,
  intakeSecondaryButtonClassName,
} from './intake-field-presentation';

const FIELD_COPY_KEY: Record<
  CarInterviewSlotId,
  | 'intakeFieldTargetDate'
  | 'intakeFieldRole'
  | 'intakeFieldCompany'
  | 'intakeFieldInterviewType'
> = {
  target_date: 'intakeFieldTargetDate',
  role: 'intakeFieldRole',
  company: 'intakeFieldCompany',
  interview_type: 'intakeFieldInterviewType',
};

const INTERVIEW_TYPE_OPTIONS = ['phone', 'video', 'onsite', 'panel'] as const;

export function CarInterviewIntakeForm({
  lang,
  initialIntake,
  caseMode,
  submitting,
  onSubmitAnswers,
  onComplete,
}: {
  lang: AppLang;
  initialIntake?: CarInterviewIntake;
  /** Case mode — compare_dates / find_dates hide target_date requirement. */
  caseMode?: string | null;
  submitting?: boolean;
  onSubmitAnswers: (answers: Partial<CarInterviewIntake>) => void | Promise<void>;
  onComplete: (answers: Partial<CarInterviewIntake>) => void | Promise<void>;
}) {
  const copy = getAskProductCopy(lang);
  // Parent remounts via `key` when case intake is loaded/updated so draft
  // initializes from props without a props→setState effect.
  const [draft, setDraft] = useState<CarInterviewIntake>(initialIntake ?? {});
  const hidesTargetDate =
    caseMode === 'compare_dates' || caseMode === 'find_dates';
  const missingRequired = useMemo(
    () => demoMissingRequiredFields(draft, caseMode),
    [draft, caseMode]
  );
  const requiredPresent = useMemo(
    () => demoRequiredFieldsPresent(draft, caseMode),
    [draft, caseMode]
  );
  const canSave = useMemo(
    () => demoHasFirstRequiredAnswer(draft, caseMode),
    [draft, caseMode]
  );
  const primaryAction = intakePrimaryAction(requiredPresent);
  const focusSlot = missingRequired[0];

  const setField = (slotId: CarInterviewSlotId, value: string) => {
    setDraft((prev) => ({ ...prev, [slotId]: value }));
  };

  const requiredSet = new Set<string>(
    carInterviewRequiredFieldIdsForMode(caseMode)
  );
  const visibleFields = CANONICAL_CAR_INTERVIEW_FIELD_IDS.filter(
    (slotId) => !(hidesTargetDate && slotId === 'target_date')
  );

  return (
    <form
      className="space-y-5"
      data-testid="car-interview-intake-form"
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
          const isSelect = slotId === 'interview_type';
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
                  {INTERVIEW_TYPE_OPTIONS.map((option) => (
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
                .map((id) => copy[FIELD_COPY_KEY[id as CarInterviewSlotId]])
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
          {caseMode === 'find_dates' ? copy.intakeCompleteFind : copy.intakeComplete}
        </button>
      </div>
    </form>
  );
}
