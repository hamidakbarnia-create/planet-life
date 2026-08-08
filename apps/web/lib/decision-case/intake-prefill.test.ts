import { describe, expect, it } from 'vitest';
import {
  evaluateDateFromDecisionFrame,
  isSupportedIntakeDecisionType,
  prefillTargetDateFromFrame,
} from './intake-prefill';

describe('intake-prefill', () => {
  it('prefills target_date from evaluate specific_date when absent', () => {
    const next = prefillTargetDateFromFrame({
      decision_frame: {
        operation: 'evaluate',
        time_scope: 'specific_date',
        date: '2026-08-18',
      },
      meeting_goal: undefined,
    });
    expect(next.target_date).toBe('2026-08-18');
    expect(next.meeting_goal).toBeUndefined();
    expect(next.role).toBeUndefined();
  });

  it('does not overwrite an existing target_date', () => {
    const next = prefillTargetDateFromFrame({
      target_date: '2026-09-01',
      decision_frame: {
        operation: 'evaluate',
        time_scope: 'specific_date',
        date: '2026-08-18',
      },
    });
    expect(next.target_date).toBe('2026-09-01');
  });

  it('does not fabricate meeting_goal from raw intent', () => {
    const next = prefillTargetDateFromFrame({
      decision_frame: {
        operation: 'evaluate',
        time_scope: 'specific_date',
        date: '2026-08-18',
        raw_intent: 'Is August 18 good for my investor pitch?',
        objective: 'Meet an investor',
      },
    });
    expect(next.target_date).toBe('2026-08-18');
    expect(next.meeting_goal).toBeUndefined();
    expect(Object.keys(next)).not.toContain('meeting_goal');
  });

  it('returns null evaluate date when frame is incomplete', () => {
    expect(
      evaluateDateFromDecisionFrame({
        decision_frame: { operation: 'evaluate', time_scope: 'none' },
      })
    ).toBeNull();
  });

  it('supports only car-interview and bus-investor-meeting intake', () => {
    expect(isSupportedIntakeDecisionType('car-interview')).toBe(true);
    expect(isSupportedIntakeDecisionType('bus-investor-meeting')).toBe(true);
    expect(isSupportedIntakeDecisionType('mar-wedding-date')).toBe(false);
    expect(isSupportedIntakeDecisionType('unknown')).toBe(false);
  });
});
