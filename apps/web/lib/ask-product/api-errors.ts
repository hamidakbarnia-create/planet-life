/**
 * Map Decision Case API error codes → localized consumer messages.
 * Never surface arbitrary English backend message strings on FA/AR/RU.
 */

import type { AppLang } from '@/lib/app-settings';
import { DecisionCaseApiError } from '@/lib/decision-case';
import { getAskProductCopy } from './copy';

const KNOWN_CODES = [
  'UNSUPPORTED_DECISION_TYPE',
  'OPERATION_NOT_IMPLEMENTED',
  'FRAMING_REQUIRED',
  'FRAMING_UNRESOLVED',
  'INTAKE_INCOMPLETE',
  'VERSION_CONFLICT',
  'PROVIDER_FAILURE',
  'CASE_NOT_FOUND',
  'UNKNOWN_DECISION_TYPE',
  'ENTRY_MODE_UNAVAILABLE',
  'VALIDATION_ERROR',
  'ILLEGAL_TRANSITION',
] as const;

export type KnownCaseErrorCode = (typeof KNOWN_CODES)[number];

function isKnownCode(code: string): code is KnownCaseErrorCode {
  return (KNOWN_CODES as readonly string[]).includes(code);
}

export function localizeCaseApiError(
  err: unknown,
  lang: AppLang
): string {
  const copy = getAskProductCopy(lang);
  if (err instanceof DecisionCaseApiError && isKnownCode(err.code)) {
    const mapped = copy.apiErrors[err.code];
    if (mapped) return mapped;
  }
  if (err instanceof DecisionCaseApiError) {
    // Unknown code: never leak English message on non-EN locales.
    if (lang === 'en' && err.message.trim()) return err.message;
    return copy.errorGeneric;
  }
  if (err instanceof Error && lang === 'en' && err.message.trim()) {
    return err.message;
  }
  return copy.errorGeneric;
}
