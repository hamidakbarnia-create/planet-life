'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  applyCompareDates,
  applyEvaluateDate,
  applyOperationChoice,
  applyOpenEndedAxis,
  canEvaluateInProduction,
  canExecuteInProduction,
  deriveClarificationState,
  getAskProductCopy,
  isEvaluateCapabilityUnavailable,
  isUnsupportedOperationFrame,
  localizeCaseApiError,
  persistFrameToCase,
  resetToExamineStep,
  saveDecisionFrame,
  type DecisionFrameV1,
} from '@/lib/ask-product';
import type { AppLang } from '@/lib/app-settings';
import styles from './ask-clarification.module.css';

type CompareDraft = { id: string; label: string; date: string };

function initialCompareDrafts(frame: DecisionFrameV1): CompareDraft[] {
  const fromOptions = (frame.options ?? [])
    .filter((o) => o.date)
    .map((o, index) => ({
      id: o.id || `opt-${index + 1}`,
      label: o.label || o.date || '',
      date: o.date || '',
    }));
  if (fromOptions.length >= 2) return fromOptions.slice(0, 3);
  const dates = frame.time.dates ?? [];
  if (dates.length >= 2) {
    return dates.slice(0, 3).map((date, index) => ({
      id: `opt-${index + 1}`,
      label: date,
      date,
    }));
  }
  return [
    { id: 'opt-1', label: '', date: '' },
    { id: 'opt-2', label: '', date: '' },
  ];
}

/**
 * Consumer clarification UX. Decision Frame stays internal.
 * EVALUATE / COMPARE offered only when the Web UX capability hint allows them
 * (shipped Runtime mirror — not backend authority). FIND remains Coming soon.
 */
