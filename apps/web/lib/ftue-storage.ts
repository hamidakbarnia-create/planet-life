import type {
  BirthTimeAccuracy,
  FtueGoalId,
  FtueNotificationId,
} from './ftue-i18n';
import { FTUE_GOAL_IDS, FTUE_NOTIFICATION_IDS } from './ftue-i18n';

const FTUE_COMPLETE_KEY = 'planet-life-ftue-complete';
const FTUE_DRAFT_KEY = 'planet-life-ftue-draft';

/** Stable place value stored in the FTUE draft (coords local-only; never for analytics). */
export type FtuePlaceValue = {
  id: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
};

/**
 * Shared client FTUE draft — one store for the Welcome→Snapshot journey.
 * Persists across route remounts / refresh via localStorage.
 */
export type FtueDraft = {
  version: 1;
  goals: FtueGoalId[];
  decisionProfileAcknowledged: boolean;
  birthDate: string | null;
  birthTimeAccuracy: BirthTimeAccuracy | null;
  birthTime: string | null;
  birthPlace: FtuePlaceValue | null;
  livingLocation: FtuePlaceValue | null;
  notifications: FtueNotificationId[];
  notificationsSkipped: boolean;
};

export const EMPTY_FTUE_DRAFT: FtueDraft = {
  version: 1,
  goals: [],
  decisionProfileAcknowledged: false,
  birthDate: null,
  birthTimeAccuracy: null,
  birthTime: null,
  birthPlace: null,
  livingLocation: null,
  notifications: [],
  notificationsSkipped: false,
};

const GOAL_ID_SET = new Set<string>(FTUE_GOAL_IDS);
const NOTIFICATION_ID_SET = new Set<string>(FTUE_NOTIFICATION_IDS);

function isBirthTimeAccuracy(v: unknown): v is BirthTimeAccuracy {
  return v === 'exact' || v === 'approximate' || v === 'unknown';
}

function isPlaceValue(v: unknown): v is FtuePlaceValue {
  if (!v || typeof v !== 'object') return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.city === 'string' &&
    typeof p.country === 'string' &&
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude)
  );
}

function sanitizeDraft(raw: unknown): FtueDraft {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_FTUE_DRAFT };
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return { ...EMPTY_FTUE_DRAFT };

  const goals = Array.isArray(o.goals)
    ? o.goals.filter((g): g is FtueGoalId => typeof g === 'string' && GOAL_ID_SET.has(g))
    : [];

  const notifications = Array.isArray(o.notifications)
    ? o.notifications.filter(
        (n): n is FtueNotificationId => typeof n === 'string' && NOTIFICATION_ID_SET.has(n)
      )
    : [];

  const birthDate =
    typeof o.birthDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.birthDate)
      ? o.birthDate
      : null;

  const birthTimeAccuracy = isBirthTimeAccuracy(o.birthTimeAccuracy)
    ? o.birthTimeAccuracy
    : null;

  const birthTime =
    typeof o.birthTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(o.birthTime)
      ? o.birthTime
      : null;

  return {
    version: 1,
    goals,
    decisionProfileAcknowledged: o.decisionProfileAcknowledged === true,
    birthDate,
    birthTimeAccuracy,
    birthTime: birthTimeAccuracy === 'unknown' ? null : birthTime,
    birthPlace: isPlaceValue(o.birthPlace) ? o.birthPlace : null,
    livingLocation: isPlaceValue(o.livingLocation) ? o.livingLocation : null,
    notifications,
    notificationsSkipped: o.notificationsSkipped === true,
  };
}

export function isFtueComplete(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(FTUE_COMPLETE_KEY) === '1';
}

export function markFtueComplete(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FTUE_COMPLETE_KEY, '1');
}

export function clearFtueComplete(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(FTUE_COMPLETE_KEY);
}

/** Post-auth / post-FTUE destination until /today ships. */
export function ftueTodayPath(): string {
  return '/home';
}

export function loadFtueDraft(): FtueDraft {
  if (typeof window === 'undefined') return { ...EMPTY_FTUE_DRAFT };
  try {
    const raw = localStorage.getItem(FTUE_DRAFT_KEY);
    if (!raw) return { ...EMPTY_FTUE_DRAFT };
    return sanitizeDraft(JSON.parse(raw) as unknown);
  } catch {
    return { ...EMPTY_FTUE_DRAFT };
  }
}

export function saveFtueDraft(draft: FtueDraft): void {
  if (typeof window === 'undefined') return;
  const next = sanitizeDraft(draft);
  localStorage.setItem(FTUE_DRAFT_KEY, JSON.stringify(next));
}

/** Patch one or more draft fields without resetting unrelated values. */
export function updateFtueDraft(
  patch: Partial<Omit<FtueDraft, 'version'>>
): FtueDraft {
  const next = sanitizeDraft({ ...loadFtueDraft(), ...patch, version: 1 });
  saveFtueDraft(next);
  return next;
}

/** Test helper — does not clear the completion flag. */
export function clearFtueDraft(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(FTUE_DRAFT_KEY);
}
