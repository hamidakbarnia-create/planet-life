import { describe, expect, it } from 'vitest';
import {
  buildDecisionFrame,
  frameFromPersistedIntake,
  isFramingPersistReady,
  toPersistedFraming,
} from '@/lib/decision-frame';

describe('decision-frame persist readiness', () => {
  it('does not persist unresolved frames', () => {
    const frame = buildDecisionFrame("I'm meeting an investor.");
    expect(isFramingPersistReady(frame)).toBe(false);
  });

  it('persists evaluate with singular date and never invents today', () => {
    const frame = buildDecisionFrame('Is August 18 good for my interview?', {
      reference_year: 2026,
    });
    expect(isFramingPersistReady(frame)).toBe(true);
    const payload = toPersistedFraming(frame);
    expect(payload.operation).toBe('evaluate');
    expect(payload.time_scope).toBe('specific_date');
    expect(payload.date).toBe('2026-08-18');
    expect(payload.dates).toBeUndefined();
    expect(payload.date).not.toBe(new Date().toISOString().slice(0, 10));
  });

  it('persists compare with dates[]', () => {
    const frame = buildDecisionFrame('14 or 18 August?', {
      reference_year: 2026,
      operation: 'compare',
      time_scope: 'multiple_dates',
      dates: ['2026-08-14', '2026-08-18'],
    });
    expect(isFramingPersistReady(frame)).toBe(true);
    const payload = toPersistedFraming(frame);
    expect(payload.operation).toBe('compare');
    expect(payload.time_scope).toBe('multiple_dates');
    expect(payload.dates).toEqual(['2026-08-14', '2026-08-18']);
    expect(payload.date).toBeUndefined();
  });

  it('requires FIND range bounds and persists start/end', () => {
    const incomplete = buildDecisionFrame(
      'Find the best date in the next 30 days'
    );
    expect(incomplete.operation).toBe('find');
    expect(isFramingPersistReady(incomplete)).toBe(false);

    const ready = buildDecisionFrame('Find the best date', {
      operation: 'find',
      time_scope: 'date_range',
      range_start: '2026-08-01',
      range_end: '2026-08-31',
    });
    expect(isFramingPersistReady(ready)).toBe(true);
    const payload = toPersistedFraming(ready);
    expect(payload.start).toBe('2026-08-01');
    expect(payload.end).toBe('2026-08-31');
    expect('range_start' in payload).toBe(false);
    expect('range_end' in payload).toBe(false);
  });

  it('reconstructs frame from Case intake without sessionStorage', () => {
    const frame = frameFromPersistedIntake({
      decision_frame: {
        operation: 'compare',
        time_scope: 'multiple_dates',
        dates: ['2026-08-14', '2026-08-18'],
        options: [
          { id: 'a', label: '14 Aug', date: '2026-08-14' },
          { id: 'b', label: '18 Aug', date: '2026-08-18' },
        ],
        raw_intent: '14 or 18 August?',
        runtime_executed: false,
      },
    });
    expect(frame).not.toBeNull();
    expect(frame?.operation).toBe('compare');
    expect(frame?.time.dates).toEqual(['2026-08-14', '2026-08-18']);
    expect(frame?.open_ended).toBe(false);
  });

  it('reconstructs evaluate from singular date and find from start/end', () => {
    const evaluate = frameFromPersistedIntake({
      decision_frame: {
        operation: 'evaluate',
        time_scope: 'specific_date',
        date: '2026-08-18',
        raw_intent: 'Is August 18 good?',
      },
    });
    expect(evaluate?.time.dates).toEqual(['2026-08-18']);

    const find = frameFromPersistedIntake({
      decision_frame: {
        operation: 'find',
        time_scope: 'date_range',
        start: '2026-08-01',
        end: '2026-08-31',
        raw_intent: 'Find best date',
      },
    });
    expect(find?.time.range_start).toBe('2026-08-01');
    expect(find?.time.range_end).toBe('2026-08-31');
  });

  it('persists evaluate + time_scope=none without inventing today', () => {
    const frame = buildDecisionFrame('Should I take the role?', {
      operation: 'evaluate',
      time_scope: 'none',
      objective: 'Role decision',
    });
    expect(isFramingPersistReady(frame)).toBe(true);
    const payload = toPersistedFraming(frame);
    expect(payload.operation).toBe('evaluate');
    expect(payload.time_scope).toBe('none');
    expect(payload.date).toBeUndefined();
    expect(payload.dates).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain(
      new Date().toISOString().slice(0, 10)
    );
  });

  it('recovers evaluate none from Case intake without sessionStorage', () => {
    const frame = frameFromPersistedIntake({
      decision_frame: {
        operation: 'evaluate',
        time_scope: 'none',
        raw_intent: 'Should I take the role?',
        runtime_executed: false,
      },
    });
    expect(frame).not.toBeNull();
    expect(frame?.operation).toBe('evaluate');
    expect(frame?.time.scope).toBe('none');
    expect(frame?.time.dates).toBeUndefined();
    expect(frame?.time.range_start).toBeUndefined();
  });
});