export function AskClarificationFlow({
  lang,
  frame,
  caseId,
  caseVersion,
  onFrameChange,
  onCaseBound,
}: {
  lang: AppLang;
  frame: DecisionFrameV1;
  caseId: string | null;
  caseVersion: number | null;
  onFrameChange: (frame: DecisionFrameV1) => void;
  onCaseBound: (caseId: string, caseVersion: number) => void;
}) {
  const router = useRouter();
  const copy = getAskProductCopy(lang);
  const state = deriveClarificationState(frame);
  const evaluateCapable = canEvaluateInProduction(frame.decision_type_id);
  const compareCapable = canExecuteInProduction(
    frame.decision_type_id,
    'compare'
  );
  const [dateInput, setDateInput] = useState(frame.time.dates?.[0] ?? '');
  const [dateError, setDateError] = useState('');
  const [compareDrafts, setCompareDrafts] = useState<CompareDraft[]>(() =>
    initialCompareDrafts(frame)
  );
  const [compareError, setCompareError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const update = (next: DecisionFrameV1) => {
    saveDecisionFrame(next);
    onFrameChange(next);
  };

  if (isUnsupportedOperationFrame(frame)) {
    return (
      <section
        className={styles.panel}
        data-testid="ask-unsupported-operation"
        data-state="UNSUPPORTED_OPERATION"
        dir={copy.dir}
      >
        <p className={`fi ${styles.eyebrow}`}>{copy.clarificationEyebrow}</p>
        <h1 className={`fc ${styles.title}`}>{copy.unsupportedTitle}</h1>
        <p className={`fi ${styles.body}`}>{copy.unsupportedBody}</p>
        <p className={`fi ${styles.intent}`}>{frame.raw_intent}</p>
        <button
          type="button"
          className={styles.secondaryBtn}
          data-testid="unsupported-back"
          onClick={() => update(resetToExamineStep(frame))}
        >
          {copy.unsupportedBack}
        </button>
      </section>
    );
  }

  if (state === 'CAPABILITY_UNAVAILABLE') {
    return (
      <section
        className={styles.panel}
        data-testid="ask-capability-unavailable"
        data-state="CAPABILITY_UNAVAILABLE"
        dir={copy.dir}
      >
        <p className={`fi ${styles.eyebrow}`}>{copy.clarificationEyebrow}</p>
        <h1 className={`fc ${styles.title}`}>{copy.capabilityTitle}</h1>
        <p className={`fi ${styles.body}`}>{copy.capabilityBody}</p>
        <p className={`fi ${styles.body}`}>{copy.capabilitySecondary}</p>
        <div className={styles.intentBlock} data-testid="ask-intent-preserve">
          <p className={`fi ${styles.label}`}>{copy.yourDecision}</p>
          <p className={`fi ${styles.intent}`}>{frame.raw_intent}</p>
        </div>
        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.secondaryBtn}
            data-testid="capability-back"
            onClick={() => router.push('/ask')}
          >
            {copy.capabilityBack}
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            data-testid="capability-edit"
            onClick={() => {
              update(resetToExamineStep(frame));
              router.push('/ask');
            }}
          >
            {copy.capabilityEdit}
          </button>
        </div>
      </section>
    );
  }

  const showOpenEnded = frame.pending_clarification === 'open_ended_axis';
  const showExamine =
    !showOpenEnded &&
    (frame.operation === 'unresolved' ||
      frame.pending_clarification === 'operation');

  const showDate =
    evaluateCapable &&
    !showExamine &&
    !showOpenEnded &&
    frame.operation === 'evaluate' &&
    (frame.time.scope !== 'specific_date' || !frame.time.dates?.[0]);

  const showCompareDates =
    compareCapable &&
    !showExamine &&
    !showOpenEnded &&
    frame.operation === 'compare' &&
    state !== 'READY_TO_COMPARE';

  const showReady = state === 'READY_TO_EVALUATE' && evaluateCapable;
  const showReadyCompare = state === 'READY_TO_COMPARE' && compareCapable;

  const showEarlyCapability =
    !evaluateCapable &&
    !compareCapable &&
    !showOpenEnded &&
    (showExamine ||
      frame.operation === 'evaluate' ||
      isEvaluateCapabilityUnavailable(frame));

  const persistAndContinue = async (readyFrame: DecisionFrameV1) => {
    const operation = readyFrame.operation;
    if (
      operation !== 'evaluate' &&
      operation !== 'compare'
    ) {
      setError(copy.capabilityBody);
      return;
    }
    if (!canExecuteInProduction(readyFrame.decision_type_id, operation)) {
      setError(copy.capabilityBody);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await persistFrameToCase({
        frame: readyFrame,
        caseId,
        caseVersion,
        decisionTypeId: readyFrame.decision_type_id,
      });
      onCaseBound(result.case.case_id, result.case.case_version);
      router.push(`/decision-cases/${result.case.case_id}/intake`);
    } catch (err) {
      setError(localizeCaseApiError(err, lang));
      setBusy(false);
    }
  };

  const submitCompareDrafts = () => {
    const cleaned = compareDrafts
      .map((item, index) => ({
        id: item.id || `opt-${index + 1}`,
        label: item.label.trim() || item.date.trim(),
        date: item.date.trim(),
      }))
      .filter((item) => item.date);
    if (cleaned.length < 2) {
      setCompareError(copy.compareNeedTwo);
      return;
    }
    if (cleaned.length > 3) {
      setCompareError(copy.compareNeedTwo);
      return;
    }
    const unique = new Set(cleaned.map((c) => c.date));
    if (unique.size !== cleaned.length) {
      setCompareError(copy.compareDuplicateDates);
      return;
    }
    setCompareError('');
    update(applyCompareDates(frame, cleaned));
  };

  return (
    <section
      className={styles.panel}
      data-testid="ask-clarification-flow"
      data-state={state}
      dir={copy.dir}
    >
      <p className={`fi ${styles.eyebrow}`}>{copy.clarificationEyebrow}</p>
      <h1 className={`fc ${styles.title}`}>{copy.clarificationTitle}</h1>

      <div className={styles.intentBlock} data-testid="ask-intent-preserve">
        <p className={`fi ${styles.label}`}>{copy.yourDecision}</p>
        <p className={`fi ${styles.intent}`}>{frame.raw_intent}</p>
      </div>

      {showEarlyCapability ? (
        <div className={styles.block} data-testid="ask-capability-notice">
          <p className={`fi ${styles.prompt}`}>{copy.capabilityTitle}</p>
          <p className={`fi ${styles.hint}`}>{copy.capabilitySecondary}</p>
        </div>
      ) : null}

      {showOpenEnded ? (
        <div className={styles.block}>
          <p className={`fi ${styles.prompt}`}>{copy.examinePrompt}</p>
          <div className={styles.choices} data-testid="open-ended-axis">
            {evaluateCapable ? (
              <button
                type="button"
                className={styles.choice}
                onClick={() => update(applyOpenEndedAxis(frame, 'when'))}
              >
                {copy.examineEvaluate}
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.choice} ${styles.choiceDisabled}`}
                disabled
                aria-disabled="true"
                data-testid="open-ended-evaluate-disabled"
              >
                {copy.examineEvaluate}
                <span className={styles.soon}>
                  {' '}
                  — {copy.evaluateUnavailableForType}
                </span>
              </button>
            )}
          </div>
        </div>
      ) : null}

      {showExamine ||
      (!evaluateCapable &&
        !compareCapable &&
        !showOpenEnded &&
        !showDate &&
        !showReady &&
        !showReadyCompare) ? (
        <div className={styles.block}>
          <p className={`fi ${styles.prompt}`}>{copy.examinePrompt}</p>
          <div className={styles.choices} data-testid="examine-choices">
            {evaluateCapable ? (
              <button
                type="button"
                className={styles.choice}
                data-testid="examine-evaluate"
                onClick={() => update(applyOperationChoice(frame, 'evaluate'))}
              >
                {copy.examineEvaluate}
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.choice} ${styles.choiceDisabled}`}
                data-testid="examine-evaluate"
                disabled
                aria-disabled="true"
              >
                {copy.examineEvaluate}
                <span className={styles.soon}>
                  {' '}
                  — {copy.evaluateUnavailableForType}
                </span>
              </button>
            )}
            {compareCapable ? (
              <button
                type="button"
                className={styles.choice}
                data-testid="examine-compare"
                onClick={() => update(applyOperationChoice(frame, 'compare'))}
              >
                {copy.examineCompare}
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.choice} ${styles.choiceDisabled}`}
                data-testid="examine-compare"
                disabled
                aria-disabled="true"
              >
                {copy.examineCompare}
                <span className={styles.soon}> — {copy.comingSoon}</span>
              </button>
            )}
            <button
              type="button"
              className={`${styles.choice} ${styles.choiceDisabled}`}
              data-testid="examine-find"
              disabled
              aria-disabled="true"
            >
              {copy.examineFind}
              <span className={styles.soon}> — {copy.comingSoon}</span>
            </button>
          </div>
          {!evaluateCapable && !compareCapable ? (
            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.secondaryBtn}
                data-testid="capability-back"
                onClick={() => router.push('/ask')}
              >
                {copy.capabilityBack}
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                data-testid="capability-edit"
                onClick={() => router.push('/ask')}
              >
                {copy.capabilityEdit}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {showDate ? (
        <div className={styles.block} data-testid="ask-date-step">
          <p className={`fi ${styles.prompt}`}>{copy.datePrompt}</p>
          <p className={`fi ${styles.hint}`}>{copy.dateHint}</p>
          <label className={styles.dateLabel}>
            <input
              type="date"
              className={styles.dateInput}
              value={dateInput}
              data-testid="ask-evaluate-date"
              onChange={(e) => {
                setDateInput(e.target.value);
                setDateError('');
              }}
            />
          </label>
          {dateError ? (
            <p className={`fi ${styles.error}`} role="alert">
              {dateError}
            </p>
          ) : null}
          <button
            type="button"
            className={styles.primaryBtn}
            data-testid="ask-date-continue"
            onClick={() => {
              if (!dateInput) {
                setDateError(copy.dateMissing);
                return;
              }
              update(applyEvaluateDate(frame, dateInput));
            }}
          >
            {copy.dateContinue}
          </button>
        </div>
      ) : null}

      {showCompareDates ? (
        <div className={styles.block} data-testid="ask-compare-dates-step">
          <p className={`fi ${styles.prompt}`}>{copy.compareDatesPrompt}</p>
          <p className={`fi ${styles.hint}`}>{copy.compareDatesHint}</p>
          <div className={styles.choices}>
            {compareDrafts.map((draft, index) => (
              <div
                key={draft.id}
                className={styles.intentBlock}
                data-testid={`compare-option-row-${index}`}
              >
                <label className={styles.dateLabel}>
                  <span className={`fi ${styles.label}`}>
                    {copy.compareOptionLabel}
                  </span>
                  <input
                    className={styles.dateInput}
                    value={draft.label}
                    data-testid={`compare-option-label-${index}`}
                    onChange={(e) => {
                      setCompareDrafts((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? { ...item, label: e.target.value }
                            : item
                        )
                      );
                      setCompareError('');
                    }}
                  />
                </label>
                <label className={styles.dateLabel}>
                  <span className={`fi ${styles.label}`}>
                    {copy.compareOptionDate}
                  </span>
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={draft.date}
                    data-testid={`compare-option-date-${index}`}
                    onChange={(e) => {
                      setCompareDrafts((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? { ...item, date: e.target.value }
                            : item
                        )
                      );
                      setCompareError('');
                    }}
                  />
                </label>
                {compareDrafts.length > 2 ? (
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    data-testid={`compare-option-remove-${index}`}
                    onClick={() =>
                      setCompareDrafts((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                  >
                    {copy.compareRemoveOption}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          {compareDrafts.length < 3 ? (
            <button
              type="button"
              className={styles.secondaryBtn}
              data-testid="compare-add-option"
              onClick={() =>
                setCompareDrafts((prev) => [
                  ...prev,
                  {
                    id: `opt-${prev.length + 1}`,
                    label: '',
                    date: '',
                  },
                ])
              }
            >
              {copy.compareAddOption}
            </button>
          ) : null}
          {compareError ? (
            <p className={`fi ${styles.error}`} role="alert">
              {compareError}
            </p>
          ) : null}
          <button
            type="button"
            className={styles.primaryBtn}
            data-testid="ask-compare-dates-continue"
            onClick={submitCompareDrafts}
          >
            {copy.dateContinue}
          </button>
        </div>
      ) : null}

      {showReady ? (
        <div className={styles.block} data-testid="ask-ready-evaluate">
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={busy}
            data-testid="ask-persist-evaluate"
            onClick={() => void persistAndContinue(frame)}
          >
            {busy ? copy.evaluating : copy.persistAndEvaluate}
          </button>
        </div>
      ) : null}

      {showReadyCompare ? (
        <div className={styles.block} data-testid="ask-ready-compare">
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={busy}
            data-testid="ask-persist-compare"
            onClick={() => void persistAndContinue(frame)}
          >
            {busy ? copy.comparing : copy.persistAndCompare}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className={`fi ${styles.error}`} role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
