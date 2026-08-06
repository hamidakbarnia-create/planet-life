/** Normalize existing profile sources into SourceProfileInput + fingerprint. */

import type { BirthProfile } from '@/lib/birth-profile';
import type {
  DecisionHistorySummary,
  IntelligenceSeed,
  SourceCompleteness,
  SourceProfileInput,
} from './types';
import { hashString, parseDateParts, parseHour } from './util';

export type NormalizeSourceProfileOptions = {
  /**
   * Optional decision-history enrichment supplied by the product layer.
   * When omitted, count is 0 — Core never reads Pathfinder (or any) storage.
   */
  decisionHistory?: DecisionHistorySummary | null;
};

function resolveHistoryCount(
  decisionHistory?: DecisionHistorySummary | null
): number {
  if (!decisionHistory) return 0;
  const n = decisionHistory.count;
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

/**
 * Build source input from BirthProfile. Missing fields stay null — never invented.
 * Decision history is optional injected enrichment only.
 */
export function normalizeSourceProfile(
  profile: BirthProfile | null | undefined,
  options: NormalizeSourceProfileOptions = {}
): SourceProfileInput {
  const decisionHistoryCount = resolveHistoryCount(options.decisionHistory);

  if (!profile) {
    return {
      birthDate: null,
      birthTime: null,
      birthLocationLabel: null,
      actionType: null,
      currentCity: null,
      hasDecisionHistory: decisionHistoryCount > 0,
      decisionHistoryCount,
    };
  }

  const birthDate = profile.birth_date?.trim() || null;
  const birthTime = profile.birth_time?.trim() || null;
  const birthLocationLabel = profile.location?.trim() || null;
  const actionType = profile.action_type?.trim() || null;
  const currentCity = profile.current_location?.city?.trim() || null;

  return {
    birthDate,
    birthTime,
    birthLocationLabel,
    actionType,
    currentCity,
    hasDecisionHistory: decisionHistoryCount > 0,
    decisionHistoryCount,
  };
}

/**
 * Stable fingerprint of relevant source fields only.
 * Uses hashed location labels so logs never need raw city strings.
 */
export function fingerprintSourceProfile(source: SourceProfileInput): string {
  const locHash = source.birthLocationLabel
    ? hashString(source.birthLocationLabel).toString(16)
    : 'none';
  const cityHash = source.currentCity
    ? hashString(source.currentCity).toString(16)
    : 'none';
  return [
    source.birthDate ?? 'missing-date',
    source.birthTime ?? 'missing-time',
    `loc:${locHash}`,
    source.actionType ?? 'missing-action',
    `city:${cityHash}`,
  ].join('|');
}

export function assessSourceCompleteness(
  source: SourceProfileInput
): SourceCompleteness {
  const missingFields: string[] = [];
  if (!source.birthDate) missingFields.push('birth_date');
  if (!source.birthTime) missingFields.push('birth_time');
  if (!source.birthLocationLabel) missingFields.push('birth_location');

  return {
    complete: missingFields.length === 0,
    missingFields,
    canGeneratePartial: Boolean(source.birthDate),
  };
}

export function buildIntelligenceSeed(source: SourceProfileInput): IntelligenceSeed {
  const missing: string[] = [];
  if (!source.birthDate) missing.push('birth_date');
  if (!source.birthTime) missing.push('birth_time');
  if (!source.birthLocationLabel) missing.push('birth_location');

  const hour = parseHour(source.birthTime);
  if (source.birthTime && hour == null) missing.push('birth_time_format');

  const { month, day, dow, valid } = parseDateParts(source.birthDate);
  if (source.birthDate && !valid) missing.push('birth_date_format');

  const h = hashString(fingerprintSourceProfile(source));
  const effectiveHour = hour ?? 12;

  return {
    hour,
    month,
    day,
    dow,
    h,
    morningBias: effectiveHour < 11,
    eveningBias: effectiveHour >= 17,
    deepWorkBias: effectiveHour >= 9 && effectiveHour < 15,
    collaborativeBias: dow === 1 || dow === 3 || h % 5 === 0,
    analyticalBias: effectiveHour % 2 === 0 || h % 3 === 1,
    creativeBias: effectiveHour >= 14 || month % 2 === 0,
    missing,
  };
}

export function profileIdFromFingerprint(fingerprint: string): string {
  return `pip-${hashString(fingerprint).toString(16)}`;
}
