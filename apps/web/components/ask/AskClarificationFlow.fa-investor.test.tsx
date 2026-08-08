import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AskClarificationFlow } from './AskClarificationFlow';
import { buildDecisionFrame } from '@/lib/decision-frame';
import { getAskProductCopy } from '@/lib/ask-product';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

afterEach(() => cleanup());

describe('FA investor free-text clarification', () => {
  it('shows capability-aware clarify UI without inventing a Decision Type', () => {
    const intent = 'جلسه با سرمایه‌گذار برای جذب سرمایه';
    const frame = buildDecisionFrame(intent);
    const copy = getAskProductCopy('fa');
    const { container } = render(
      <AskClarificationFlow
        lang="fa"
        frame={frame}
        caseId={null}
        caseVersion={null}
        onFrameChange={vi.fn()}
        onCaseBound={vi.fn()}
      />
    );

    expect(frame.decision_type_id).toBeUndefined();
    expect(screen.getByTestId('ask-clarification-flow').getAttribute('dir')).toBe(
      'rtl'
    );
    expect(screen.getByTestId('ask-intent-preserve').textContent).toContain(
      intent
    );
    expect(screen.getByText(copy.examinePrompt)).toBeTruthy();
    const evaluate = screen.getByTestId('examine-evaluate');
    expect(evaluate.hasAttribute('disabled')).toBe(true);
    expect(evaluate.textContent).toContain(copy.examineEvaluate);
    expect(evaluate.textContent).toContain(copy.evaluateUnavailableForType);
    expect(screen.getByTestId('examine-compare').textContent).toContain(
      copy.comingSoon
    );
    expect(screen.getByTestId('examine-find').textContent).toContain(
      copy.comingSoon
    );
    expect(screen.getByTestId('ask-capability-notice').textContent).toContain(
      copy.capabilityTitle
    );

    const text = container.textContent ?? '';
    expect(text).not.toMatch(/Decision Frame|time_scope|operation|Unknown/i);
    expect(text).not.toMatch(/unresolved|specific_date|multiple_dates/);
    expect(text).not.toMatch(/UNSUPPORTED_DECISION_TYPE|mar-wedding-date|car-interview/);
    expect(screen.queryByTestId('evaluate-product-result')).toBeNull();
    expect(screen.queryByTestId('ask-persist-evaluate')).toBeNull();
  });
});
