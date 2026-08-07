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
    'shows evaluate enabled and compare/find coming soon for %s',
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

      expect(screen.getByTestId('examine-evaluate').textContent).toContain(
        copy.examineEvaluate
      );
      const compare = screen.getByTestId('examine-compare');
      const find = screen.getByTestId('examine-find');
      expect(compare.hasAttribute('disabled')).toBe(true);
      expect(find.hasAttribute('disabled')).toBe(true);
      expect(compare.textContent).toContain(copy.comingSoon);
      expect(find.textContent).toContain(copy.comingSoon);
      expect(screen.getByTestId('ask-intent-preserve').textContent).toContain(
        frame.raw_intent
      );
      expect(screen.queryByText(/\bUnknown\b/)).toBeNull();
      expect(screen.queryByTestId('evaluate-product-result')).toBeNull();
    }
  );

  it('renders unsupported recovery for persisted compare frames', () => {
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
    expect(screen.getByTestId('ask-unsupported-operation')).toBeTruthy();
    expect(screen.getByText(getAskProductCopy('fa').unsupportedTitle)).toBeTruthy();
    expect(screen.queryByTestId('examine-choices')).toBeNull();
  });

  it('does not invent a date when continuing without input', () => {
    const frame = buildDecisionFrame('Is my interview timing good?', {
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
