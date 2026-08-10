'use client';

import { useMemo, useState } from 'react';
import type { AppLang } from '@/lib/app-settings';
import { getAskProductCopy } from '@/lib/ask-product';
import {
  CANONICAL_PRODUCT_LAUNCH_FIELD_IDS,
  productLaunchHasFirstRequiredAnswer,
  productLaunchMissingRequiredFields,
  productLaunchRequiredFieldIdsForMode,
  productLaunchRequiredFieldsPresent,
  type ProductLaunchIntake,
  type ProductLaunchSlotId,
} from '@/lib/decision-case/product-launch-form';
import {
  intakeControlClassName,
  intakeLabelClassName,
  intakePrimaryAction,
  intakePrimaryButtonClassName,
  intakePrimaryButtonStyle,
  intakeSecondaryButtonClassName,
} from './intake-field-presentation';

const FIELD_COPY_KEY: Record<
  ProductLaunchSlotId,
  | 'intakeFieldLaunchDate'
  | 'intakeFieldLaunchObject'
  | 'intakeFieldLaunchChannel'
  | 'intakeFieldBrandOrCompany'
> = {
  target_date: 'intakeFieldLaunchDate',
  launch_object: 'intakeFieldLaunchObject',
  launch_channel: 'intakeFieldLaunchChannel',
  brand_or_company: 'intakeFieldBrandOrCompany',
};

const LAUNCH_CHANNEL_OPTIONS = [
  'online',
  'retail',
  'event',
  'marketplace',
  'other',
] as const;

export function ProductLaunchIntakeForm({
  lang,
  initialIntake,
  caseMode,
  submitting,
  onSubmitAnswers,
  onComplete,
}: {
  lang: AppLang;
  initialIntake?: ProductLaunchIntake;
  /** Case mode — find_dates hides target_date (range lives on framing). */
  caseMode?: string | null;
  submitting?: boolean;
  onSubmitAnswers: (
    answers: Partial<ProductLaunchIntake>
  ) => void | Promise<void>;
  onComplete: (answers: Partial<ProductLaunchIntake>) => void | Promise<void>;
}) {
  const copy = getAskProductCopy(lang);
  const [draft, setDraft] = useState<ProductLaunchIntake>(initialIntake ?? {});
  const isFind = caseMode === 'find_dates';
  const missingRequired = useMemo(
    () => productLaunchMissingRequiredFields(draft, caseMode),
    [draft, caseMode]
  );
  const requiredPresent = useMemo(
    () => productLaunchRequiredFieldsPresent(draft, caseMode),
    [draft, caseMode]
  );
  const canSave = useMemo(
    () => productLaunchHasFirstRequiredAnswer(draft, caseMode),
    [draft, caseMode]
  );
  const primaryAction = intakePrimaryAction(requiredPresent);
  const focusSlot = missingRequired[0];

  const setField = (slotId: ProductLaunchSlotId, value: string) => {
    setDraft((prev) => ({ ...prev, [slotId]: value }));
  };

  const requiredSet = new Set<string>(
    productLaunchRequiredFieldIdsForMode(caseMode)
  );
  const visibleFields = CANONICAL_PRODUCT_LAUNCH_FIELD_IDS.filter(
    (slotId) => !(isFind && slotId === 'target_date')
  );

  return (
    <form
      className="space-y-5"
      data-testid="product-launch-intake-form"
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
          const isSelect = slotId === 'launch_channel';
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
                  {LAUNCH_CHANNEL_OPTIONS.map((option) => (
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
                .map((id) => copy[FIELD_COPY_KEY[id as ProductLaunchSlotId]])
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
          {isFind ? copy.intakeCompleteFind : copy.intakeComplete}
        </button>
      </div>
    </form>
  );
}
