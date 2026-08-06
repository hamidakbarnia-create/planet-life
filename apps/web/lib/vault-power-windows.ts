import type {
  VaultPowerDayWindow,
  VaultYesDaySlot,
} from './vault-reading';

export type VaultPowerRankedModule = 'hot' | 'money' | 'ghost';
export type VaultPowerYesModule = 'yes';

export type VaultPowerTimingView =
  | {
      kind: 'ranked_days';
      module: VaultPowerRankedModule;
      days: VaultPowerDayWindow[];
    }
  | {
      kind: 'yes_slots';
      module: VaultPowerYesModule;
      ask: VaultYesDaySlot;
      commit: VaultYesDaySlot;
      sign: VaultYesDaySlot;
    };

export type VaultScoreBand = 'strongest' | 'supportive' | 'lighter';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const t = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(t);
}

function isFiniteScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function optionalRating(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string') return value;
  return undefined;
}

function parseDayWindow(raw: unknown): VaultPowerDayWindow | null {
  if (!isPlainObject(raw)) return null;
  if (!isValidIsoDate(raw.date) || !isFiniteScore(raw.score)) return null;
  const day: VaultPowerDayWindow = {
    date: raw.date,
    score: raw.score,
  };
  const rating = optionalRating(raw.rating);
  if (rating !== undefined) day.rating = rating;
  return day;
}

function parseYesSlot(raw: unknown): VaultYesDaySlot | null {
  if (!isPlainObject(raw)) return null;
  if (!isValidIsoDate(raw.date) || !isFiniteScore(raw.score)) return null;
  if (typeof raw.confidence !== 'string' || !raw.confidence.trim()) return null;
  if (typeof raw.action_type !== 'string' || !raw.action_type.trim()) return null;
  const slot: VaultYesDaySlot = {
    date: raw.date,
    score: raw.score,
    confidence: raw.confidence,
    action_type: raw.action_type,
  };
  const rating = optionalRating(raw.rating);
  if (rating !== undefined) slot.rating = rating;
  return slot;
}

/** Presentation-only score band — not a probability or certainty claim. */
export function vaultScoreBand(score: number): VaultScoreBand {
  if (score >= 80) return 'strongest';
  if (score >= 60) return 'supportive';
  return 'lighter';
}

/** Max length for a rating shown inside a ranked-day chip. */
export const POWER_RATING_VISIBLE_MAX = 18;

/**
 * Concise rating for ranked-day chip layout.
 * Long / empty / nullish values return null (never truncate mid-word).
 */
export function visiblePowerRating(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > POWER_RATING_VISIBLE_MAX) return null;
  return trimmed;
}

/**
 * Full trimmed rating for native `title` when omitted from chip layout.
 * Returns undefined when there is nothing useful to expose.
 */
export function powerRatingTitle(
  value: string | null | undefined,
): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length <= POWER_RATING_VISIBLE_MAX) return undefined;
  return trimmed;
}

export function toRankedPowerDaysView(
  module: VaultPowerRankedModule,
  windows: unknown,
): VaultPowerTimingView | null {
  if (!Array.isArray(windows) || windows.length === 0) return null;
  const days: VaultPowerDayWindow[] = [];
  for (const item of windows) {
    const day = parseDayWindow(item);
    if (day) days.push(day);
  }
  if (days.length === 0) return null;
  return { kind: 'ranked_days', module, days };
}

export function toYesPowerSlotsView(verdict: unknown): VaultPowerTimingView | null {
  if (!isPlainObject(verdict)) return null;
  const ask = parseYesSlot(verdict.ask);
  const commit = parseYesSlot(verdict.commit);
  const sign = parseYesSlot(verdict.sign);
  if (!ask || !commit || !sign) return null;
  return { kind: 'yes_slots', module: 'yes', ask, commit, sign };
}

/**
 * Build a Power timing view from a live Vault API response + module key.
 * Returns null for non-Power modules or unusable structured data.
 */
export function toPowerTimingView(
  module: string,
  response: unknown,
): VaultPowerTimingView | null {
  if (!isPlainObject(response)) return null;
  if (module === 'hot' || module === 'money' || module === 'ghost') {
    return toRankedPowerDaysView(module, response.windows);
  }
  if (module === 'yes') {
    return toYesPowerSlotsView(response.verdict);
  }
  return null;
}
