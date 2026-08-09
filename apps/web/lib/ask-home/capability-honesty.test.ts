import { describe, expect, it } from 'vitest';
import { buildDecisionFrame } from '@/lib/decision-frame';
import { persistFrameToCase } from '@/lib/decision-frame/persist';
import { DecisionCaseApiError } from '@/lib/decision-case';
import { listPopularDecisions } from './popular-decisions';
import { canExecuteInProduction } from './production-capability';

describe('ASK capability honesty (Case create gate)', () => {
  it('refuses Case persist for free-text without Decision Type', async () => {
    const frame = buildDecisionFrame('Should I sign this lease on 15 September?', {
      operation: 'evaluate',
      time_scope: 'specific_date',
      dates: ['2026-09-15'],
    });
    expect(frame.decision_type_id).toBeUndefined();
    // Persist-ready evaluate frame still fails closed without a shipped DT.
    await expect(
      persistFrameToCase({
        frame: {
          ...frame,
          open_ended: false,
          operation: 'evaluate',
          time: {
            scope: 'specific_date',
            dates: ['2026-09-15'],
          },
          pending_clarification: null,
        },
        decisionTypeId: undefined,
      })
    ).rejects.toBeInstanceOf(DecisionCaseApiError);
  });

  it('refuses Case persist for unsupported Popular topics', async () => {
    const career = listPopularDecisions('en').find(
      (item) => item.id === 'career-change'
    );
    expect(career?.capability).toBe('unavailable');
    expect(canExecuteInProduction(career?.decisionTypeId, 'evaluate')).toBe(
      false
    );

    const frame = buildDecisionFrame(career?.label ?? 'Career change', {
      operation: 'evaluate',
      time_scope: 'specific_date',
      dates: ['2026-09-15'],
      decision_type_id: career?.decisionTypeId,
    });
    await expect(
      persistFrameToCase({
        frame,
        decisionTypeId: career?.decisionTypeId,
      })
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_DECISION_TYPE' });
  });

  it('allows Case persist gate for shipped Interview evaluate', () => {
    expect(canExecuteInProduction('car-interview', 'evaluate')).toBe(true);
    expect(canExecuteInProduction('mar-wedding-date', 'compare')).toBe(true);
    expect(canExecuteInProduction('bus-product-launch', 'find')).toBe(true);
    expect(canExecuteInProduction('bus-investor-meeting', 'evaluate')).toBe(
      true
    );
  });
});
