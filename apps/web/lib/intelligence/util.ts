/** Shared helpers for Personal Intelligence Core. */

import type { ConfidenceLevel, InsightConfidence, InsightEvidence } from './types';

export function clampScore(n: number, lo = 0, hi = 100): number {
  if (!Number.isFinite(n)) return 50;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function parseHour(birthTime: string | null): number | null {
  if (!birthTime?.trim()) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(birthTime.trim());
  if (!m) return null;
  const h = Number(m[1]);
  return Number.isFinite(h) ? ((h % 24) + 24) % 24 : null;
}

export function parseDateParts(birthDate: string | null): {
  month: number;
  day: number;
  dow: number;
  valid: boolean;
} {
  if (!birthDate?.trim()) return { month: 6, day: 15, dow: 3, valid: false };
  const d = new Date(`${birthDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return { month: 6, day: 15, dow: 3, valid: false };
  return {
    month: d.getMonth() + 1,
    day: d.getDate(),
    dow: d.getDay(),
    valid: true,
  };
}

export function wordLimit(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return words.slice(0, maxWords).join(' ');
}

export function confidenceFromGaps(
  missingInputs: string[],
  baseScore: number,
  explanation: string,
  limitations: string[] = []
): InsightConfidence {
  const penalty = missingInputs.length * 12;
  const score = clampScore(baseScore - penalty);
  const level: ConfidenceLevel =
    score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low';
  return {
    level,
    score,
    explanation,
    missingInputs: [...missingInputs],
    limitations: [
      ...limitations,
      'Comparative signals only — not deterministic prediction.',
    ],
  };
}

export function makeEvidence(
  calculationId: string,
  sourceFields: string[],
  derivedAt: string,
  sourceType: InsightEvidence['sourceType'] = 'birth_timing',
  limitations: string[] = []
): InsightEvidence {
  return {
    sourceType,
    sourceFields,
    calculationId,
    derivedAt,
    limitations: [
      ...limitations,
      'Derived from available profile timing anchors only.',
    ],
  };
}

/** Safe log metadata — never include raw birth details. */
export function safeLogMeta(input: {
  profileVersion?: string;
  fingerprint?: string;
  validationState?: string;
  missingFields?: string[];
}): Record<string, string | string[] | undefined> {
  return {
    profileVersion: input.profileVersion,
    fingerprintPrefix: input.fingerprint?.slice(0, 8),
    validationState: input.validationState,
    missingFields: input.missingFields,
  };
}
