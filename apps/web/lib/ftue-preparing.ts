import {
  getProfileRepository,
  isProfileRecordComplete,
  type ProfileRepository,
} from '@/lib/profile';

export type PreparingStepId = 'chart' | 'window' | 'brief';

export type PreparingStepStatus = 'pending' | 'active' | 'done' | 'error';

export interface PreparingStep {
  id: PreparingStepId;
  label: string;
  status: PreparingStepStatus;
}

export type PreparingErrorCode = 'offline' | 'no_profile';

export class PreparingError extends Error {
  code: PreparingErrorCode;

  constructor(code: PreparingErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'PreparingError';
  }
}

export const PREPARING_STEPS: PreparingStep[] = [
  { id: 'chart', label: 'Chart calculated', status: 'pending' },
  { id: 'window', label: "Today's window evaluated", status: 'pending' },
  { id: 'brief', label: 'Preparing your brief', status: 'pending' },
];

export interface PreparingOrchestratorOptions {
  repo?: ProfileRepository;
  isOnline?: () => boolean;
  delay?: (ms: number) => Promise<void>;
  onStepUpdate?: (steps: PreparingStep[]) => void;
  windowDelayMs?: number;
  briefDelayMs?: number;
  chartDelayMs?: number;
}

function cloneSteps(steps: PreparingStep[]): PreparingStep[] {
  return steps.map((s) => ({ ...s }));
}

function setStepStatus(
  steps: PreparingStep[],
  id: PreparingStepId,
  status: PreparingStepStatus
): PreparingStep[] {
  return steps.map((step) => (step.id === id ? { ...step, status } : step));
}

function assertOnline(isOnline: () => boolean): void {
  if (!isOnline()) {
    throw new PreparingError('offline', 'Connect to prepare your brief.');
  }
}

/** Local-only orchestration — no Today API until Sprint 2+. */
export async function runPreparingOrchestration(
  options: PreparingOrchestratorOptions = {}
): Promise<void> {
  const repo = options.repo ?? getProfileRepository();
  const delay = options.delay ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const isOnline = options.isOnline ?? (() =>
    typeof navigator === 'undefined' ? true : navigator.onLine);

  assertOnline(isOnline);

  const profile = repo.loadProfile();
  if (!isProfileRecordComplete(profile)) {
    throw new PreparingError('no_profile', 'Birth profile required.');
  }

  let steps = cloneSteps(PREPARING_STEPS);
  const publish = (next: PreparingStep[]) => {
    steps = next;
    options.onStepUpdate?.(next);
  };

  publish(setStepStatus(steps, 'chart', 'active'));
  await delay(options.chartDelayMs ?? 300);
  assertOnline(isOnline);
  publish(setStepStatus(steps, 'chart', 'done'));

  publish(setStepStatus(steps, 'window', 'active'));
  await delay(options.windowDelayMs ?? 600);
  assertOnline(isOnline);
  publish(setStepStatus(steps, 'window', 'done'));

  publish(setStepStatus(steps, 'brief', 'active'));
  await delay(Math.max(options.briefDelayMs ?? 500, 500));
  publish(setStepStatus(steps, 'brief', 'done'));
}
