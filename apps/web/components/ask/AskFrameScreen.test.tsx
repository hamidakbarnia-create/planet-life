import {
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AskFrameScreen } from './AskFrameScreen';
import {
  applyCompareDates,
  applyEvaluateDate,
  applyFindDateRange,
  applyOperationChoice,
  buildDecisionFrame,
  clearDecisionFrame,
  getAskProductCopy,
  loadDecisionFrame,
  saveDecisionFrame,
} from '@/lib/ask-product';
import {
  getAskQuestionRepository,
  resetAskQuestionRepositoryForTests,
} from '@/lib/ask-question-repository';

const replace = vi.fn();
const push = vi.fn();
let searchParams = new URLSearchParams();

const loadFrameFromCase = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => searchParams,
}));

vi.mock('@/lib/ask-product', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ask-product')>(
    '@/lib/ask-product'
  );
  return {
    ...actual,
    loadFrameFromCase: (...args: unknown[]) => loadFrameFromCase(...args),
  };
});

function seedQuestion(text: string, decisionTypeId?: string) {
  getAskQuestionRepository().saveQuestion({
    submitted_at: Date.now(),
    source: 'typed',
    text,
    ...(decisionTypeId ? { decision_type_id: decisionTypeId } : {}),
  });
}

function seedWeddingCompareFrame() {
  let frame = buildDecisionFrame('Choose wedding date', {
    decision_type_id: 'mar-wedding-date',
  });
  frame = applyOperationChoice(frame, 'compare');
  frame = applyCompareDates(frame, [
    { id: 'opt-1', label: 'Ceremony A', date: '2026-08-14' },
    { id: 'opt-2', label: 'Ceremony B', date: '2026-09-20' },
  ]);
  saveDecisionFrame(frame);
  return frame;
}

