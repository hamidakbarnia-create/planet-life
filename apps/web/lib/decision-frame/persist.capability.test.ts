import { describe, expect, it, vi, beforeEach } from 'vitest';
import { buildDecisionFrame } from './frame';
import { persistFrameToCase } from './persist';
import { DecisionCaseApiError } from '@/lib/decision-case';

const createDecisionCaseFromFraming = vi.fn();

vi.mock('@/lib/decision-case', async () => {
  const actual = await vi.importActual<typeof import('@/lib/decision-case')>(
    '@/lib/decision-case'
  );
  return {
    ...actual,
    createDecisionCaseFromFraming: (...args: unknown[]) =>
      createDecisionCaseFromFraming(...args),
    updateDecisionCaseFraming: vi.fn(),
    getDecisionCase: vi.fn(),
  };
});

beforeEach(() => {
  createDecisionCaseFromFraming.mockReset();
});

describe('persistFrameToCase capability gate', () => {
  it('refuses free-text evaluate without inventing a Decision Type', async () => {
    const frame = buildDecisionFrame('جلسه با سرمایه‌گذار برای جذب سرمایه', {
      operation: 'evaluate',
      time_scope: 'specific_date',
      dates: ['2026-09-01'],
    });
    await expect(persistFrameToCase({ frame })).rejects.toMatchObject({
      code: 'UNSUPPORTED_DECISION_TYPE',
    });
    expect(createDecisionCaseFromFraming).not.toHaveBeenCalled();
  });

  it('creates Case for car-interview evaluate when ready', async () => {
    createDecisionCaseFromFraming.mockResolvedValue({
      case: {
        case_id: 'c1',
        case_version: 1,
        decision_type_id: 'car-interview',
      },
      framing: {},
      intake: {},
    });
    const frame = buildDecisionFrame('Is my interview timing good?', {
      decision_type_id: 'car-interview',
      operation: 'evaluate',
      time_scope: 'specific_date',
      dates: ['2026-09-01'],
    });
    const result = await persistFrameToCase({ frame });
    expect(result.case.case_id).toBe('c1');
    expect(createDecisionCaseFromFraming).toHaveBeenCalledWith(
      expect.objectContaining({ decisionTypeId: 'car-interview' })
    );
  });

  it('creates Case for wedding evaluate when ready', async () => {
    createDecisionCaseFromFraming.mockResolvedValue({
      case: {
        case_id: 'w1',
        case_version: 1,
        decision_type_id: 'mar-wedding-date',
      },
      framing: {},
      intake: {},
    });
    const frame = buildDecisionFrame('Wedding date?', {
      decision_type_id: 'mar-wedding-date',
      operation: 'evaluate',
      time_scope: 'specific_date',
      dates: ['2026-10-10'],
    });
    const result = await persistFrameToCase({ frame });
    expect(result.case.case_id).toBe('w1');
    expect(createDecisionCaseFromFraming).toHaveBeenCalledWith(
      expect.objectContaining({ decisionTypeId: 'mar-wedding-date' })
    );
  });

  it('surfaces DecisionCaseApiError (not generic Error) for unsupported type', async () => {
    const frame = buildDecisionFrame('Compare three dates?', {
      decision_type_id: 'tim-compare-three',
      operation: 'evaluate',
      time_scope: 'specific_date',
      dates: ['2026-09-01'],
    });
    try {
      await persistFrameToCase({ frame });
      expect.fail('expected reject');
    } catch (err) {
      expect(err).toBeInstanceOf(DecisionCaseApiError);
      expect((err as DecisionCaseApiError).code).toBe(
        'UNSUPPORTED_DECISION_TYPE'
      );
    }
  });
});
