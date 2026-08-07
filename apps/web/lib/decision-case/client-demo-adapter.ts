/**
 * PR-1 temporary client walking-skeleton adapter for car-interview.
 *
 * NOT the Decision Case repository. NOT Decision History SoR.
 * Production authority is the backend Decision Case API:
 *   POST/GET /api/v1/decision-cases
 *   POST /api/v1/decision-cases/{case_id}/complete
 *   GET  /api/v1/decision-cases/{case_id}/history
 *   GET  /api/v1/decision-cases/{case_id}/evaluations
 *   (intake answers/complete reserved for later PRs)
 *
 * This adapter only keeps demo session state in localStorage so the vertical
 * slice can be clicked through without backend intake wiring.
 */

import type { DecisionEvaluationPackage } from './package-types';
import {
  CAR_INTERVIEW_DECISION_TYPE_ID,
  CAR_INTERVIEW_FAMILY_ID,
  CAR_INTERVIEW_LABEL,
  demoHasFirstRequiredAnswer,
  demoMissingRequiredFields,
  demoRequiredFieldsPresent,
  mergeCarInterviewFormAnswers,
  type CarInterviewIntake,
} from './car-interview-form';
import { bindDemoStubPackage } from './demo-stub-fixture';

const STORAGE_KEY = 'metioro-pr1-car-interview-demo-v1';

/** Minimal UI state for the demo — not the production Case lifecycle. */
export type DemoUiState = 'collecting' | 'package_ready';

export type DemoCaseRecord = {
  demoCaseId: string;
  decisionTypeId: typeof CAR_INTERVIEW_DECISION_TYPE_ID;
  familyId: typeof CAR_INTERVIEW_FAMILY_ID;
  title: string;
  uiState: DemoUiState;
  mode: 'evaluate_date';
  caseVersion: number;
  intake: CarInterviewIntake;
  package: DecisionEvaluationPackage | null;
  createdAt: string;
  updatedAt: string;
};

/** Local demo/session events only — not production Decision History. */
export type LocalDemoEvent = {
  eventId: string;
  demoCaseId: string;
  type: 'demo_case_opened' | 'demo_answers_updated' | 'demo_package_bound';
  at: string;
  summary: string;
};

type StoreShape = {
  cases: DemoCaseRecord[];
  localEvents: LocalDemoEvent[];
};

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyStore(): StoreShape {
  return { cases: [], localEvents: [] };
}

function readStore(): StoreShape {
  if (typeof window === 'undefined') return emptyStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as StoreShape;
    return {
      cases: Array.isArray(parsed.cases) ? parsed.cases : [],
      localEvents: Array.isArray(parsed.localEvents) ? parsed.localEvents : [],
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: StoreShape): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function pushLocalEvent(
  store: StoreShape,
  event: Omit<LocalDemoEvent, 'eventId'>
): void {
  store.localEvents = [
    { eventId: newId(), ...event },
    ...store.localEvents,
  ].slice(0, 200);
}

export function listDemoCases(): DemoCaseRecord[] {
  return readStore().cases;
}

export function getDemoCase(demoCaseId: string): DemoCaseRecord | null {
  return readStore().cases.find((row) => row.demoCaseId === demoCaseId) ?? null;
}

export function listLocalDemoEvents(demoCaseId?: string): LocalDemoEvent[] {
  const events = readStore().localEvents;
  return demoCaseId
    ? events.filter((row) => row.demoCaseId === demoCaseId)
    : events;
}

/**
 * Persist demo form answers in the client adapter.
 * Opens a demo case only after the first required field is answered (UI gate).
 */
export function saveDemoCarInterviewAnswers(input: {
  demoCaseId?: string | null;
  answers: Partial<CarInterviewIntake>;
}): {
  demoCase: DemoCaseRecord;
  created: boolean;
  missingRequired: ReturnType<typeof demoMissingRequiredFields>;
  requiredPresent: boolean;
} {
  const store = readStore();

  let existing: DemoCaseRecord | null = null;
  if (input.demoCaseId) {
    existing =
      store.cases.find((row) => row.demoCaseId === input.demoCaseId) ?? null;
    if (!existing) {
      throw new Error(`demo case not found: ${input.demoCaseId}`);
    }
  }

  const intake = mergeCarInterviewFormAnswers(existing?.intake, input.answers);
  const missingRequired = demoMissingRequiredFields(intake);
  const requiredPresent = demoRequiredFieldsPresent(intake);

  if (!existing && !demoHasFirstRequiredAnswer(intake)) {
    throw new Error(
      'Demo case requires at least one required answer before opening'
    );
  }

  const now = new Date().toISOString();
  let created = false;
  let demoCase: DemoCaseRecord;

  if (!existing) {
    created = true;
    demoCase = {
      demoCaseId: newId(),
      decisionTypeId: CAR_INTERVIEW_DECISION_TYPE_ID,
      familyId: CAR_INTERVIEW_FAMILY_ID,
      title: `${CAR_INTERVIEW_LABEL}${intake.role ? ` — ${intake.role}` : ''}`,
      uiState: 'collecting',
      mode: 'evaluate_date',
      caseVersion: 1,
      intake,
      package: null,
      createdAt: now,
      updatedAt: now,
    };
    store.cases = [demoCase, ...store.cases];
    pushLocalEvent(store, {
      demoCaseId: demoCase.demoCaseId,
      type: 'demo_case_opened',
      at: now,
      summary: 'Local demo case opened after first required answer.',
    });
  } else {
    demoCase = {
      ...existing,
      title: `${CAR_INTERVIEW_LABEL}${intake.role ? ` — ${intake.role}` : ''}`,
      uiState: 'collecting',
      caseVersion: existing.caseVersion + 1,
      intake,
      updatedAt: now,
    };
    store.cases = store.cases.map((row) =>
      row.demoCaseId === demoCase.demoCaseId ? demoCase : row
    );
    pushLocalEvent(store, {
      demoCaseId: demoCase.demoCaseId,
      type: 'demo_answers_updated',
      at: now,
      summary: 'Local demo answers updated (session storage only).',
    });
  }

  writeStore(store);
  return { demoCase, created, missingRequired, requiredPresent };
}

/** Bind the checked-in demo stub fixture and mark the demo case ready. */
export function bindDemoCarInterviewPackage(
  demoCaseId: string
): DemoCaseRecord {
  const store = readStore();
  const existing = store.cases.find((row) => row.demoCaseId === demoCaseId);
  if (!existing) {
    throw new Error(`demo case not found: ${demoCaseId}`);
  }

  if (!demoRequiredFieldsPresent(existing.intake)) {
    throw new Error(
      `cannot bind demo package; missing ${demoMissingRequiredFields(existing.intake).join(', ')}`
    );
  }

  const pkg = bindDemoStubPackage({
    caseId: existing.demoCaseId,
    caseVersion: existing.caseVersion,
    intake: existing.intake,
  });

  const now = new Date().toISOString();
  const demoCase: DemoCaseRecord = {
    ...existing,
    uiState: 'package_ready',
    package: pkg,
    updatedAt: now,
  };

  store.cases = store.cases.map((row) =>
    row.demoCaseId === demoCaseId ? demoCase : row
  );
  pushLocalEvent(store, {
    demoCaseId,
    type: 'demo_package_bound',
    at: now,
    summary:
      'Local demo bound DecisionEvaluationPackage fixture (stub engine; not production).',
  });
  writeStore(store);
  return demoCase;
}

export function resetClientDemoAdapterForTests(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
