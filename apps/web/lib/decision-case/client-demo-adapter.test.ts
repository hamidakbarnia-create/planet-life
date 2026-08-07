import { beforeEach, describe, expect, it } from 'vitest';
import {
  bindDemoCarInterviewPackage,
  listLocalDemoEvents,
  resetClientDemoAdapterForTests,
  saveDemoCarInterviewAnswers,
} from './client-demo-adapter';

describe('client demo adapter (walking skeleton)', () => {
  beforeEach(() => {
    resetClientDemoAdapterForTests();
    localStorage.clear();
  });

  it('opens a demo case after the first required answer', () => {
    expect(() =>
      saveDemoCarInterviewAnswers({ answers: { company: 'Acme' } })
    ).toThrow(/at least one required answer/i);

    const opened = saveDemoCarInterviewAnswers({
      answers: { target_date: '2026-08-10' },
    });
    expect(opened.created).toBe(true);
    expect(opened.demoCase.uiState).toBe('collecting');
    expect(opened.requiredPresent).toBe(false);
  });

  it('binds a stub fixture and records local demo events only', () => {
    const draft = saveDemoCarInterviewAnswers({
      answers: { target_date: '2026-08-10', role: 'Engineer' },
    });
    const ready = bindDemoCarInterviewPackage(draft.demoCase.demoCaseId);

    expect(ready.uiState).toBe('package_ready');
    expect(ready.package?.engine_id).toBe('decision-engine-stub-v1');
    expect(ready.package?.decision_type_id).toBe('car-interview');

    const events = listLocalDemoEvents(draft.demoCase.demoCaseId);
    expect(events.length).toBeGreaterThan(0);
    expect(
      events.every(
        (event) =>
          !/decision history/i.test(event.summary) &&
          !/saved to history/i.test(event.summary)
      )
    ).toBe(true);
    expect(events.some((event) => /local demo/i.test(event.summary))).toBe(
      true
    );
  });
});
