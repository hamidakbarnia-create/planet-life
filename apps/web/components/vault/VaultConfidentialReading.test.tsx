import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import { VaultConfidentialReading } from './VaultConfidentialReading';
import marsApiReadings from './fixtures/mars-symbolic-api.json';
import { VAULT_READING_PRESENTATION_COPY } from '@/lib/vault-reading-presentation';
import type { VaultReadingLayer } from '@/lib/vault-reading';

afterEach(() => {
  cleanup();
});

const READING: VaultReadingLayer = {
  executive:
    'High-voltage attraction. Mars in Aries. Action: Choose one pursuit today and drop the rest.',
  strategic:
    'Mars square Pluto: power struggles in intimacy. You can magnetize dangerous dynamics — choose consciously. What this changes today: your desire pattern is a filter — use it before you invest. Action: Choose one pursuit today and drop the rest.',
  technical: 'Mars 15.0° Aries · house 1 · dignity: rulership',
  headline: 'High-voltage attraction',
  action: 'Choose one pursuit today and drop the rest',
  confidence: 'high',
};

const labels = VAULT_READING_PRESENTATION_COPY.en;

describe('VaultConfidentialReading', () => {
  it('places the hero before the optional windows slot', () => {
    const { container } = render(
      <VaultConfidentialReading
        lang="en"
        reading={READING}
        labels={labels}
        windowsSlot={<div data-testid="windows-slot-probe">windows</div>}
      />
    );
    const root = screen.getByTestId('vault-confidential-reading');
    const hero = screen.getByTestId('vault-reading-hero');
    const windows = screen.getByTestId('vault-reading-windows');
    const children = Array.from(root.children);
    expect(children.indexOf(hero)).toBeLessThan(children.indexOf(windows));
    expect(screen.getByTestId('windows-slot-probe')).toBeTruthy();
    expect(container.textContent).not.toContain(READING.technical);
  });

  it('renders identical opportunity/action/next-step content once in the main flow', () => {
    render(
      <VaultConfidentialReading lang="en" reading={READING} labels={labels} />
    );
    const root = screen.getByTestId('vault-confidential-reading');
    const why = screen.getByTestId('vault-reading-why-bullets').textContent ?? '';
    expect(why).not.toMatch(/Choose one pursuit today and drop the rest/i);
    expect(screen.queryByTestId('vault-reading-deep-practicalNextStep')).toBeNull();
    // Hero summary + action checklist may both surface the primary action;
    // there must be no third opportunity/next-step copy of the same line.
    const matches =
      root.textContent?.match(/Choose one pursuit today and drop the rest/g) ??
      [];
    expect(matches.length).toBe(2);
  });

  it('keeps distinct content and preserves overflow in Deep Reading', () => {
    const longReading: VaultReadingLayer = {
      executive:
        'Line one for the decision. Line two explains the context. Line three adds timing. Line four covers tone. Line five is overflow. Line six stays available.',
      strategic:
        'Line one for the decision. Line two explains the context. Line three adds timing. Line four covers tone. Line five is overflow. Line six stays available. Opportunity: Unique opening that is not the action. Action: Take the unique action path. Avoid: Skip the first trap. Skip the second trap. Skip the third trap. Skip the fourth trap. Skip the fifth trap.',
      technical: 'ignored',
      headline: 'Line one for the decision',
      action: 'Take the unique action path',
      avoid:
        'Skip the first trap. Skip the second trap. Skip the third trap. Skip the fourth trap. Skip the fifth trap.',
      confidence: 'medium',
    };

    render(
      <VaultConfidentialReading lang="en" reading={longReading} labels={labels} />
    );

    const why = screen.getByTestId('vault-reading-why-bullets');
    expect(why.querySelectorAll('li').length).toBeLessThanOrEqual(4);

    const avoid = screen.getByTestId('vault-reading-avoid-items');
    expect(avoid.querySelectorAll('li').length).toBeLessThanOrEqual(4);

    const deep = screen.getByTestId('vault-reading-deep');
    expect(deep).toBeTruthy();
    expect(deep.textContent).toMatch(/Line five is overflow|Line six stays available/i);
    expect(deep.textContent).toMatch(/fifth trap/i);
    expect(screen.getByTestId('vault-confidential-reading').textContent).toMatch(
      /Unique opening that is not the action/i
    );
    expect(screen.getByTestId('vault-confidential-reading').textContent).toContain(
      'Take the unique action path'
    );
  });

  it('maps high, medium, and low confidence to existing semantic levels only', () => {
    const { rerender } = render(
      <VaultConfidentialReading
        lang="en"
        reading={{ ...READING, confidence: 'high' }}
        labels={labels}
        confidenceLabel="Advisory confidence: Higher"
      />
    );
    expect(
      screen.getByTestId('vault-reading-confidence-bar').getAttribute('data-confidence-level')
    ).toBe('high');

    rerender(
      <VaultConfidentialReading
        lang="en"
        reading={{ ...READING, confidence: 'medium' }}
        labels={labels}
      />
    );
    expect(
      screen.getByTestId('vault-reading-confidence-bar').getAttribute('data-confidence-level')
    ).toBe('medium');

    rerender(
      <VaultConfidentialReading
        lang="en"
        reading={{ ...READING, confidence: 'low' }}
        labels={labels}
      />
    );
    expect(
      screen.getByTestId('vault-reading-confidence-bar').getAttribute('data-confidence-level')
    ).toBe('low');
  });

  it('uses existing localized labels for section headings', () => {
    render(
      <VaultConfidentialReading lang="en" reading={READING} labels={labels} />
    );
    const root = screen.getByTestId('vault-confidential-reading');
    expect(root.textContent).toContain(labels.overallSituation);
    expect(root.textContent).toContain(labels.recommendedActions);
    expect(root.textContent).toContain(labels.thingsToAvoid);
    expect(root.textContent).toContain(labels.mainRisk);
    expect(
      within(screen.getByTestId('vault-reading-section-overallSituation')).getByText(
        labels.overallSituation
      )
    ).toBeTruthy();
  });

  it('hides producer / engine vocabulary from the visible reading', () => {
    render(
      <VaultConfidentialReading lang="en" reading={READING} labels={labels} />
    );
    const root = screen.getByTestId('vault-confidential-reading');
    expect(root.textContent?.toLowerCase()).not.toMatch(
      /\bmars\b|\bsquare\b|\bpluto\b|\baries\b|\bdignity\b|\bhouse\b/
    );
  });
});


