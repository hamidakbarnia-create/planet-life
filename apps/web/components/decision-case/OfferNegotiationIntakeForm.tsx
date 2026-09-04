'use client';

import { useMemo, useState } from 'react';
import type { AppLang } from '@/lib/app-settings';
import { getAskProductCopy } from '@/lib/ask-product';
import {
  CANONICAL_OFFER_NEGOTIATION_FIELD_IDS,
  COUNTERPARTY_ROLE_VALUES,
  NEGOTIATION_GOAL_VALUES,
  OFFER_STAGE_VALUES,
  offerNegotiationHasFirstRequiredAnswer,
  offerNegotiationMissingRequiredFields,
  offerNegotiationRequiredFieldIdsForMode,
  offerNegotiationRequiredFieldsPresent,
  type OfferNegotiationIntake,
  type OfferNegotiationSlotId,
} from '@/lib/decision-case/offer-negotiation-form';
import {
  intakeControlClassName,
  intakeLabelClassName,
  intakePrimaryAction,
  intakePrimaryButtonClassName,
  intakePrimaryButtonStyle,
  intakeSecondaryButtonClassName,
} from './intake-field-presentation';

const FIELD_COPY_KEY: Record<
  OfferNegotiationSlotId,
  | 'intakeFieldNegotiationDate'
  | 'intakeFieldNegotiationGoal'
  | 'intakeFieldOfferStage'
  | 'intakeFieldCounterpartyRole'
> = {
  target_date: 'intakeFieldNegotiationDate',
  negotiation_goal: 'intakeFieldNegotiationGoal',
  offer_stage: 'intakeFieldOfferStage',
  counterparty_role: 'intakeFieldCounterpartyRole',
};

/** Canonical value order per select. Labels are resolved per locale. */
const SELECT_VALUES: Partial<
  Record<OfferNegotiationSlotId, readonly string[]>
> = {
  negotiation_goal: NEGOTIATION_GOAL_VALUES,
  offer_stage: OFFER_STAGE_VALUES,
  counterparty_role: COUNTERPARTY_ROLE_VALUES,
};

export function OfferNegotiationIntakeForm({
  lang,
  initialIntake,
  caseMode,
  submitting,
  onSubmitAnswers,
  onComplete,
}: {
  lang: AppLang;
  initialIntake?: OfferNegotiationIntake;
  /** EVALUATE is the only supported mode; kept for screen parity. */
  caseMode?: string | null;
  submitting?: boolean;
  onSubmitAnswers: (
    answers: Partial<OfferNegotiationIntake>
  ) => void | Promise<void>;
  onComplete: (
    answers: Partial<OfferNegotiationIntake>
  ) => void | Promise<void>;
}) {
  const copy = getAskProductCopy(lang);
  const [draft, setDraft] = useState<OfferNegotiationIntake>(
    initialIntake ?? {}
  );
  const missingRequired = useMemo(
    () => offerNegotiationMissingRequiredFields(draft, caseMode),
    [draft, caseMode]
  );
  const requiredPresent = useMemo(
    () => offerNegotiationRequiredFieldsPresent(draft, caseMode),
    [draft, caseMode]
  );
  const canSave = useMemo(
    () => offerNegotiationHasFirstRequiredAnswer(draft, caseMode),
    [draft, caseMode]
  );
  const primaryAction = intakePrimaryAction(requiredPresent);
  const focusSlot = missingRequired[0];

  const setField = (slotId: OfferNegotiationSlotId, value: string) => {
    setDraft((prev) => ({ ...prev, [slotId]: value }));
  };

  const optionLabel = (
    slotId: OfferNegotiationSlotId,
    value: string
  ): string => {
    if (slotId === 'negotiation_goal') {
      return copy.negotiationGoalOptions[
        value as keyof typeof copy.negotiationGoalOptions
      ];
    }
    if (slotId === 'offer_stage') {
      return copy.offerStageOptions[
        value as keyof typeof copy.offerStageOptions
      ];
    }
    return copy.counterpartyRoleOptions[
      value as keyof typeof copy.counterpartyRoleOptions
    ];
  };

  const requiredSet = new Set<string>(
    offerNegotiationRequiredFieldIdsForMode(caseMode)
  );

  return (
    <form
      className="space-y-5"
      data-testid="offer-negotiation-intake-form"
      data-mode={caseMode ?? 'evaluate_date'}
      dir={copy.dir}
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmitAnswers(draft);
      }}
    >
      <div className="space-y-4">
        {CANONICAL_OFFER_NEGOTIATION_FIELD_IDS.map((slotId) => {
          const value = draft[slotId] ?? '';
          const missing = missingRequired.includes(slotId);
          const required = requiredSet.has(slotId);
          const optional = !required;
          const known =
            slotId === 'target_date' && Boolean(value.trim()) && !missing;
          const focusMissing = focusSlot === slotId;
          const label = copy[FIELD_COPY_KEY[slotId]];
          const selectValues = SELECT_VALUES[slotId];
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
              {selectValues ? (
                <select
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
                >
                  <option value="">{copy.intakeSelect}</option>
                  {selectValues.map((option) => (
                    <option key={option} value={option}>
                      {optionLabel(slotId, option)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="date"
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
                .map((id) => copy[FIELD_COPY_KEY[id]])
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
