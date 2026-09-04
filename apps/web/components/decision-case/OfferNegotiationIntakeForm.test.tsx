import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OfferNegotiationIntakeForm } from './OfferNegotiationIntakeForm';
import type { AppLang } from '@/lib/app-settings';
import { getAskProductCopy } from '@/lib/ask-product';
import {
  COUNTERPARTY_ROLE_VALUES,
  NEGOTIATION_GOAL_VALUES,
  OFFER_STAGE_VALUES,
} from '@/lib/decision-case/offer-negotiation-form';

afterEach(() => cleanup());

const LANGS: readonly AppLang[] = ['en', 'fa', 'ar', 'ru'];

function renderForm(
  lang: AppLang = 'en',
  props: Partial<
    React.ComponentProps<typeof OfferNegotiationIntakeForm>
  > = {}
) {
  return render(
    <OfferNegotiationIntakeForm
      lang={lang}
      submitting={false}
      onSubmitAnswers={vi.fn()}
      onComplete={vi.fn()}
      {...props}
    />
  );
}

describe('OfferNegotiationIntakeForm', () => {
  it('renders the four canonical slots and demands only the date', () => {
    const copy = getAskProductCopy('en');
    renderForm();
    expect(screen.getByTestId('offer-negotiation-intake-form')).toBeTruthy();
    expect(screen.getByTestId('intake-target_date')).toBeTruthy();
    expect(screen.getByTestId('intake-negotiation_goal')).toBeTruthy();
    expect(screen.getByTestId('intake-offer_stage')).toBeTruthy();
    expect(screen.getByTestId('intake-counterparty_role')).toBeTruthy();

    const status = screen.getByTestId('intake-status').textContent ?? '';
    expect(status).toContain(copy.intakeFieldNegotiationDate);
    // Stored-only context slots are never demanded.
    expect(status).not.toContain(copy.intakeFieldNegotiationGoal);
    expect(status).not.toContain(copy.intakeFieldOfferStage);
    expect(status).not.toContain(copy.intakeFieldCounterpartyRole);
  });

  it('marks every context slot optional and only the date required', () => {
    const copy = getAskProductCopy('en');
    const { container } = renderForm();
    const labels = Array.from(container.querySelectorAll('label'));
    const labelFor = (text: string) =>
      labels.find((node) => (node.textContent ?? '').includes(text));

    expect(labelFor(copy.intakeFieldNegotiationDate)?.textContent).toContain(
      '*'
    );
    for (const field of [
      copy.intakeFieldNegotiationGoal,
      copy.intakeFieldOfferStage,
      copy.intakeFieldCounterpartyRole,
    ]) {
      const label = labelFor(field);
      expect(label?.textContent).toContain(copy.intakeOptional);
      expect(label?.textContent).not.toContain('*');
    }
  });

  it('collects no compensation amount field', () => {
    const { container } = renderForm();
    const names = Array.from(container.querySelectorAll('[data-testid]'))
      .map((node) => node.getAttribute('data-testid') ?? '')
      .join(' ');
    expect(names).not.toMatch(/salary_amount|compensation|current_pay|equity/);
    expect(container.querySelector('input[type="number"]')).toBeNull();
  });

  it('prefills target_date from the frame without inventing a goal', () => {
    renderForm('en', { initialIntake: { target_date: '2026-09-15' } });
    const date = screen.getByTestId('intake-target_date') as HTMLInputElement;
    const goal = screen.getByTestId(
      'intake-negotiation_goal'
    ) as HTMLSelectElement;
    expect(date.value).toBe('2026-09-15');
    expect(goal.value).toBe('');
    expect(screen.getByTestId('intake-known-hint')).toBeTruthy();
  });

  it('blocks Complete until the evaluated date is answered', () => {
    renderForm();
    const complete = screen.getByTestId('intake-complete');
    expect(complete.hasAttribute('disabled')).toBe(true);

    // Context alone never unlocks completion.
    fireEvent.change(screen.getByTestId('intake-negotiation_goal'), {
      target: { value: 'salary' },
    });
    expect(complete.hasAttribute('disabled')).toBe(true);

    fireEvent.change(screen.getByTestId('intake-target_date'), {
      target: { value: '2026-09-15' },
    });
    expect(complete.hasAttribute('disabled')).toBe(false);
  });

  it('submits canonical stored enum identifiers', () => {
    const onSubmitAnswers = vi.fn();
    renderForm('fa', { onSubmitAnswers });
    fireEvent.change(screen.getByTestId('intake-target_date'), {
      target: { value: '2026-09-15' },
    });
    fireEvent.change(screen.getByTestId('intake-negotiation_goal'), {
      target: { value: 'complete_package' },
    });
    fireEvent.submit(screen.getByTestId('offer-negotiation-intake-form'));
    expect(onSubmitAnswers).toHaveBeenCalledWith({
      target_date: '2026-09-15',
      negotiation_goal: 'complete_package',
    });
  });

  it.each(LANGS)(
    '%s renders localized option labels and no raw enum tokens',
    (lang) => {
      const copy = getAskProductCopy(lang);
      const { container } = renderForm(lang);
      expect(
        screen.getByTestId('offer-negotiation-intake-form').getAttribute('dir')
      ).toBe(copy.dir);

      for (const slotId of [
        'negotiation_goal',
        'offer_stage',
        'counterparty_role',
      ] as const) {
        const select = screen.getByTestId(`intake-${slotId}`);
        const options = Array.from(select.querySelectorAll('option'));
        const values = options.map((option) => option.value).filter(Boolean);
        const labels = options
          .map((option) => option.textContent ?? '')
          .filter(Boolean);
        const expected =
          slotId === 'negotiation_goal'
            ? NEGOTIATION_GOAL_VALUES
            : slotId === 'offer_stage'
              ? OFFER_STAGE_VALUES
              : COUNTERPARTY_ROLE_VALUES;
        // Stored values stay canonical English identifiers...
        expect(values).toEqual([...expected]);
        // ...but no visible label repeats one.
        for (const label of labels) {
          expect(expected).not.toContain(label);
          expect(label).not.toMatch(/[a-z0-9]+_[a-z0-9]+/);
        }
      }

      const visible = container.textContent ?? '';
      expect(visible).not.toMatch(
        /complete_package|counter_offer|offer_negotiation|role_title|working_arrangement|hiring_manager/
      );
    }
  );

  it.each(['fa', 'ar', 'ru'] as const)(
    '%s shows no English prose in visible form text',
    (lang) => {
      const { container } = renderForm(lang);
      const visible = (container.textContent ?? '').replace(/\s+/g, ' ');
      expect(visible).not.toMatch(/[A-Za-z]{3,}/);
    }
  );
});
