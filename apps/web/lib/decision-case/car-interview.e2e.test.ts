/**
 * PR-1 walking-skeleton path (client-side):
 * ASK job-interview → demo intake → demo case adapter → fixture package → renderer
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { assertPackageRenderContract } from './demo-stub-fixture';
import {
  bindDemoCarInterviewPackage,
  listLocalDemoEvents,
  resetClientDemoAdapterForTests,
  saveDemoCarInterviewAnswers,
} from './client-demo-adapter';
import { CAR_INTERVIEW_DECISION_TYPE_ID } from './car-interview-form';

describe('car-interview PR-1 walking skeleton', () => {
  beforeEach(() => {
    resetClientDemoAdapterForTests();
    localStorage.clear();
  });

  it('runs intake → demo case → fixture package → local demo events', () => {
    expect(() =>
      saveDemoCarInterviewAnswers({ answers: { company: 'Acme' } })
    ).toThrow(/at least one required answer/i);

    const afterDate = saveDemoCarInterviewAnswers({
      answers: { target_date: '2026-08-10' },
    });
    expect(afterDate.demoCase.decisionTypeId).toBe(CAR_INTERVIEW_DECISION_TYPE_ID);

    const afterRole = saveDemoCarInterviewAnswers({
      demoCaseId: afterDate.demoCase.demoCaseId,
      answers: { role: 'Designer', interview_type: 'video' },
    });
    expect(afterRole.requiredPresent).toBe(true);

    const ready = bindDemoCarInterviewPackage(afterRole.demoCase.demoCaseId);
    assertPackageRenderContract(ready.package!);
    expect(ready.package?.engine_id).toBe('decision-engine-stub-v1');
    expect(ready.package?.timing.candidates[0]?.date).toBe('2026-08-10');

    const events = listLocalDemoEvents(afterRole.demoCase.demoCaseId);
    expect(events.map((event) => event.type)).toEqual(
      expect.arrayContaining([
        'demo_case_opened',
        'demo_answers_updated',
        'demo_package_bound',
      ])
    );
    expect(
      events.every((event) => !/decision history/i.test(event.summary))
    ).toBe(true);
  });
});
