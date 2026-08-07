'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  applyEvaluateDate,
  applyOperationChoice,
  applyOpenEndedAxis,
  deriveClarificationState,
  getAskProductCopy,
  isUnsupportedOperationFrame,
  persistFrameToCase,
  resetToExamineStep,
  saveDecisionFrame,
  type DecisionFrameV1,
} from '@/lib/ask-product';
import { DecisionCaseApiError } from '@/lib/decision-case';
import type { AppLang } from '@/lib/app-settings';
import styles from './ask-clarification.module.css';

/**
 * Consumer clarification UX. Decision Frame stays internal.
 * COMPARE/FIND are visible but disabled (Coming soon).
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
  const [dateInput, setDateInput] = useState(frame.time.dates?.[0] ?? '');
  const [dateError, setDateError] = useState('');
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

  const showOpenEnded = frame.pending_clarification === 'open_ended_axis';
  const showExamine =
    !showOpenEnded &&
    (frame.operation === 'unresolved' ||
      frame.pending_clarification === 'operation');

  const showDate =
    !showExamine &&
    !showOpenEnded &&
    frame.operation === 'evaluate' &&
    (frame.time.scope !== 'specific_date' || !frame.time.dates?.[0]);

  const showReady = state === 'READY_TO_EVALUATE';

  const runEvaluate = async (readyFrame: DecisionFrameV1) => {
    setBusy(true);
    setError('');
    try {
      const result = await persistFrameToCase({
        frame: readyFrame,
        caseId,
        caseVersion,
      });
      onCaseBound(result.case.case_id, result.case.case_version);
      router.push(`/decision-cases/${result.case.case_id}/result`);
    } catch (err) {
      setError(
        err instanceof DecisionCaseApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : copy.errorGeneric
      );
      setBusy(false);
    }
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

      {showOpenEnded ? (
        <div className={styles.block}>
          <p className={`fi ${styles.prompt}`}>{copy.examinePrompt}</p>
          <div className={styles.choices} data-testid="open-ended-axis">
            <button
              type="button"
              className={styles.choice}
              onClick={() => update(applyOpenEndedAxis(frame, 'when'))}
            >
              {copy.examineEvaluate}
            </button>
          </div>
        </div>
      ) : null}

      {showExamine ? (
        <div className={styles.block}>
          <p className={`fi ${styles.prompt}`}>{copy.examinePrompt}</p>
          <div className={styles.choices} data-testid="examine-choices">
            <button
              type="button"
              className={styles.choice}
              data-testid="examine-evaluate"
              onClick={() => update(applyOperationChoice(frame, 'evaluate'))}
            >
              {copy.examineEvaluate}
            </button>
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

      {showReady ? (
        <div className={styles.block} data-testid="ask-ready-evaluate">
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={busy}
            data-testid="ask-persist-evaluate"
            onClick={() => void runEvaluate(frame)}
          >
            {busy ? copy.evaluating : copy.persistAndEvaluate}
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
