'use client';

import { useMemo, useState } from 'react';
import {
  CAR_INTERVIEW_FORM_FIELDS,
  demoHasFirstRequiredAnswer,
  demoMissingRequiredFields,
  demoRequiredFieldsPresent,
  type CarInterviewIntake,
  type CarInterviewSlotId,
} from '@/lib/decision-case';

export function CarInterviewIntakeForm({
  initialIntake,
  submitting,
  onSubmitAnswers,
  onComplete,
}: {
  initialIntake?: CarInterviewIntake;
  submitting?: boolean;
  onSubmitAnswers: (answers: Partial<CarInterviewIntake>) => void;
  onComplete: (answers: Partial<CarInterviewIntake>) => void;
}) {
  const [draft, setDraft] = useState<CarInterviewIntake>(initialIntake ?? {});
  const missingRequired = useMemo(
    () => demoMissingRequiredFields(draft),
    [draft]
  );
  const requiredPresent = useMemo(
    () => demoRequiredFieldsPresent(draft),
    [draft]
  );
  const canSave = useMemo(() => demoHasFirstRequiredAnswer(draft), [draft]);

  const setField = (slotId: CarInterviewSlotId, value: string) => {
    setDraft((prev) => ({ ...prev, [slotId]: value }));
  };

  return (
    <form
      className="space-y-5"
      data-testid="car-interview-intake-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmitAnswers(draft);
      }}
    >
      <div className="space-y-4">
        {CAR_INTERVIEW_FORM_FIELDS.map((slot) => {
          const value = draft[slot.slotId] ?? '';
          const missing = missingRequired.includes(slot.slotId);
          return (
            <label key={slot.slotId} className="block space-y-1.5">
              <span className="fi text-sm text-white/75">
                {slot.label}
                {slot.required ? (
                  <span className="text-amber-300/90"> *</span>
                ) : (
                  <span className="text-white/35"> (optional)</span>
                )}
              </span>
              {slot.inputType === 'select' ? (
                <select
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 fi text-sm text-white outline-none focus-visible:border-amber-400/50"
                  value={value}
                  onChange={(event) => setField(slot.slotId, event.target.value)}
                  data-testid={`intake-${slot.slotId}`}
                >
                  <option value="">Select…</option>
                  {(slot.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={slot.inputType}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 fi text-sm text-white outline-none focus-visible:border-amber-400/50"
                  value={value}
                  onChange={(event) => setField(slot.slotId, event.target.value)}
                  data-testid={`intake-${slot.slotId}`}
                  aria-invalid={missing}
                />
              )}
            </label>
          );
        })}
      </div>

      <p className="fi text-xs text-white/45" data-testid="intake-status">
        {requiredPresent
          ? 'Required demo fields filled — you can generate the demo package.'
          : `Required remaining: ${missingRequired.join(', ') || 'none'}`}
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
          Save answers
        </button>
        <button
          type="button"
          disabled={submitting || !requiredPresent}
          onClick={() => onComplete(draft)}
          className="fc rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/85 disabled:cursor-not-allowed disabled:opacity-40"
          data-testid="intake-complete"
        >
          Generate demo package
        </button>
      </div>
    </form>
  );
}
