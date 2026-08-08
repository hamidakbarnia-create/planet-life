import { describe, expect, it } from 'vitest';
import { DecisionCaseApiError } from '@/lib/decision-case';
import { getAskProductCopy } from './copy';
import { localizeCaseApiError } from './api-errors';

describe('localizeCaseApiError', () => {
  it.each([
    'UNSUPPORTED_DECISION_TYPE',
    'OPERATION_NOT_IMPLEMENTED',
    'FRAMING_REQUIRED',
    'INTAKE_INCOMPLETE',
    'VERSION_CONFLICT',
    'PROVIDER_FAILURE',
    'CASE_NOT_FOUND',
  ] as const)('maps %s for EN/FA/AR/RU without leaking code', (code) => {
    const err = new DecisionCaseApiError({
      status: 400,
      code,
      message: 'Decision type is not supported for this operation',
    });
    for (const lang of ['en', 'fa', 'ar', 'ru'] as const) {
      const msg = localizeCaseApiError(err, lang);
      expect(msg).toBe(getAskProductCopy(lang).apiErrors[code]);
      expect(msg).not.toMatch(/UNSUPPORTED_DECISION_TYPE|OPERATION_NOT_IMPLEMENTED/);
      if (lang !== 'en') {
        expect(msg).not.toMatch(/Decision type is not supported/i);
        expect(msg).not.toMatch(/not implemented/i);
      }
    }
  });

  it('does not surface raw English backend message on FA', () => {
    const err = new DecisionCaseApiError({
      status: 400,
      code: 'SOME_UNKNOWN_CODE',
      message: 'Decision type is not supported for this operation',
    });
    expect(localizeCaseApiError(err, 'fa')).toBe(
      getAskProductCopy('fa').errorGeneric
    );
    expect(localizeCaseApiError(err, 'fa')).not.toContain(
      'Decision type is not supported'
    );
  });

  it('drift B: web UX offered flow but backend rejects → localized capability error, no raw text', () => {
    // Web hint may say car-interview+evaluate is offerable; backend remains final
    // authority and can still return UNSUPPORTED_DECISION_TYPE.
    const backendReject = new DecisionCaseApiError({
      status: 400,
      code: 'UNSUPPORTED_DECISION_TYPE',
      message: 'Decision type is not supported for this operation',
      details: { decision_type_id: 'car-interview', operation: 'evaluate' },
    });
    for (const lang of ['en', 'fa', 'ar', 'ru'] as const) {
      const msg = localizeCaseApiError(backendReject, lang);
      expect(msg).toBe(
        getAskProductCopy(lang).apiErrors.UNSUPPORTED_DECISION_TYPE
      );
      expect(msg).not.toBe(backendReject.message);
      expect(msg).not.toMatch(/UNSUPPORTED_DECISION_TYPE/);
      if (lang !== 'en') {
        expect(msg).not.toMatch(/Decision type is not supported/i);
      }
    }
  });
});
