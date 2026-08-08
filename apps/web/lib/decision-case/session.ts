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
  compareDecisionCase,
  completeIntake,
  createDecisionCase,
  evaluateDecisionCase,
  findDecisionCase,
  getComparison,
  getDecisionCase,
  getDecisionCaseHistory,
  getEvaluation,
  getFinding,
  listDecisionCaseComparisons,
  listDecisionCaseEvaluations,
  listDecisionCaseFindings,
  saveIntakeAnswers,
  updateDecisionCaseFraming,
  type DecisionCaseResource,
  type DecisionComparisonResource,
  type DecisionEvaluationResource,
  type DecisionFindingResource,
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

function isCompareCase(caseRecord: DecisionCaseResource): boolean {
  if (caseRecord.mode === 'compare_dates' || caseRecord.state === 'compared') {
    return true;
  }
  const frame = caseRecord.intake?.decision_frame;
  return (
    !!frame &&
    typeof frame === 'object' &&
    (frame as { operation?: string }).operation === 'compare'
  );
}

/** True when Case mode or framing indicates FIND (find_dates). */
export function isFindCase(caseRecord: DecisionCaseResource): boolean {
  if (caseRecord.mode === 'find_dates' || caseRecord.state === 'found') {
    return true;
  }
  const frame = caseRecord.intake?.decision_frame;
  return (
    !!frame &&
    typeof frame === 'object' &&
    (frame as { operation?: string }).operation === 'find'
  );
}

function comparisonToEvaluationResource(
  comparison: DecisionComparisonResource
): DecisionEvaluationResource {
  return {
    evaluation_id: comparison.evaluation_id,
    case_id: comparison.case_id,
    case_version: comparison.case_version,
    evaluation_version: 0,
    package_contract_version: String(
      comparison.package?.schema_version || '1.0.0'
    ),
    engine_id: String(comparison.package?.engine_id || ''),
    dq_status:
      comparison.package?.recommendation?.stance === 'insufficient_data'
        ? 'blocked'
        : 'pass',
    created_at: comparison.created_at,
    package: comparison.package,
  };
}

function findingToEvaluationResource(
  finding: DecisionFindingResource
): DecisionEvaluationResource {
  return {
    evaluation_id: finding.finding_id,
    case_id: finding.case_id,
    case_version: finding.case_version,
    evaluation_version: finding.finding_version,
    package_contract_version: finding.package_contract_version,
    engine_id: finding.engine_id,
    dq_status: finding.dq_status,
    created_at: finding.created_at,
    package: finding.package,
  };
}

/** Ensure Case has authoritative Evaluate framing before Runtime executes.
 * COMPARE framing is already authoritative — never collapse it to evaluate.
 */
async function ensureEvaluateFramingOnCase(input: {
  caseId: string;
  caseVersion: number;
  intake: Record<string, unknown> | undefined;
}): Promise<DecisionCaseResource> {
  const existing = input.intake?.decision_frame;
  if (existing && typeof existing === 'object') {
    const frame = existing as {
      operation?: string;
      time_scope?: string;
      date?: string;
      dates?: unknown;
      options?: unknown;
      start?: string;
      end?: string;
    };
    if (
      frame.operation === 'evaluate' &&
      frame.time_scope === 'specific_date' &&
      typeof frame.date === 'string'
    ) {
      return getDecisionCase(input.caseId);
    }
    if (
      frame.operation === 'compare' &&
      frame.time_scope === 'multiple_dates' &&
      Array.isArray(frame.dates) &&
      frame.dates.length >= 2
    ) {
      return getDecisionCase(input.caseId);
    }
    if (
      frame.operation === 'find' &&
      frame.time_scope === 'date_range' &&
      typeof frame.start === 'string' &&
      typeof frame.end === 'string'
    ) {
      return getDecisionCase(input.caseId);
    }
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
 * FIND loads /findings; COMPARE loads /comparisons; EVALUATE loads /evaluations.
 * Creates a real Runtime execution through the API only when none exists yet.
 */
export async function loadCaseResult(caseId: string): Promise<{
  caseRecord: DecisionCaseResource;
  evaluation: DecisionEvaluationResource;
  history: DecisionHistoryEvent[];
}> {
  let caseRecord = await getDecisionCase(caseId);

  if (isFindCase(caseRecord)) {
    const listed = await listDecisionCaseFindings(caseId);
    if (listed.findings.length > 0) {
      const latest = listed.findings.reduce((a, b) =>
        a.finding_version >= b.finding_version ? a : b
      );
      const finding = await getFinding({
        caseId,
        findingId: latest.finding_id,
      });
      const history = (await getDecisionCaseHistory(caseId)).events;
      return {
        caseRecord,
        evaluation: findingToEvaluationResource(finding),
        history,
      };
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
      caseRecord.state !== 'evaluated' &&
      caseRecord.state !== 'found'
    ) {
      throw new DecisionCaseApiError({
        status: 409,
        code: 'ILLEGAL_TRANSITION',
        message: `Cannot find case in state ${caseRecord.state}`,
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

    const finding = await findDecisionCase({
      caseId,
      expectedCaseVersion: caseRecord.case_version,
    });
    caseRecord = await getDecisionCase(caseId);
    const history = (await getDecisionCaseHistory(caseId)).events;
    return {
      caseRecord,
      evaluation: findingToEvaluationResource(finding),
      history,
    };
  }

  if (isCompareCase(caseRecord)) {
    const listed = await listDecisionCaseComparisons(caseId);
    if (listed.comparisons.length > 0) {
      const latest = listed.comparisons.reduce((a, b) =>
        a.created_at >= b.created_at ? a : b
      );
      const comparison = await getComparison({
        caseId,
        comparisonId: latest.comparison_id,
      });
      const history = (await getDecisionCaseHistory(caseId)).events;
      return {
        caseRecord,
        evaluation: comparisonToEvaluationResource(comparison),
        history,
      };
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
      caseRecord.state !== 'evaluated' &&
      caseRecord.state !== 'compared'
    ) {
      throw new DecisionCaseApiError({
        status: 409,
        code: 'ILLEGAL_TRANSITION',
        message: `Cannot compare case in state ${caseRecord.state}`,
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

    const comparison = await compareDecisionCase({
      caseId,
      expectedCaseVersion: caseRecord.case_version,
    });
    caseRecord = await getDecisionCase(caseId);
    const history = (await getDecisionCaseHistory(caseId)).events;
    return {
      caseRecord,
      evaluation: comparisonToEvaluationResource(comparison),
      history,
    };
  }

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
