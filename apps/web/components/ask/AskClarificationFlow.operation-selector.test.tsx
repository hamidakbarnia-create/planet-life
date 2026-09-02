import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AskClarificationFlow } from './AskClarificationFlow';
import { buildDecisionFrame } from '@/lib/decision-frame';
import { getAskProductCopy, type DecisionFrameV1 } from '@/lib/ask-product';

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

function Harness({
  initial,
  lang = 'en',
}: {
  initial: DecisionFrameV1;
  lang?: 'en' | 'fa' | 'ar' | 'ru';
}) {
  const [frame, setFrame] = useState(initial);
  return (
    <AskClarificationFlow
      lang={lang}
      frame={frame}
      caseId={null}
      caseVersion={null}
      onFrameChange={setFrame}
      onCaseBound={vi.fn()}
    />
  );
}

function renderFlow(
  frame: DecisionFrameV1,
  lang: 'en' | 'fa' | 'ar' | 'ru' = 'en'
) {
  return render(
    <AskClarificationFlow
      lang={lang}
      frame={frame}
      caseId={null}
      caseVersion={null}
      onFrameChange={vi.fn()}
      onCaseBound={vi.fn()}
    />
  );
}

describe('AskClarificationFlow explicit operation selector', () => {
  it('Product Launch shows all three choices with Compare disabled', () => {
    const copy = getAskProductCopy('fa');
    const frame = buildDecisionFrame(
      'بهترین زمان برای لانچ پروژه یا محصول جدید',
      { decision_type_id: 'bus-product-launch' }
    );
    renderFlow(frame, 'fa');
    expect(screen.getByTestId('examine-choices')).toBeTruthy();
    expect(screen.getByTestId('examine-evaluate').hasAttribute('disabled')).toBe(
      false
    );
    expect(screen.getByTestId('examine-find').hasAttribute('disabled')).toBe(
      false
    );
    const compare = screen.getByTestId('examine-compare');
    expect(compare.hasAttribute('disabled')).toBe(true);
    expect(compare.textContent).toContain(copy.compareUnavailableForLaunch);
    expect(compare.textContent).toContain(copy.examineCompare);
    expect(screen.getByTestId('examine-evaluate').textContent).toContain(
      copy.examineEvaluate
    );
    expect(screen.getByTestId('examine-find').textContent).toContain(
      copy.examineFind
    );
    expect(screen.queryByTestId('ask-evaluate-date')).toBeNull();
    expect(screen.queryByTestId('ask-find-range-start')).toBeNull();
    expect(screen.queryByTestId('ask-compare-dates-step')).toBeNull();
    expect(screen.getByTestId('examine-evaluate').getAttribute('data-recommended')).toBeNull();
    expect(screen.getByTestId('examine-compare').getAttribute('data-recommended')).toBeNull();
    expect(screen.getByTestId('examine-find').getAttribute('data-recommended')).toBeNull();
    expect(persistFrameToCase).not.toHaveBeenCalled();
  });

  it('Car Interview enables Evaluate, Compare, and Find', () => {
    renderFlow(
      buildDecisionFrame('Interview timing?', {
        decision_type_id: 'car-interview',
      })
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

  it('Wedding enables Evaluate/Compare and disables Find', () => {
    const copy = getAskProductCopy('en');
    renderFlow(
      buildDecisionFrame('Choose wedding date', {
        decision_type_id: 'mar-wedding-date',
      })
    );
    expect(screen.getByTestId('examine-evaluate').hasAttribute('disabled')).toBe(
      false
    );
    expect(screen.getByTestId('examine-compare').hasAttribute('disabled')).toBe(
      false
    );
    const find = screen.getByTestId('examine-find');
    expect(find.hasAttribute('disabled')).toBe(true);
    expect(find.textContent).toContain(copy.comingSoon);
  });

  it('Investor Meeting enables Evaluate/Compare and disables Find', () => {
    const copy = getAskProductCopy('en');
    renderFlow(
      buildDecisionFrame('Investor meeting timing?', {
        decision_type_id: 'bus-investor-meeting',
      })
    );
    expect(screen.getByTestId('examine-evaluate').hasAttribute('disabled')).toBe(
      false
    );
    expect(screen.getByTestId('examine-compare').hasAttribute('disabled')).toBe(
      false
    );
    const find = screen.getByTestId('examine-find');
    expect(find.hasAttribute('disabled')).toBe(true);
    expect(find.textContent).toContain(copy.comingSoon);
  });

  it('FA Evaluate recommendation still shows the selector (PR #35)', () => {
    const copy = getAskProductCopy('fa');
    const frame = buildDecisionFrame('آیا ۱۲ سپتامبر برای مصاحبه خوبه؟', {
      decision_type_id: 'car-interview',
      reference_year: 2026,
    });
    renderFlow(frame, 'fa');
    expect(screen.getByTestId('examine-choices')).toBeTruthy();
    expect(
      screen.getByTestId('examine-evaluate').getAttribute('data-recommended')
    ).toBe('true');
    expect(screen.getByTestId('examine-evaluate').textContent).toContain(
      copy.examineRecommended
    );
    expect(persistFrameToCase).not.toHaveBeenCalled();
  });

  it('English auto-Find still shows the selector with Find recommended', () => {
    const frame = buildDecisionFrame(
      'Find the best date in the next 30 days',
      { decision_type_id: 'bus-product-launch' }
    );
    renderFlow(frame);
    expect(screen.getByTestId('examine-choices')).toBeTruthy();
    expect(
      screen.getByTestId('examine-find').getAttribute('data-recommended')
    ).toBe('true');
    expect(screen.getByTestId('examine-find').textContent).toContain(
      getAskProductCopy('en').examineRecommended
    );
    expect(screen.getByTestId('ask-find-range-step')).toBeTruthy();
    expect(screen.getByTestId('ask-find-range-start')).toBeTruthy();
    expect(screen.getByTestId('ask-find-range-end')).toBeTruthy();
    expect(screen.queryByTestId('ask-compare-dates-step')).toBeNull();
    expect(screen.queryByTestId('ask-persist-find')).toBeNull();
  });

  it('Evaluate selection renders one date field', () => {
    render(
      <Harness
        initial={buildDecisionFrame('Interview timing?', {
          decision_type_id: 'car-interview',
        })}
      />
    );
    fireEvent.click(screen.getByTestId('examine-evaluate'));
    expect(screen.getByTestId('ask-evaluate-date')).toBeTruthy();
    expect(screen.queryByTestId('ask-find-range-start')).toBeNull();
    expect(screen.queryByTestId('ask-compare-dates-step')).toBeNull();
    expect(screen.getByTestId('examine-evaluate').getAttribute('data-selected')).toBe(
      'true'
    );
  });

  it('Compare selection renders candidate dates, not a range', () => {
    render(
      <Harness
        initial={buildDecisionFrame('Choose wedding date', {
          decision_type_id: 'mar-wedding-date',
        })}
      />
    );
    fireEvent.click(screen.getByTestId('examine-compare'));
    expect(screen.getByTestId('ask-compare-dates-step')).toBeTruthy();
    expect(screen.getByTestId('compare-option-date-0')).toBeTruthy();
    expect(screen.getByTestId('compare-option-date-1')).toBeTruthy();
    expect(screen.getByTestId('compare-option-label-0')).toBeTruthy();
    expect(screen.queryByTestId('ask-find-range-start')).toBeNull();
    expect(screen.queryByTestId('ask-find-range-end')).toBeNull();
    expect(screen.queryByText(getAskProductCopy('en').findRangeStart)).toBeNull();
  });

  it('Find selection renders start/end, not candidate options', () => {
    render(
      <Harness
        initial={buildDecisionFrame(
          'بهترین زمان برای لانچ پروژه یا محصول جدید',
          { decision_type_id: 'bus-product-launch' }
        )}
        lang="fa"
      />
    );
    fireEvent.click(screen.getByTestId('examine-find'));
    expect(screen.getByTestId('ask-find-range-step')).toBeTruthy();
    expect(screen.getByTestId('ask-find-range-start')).toBeTruthy();
    expect(screen.getByTestId('ask-find-range-end')).toBeTruthy();
    expect(screen.queryByTestId('ask-compare-dates-step')).toBeNull();
    expect(screen.queryByTestId('compare-option-date-0')).toBeNull();
  });

  it('switching operations clears incompatible fields', () => {
    const initial = buildDecisionFrame(
      'Find the best date in the next 30 days',
      {
        decision_type_id: 'car-interview',
        operation: 'find',
        time_scope: 'date_range',
        range_start: '2026-09-15',
        range_end: '2026-09-30',
      }
    );
    render(<Harness initial={initial} />);
    expect(screen.getByTestId('ask-ready-find')).toBeTruthy();
    fireEvent.click(screen.getByTestId('examine-compare'));
    expect(screen.getByTestId('ask-compare-dates-step')).toBeTruthy();
    expect(screen.queryByTestId('ask-find-range-start')).toBeNull();
    expect(screen.queryByDisplayValue('2026-09-15')).toBeNull();
    expect(screen.queryByDisplayValue('2026-09-30')).toBeNull();
    fireEvent.click(screen.getByTestId('examine-evaluate'));
    expect(screen.getByTestId('ask-evaluate-date')).toBeTruthy();
    expect(screen.queryByTestId('ask-compare-dates-step')).toBeNull();
    expect(screen.queryByTestId('ask-find-range-start')).toBeNull();
  });

  it('does not persist Product Launch Compare', () => {
    renderFlow(
      buildDecisionFrame('بهترین زمان برای لانچ پروژه یا محصول جدید', {
        decision_type_id: 'bus-product-launch',
      }),
      'fa'
    );
    fireEvent.click(screen.getByTestId('examine-compare'));
    expect(persistFrameToCase).not.toHaveBeenCalled();
    expect(screen.queryByTestId('ask-persist-compare')).toBeNull();
    expect(screen.getByTestId('examine-compare').hasAttribute('disabled')).toBe(
      true
    );
  });

  it('rejects Find ranges outside the 7–90 inclusive contract before persist', () => {
    const copy = getAskProductCopy('en');
    render(
      <Harness
        initial={buildDecisionFrame('Find the best date in the next 30 days', {
          decision_type_id: 'car-interview',
        })}
      />
    );
    const start = screen.getByTestId('ask-find-range-start');
    const end = screen.getByTestId('ask-find-range-end');

    fireEvent.change(start, { target: { value: '2026-09-01' } });
    fireEvent.change(end, { target: { value: '2026-09-06' } });
    fireEvent.click(screen.getByTestId('ask-find-range-continue'));
    expect(screen.getByRole('alert').textContent).toBe(copy.findRangeTooShort);
    expect(screen.queryByTestId('ask-ready-find')).toBeNull();
    expect(persistFrameToCase).not.toHaveBeenCalled();

    fireEvent.change(end, { target: { value: '2026-11-30' } });
    fireEvent.click(screen.getByTestId('ask-find-range-continue'));
    expect(screen.getByRole('alert').textContent).toBe(copy.findRangeTooLong);

    fireEvent.change(end, { target: { value: '2026-09-01' } });
    fireEvent.click(screen.getByTestId('ask-find-range-continue'));
    expect(screen.getByRole('alert').textContent).toBe(copy.findRangeTooShort);

    fireEvent.change(end, { target: { value: '2026-08-01' } });
    fireEvent.click(screen.getByTestId('ask-find-range-continue'));
    expect(screen.getByRole('alert').textContent).toBe(copy.findRangeInvalid);

    fireEvent.change(end, { target: { value: '2026-09-07' } });
    fireEvent.click(screen.getByTestId('ask-find-range-continue'));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByTestId('ask-ready-find')).toBeTruthy();
    expect(persistFrameToCase).not.toHaveBeenCalled();
  });

  it.each(['en', 'fa', 'ar', 'ru'] as const)(
    'renders localized selector copy for %s without internal IDs',
    (lang) => {
      const copy = getAskProductCopy(lang);
      renderFlow(
        buildDecisionFrame('Launch timing', {
          decision_type_id: 'bus-product-launch',
        }),
        lang
      );
      const choices = screen.getByTestId('examine-choices').textContent ?? '';
      expect(choices).toContain(copy.examineEvaluate);
      expect(choices).toContain(copy.examineCompare);
      expect(choices).toContain(copy.examineFind);
      expect(choices).not.toMatch(
        /bus-product-launch|compare_dates|find_dates|evaluate_date/
      );
    }
  );
});
