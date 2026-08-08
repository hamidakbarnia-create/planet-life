/**
 * Decision Case session orchestration over Case API.
 * Browser carries backend case_id only — no client Case SoR / local history.
 * Runtime authority is Case intake (decision_frame + natal_evidence), not sessionStorage.
 *
 * `ensureCaseAndSaveAnswers` remains the car-interview create-on-first-answer
 * helper for the popular-card entry path. Generic ASK intake uses an existing
 * Case id and `saveIntakeAnswers` / `completeCaseIntake` directly.
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
  updateDecisionCaseFraming,
  type DecisionCaseResource,
  type DecisionEvaluationResource,
  type DecisionHistoryEvent,
  type IntakeMutationResult,
  type NatalEvidencePayload,
  type PersistedDecisionFraming,
} from './api-client';
import { getProfileRepository } from '@/lib/profile';

export type { DecisionCaseApiError };

/**
 * Copy birth inputs from the local profile repository onto the Case as a
 * one-time evaluation evidence snapshot (`intake.natal_evidence`).
 *
 * Profile remains the user-profile authority. The Case stores a snapshot so
 * Runtime can reproduce evaluations from persisted Case state without reading
 * browser profile/sessionStorage at score time.
 */
function natalSnapshotFromLocalProfile(): NatalEvidencePayload | null {
  const profile = getProfileRepository().loadProfile();
  if (!profile?.birth_date || !profile.birth_time) return null;
  const location =
    profile.birth_place?.short?.trim() ||
    profile.birth_place?.name?.trim() ||
    '';
  if (!location) return null;
  // Birth fields only. Do NOT copy birth place into interview/event location —
  // those are distinct concepts. Event location is omitted until the Case
  // carries a real interview location (engine may default transit to birth).
  return {
    birth_date: profile.birth_date,
    birth_time: profile.birth_time,
    location,
    latitude: profile.birth_place.lat,
    longitude: profile.birth_place.lon,
  };
}

function evaluateFramingFromIntake(
  intake: Record<string, unknown> | CarInterviewIntake | undefined
): PersistedDecisionFraming | null {
  const target =
    intake && typeof intake === 'object'
      ? String((intake as Record<string, unknown>).target_date || '').trim()
      : '';
  if (!target) return null;
  return {
    operation: 'evaluate',
    time_scope: 'specific_date',
    date: target,
    objective: 'Evaluate selected date',
    raw_intent: `Evaluate date ${target}`,
  };
}

/** Ensure Case has authoritative Evaluate framing before Runtime executes. */
async function ensureEvaluateFramingOnCase(input: {
  caseId: string;
  caseVersion: number;
  intake: Record<string, unknown> | undefined;
}): Promise<DecisionCaseResource> {
  const existing = input.intake?.decision_frame;
  if (
    existing &&
    typeof existing === 'object' &&
    (existing as { operation?: string }).operation === 'evaluate' &&
    (existing as { time_scope?: string }).time_scope === 'specific_date' &&
    typeof (existing as { date?: string }).date === 'string'
  ) {
    const current = await getDecisionCase(input.caseId);
    return current;
  }
  const framing = evaluateFramingFromIntake(input.intake);
  if (!framing) {
    throw new DecisionCaseApiError({
      status: 400,
      code: 'FRAMING_REQUIRED',
      message: 'Target date is required before evaluation',
      details: { missing: ['decision_frame.date'] },
    });
  }
  const updated = await updateDecisionCaseFraming({
    caseId: input.caseId,
    expectedCaseVersion: input.caseVersion,
    framing,
  });
  return { ...updated.case, intake: updated.intake as DecisionCaseResource['intake'] };
}

async function ensureNatalEvidenceOnCase(input: {
  caseId: string;
  caseVersion: number;
  intake: Record<string, unknown> | undefined;
}): Promise<DecisionCaseResource> {
  const existing = input.intake?.natal_evidence;
  if (existing && typeof existing === 'object') {
    return getDecisionCase(input.caseId);
  }
  const natal = natalSnapshotFromLocalProfile();
  if (!natal) {
    // Runtime will return insufficient_data Package — do not invent natal.
    return getDecisionCase(input.caseId);
  }
  const saved = await saveIntakeAnswers({
    caseId: input.caseId,
    expectedCaseVersion: input.caseVersion,
    answers: { natal_evidence: natal },
  });
  return { ...saved.case, intake: saved.intake };
}

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
  let caseRecord = await getDecisionCase(input.caseId);
  caseRecord = await ensureEvaluateFramingOnCase({
    caseId: input.caseId,
    caseVersion: caseRecord.case_version,
    intake: caseRecord.intake as Record<string, unknown> | undefined,
  });
  caseRecord = await ensureNatalEvidenceOnCase({
    caseId: input.caseId,
    caseVersion: caseRecord.case_version,
    intake: caseRecord.intake as Record<string, unknown> | undefined,
  });
  return evaluateDecisionCase({
    caseId: input.caseId,
    expectedCaseVersion: caseRecord.case_version,
  });
}

/**
 * Resolve package for result route from backend authority.
 * Creates a real Runtime evaluation through the API only when none exists yet.
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

  caseRecord = await ensureEvaluateFramingOnCase({
    caseId,
    caseVersion: caseRecord.case_version,
    intake: caseRecord.intake as Record<string, unknown> | undefined,
  });
  caseRecord = await ensureNatalEvidenceOnCase({
    caseId,
    caseVersion: caseRecord.case_version,
    intake: caseRecord.intake as Record<string, unknown> | undefined,
  });

  const evaluation = await evaluateDecisionCase({
    caseId,
    expectedCaseVersion: caseRecord.case_version,
  });
  caseRecord = await getDecisionCase(caseId);
  const history = (await getDecisionCaseHistory(caseId)).events;
  return { caseRecord, evaluation, history };
}
