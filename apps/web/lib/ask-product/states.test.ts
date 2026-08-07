import { describe, expect, it } from 'vitest';
import { buildDecisionFrame } from '@/lib/decision-frame';
import {
  deriveClarificationState,
  isUnsupportedOperationFrame,
} from './states';
import { resetToExamineStep } from './clarify-bridge';

describe('ask-product consumer states', () => {
  it('maps FA free-text investor intent to NEEDS_CLARIFICATION', () => {
    const frame = buildDecisionFrame('جلسه با سرمایه‌گذار برای جذب سرمایه');
    expect(frame.raw_intent).toBe('جلسه با سرمایه‌گذار برای جذب سرمایه');
    expect(frame.operation).toBe('unresolved');
    expect(deriveClarificationState(frame)).toBe('NEEDS_CLARIFICATION');
  });

  it('marks compare/find as UNSUPPORTED_OPERATION', () => {
    const compare = buildDecisionFrame('14 or 18 August?', {
      reference_year: 2026,
      operation: 'compare',
      time_scope: 'multiple_dates',
      dates: ['2026-08-14', '2026-08-18'],
    });
    expect(isUnsupportedOperationFrame(compare)).toBe(true);
    expect(deriveClarificationState(compare)).toBe('UNSUPPORTED_OPERATION');
  });

  it('resetToExamineStep clears compare without fabricating evaluate result', () => {
    const compare = buildDecisionFrame('14 or 18 August?', {
      reference_year: 2026,
      operation: 'compare',
      time_scope: 'multiple_dates',
      dates: ['2026-08-14', '2026-08-18'],
    });
    const next = resetToExamineStep(compare);
    expect(next.operation).toBe('unresolved');
    expect(deriveClarificationState(next)).toBe('NEEDS_CLARIFICATION');
  });

  it('READY_TO_EVALUATE only with explicit evaluate date', () => {
    const ready = buildDecisionFrame('Is August 18 good?', {
      reference_year: 2026,
      operation: 'evaluate',
      time_scope: 'specific_date',
      dates: ['2026-08-18'],
    });
    expect(deriveClarificationState(ready)).toBe('READY_TO_EVALUATE');
  });
});