describe('AskFrameScreen new-Ask DecisionFrame isolation', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetAskQuestionRepositoryForTests();
    replace.mockReset();
    push.mockReset();
    loadFrameFromCase.mockReset();
    searchParams = new URLSearchParams();
  });

  afterEach(() => {
    cleanup();
  });

  it('P0: new typed Ask does not inherit Wedding COMPARE frame', async () => {
    seedWeddingCompareFrame();
    // Simulate AskScreen clear + new question (primary path).
    clearDecisionFrame();
    seedQuestion('Close an important business deal');

    render(<AskFrameScreen lang="en" />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-frame-screen')).toBeTruthy();
    });

    const intent = screen.getByTestId('ask-intent-preserve');
    expect(intent.textContent).toContain('Close an important business deal');
    expect(intent.textContent).not.toContain('Choose wedding date');
    expect(screen.queryByTestId('ask-ready-compare')).toBeNull();
    expect(screen.queryByTestId('ask-persist-compare')).toBeNull();
    expect(
      screen.queryByText(getAskProductCopy('en').persistAndCompare)
    ).toBeNull();
    expect(screen.queryByDisplayValue('2026-08-14')).toBeNull();
    expect(screen.queryByDisplayValue('2026-09-20')).toBeNull();
    expect(screen.queryByDisplayValue('Ceremony A')).toBeNull();
    expect(screen.queryByText('Ceremony A')).toBeNull();

    const rebuilt = loadDecisionFrame();
    expect(rebuilt?.raw_intent).toBe('Close an important business deal');
    expect(rebuilt?.decision_type_id).toBeUndefined();
    expect(rebuilt?.operation).not.toBe('compare');
    expect(rebuilt?.options).toBeUndefined();
    expect(JSON.stringify(rebuilt)).not.toContain('2026-08-14');
    expect(JSON.stringify(rebuilt)).not.toContain('Ceremony A');
  });

  it('defensive guard rebuilds when session frame mismatches current question', async () => {
    // Stale session left behind (primary clear skipped).
    seedWeddingCompareFrame();
    seedQuestion('Close an important business deal');

    render(<AskFrameScreen lang="en" />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-frame-screen')).toBeTruthy();
    });

    expect(screen.getByTestId('ask-intent-preserve').textContent).toContain(
      'Close an important business deal'
    );
    expect(screen.queryByTestId('ask-ready-compare')).toBeNull();
    const rebuilt = loadDecisionFrame();
    expect(rebuilt?.raw_intent).toBe('Close an important business deal');
    expect(JSON.stringify(rebuilt)).not.toContain('2026-08-14');
  });

  it('Popular → Popular replaces Decision Type completely', async () => {
    let wedding = buildDecisionFrame('Choose wedding date', {
      decision_type_id: 'mar-wedding-date',
    });
    wedding = applyOperationChoice(wedding, 'compare');
    saveDecisionFrame(wedding);

    clearDecisionFrame();
    seedQuestion(
      'Best time to launch a new project or product',
      'bus-product-launch'
    );

    render(<AskFrameScreen lang="en" />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-frame-screen')).toBeTruthy();
    });

    const rebuilt = loadDecisionFrame();
    expect(rebuilt?.raw_intent).toBe(
      'Best time to launch a new project or product'
    );
    expect(rebuilt?.decision_type_id).toBe('bus-product-launch');
    expect(rebuilt?.decision_type_id).not.toBe('mar-wedding-date');
    expect(rebuilt?.operation).not.toBe('compare');
    expect(screen.getByTestId('ask-intent-preserve').textContent).toContain(
      'Best time to launch a new project or product'
    );
  });

  it('keeps same-draft session frame on refresh without new Ask', async () => {
    seedQuestion('Choose wedding date', 'mar-wedding-date');
    const seeded = seedWeddingCompareFrame();

    render(<AskFrameScreen lang="en" />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-frame-screen')).toBeTruthy();
    });

    expect(screen.getByTestId('ask-ready-compare')).toBeTruthy();
    expect(screen.getByTestId('ask-persist-compare').textContent).toContain(
      getAskProductCopy('en').persistAndCompare
    );
    const kept = loadDecisionFrame();
    expect(kept?.raw_intent).toBe(seeded.raw_intent);
    expect(kept?.operation).toBe('compare');
    expect(kept?.options?.map((o) => o.date)).toEqual([
      '2026-08-14',
      '2026-09-20',
    ]);
  });

  it('caseId hydration wins over session and Ask question', async () => {
    seedWeddingCompareFrame();
    seedQuestion('Close an important business deal');
    searchParams = new URLSearchParams('caseId=case-resume-1');

    const caseFrame = buildDecisionFrame('Case-bound interview timing', {
      decision_type_id: 'car-interview',
      operation: 'evaluate',
      time_scope: 'specific_date',
      dates: ['2026-10-01'],
    });
    loadFrameFromCase.mockResolvedValue({
      frame: caseFrame,
      case: { case_id: 'case-resume-1', case_version: 3 },
    });

    render(<AskFrameScreen lang="en" />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-frame-screen')).toBeTruthy();
    });

    expect(loadFrameFromCase).toHaveBeenCalledWith('case-resume-1');
    expect(screen.getByTestId('ask-intent-preserve').textContent).toContain(
      'Case-bound interview timing'
    );
    expect(screen.getByTestId('ask-intent-preserve').textContent).not.toContain(
      'Close an important business deal'
    );
    expect(loadDecisionFrame()?.raw_intent).toBe('Case-bound interview timing');
    expect(loadDecisionFrame()?.decision_type_id).toBe('car-interview');
  });

  it('previous FIND range does not survive a new Ask', async () => {
    let frame = buildDecisionFrame('Find best wedding window', {
      decision_type_id: 'mar-wedding-date',
    });
    frame = applyOperationChoice(frame, 'find');
    frame = applyFindDateRange(frame, '2026-07-01', '2026-07-31');
    saveDecisionFrame(frame);

    clearDecisionFrame();
    seedQuestion('Close an important business deal');

    render(<AskFrameScreen lang="en" />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-frame-screen')).toBeTruthy();
    });

    const rebuilt = loadDecisionFrame();
    expect(rebuilt?.time.range_start).toBeUndefined();
    expect(rebuilt?.time.range_end).toBeUndefined();
    expect(JSON.stringify(rebuilt)).not.toContain('2026-07-01');
    expect(JSON.stringify(rebuilt)).not.toContain('2026-07-31');
  });

  it('previous EVALUATE date does not survive a new Ask', async () => {
    let frame = buildDecisionFrame('Is this wedding date good?', {
      decision_type_id: 'mar-wedding-date',
    });
    frame = applyOperationChoice(frame, 'evaluate');
    frame = applyEvaluateDate(frame, '2026-11-15');
    saveDecisionFrame(frame);

    clearDecisionFrame();
    seedQuestion('Close an important business deal');

    render(<AskFrameScreen lang="en" />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-frame-screen')).toBeTruthy();
    });

    const rebuilt = loadDecisionFrame();
    expect(rebuilt?.time.dates ?? []).not.toContain('2026-11-15');
    expect(JSON.stringify(rebuilt)).not.toContain('2026-11-15');
    expect(screen.queryByDisplayValue('2026-11-15')).toBeNull();
  });
});
