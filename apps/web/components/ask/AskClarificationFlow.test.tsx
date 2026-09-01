import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AskClarificationFlow } from './AskClarificationFlow';
import { buildDecisionFrame } from '@/lib/decision-frame';
import { getAskProductCopy } from '@/lib/ask-product';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

afterEach(() => cleanup());

describe('AskClarificationFlow product recovery', () => {
  it.each(['en', 'fa', 'ar', 'ru'] as const)(
    'shows one unsupported panel for untyped free-text in %s',
    (lang) => {
      const copy = getAskProductCopy(lang);
      const frame = buildDecisionFrame("I'm meeting an investor.");
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

      expect(screen.getByTestId('ask-unsupported-type')).toBeTruthy();
      expect(screen.getByText(copy.unsupportedTypeTitle)).toBeTruthy();
      expect(screen.getByText(copy.unsupportedTypeBody)).toBeTruthy();
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
      expect(screen.getByTestId('ask-intent-preserve').textContent).toContain(
        frame.raw_intent
      );
      expect(screen.queryByText(/\bUnknown\b/)).toBeNull();
      expect(screen.queryByText(copy.comingSoon)).toBeNull();
      expect(screen.queryByTestId('evaluate-product-result')).toBeNull();
    }
  );

  it('renders unsupported-type panel for untyped compare frames', () => {
    const frame = buildDecisionFrame('14 or 18 August?', {
      reference_year: 2026,
      operation: 'compare',
      time_scope: 'multiple_dates',
      dates: ['2026-08-14', '2026-08-18'],
    });
    render(
      <AskClarificationFlow
        lang="fa"
        frame={frame}
        caseId="case-1"
        caseVersion={1}
        onFrameChange={vi.fn()}
        onCaseBound={vi.fn()}
      />
    );
    expect(screen.getByTestId('ask-unsupported-type')).toBeTruthy();
    expect(
      screen.getByText(getAskProductCopy('fa').unsupportedTypeTitle)
    ).toBeTruthy();
    expect(screen.queryByTestId('examine-choices')).toBeNull();
    expect(screen.queryByTestId('ask-unsupported-operation')).toBeNull();
  });

  it('enables compare for wedding and shows ready persist CTA', () => {
    const frame = buildDecisionFrame('14 or 18 August wedding?', {
      decision_type_id: 'mar-wedding-date',
      reference_year: 2026,
      operation: 'compare',
      time_scope: 'multiple_dates',
      dates: ['2026-08-14', '2026-08-18'],
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
    expect(screen.queryByTestId('ask-unsupported-operation')).toBeNull();
    expect(screen.getByTestId('ask-ready-compare')).toBeTruthy();
    expect(screen.getByTestId('ask-persist-compare').textContent).toContain(
      getAskProductCopy('en').persistAndCompare
    );
  });

  it('does not invent a date when continuing without input', () => {
    const frame = buildDecisionFrame('Is my interview timing good?', {
      decision_type_id: 'car-interview',
      operation: 'evaluate',
      time_scope: 'none',
    });
    const onFrameChange = vi.fn();
    render(
      <AskClarificationFlow
        lang="en"
        frame={frame}
        caseId={null}
        caseVersion={null}
        onFrameChange={onFrameChange}
        onCaseBound={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('ask-date-continue'));
    expect(screen.getByText(getAskProductCopy('en').dateMissing)).toBeTruthy();
    expect(onFrameChange).not.toHaveBeenCalled();
  });
});
