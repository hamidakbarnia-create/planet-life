import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AskClarificationFlow } from './AskClarificationFlow';
import { buildDecisionFrame } from '@/lib/decision-frame';
import { getAskProductCopy } from '@/lib/ask-product';

const persistFrameToCase = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
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
  persistFrameToCase.mockReset();
});

describe('AskClarificationFlow capability gating', () => {
  it('enables Evaluate for car-interview and can persist/evaluate', async () => {
    persistFrameToCase.mockResolvedValue({
      case: { case_id: 'case-ci', case_version: 1 },
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
    expect(screen.getByTestId('ask-ready-evaluate')).toBeTruthy();
    fireEvent.click(screen.getByTestId('ask-persist-evaluate'));
    expect(persistFrameToCase).toHaveBeenCalled();
  });

  it('drift B: web offered evaluate but backend rejects → FA shows localized capability error', async () => {
    const { DecisionCaseApiError } = await import('@/lib/decision-case');
    persistFrameToCase.mockRejectedValue(
      new DecisionCaseApiError({
        status: 400,
        code: 'UNSUPPORTED_DECISION_TYPE',
        message: 'Decision type is not supported for this operation',
      })
    );
    const copy = getAskProductCopy('fa');
    const frame = buildDecisionFrame('Is August 18 good for my interview?', {
      decision_type_id: 'car-interview',
      operation: 'evaluate',
      time_scope: 'specific_date',
      dates: ['2026-08-18'],
    });
    render(
      <AskClarificationFlow
        lang="fa"
        frame={frame}
        caseId={null}
        caseVersion={null}
        onFrameChange={vi.fn()}
        onCaseBound={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('ask-persist-evaluate'));
    expect(
      await screen.findByText(copy.apiErrors.UNSUPPORTED_DECISION_TYPE)
    ).toBeTruthy();
    expect(
      screen.queryByText(/Decision type is not supported/i)
    ).toBeNull();
    expect(screen.queryByText(/UNSUPPORTED_DECISION_TYPE/)).toBeNull();
  });

  it('disables Evaluate for unsupported free-text and never creates Case', () => {
    const intent = 'جلسه با سرمایه‌گذار برای جذب سرمایه';
    const frame = buildDecisionFrame(intent);
    const copy = getAskProductCopy('fa');
    render(
      <AskClarificationFlow
        lang="fa"
        frame={frame}
        caseId={null}
        caseVersion={null}
        onFrameChange={vi.fn()}
        onCaseBound={vi.fn()}
      />
    );
    const evaluate = screen.getByTestId('examine-evaluate');
    expect(evaluate.hasAttribute('disabled')).toBe(true);
    expect(evaluate.textContent).toContain(copy.evaluateUnavailableForType);
    expect(screen.getByTestId('ask-capability-notice').textContent).toContain(
      copy.capabilityTitle
    );
    expect(screen.queryByTestId('ask-ready-evaluate')).toBeNull();
    expect(screen.queryByTestId('ask-date-step')).toBeNull();
    expect(persistFrameToCase).not.toHaveBeenCalled();
    expect(screen.queryByText(/UNSUPPORTED_DECISION_TYPE/)).toBeNull();
  });

  it('shows CAPABILITY_UNAVAILABLE when evaluate+date but no runtime type', () => {
    const frame = buildDecisionFrame('Investor meeting on Sept 1', {
      operation: 'evaluate',
      time_scope: 'specific_date',
      dates: ['2026-09-01'],
    });
    const copy = getAskProductCopy('en');
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
    expect(screen.getByTestId('ask-capability-unavailable')).toBeTruthy();
    expect(screen.getByText(copy.capabilityTitle)).toBeTruthy();
    expect(persistFrameToCase).not.toHaveBeenCalled();
  });

  it('COMPARE ships for car-interview; FIND remains coming soon', () => {
    const frame = buildDecisionFrame('Interview timing?', {
      decision_type_id: 'car-interview',
    });
    const copy = getAskProductCopy('en');
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
    expect(screen.getByTestId('examine-evaluate').hasAttribute('disabled')).toBe(
      false
    );
    expect(screen.getByTestId('examine-compare').hasAttribute('disabled')).toBe(
      false
    );
    expect(screen.getByTestId('examine-find').hasAttribute('disabled')).toBe(
      true
    );
    expect(screen.getByTestId('examine-find').textContent).toContain(
      copy.comingSoon
    );
  });

  it.each(['en', 'fa', 'ar', 'ru'] as const)(
    'localizes capability messages for %s',
    (lang) => {
      const copy = getAskProductCopy(lang);
      const frame = buildDecisionFrame('جلسه با سرمایه‌گذار برای جذب سرمایه');
      render(
        <AskClarificationFlow
          lang={lang}
          frame={frame}
          caseId={null}
          caseVersion={null}
          onFrameChange={vi.fn()}
          onCaseBound={vi.fn()}
        />
      );
      expect(screen.getByTestId('ask-capability-notice').textContent).toContain(
        copy.capabilityTitle
      );
      expect(screen.getByTestId('examine-evaluate').textContent).toContain(
        copy.evaluateUnavailableForType
      );
    }
  );
});
