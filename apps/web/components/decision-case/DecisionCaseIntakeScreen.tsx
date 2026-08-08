'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CarInterviewIntakeForm } from '@/components/decision-case/CarInterviewIntakeForm';
import { InvestorMeetingIntakeForm } from '@/components/decision-case/InvestorMeetingIntakeForm';
import { getAskProductCopy } from '@/lib/ask-product';
import type { AppLang } from '@/lib/app-settings';
import {
  DecisionCaseApiError,
  completeCaseIntake,
  getDecisionCase,
  isSupportedIntakeDecisionType,
  prefillTargetDateFromFrame,
  saveIntakeAnswers,
  type CarInterviewIntake,
  type DecisionCaseIntake,
  type DecisionCaseResource,
  type InvestorMeetingIntake,
} from '@/lib/decision-case';
import { useQueuedEffect } from '@/lib/use-queued-effect';

function intakeAsCar(intake: DecisionCaseIntake): CarInterviewIntake {
  return {
    target_date:
      typeof intake.target_date === 'string' ? intake.target_date : undefined,
    role: typeof intake.role === 'string' ? intake.role : undefined,
    company: typeof intake.company === 'string' ? intake.company : undefined,
    interview_type:
      typeof intake.interview_type === 'string'
        ? intake.interview_type
        : undefined,
  };
}

function intakeAsInvestor(intake: DecisionCaseIntake): InvestorMeetingIntake {
  return {
    target_date:
      typeof intake.target_date === 'string' ? intake.target_date : undefined,
    meeting_goal:
      typeof intake.meeting_goal === 'string' ? intake.meeting_goal : undefined,
    investor_name:
      typeof intake.investor_name === 'string'
        ? intake.investor_name
        : undefined,
    meeting_type:
      typeof intake.meeting_type === 'string' ? intake.meeting_type : undefined,
  };
}

export function DecisionCaseIntakeScreen({
  lang,
  caseId,
  ready = true,
}: {
  lang: AppLang;
  caseId: string;
  ready?: boolean;
}) {
  const copy = getAskProductCopy(lang);
  const router = useRouter();
  const [caseRecord, setCaseRecord] = useState<DecisionCaseResource | null>(
    null
  );
  const [caseVersion, setCaseVersion] = useState<number | null>(null);
  const [intake, setIntake] = useState<DecisionCaseIntake>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  useQueuedEffect(() => {
    if (!ready || !caseId) return;
    let cancelled = false;
    (async () => {
      try {
        const current = await getDecisionCase(caseId);
        if (cancelled) return;
        if (!isSupportedIntakeDecisionType(current.decision_type_id)) {
          setUnsupported(true);
          setError(copy.intakeUnsupportedType);
          setCaseRecord(current);
          return;
        }
        setUnsupported(false);
        setCaseRecord(current);
        setCaseVersion(current.case_version);
        setIntake(
          prefillTargetDateFromFrame(
            (current.intake ?? {}) as DecisionCaseIntake
          ) as DecisionCaseIntake
        );
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof DecisionCaseApiError
            ? err.message
            : copy.intakeLoadError
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, caseId, copy.intakeLoadError, copy.intakeUnsupportedType]);

  const title =
    caseRecord?.decision_type_id === 'bus-investor-meeting'
      ? copy.intakeTitleInvestorMeeting
      : copy.intakeTitle;
  const body =
    caseRecord?.decision_type_id === 'bus-investor-meeting'
      ? copy.intakeBodyInvestorMeeting
      : copy.intakeBody;

  const persistAnswers = async (answers: Record<string, unknown>) => {
    if (caseVersion == null) {
      throw new DecisionCaseApiError({
        status: 400,
        code: 'VERSION_CONFLICT',
        message: copy.intakeSaveError,
      });
    }
    const result = await saveIntakeAnswers({
      caseId,
      expectedCaseVersion: caseVersion,
      answers,
    });
    setCaseRecord(result.case);
    setCaseVersion(result.case.case_version);
    setIntake(result.intake);
    return result;
  };

  return (
    <div
      className="mx-auto max-w-2xl px-4 py-8 space-y-6"
      dir={copy.dir}
      data-testid="decision-case-intake-screen"
    >
      <header className="space-y-2">
        <p className="fi text-xs uppercase tracking-[0.16em] text-amber-400/80">
          {copy.intakeEyebrow}
        </p>
        <h1 className="fc text-2xl text-white">{title}</h1>
        <p className="fi text-sm text-white/60">{body}</p>
      </header>

      {error ? (
        <p
          className="fi text-sm text-red-300"
          role="alert"
          data-testid="intake-error"
        >
          {error}
        </p>
      ) : null}

      {!unsupported && caseRecord?.decision_type_id === 'car-interview' ? (
        <div className="mio-glass mio-glass--primary !p-5">
          <CarInterviewIntakeForm
            key={`${caseId}-${caseVersion ?? 0}`}
            lang={lang}
            initialIntake={intakeAsCar(intake)}
            submitting={busy}
            onSubmitAnswers={async (answers) => {
              setBusy(true);
              setError('');
              try {
                await persistAnswers(answers);
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : copy.intakeSaveError
                );
              } finally {
                setBusy(false);
              }
            }}
            onComplete={async (answers) => {
              setBusy(true);
              setError('');
              try {
                const saved = await persistAnswers(answers);
                if (!saved.is_complete) {
                  setError(
                    copy.intakeRequiredRemaining(
                      saved.missing_required.join(', ')
                    )
                  );
                  return;
                }
                const completed = await completeCaseIntake({
                  caseId: saved.case.case_id,
                  caseVersion: saved.case.case_version,
                });
                router.push(
                  `/decision-cases/${completed.case.case_id}/result`
                );
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : copy.intakeCompleteError
                );
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>
      ) : null}

      {!unsupported &&
      caseRecord?.decision_type_id === 'bus-investor-meeting' ? (
        <div className="mio-glass mio-glass--primary !p-5">
          <InvestorMeetingIntakeForm
            key={`${caseId}-${caseVersion ?? 0}`}
            lang={lang}
            initialIntake={intakeAsInvestor(intake)}
            submitting={busy}
            onSubmitAnswers={async (answers) => {
              setBusy(true);
              setError('');
              try {
                await persistAnswers(answers);
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : copy.intakeSaveError
                );
              } finally {
                setBusy(false);
              }
            }}
            onComplete={async (answers) => {
              setBusy(true);
              setError('');
              try {
                const saved = await persistAnswers(answers);
                if (!saved.is_complete) {
                  setError(
                    copy.intakeRequiredRemaining(
                      saved.missing_required.join(', ')
                    )
                  );
                  return;
                }
                const completed = await completeCaseIntake({
                  caseId: saved.case.case_id,
                  caseVersion: saved.case.case_version,
                });
                router.push(
                  `/decision-cases/${completed.case.case_id}/result`
                );
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : copy.intakeCompleteError
                );
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>
      ) : null}

      <Link href="/ask" className="fi text-sm text-[#93B4FF] hover:text-white">
        {copy.backToAsk}
      </Link>
    </div>
  );
}
