/**
 * Architectural boundary for car-offer-negotiation on the web client.
 *
 * The type ships exactly one capability. These tests pin that Compare and
 * Find stay fail-closed at every client gate that could otherwise create a
 * Case or route to a runtime, and that no other Decision Type is affected.
 */

import { describe, expect, it, vi } from 'vitest';
import { canExecuteInProduction } from '@/lib/ask-home/production-capability';
import { getDecisionType } from '@/lib/ask-home/decision-type-registry';
import {
  deriveClarificationState,
  isUnsupportedOperationFrame,
} from '@/lib/ask-product/states';
import { DecisionCaseApiError } from '@/lib/decision-case/api-client';
import type { DecisionFrameV1 } from './types';
import { buildDecisionFrame } from './frame';
import { isFramingPersistReady, persistFrameToCase } from './persist';

const TYPE = 'car-offer-negotiation';

// Frames come from the real pipeline so the persistence gates under test are
// the same ones production hits.
const EVALUATE_FRAME: DecisionFrameV1 = buildDecisionFrame(
  'Negotiate my job offer on September 15',
  { reference_year: 2026, decision_type_id: TYPE, operation: 'evaluate' }
);

const COMPARE_FRAME: DecisionFrameV1 = buildDecisionFrame(
  'Negotiate my job offer on September 15 or September 18',
  { reference_year: 2026, decision_type_id: TYPE, operation: 'compare' }
);

const FIND_FRAME: DecisionFrameV1 = buildDecisionFrame(
  'Find the best time between September 1 and November 30 to negotiate my job offer',
  { reference_year: 2026, decision_type_id: TYPE, operation: 'find' }
);

describe('car-offer-negotiation capability boundary', () => {
  it('exposes exactly one executable mode', () => {
    expect(canExecuteInProduction(TYPE, 'evaluate')).toBe(true);
    expect(canExecuteInProduction(TYPE, 'compare')).toBe(false);
    expect(canExecuteInProduction(TYPE, 'find')).toBe(false);
  });

  it('declares only evaluate_date in the registry mirror', () => {
    expect(getDecisionType(TYPE)?.allowed_modes).toEqual(['evaluate_date']);
  });

  it('marks Compare and Find frames as unsupported operations', () => {
    expect(isUnsupportedOperationFrame(EVALUATE_FRAME)).toBe(false);
    expect(isUnsupportedOperationFrame(COMPARE_FRAME)).toBe(true);
    expect(isUnsupportedOperationFrame(FIND_FRAME)).toBe(true);
  });

  it('never reaches a READY_TO_COMPARE or READY_TO_FIND state', () => {
    expect(deriveClarificationState(COMPARE_FRAME)).not.toBe(
      'READY_TO_COMPARE'
    );
    expect(deriveClarificationState(FIND_FRAME)).not.toBe('READY_TO_FIND');
    expect(deriveClarificationState(EVALUATE_FRAME)).toBe('READY_TO_EVALUATE');
  });
});

describe('car-offer-negotiation persistence boundary', () => {
  it('reaches the capability gate for a well-formed Compare frame', async () => {
    // Proves the rejection below comes from the capability matrix rather than
    // from an earlier shape check.
    expect(isFramingPersistReady(COMPARE_FRAME)).toBe(true);

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('network must not be reached'));

    try {
      await expect(
        persistFrameToCase({ frame: COMPARE_FRAME, decisionTypeId: TYPE })
      ).rejects.toMatchObject({
        code: 'UNSUPPORTED_DECISION_TYPE',
        details: { decision_type_id: TYPE, operation: 'compare' },
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('never persists a Compare or Find Case for this type', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('network must not be reached'));

    try {
      for (const frame of [COMPARE_FRAME, FIND_FRAME]) {
        await expect(
          persistFrameToCase({ frame, decisionTypeId: TYPE })
        ).rejects.toBeInstanceOf(Error);
      }
      // No Case request of any kind left the client.
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('keeps the Evaluate path past the capability gate', async () => {
    expect(isFramingPersistReady(EVALUATE_FRAME)).toBe(true);

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('reached the network'));

    try {
      // Evaluate is not blocked by the client gate, so it proceeds far enough
      // to attempt the request instead of failing UNSUPPORTED_DECISION_TYPE.
      await expect(
        persistFrameToCase({ frame: EVALUATE_FRAME, decisionTypeId: TYPE })
      ).rejects.not.toMatchObject({ code: 'UNSUPPORTED_DECISION_TYPE' });
      expect(fetchSpy).toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('leaves DecisionCaseApiError as the gate error type', () => {
    expect(DecisionCaseApiError).toBeTypeOf('function');
  });
});