describe('symbolic guidance safety context', () => {
  it.each(['en', 'ru', 'fa', 'ar'] as const)('preserves the API limitation and hides evidential confidence in %s', (lang) => {
    const limitations = {
      en: 'A symbolic score is not a probability. Actual behavior and fidelity are unknown.',
      ru: 'Символический балл не является вероятностью. Поведение и верность неизвестны.',
      fa: 'امتیاز نمادین احتمال نیست. رفتار و وفاداری نامشخص‌اند.',
      ar: 'الدرجة الرمزية ليست احتمالاً. السلوك والوفاء غير معروفين.',
    };
    const explanation = {
      en: 'Predictive reliability is unvalidated. Chart data is not observed behavior.',
      ru: 'Надёжность прогноза не подтверждена. Данные карты не являются поведением.',
      fa: 'اعتبار پیش‌بینی تأیید نشده است. دادهٔ چارت رفتار مشاهده‌شده نیست.',
      ar: 'موثوقية التنبؤ غير مثبتة. بيانات الخريطة ليست سلوكاً ملاحظاً.',
    };
    const reading: VaultReadingLayer = {
      ...READING,
      executive: limitations[lang],
      strategic: explanation[lang],
      headline: limitations[lang],
      action: {en: 'Reflect on your own experience', ru: 'Подумайте о своём опыте', fa: 'به تجربهٔ خودت فکر کن', ar: 'تأمل تجربتك الشخصية'}[lang],
      confidence: 'low',
      confidence_basis: 'unvalidated_symbolic_guidance',
      limitation: limitations[lang],
      confidence_explanation: explanation[lang],
    };
    render(<VaultConfidentialReading lang={lang} reading={reading}
      labels={VAULT_READING_PRESENTATION_COPY[lang]} confidenceLabel="Old confidence label" />);
    const safety = screen.getByTestId('vault-symbolic-limitation');
    expect(safety.textContent).toContain(limitations[lang]);
    expect(safety.textContent).toContain(explanation[lang]);
    expect(screen.queryByTestId('vault-reading-confidence-bar')).toBeNull();
    expect(screen.queryByText('Old confidence label')).toBeNull();
  });
});


