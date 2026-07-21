/** Shared Ask V3 helpers. */

import type { ConfidenceLevel } from './types';
import { CONFIDENCE_LEVELS } from './types';

export function clampScore(n: unknown, fallback = 50): number {
  const num = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

export function wordLimit(text: string, max: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= max) return words.join(' ');
  return words.slice(0, max).join(' ');
}

export function asConfidenceLevel(value: unknown, fallback: ConfidenceLevel = 'medium'): ConfidenceLevel {
  if (typeof value === 'string') {
    const v = value.toLowerCase();
    if ((CONFIDENCE_LEVELS as readonly string[]).includes(v)) {
      return v as ConfidenceLevel;
    }
    if (v === 'High') return 'high';
    if (v === 'Low') return 'low';
    if (v === 'Medium') return 'medium';
  }
  return fallback;
}

export function extractJsonObject(text: string): unknown | null {
  if (!text?.trim()) return null;
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const candidate = fenced ? fenced[1]!.trim() : text.trim();
  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1)) as unknown;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export const MODULE_ROUTES: Record<string, string> = {
  pathfinder: '/pathfinder',
  calendar: '/calendar',
  today: '/home',
  people: '/people',
  julia: '/home',
  vault: '/vault',
  profile: '/profile?onboarding=1',
};
