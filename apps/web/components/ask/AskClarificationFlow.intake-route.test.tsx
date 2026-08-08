import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AskClarificationFlow } from './AskClarificationFlow';
import { buildDecisionFrame } from '@/lib/decision-frame';

const persistFrameToCase = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock('@/lib/ask-product', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ask-product')>(
    '@/lib/ask-product'
  );
  return {
    ...actual,
    persistFrameToCase: (...args: unknown[]) => persistFrameToCase(...args),
  };
});

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  persistFrameToCase.mockReset();
  push.mockReset();
});

describe('AskClarificationFlow evaluate routes to intake', () => {
  it('routes car-interview ASK evaluate to intake, not result', async () => {
    persistFrameToCase.mockResolvedValue({
      case: { case_id: 'case-ci', case_version: 2 },
    });
    const frame = buildDecisionFrame('Is August 18 good for my interview?', {
      decision_type_id: 'car-interview',
      operation: 'evaluate',
      time_scope: 'specific_date',
      dates: ['2026-08-18'],
    });
    render(
      <AskClarificationFlow
        lang="en"
        frame={frame}
        caseId={null}
        caseVersion={null}
        onFrameChange={vi.fn()}
        onCaseBound={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('ask-persist-evaluate'));
    await waitFor(() => {
      expect(persistFrameToCase).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith('/decision-cases/case-ci/intake');
      expect(push).not.toHaveBeenCalledWith(
        '/decision-cases/case-ci/result'
      );
    });
  });

  it('routes investor ASK evaluate to intake, not result', async () => {
    persistFrameToCase.mockResolvedValue({
      case: { case_id: 'case-inv', case_version: 2 },
    });
    const frame = buildDecisionFrame('Is August 20 good for my investor meeting?', {
      decision_type_id: 'bus-investor-meeting',
      operation: 'evaluate',
      time_scope: 'specific_date',
      dates: ['2026-08-20'],
    });
    render(
      <AskClarificationFlow
        lang="en"
        frame={frame}
        caseId={null}
        caseVersion={null}
        onFrameChange={vi.fn()}
        onCaseBound={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('ask-persist-evaluate'));
    await waitFor(() => {
      expect(persistFrameToCase).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith('/decision-cases/case-inv/intake');
      expect(push).not.toHaveBeenCalledWith(
        '/decision-cases/case-inv/result'
      );
    });
  });

  it('routes wedding ASK evaluate to intake, not result', async () => {
    persistFrameToCase.mockResolvedValue({
      case: { case_id: 'case-wed', case_version: 2 },
    });
    const frame = buildDecisionFrame('Is October 10 a good wedding date?', {
      decision_type_id: 'mar-wedding-date',
      operation: 'evaluate',
      time_scope: 'specific_date',
      dates: ['2026-10-10'],
    });
    render(
      <AskClarificationFlow
        lang="en"
        frame={frame}
        caseId={null}
        caseVersion={null}
        onFrameChange={vi.fn()}
        onCaseBound={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('ask-persist-evaluate'));
    await waitFor(() => {
      expect(persistFrameToCase).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith('/decision-cases/case-wed/intake');
      expect(push).not.toHaveBeenCalledWith(
        '/decision-cases/case-wed/result'
      );
    });
  });
});