describe('structured symbolic output', () => {
  const limitations = {
    en: 'The score measures symbolic timing strength, not the probability of receiving money or financial success—even at 100/100. Commercial terms, affordability and real evidence remain decisive.',
    ru: 'Символический балл не является вероятностью. Поведение и верность неизвестны.',
    fa: 'امتیاز نمادین احتمال نیست. رفتار و وفاداری نامشخص‌اند.',
    ar: 'الدرجة الرمزية ليست احتمالاً. السلوك والوفاء غير معروفين.',
  };
  it.each(['en', 'ru', 'fa', 'ar'] as const)('renders the exact limitation once next to the action, independently of the legacy enum in %s', (lang) => {
    const reading: VaultReadingLayer = {
      executive: 'Legacy summary', strategic: 'Legacy interpretation', technical: '',
      headline: 'Symbolic window', action: 'Review the terms', avoid: 'Pressure',
      interpretation: 'Compare the symbolic theme with your experience.',
      evidence_status: 'unvalidated', data_completeness: 'supplied_unverified',
      limitation: limitations[lang],
      strongest_window: { date: '2026-09-12', score: 100 },
      secondary_windows: [11, 13, 14, 15].map((day) => ({ date: `2026-09-${day}`, score: 70 })),
    };
    const { rerender } = render(<VaultConfidentialReading lang={lang} reading={reading} labels={VAULT_READING_PRESENTATION_COPY[lang]} />);
    for (const confidence of ['high', 'medium', 'low']) {
      rerender(<VaultConfidentialReading lang={lang} reading={{ ...reading, confidence }} labels={VAULT_READING_PRESENTATION_COPY[lang]} confidenceLabel="Predictive confidence" />);
      const root = screen.getByTestId('vault-confidential-reading');
      expect(root.textContent?.split(limitations[lang])).toHaveLength(2);
      expect(screen.getAllByText(limitations[lang], { exact: true })).toHaveLength(1);
      expect(screen.getByTestId('vault-reading-hero-action').nextElementSibling).toBe(screen.getByTestId('vault-symbolic-limitation'));
      expect(screen.getByTestId('vault-evidence-status').textContent).toBeTruthy();
      expect(screen.getByTestId('vault-data-completeness').textContent).not.toMatch(/supplied_unverified|complete|incomplete/);
      expect(screen.queryByTestId('vault-reading-confidence-bar')).toBeNull();
      expect(screen.queryByText('Predictive confidence')).toBeNull();
      expect(screen.getByTestId('vault-reading-windows').querySelectorAll('li')).toHaveLength(4);
      expect(screen.getByTestId('vault-reading-hero-decision').textContent).not.toMatch(/2026|100/);
      expect(root.getAttribute('dir')).toBe(lang === 'fa' || lang === 'ar' ? 'rtl' : 'ltr');
    }
  });

  it('keeps materially different API Mars interpretations visible without the legacy jargon filter', () => {
    // These are actual local ASGI responses for the documented synthetic primary
    // and the controlled 1981-12-01 variation (fixture is verified by API tests).
    const { rerender } = render(<VaultConfidentialReading lang="en" reading={marsApiReadings[0] as VaultReadingLayer} labels={labels} />);
    const first = screen.getByTestId('vault-reading-interpretation').textContent;
    expect(first).toContain(marsApiReadings[0].interpretation);
    rerender(<VaultConfidentialReading lang="en" reading={marsApiReadings[1] as VaultReadingLayer} labels={labels} />);
    const second = screen.getByTestId('vault-reading-interpretation').textContent;
    expect(second).toContain(marsApiReadings[1].interpretation);
    expect(first).not.toBe(second);
    for (const text of [first, second]) {
      expect(text).toMatch(/symbolic/);
      expect(text).not.toMatch(/your sexuality is|your desire ignites|you are|you behave/i);
    }
  });
});
