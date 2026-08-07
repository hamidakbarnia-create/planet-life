/**
 * PR-2 car-interview session orchestration over Decision Case API.
 * Browser carries backend case_id only — no client Case SoR / local history.
 */

import {
  CAR_INTERVIEW_DECISION_TYPE_ID,
  CAR_INTERVIEW_LABEL,
  demoHasFirstRequiredAnswer,
  type CarInterviewIntake,
} from './car-interview-form';
import {
  DecisionCaseApiError,
  completeIntake,
  createDecisionCase,
  evaluateDecisionCase,
  getDecisionCase,
  getDecisionCaseHistory,
  getEvaluation,
  listDecisionCaseEvaluations,
  saveIntakeAnswers,
  type DecisionCaseResource,
  type DecisionEvaluationResource,
  type DecisionHistoryEvent,
  type IntakeMutationResult,
} from './api-client';

export type { DecisionCaseApiError };

export async function ensureCaseAndSaveAnswers(input: {
  caseId?: string | null;
  caseVersion?: number | null;
  answers: Partial<CarInterviewIntake>;
}): Promise<IntakeMutationResult> {
  const mergedProbe = { ...(input.answers ?? {}) };
  if (!input.caseId && !demoHasFirstRequiredAnswer(mergedProbe)) {
    throw new DecisionCaseApiError({
      status: 400,
      code: 'INTAKE_INCOMPLETE',
      message: 'First meaningful required answer is required before Case create',
      details: { missing_required: ['target_date', 'role'] },
    });
  }

  let caseId = input.caseId ?? null;
  let expectedVersion = input.caseVersion ?? null;

  if (!caseId) {
    const created = await createDecisionCase({
      decisionTypeId: CAR_INTERVIEW_DECISION_TYPE_ID,
      title: CAR_INTERVIEW_LABEL,
      entryMode: 'structured',
    });
    caseId = created.case_id;
    expectedVersion = created.case_version;
  }

  if (expectedVersion == null) {
    const current = await getDecisionCase(caseId);
    expectedVersion = current.case_version;
  }

  return saveIntakeAnswers({
    caseId,
    expectedCaseVersion: expectedVersion,
    answers: input.answers,
  });
}

export async function completeCaseIntake(input: {
  caseId: string;
  caseVersion: number;
}): Promise<IntakeMutationResult> {
  return completeIntake({
    caseId: input.caseId,
    expectedCaseVersion: input.caseVersion,
  });
}

export async function requestCaseEvaluation(input: {
  caseId: string;
  caseVersion: number;
}): Promise<DecisionEvaluationResource> {
  return evaluateDecisionCase({
    caseId: input.caseId,
    expectedCaseVersion: input.caseVersion,
  });
}

/**
 * Resolve package for result route from backend authority.
 * Creates a stub evaluation through the API only when none exists yet.
 */
export async function loadCaseResult(caseId: string): Promise<{
  caseRecord: DecisionCaseResource;
  evaluation: DecisionEvaluationResource;
  history: DecisionHistoryEvent[];
}> {
  let caseRecord = await getDecisionCase(caseId);

  const listed = await listDecisionCaseEvaluations(caseId);
  if (listed.evaluations.length > 0) {
    const latest = listed.evaluations.reduce((a, b) =>
      a.evaluation_version >= b.evaluation_version ? a : b
    );
    const evaluation = await getEvaluation({
      caseId,
      evaluationId: latest.evaluation_id,
    });
    const history = (await getDecisionCaseHistory(caseId)).events;
    return { caseRecord, evaluation, history };
  }

  if (caseRecord.state === 'intake' || caseRecord.state === 'draft') {
    const completed = await completeIntake({
      caseId,
      expectedCaseVersion: caseRecord.case_version,
    });
    caseRecord = { ...completed.case, intake: completed.intake };
  }

  if (
    caseRecord.state !== 'evidence_ready' &&
    caseRecord.state !== 'evaluated'
  ) {
    throw new DecisionCaseApiError({
      status: 409,
      code: 'ILLEGAL_TRANSITION',
      message: `Cannot evaluate case in state ${caseRecord.state}`,
      details: { state: caseRecord.state },
    });
  }

  const evaluation = await evaluateDecisionCase({
    caseId,
    expectedCaseVersion: caseRecord.case_version,
  });
  caseRecord = await getDecisionCase(caseId);
  const history = (await getDecisionCaseHistory(caseId)).events;
  return { caseRecord, evaluation, history };
}
