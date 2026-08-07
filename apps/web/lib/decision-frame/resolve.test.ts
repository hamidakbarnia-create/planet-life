import { describe, expect, it } from 'vitest';
import {
  buildDecisionFrame,
  canSelectOperationRenderer,
  framingReadyResult,
  resultContainsForbiddenCoaching,
} from '@/lib/decision-frame';
import { detectOperation, detectTimeScope, extractExplicitDates } from './resolve';

describe('decision-frame time + operation resolution', () => {
  it('never invents today when no date is stated', () => {
    const time = detectTimeScope('I have an investor meeting');
    expect(time.scope).toBe('none');
    expect(time.dates).toEqual([]);
    expect(extractExplicitDates('I have an investor meeting')).toEqual([]);
  });

  it('maps specific_date to evaluate', () => {
    const text = 'Is August 18 good for my interview?';
    const time = detectTimeScope(text, 2026);
    expect(time.scope).toBe('specific_date');
    expect(time.dates).toEqual(['2026-08-18']);
    expect(detectOperation(text, time.scope)).toBe('evaluate');

    const frame = buildDecisionFrame(text, { reference_year: 2026 });
    expect(frame.operation).toBe('evaluate');
    expect(frame.time.scope).toBe('specific_date');
    expect(canSelectOperationRenderer(frame)).toBe(true);
    expect(framingReadyResult(frame)?.operation).toBe('evaluate');
  });

  it('maps multiple_dates to compare', () => {
    const text = '14 or 18 August?';
    const time = detectTimeScope(text, 2026);
    expect(time.scope).toBe('multiple_dates');
    expect(time.dates).toEqual(['2026-08-14', '2026-08-18']);
    expect(detectOperation(text, time.scope)).toBe('compare');

    const frame = buildDecisionFrame(text, { reference_year: 2026 });
    expect(frame.operation).toBe('compare');
    expect(framingReadyResult(frame)?.operation).toBe('compare');
  });

  it('maps date_range find intent to find', () => {
    const text = 'Find the best date in the next 30 days';
    const time = detectTimeScope(text);
    expect(time.scope).toBe('date_range');
    expect(detectOperation(text, time.scope)).toBe('find');

    const frame = buildDecisionFrame(text);
    expect(frame.operation).toBe('find');
    expect(frame.time.scope).toBe('date_range');
    expect(framingReadyResult(frame)?.operation).toBe('find');
  });

  it('keeps open-ended intent from jumping to a recommendation renderer', () => {
    const frame = buildDecisionFrame("I'm thinking about moving abroad.");
    expect(frame.open_ended).toBe(true);
    expect(frame.pending_clarification).toBe('open_ended_axis');
    expect(canSelectOperationRenderer(frame)).toBe(false);
    expect(framingReadyResult(frame)).toBeNull();
  });

  it('asks for operation when intent is temporally ambiguous', () => {
    const frame = buildDecisionFrame('I have an investor meeting.');
    expect(frame.operation).toBe('unresolved');
    expect(frame.pending_clarification).toBe('operation');
    expect(canSelectOperationRenderer(frame)).toBe(false);
  });

  it('framing-ready shells omit generic coaching markers', () => {
    const frame = buildDecisionFrame('Is 2026-08-18 good for my interview?');
    const model = framingReadyResult(frame);
    expect(model).not.toBeNull();
    const blob = JSON.stringify(model);
    expect(resultContainsForbiddenCoaching(blob)).toBe(false);
    expect(blob.toLowerCase()).not.toContain('run a small experiment');
    expect(blob.toLowerCase()).not.toContain('best case');
  });
});
