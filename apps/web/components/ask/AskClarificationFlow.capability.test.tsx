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

  it('shows one unsupported panel for untyped free-text and never creates Case', () => {
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
    expect(screen.getByTestId('ask-unsupported-type')).toBeTruthy();
    expect(screen.getByText(copy.unsupportedTypeTitle)).toBeTruthy();
    expect(screen.getByText(copy.unsupportedTypeBody)).toBeTruthy();
    expect(screen.getByTestId('ask-intent-preserve').textContent).toContain(
      intent
    );
    expect(screen.getByTestId('unsupported-type-edit').textContent).toBe(
      copy.unsupportedTypeEdit
    );
    expect(screen.getByTestId('unsupported-type-back').textContent).toBe(
      copy.unsupportedTypeBack
    );
    expect(screen.queryByTestId('examine-choices')).toBeNull();
    expect(screen.queryByTestId('examine-evaluate')).toBeNull();
    expect(screen.queryByTestId('examine-compare')).toBeNull();
    expect(screen.queryByTestId('examine-find')).toBeNull();
    expect(screen.queryByTestId('ask-ready-evaluate')).toBeNull();
    expect(screen.queryByTestId('ask-date-step')).toBeNull();
    expect(persistFrameToCase).not.toHaveBeenCalled();
    expect(screen.queryByText(/UNSUPPORTED_DECISION_TYPE/)).toBeNull();
  });

  it('shows unsupported panel when evaluate+date but no executable type', () => {
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
    expect(screen.getByTestId('ask-unsupported-type')).toBeTruthy();
    expect(screen.getByText(copy.unsupportedTypeTitle)).toBeTruthy();
    expect(screen.queryByTestId('examine-choices')).toBeNull();
    expect(persistFrameToCase).not.toHaveBeenCalled();
  });

  it('shows unsupported panel for negotiate-offer without Decision Type', () => {
    const intent = 'مذاکره روی پیشنهاد شغلی';
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
    expect(frame.decision_type_id).toBeUndefined();
    expect(screen.getByTestId('ask-unsupported-type')).toBeTruthy();
    expect(screen.getByText(copy.unsupportedTypeTitle)).toBeTruthy();
    expect(screen.getByTestId('ask-intent-preserve').textContent).toContain(
      intent
    );
    expect(screen.queryByTestId('examine-choices')).toBeNull();
    expect(screen.queryByTestId('examine-evaluate')).toBeNull();
    expect(screen.queryByTestId('examine-compare')).toBeNull();
    expect(screen.queryByTestId('examine-find')).toBeNull();
    expect(persistFrameToCase).not.toHaveBeenCalled();
  });

  it('shows unsupported panel for relocation and other untyped questions', () => {
    for (const intent of [
      'Should I relocate to Spain?',
      'Negotiate a job offer',
    ]) {
      const frame = buildDecisionFrame(intent);
      const { unmount } = render(
        <AskClarificationFlow
          lang="en"
          frame={frame}
          caseId={null}
          caseVersion={null}
          onFrameChange={vi.fn()}
          onCaseBound={vi.fn()}
        />
      );
      expect(screen.getByTestId('ask-unsupported-type')).toBeTruthy();
      expect(screen.getByTestId('ask-intent-preserve').textContent).toContain(
        intent
      );
      expect(screen.queryByTestId('examine-choices')).toBeNull();
      expect(screen.queryByTestId('examine-evaluate')).toBeNull();
      expect(persistFrameToCase).not.toHaveBeenCalled();
      unmount();
    }
  });

  it('keeps selector hidden for registry-only unreachable types', () => {
    const frame = buildDecisionFrame('Compare three dates', {
      decision_type_id: 'tim-compare-three',
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
    expect(screen.getByTestId('ask-unsupported-type')).toBeTruthy();
    expect(screen.queryByTestId('examine-choices')).toBeNull();
    expect(persistFrameToCase).not.toHaveBeenCalled();
  });

  it('EVALUATE + COMPARE + FIND ship for car-interview', () => {
    const frame = buildDecisionFrame('Interview timing?', {
      decision_type_id: 'car-interview',
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
    expect(screen.getByTestId('examine-evaluate').hasAttribute('disabled')).toBe(
      false
    );
    expect(screen.getByTestId('examine-compare').hasAttribute('disabled')).toBe(
      false
    );
    expect(screen.getByTestId('examine-find').hasAttribute('disabled')).toBe(
      false
    );
  });

  it('car-interview FIND can create a date_range frame path', () => {
    persistFrameToCase.mockResolvedValue({
      case: { case_id: 'case-ci-find', case_version: 2 },
    });
    const frame = buildDecisionFrame('When should I interview?', {
      decision_type_id: 'car-interview',
      operation: 'find',
      time_scope: 'date_range',
      range_start: '2026-09-01',
      range_end: '2026-09-14',
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
    expect(screen.getByTestId('ask-ready-find')).toBeTruthy();
    fireEvent.click(screen.getByTestId('ask-persist-find'));
    expect(persistFrameToCase).toHaveBeenCalled();
  });

  it('COMPARE ships for bus-investor-meeting; FIND remains coming soon', () => {
    const frame = buildDecisionFrame('Investor meeting timing?', {
      decision_type_id: 'bus-investor-meeting',
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
    'localizes unsupported-type panel for %s without internal IDs',
    (lang) => {
      const copy = getAskProductCopy(lang);
      const frame = buildDecisionFrame('جلسه با سرمایه‌گذار برای جذب سرمایه');
      const { container } = render(
        <AskClarificationFlow
          lang={lang}
          frame={frame}
          caseId={null}
          caseVersion={null}
          onFrameChange={vi.fn()}
          onCaseBound={vi.fn()}
        />
      );
      expect(screen.getByTestId('ask-unsupported-type').textContent).toContain(
        copy.unsupportedTypeTitle
      );
      expect(screen.getByText(copy.unsupportedTypeBody)).toBeTruthy();
      expect(screen.queryByTestId('examine-choices')).toBeNull();
      const text = container.textContent ?? '';
      expect(text).not.toMatch(
        /bus-product-launch|car-interview|compare_dates|find_dates|evaluate_date|UNSUPPORTED_DECISION_TYPE/
      );
      if (lang === 'fa' || lang === 'ar') {
        expect(text).not.toMatch(
          /This decision type is not yet supported|Your decision was not saved/
        );
      }
    }
  );
});
