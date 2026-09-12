import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';

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

  it('places Yes Day timing rows under the headline, not after the body', () => {
    render(
      <VaultConfidentialReading
        lang="en"
        reading={READING}
        labels={labels}
        timingSlot={<div>Ask row</div>}
      />,
    );
    const headline = screen.getByTestId('vault-reading-hero-decision');
    const slots = screen.getByTestId('vault-yes-slots');
    expect(headline.textContent).toContain('High-voltage attraction');
    expect(slots.textContent).toContain('Ask row');
    expect(headline.compareDocumentPosition(slots) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(slots.compareDocumentPosition(screen.getByTestId('vault-reading-hero-action')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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


describe('limitation and validity safeguards', () => {
  const evidence = {
    en: 'Predictive validity has not been established.',
    ru: 'Предсказательная достоверность не подтверждена.',
    fa: 'اعتبار پیش‌بینی تأیید نشده است.',
    ar: 'لم تثبت صلاحية هذه القراءة للتنبؤ.',
  } as const;

  it.each(['en', 'ru', 'fa', 'ar'] as const)('keeps a distinct validity warning when a different limitation exists in %s', (lang) => {
    const limitation = {
      en: 'Risk patterns only — never a verdict. No factual character claim about lying.',
      ru: 'Только паттерны риска — не приговор. Нет фактических утверждений о характере.',
      fa: 'فقط الگوی ریسک — هرگز حکم نیست. هیچ ادعای شخصیتی واقعی مطرح نمی‌شود.',
      ar: 'أنماط مخاطر فقط — ليست حكماً. لا ادعاء شخصي واقعي حول الكذب.',
    }[lang];
    render(
      <VaultConfidentialReading
        lang={lang}
        reading={{
          executive: limitation,
          strategic: limitation,
          technical: '',
          headline: 'Communication Risk themes',
          action: 'Slow the next hard talk',
          evidence_status: 'unvalidated',
          data_completeness: 'supplied_unverified',
          limitation,
        }}
        labels={VAULT_READING_PRESENTATION_COPY[lang]}
      />,
    );
    expect(screen.getByTestId('vault-symbolic-limitation').textContent).toContain(limitation);
    expect(screen.getByTestId('vault-evidence-status').textContent).toContain(evidence[lang]);
  });

  it.each(['en', 'ru', 'fa', 'ar'] as const)('shows the validity sentence once when the limitation already contains it in %s', (lang) => {
    render(
      <VaultConfidentialReading
        lang={lang}
        reading={{
          executive: evidence[lang],
          strategic: evidence[lang],
          technical: '',
          headline: 'Symbolic window',
          action: 'Review the terms',
          evidence_status: 'unvalidated',
          data_completeness: 'supplied_unverified',
          limitation: evidence[lang],
        }}
        labels={VAULT_READING_PRESENTATION_COPY[lang]}
      />,
    );
    expect(screen.getByTestId('vault-symbolic-limitation').textContent?.split(evidence[lang])).toHaveLength(2);
    expect(screen.getByTestId('vault-evidence-status').textContent).not.toContain(evidence[lang]);
    expect(screen.getByTestId('vault-data-completeness').textContent).toBeTruthy();
  });

  it('omits the extra Heat validity line when the limitation already states it', () => {
    const limitation =
      'Timing scores are symbolic weights, not probabilities of attraction. Predictive validity is unestablished; consent and another person’s response cannot be inferred.';
    render(
      <VaultConfidentialReading
        lang="en"
        reading={{
          executive: 'Optional attraction timing',
          strategic: 'Compare symbolic windows',
          technical: '',
          headline: 'Optional attraction timing',
          action: 'Choose a low-pressure invitation only if you want to; leave room for a clear answer',
          interpretation:
            'These windows compare symbolic timing strength for social initiative. They say nothing about another person’s interest.',
          evidence_status: 'unvalidated',
          data_completeness: 'supplied_unverified',
          limitation,
        }}
        labels={labels}
      />,
    );
    expect(screen.getByTestId('vault-symbolic-limitation').textContent).toContain(
      'Predictive validity is unestablished',
    );
    expect(screen.getByTestId('vault-evidence-status').textContent).not.toContain(
      'Predictive validity has not been established.',
    );
    expect(screen.getByTestId('vault-reading-interpretation').textContent).toContain(
      'another person’s interest',
    );
  });

  it('hides Overall Situation when it only repeats the action', () => {
    render(
      <VaultConfidentialReading
        lang="en"
        reading={{
          executive: 'Symbolic timing for a money discussion',
          strategic: 'Choose whether to discuss money after reviewing the real terms and evidence',
          technical: '',
          headline: 'Symbolic timing for a money discussion',
          action: 'Choose whether to discuss money after reviewing the real terms and evidence',
          interpretation: 'Choose whether to discuss money after reviewing the real terms and evidence.',
          evidence_status: 'unvalidated',
          data_completeness: 'supplied_unverified',
          limitation:
            'The score measures symbolic timing strength, not the probability of receiving money or financial success—even at 100/100. Commercial terms, affordability and real evidence remain decisive.',
        }}
        labels={labels}
      />,
    );
    expect(screen.queryByTestId('vault-reading-interpretation')).toBeNull();
    expect(screen.getByTestId('vault-reading-hero-action').textContent).toContain(
      'Choose whether to discuss money',
    );
    expect(screen.getByTestId('vault-symbolic-limitation').textContent).toContain(
      'not the probability of receiving money',
    );
  });
});


describe('compatibility and geography presentation', () => {
  it('shows the Overall formula and does not hide a distinct validity warning', () => {
    render(
      <VaultConfidentialReading
        lang="en"
        reading={{
          executive: 'Symbolic relationship comparison',
          strategic: 'Theme weights only',
          technical: '',
          headline: 'Symbolic relationship comparison',
          action: 'Discuss one shared priority',
          evidence_status: 'unvalidated',
          data_completeness: 'supplied_unverified',
          limitation: 'All scores are symbolic comparison weights.',
          score_formula: 'If theme scores are present, Overall is 45% of the full two-chart comparison plus 55% of the mean of those themes, then rounded. Overall is not measured relationship quality.',
          details: [
            { label: 'Attraction theme', value: '53/100' },
            { label: 'Overall', value: '58/100' },
          ],
        }}
        labels={VAULT_READING_PRESENTATION_COPY.en}
      />,
    );
    expect(screen.getByTestId('vault-overall-formula').textContent).toContain('45%');
    expect(screen.getByTestId('vault-overall-formula').textContent).toContain('not measured relationship quality');
    expect(screen.getByTestId('vault-evidence-status').textContent).toContain('Predictive validity has not been established.');
  });

  it('collapses repeated city evidence and labels a tie without superiority', () => {
    render(
      <VaultConfidentialReading
        lang="en"
        reading={{
          executive: 'Symbolic location comparison',
          strategic: 'Shortlist only',
          technical: '',
          headline: 'Symbolic location comparison: Shared expectations',
          action: 'Compare the listed places',
          evidence_status: 'unvalidated',
          data_completeness: 'supplied_unverified',
          limitation: 'These comparisons cannot predict prosperity or love.',
          place_scope: 'Ranking applies only to this candidate-city shortlist. It is not a global ranking or advice to move.',
          details: [
            { label: 'Dubai', value: '70/100', reason: 'Sun-axis symbolism; Sun-axis symbolism; Jupiter weight' },
            { label: 'Tehran', value: '70/100', reason: 'Moon theme' },
          ],
        }}
        labels={VAULT_READING_PRESENTATION_COPY.en}
      />,
    );
    const details = screen.getByTestId('vault-reading-details').textContent ?? '';
    expect(details.match(/Sun-axis symbolism/g)?.length).toBe(1);
    expect(details).toContain('Jupiter weight');
    expect(details).toContain('Moon theme');
    expect(screen.getByTestId('vault-tied-scores').textContent).toBe(
      'For entries with equal scores, display order does not indicate superiority.',
    );
    expect(screen.getByTestId('vault-reading-details').textContent).not.toMatch(/#\d|\b1\.\s|Rank\s+\d/i);
    expect(screen.getByTestId('vault-place-shortlist').textContent).toContain('candidate-city shortlist');
  });

  it('does not show a tie-order message for Compatibility scores 53, 53, 58', () => {
    render(
      <VaultConfidentialReading
        lang="en"
        reading={{
          executive: 'Symbolic relationship comparison',
          strategic: 'Theme weights only',
          technical: '',
          headline: 'Symbolic relationship comparison',
          action: 'Discuss one shared priority',
          evidence_status: 'unvalidated',
          data_completeness: 'supplied_unverified',
          limitation: 'All scores are symbolic comparison weights.',
          details: [
            { label: 'Attraction theme', value: '53/100' },
            { label: 'Communication theme', value: '53/100' },
            { label: 'Overall', value: '58/100' },
          ],
        }}
        labels={VAULT_READING_PRESENTATION_COPY.en}
      />,
    );
    expect(screen.queryByTestId('vault-tied-scores')).toBeNull();
    expect(screen.getByTestId('vault-reading-details').textContent).toContain('53/100');
    expect(screen.getByTestId('vault-reading-details').textContent).toContain('58/100');
  });

  it('shows a qualified tie-order message for Geography scores 54, 54, 70 with place_scope', () => {
    render(
      <VaultConfidentialReading
        lang="en"
        reading={{
          executive: 'Symbolic location comparison',
          strategic: 'Shortlist only',
          technical: '',
          headline: 'Symbolic location comparison',
          action: 'Compare the listed places',
          evidence_status: 'unvalidated',
          data_completeness: 'supplied_unverified',
          limitation: 'These comparisons cannot predict prosperity or love.',
          place_scope: 'Ranking applies only to this candidate-city shortlist. It is not a global ranking or advice to move.',
          details: [
            { label: 'Dubai', value: '54/100', reason: 'Sun-axis symbolism' },
            { label: 'Tehran', value: '54/100', reason: 'Moon theme' },
            { label: 'London', value: '70/100', reason: 'Jupiter weight' },
          ],
        }}
        labels={VAULT_READING_PRESENTATION_COPY.en}
      />,
    );
    expect(screen.getByTestId('vault-tied-scores').textContent).toBe(
      'For entries with equal scores, display order does not indicate superiority.',
    );
    expect(screen.getByTestId('vault-tied-scores').textContent).not.toMatch(/^Scores are equal/);
    expect(screen.getByTestId('vault-reading-details').textContent).toContain('54/100');
    expect(screen.getByTestId('vault-reading-details').textContent).toContain('70/100');
  });

  it('does not show a tie-order message for Geography with unique scores', () => {
    render(
      <VaultConfidentialReading
        lang="en"
        reading={{
          executive: 'Symbolic location comparison',
          strategic: 'Shortlist only',
          technical: '',
          headline: 'Symbolic location comparison',
          action: 'Compare the listed places',
          evidence_status: 'unvalidated',
          data_completeness: 'supplied_unverified',
          limitation: 'These comparisons cannot predict prosperity or love.',
          place_scope: 'Ranking applies only to this candidate-city shortlist. It is not a global ranking or advice to move.',
          details: [
            { label: 'Dubai', value: '70/100', reason: 'Sun-axis symbolism' },
            { label: 'Tehran', value: '64/100', reason: 'Moon theme' },
            { label: 'London', value: '58/100', reason: 'Jupiter weight' },
          ],
        }}
        labels={VAULT_READING_PRESENTATION_COPY.en}
      />,
    );
    expect(screen.queryByTestId('vault-tied-scores')).toBeNull();
    expect(screen.getByTestId('vault-place-shortlist').textContent).toContain('candidate-city shortlist');
  });
});

describe('style timing presentation', () => {
  it('shows accessible swatches, scent alternatives, optional accessories, and date-aware window facts', () => {
    render(
      <VaultConfidentialReading
        lang="en"
        now={new Date('2026-09-12T12:00:00Z')}
        reading={{
          executive: 'An optional outfit direction',
          strategic: 'Accessories stay optional.',
          technical: '',
          headline: 'An optional outfit direction',
          action: 'Try the pieces together',
          evidence_status: 'unvalidated',
          data_completeness: 'supplied_unverified',
          limitation: 'This is a styling prompt.',
          interpretation: 'Use the symbolic clothing and colour as a starting point. Accessories stay optional.',
          details: [
            { label: 'Symbolic meeting window', value: '23:00–00:00 · 78/100 · Europe/London', direction: 'ltr' },
            { label: 'Date', value: '2026-09-10' },
            { label: 'Palette', value: 'Stone beige · Mystery pigment' },
            { label: 'Scent notes', value: 'rose + sandalwood · iris + clean cedar' },
            { label: 'Accessory', value: 'fine chain without a pendant' },
          ],
        }}
        labels={VAULT_READING_PRESENTATION_COPY.en}
      />,
    );
    expect(screen.getAllByTestId('vault-color-swatch')).toHaveLength(1);
    expect(screen.getByTestId('vault-color-swatch').getAttribute('aria-label')).toBe('Stone beige');
    expect(screen.getByText('Stone beige')).toBeTruthy();
    expect(screen.getByText('Mystery pigment')).toBeTruthy();
    expect(screen.getByTestId('vault-color-name-fallback')).toBeTruthy();
    expect(screen.getByTestId('vault-scent-alternatives').textContent).toMatch(/alternatives to compare/);
    expect(screen.getByText('rose + sandalwood')).toBeTruthy();
    expect(screen.getByText('iris + clean cedar')).toBeTruthy();
    expect(screen.getByTestId('vault-accessory-optional').textContent).toBe('Optional');
    const when = screen.getByTestId('vault-window-when');
    expect(when.getAttribute('data-relation')).toBe('past');
    expect(when.textContent).toContain('2026-09-10 23:00–00:00 Europe/London');
    expect(when.textContent).toContain('This window has ended.');
  });

  it('does not invent a past or future label when the date is missing', () => {
    render(
      <VaultConfidentialReading
        lang="en"
        now={new Date('2026-09-12T12:00:00Z')}
        reading={{
          executive: 'Symbolic content timing',
          strategic: 'Windows are compared separately.',
          technical: '',
          headline: 'Symbolic content timing',
          action: 'Plan a small experiment',
          evidence_status: 'unvalidated',
          data_completeness: 'supplied_unverified',
          limitation: 'Scores measure symbolic timing strength.',
          details: [{ label: 'Posting', value: '23:00–00:00 · 95/100' }],
        }}
        labels={VAULT_READING_PRESENTATION_COPY.en}
      />,
    );
    const when = screen.getByTestId('vault-window-when');
    expect(when.getAttribute('data-relation')).toBe('unknown');
    expect(when.textContent).not.toMatch(/ended|in progress|has not started/);
    expect(when.textContent).not.toContain('2026-09-12');
  });

  const liveWindowReading: VaultReadingLayer = {
    executive: 'Symbolic content timing',
    strategic: 'Windows are compared separately.',
    technical: '',
    headline: 'Symbolic content timing',
    action: 'Plan a small experiment',
    evidence_status: 'unvalidated',
    data_completeness: 'supplied_unverified',
    limitation: 'Scores measure symbolic timing strength.',
    details: [
      { label: 'Posting', value: '10:00–11:00 · 80/100 · Europe/London', direction: 'ltr' },
      { label: 'Date', value: '2026-09-10' },
    ],
  };

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('crosses start and exact end on an open page without remounting', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-10T08:59:00Z'));
    render(
      <VaultConfidentialReading
        lang="en"
        reading={liveWindowReading}
        labels={VAULT_READING_PRESENTATION_COPY.en}
      />,
    );
    expect(screen.getByTestId('vault-window-when').getAttribute('data-relation')).toBe('upcoming');
    expect(screen.getByTestId('vault-window-when').textContent).toContain('This window has not started.');

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId('vault-window-when').getAttribute('data-relation')).toBe('current');
    expect(screen.getByTestId('vault-window-when').textContent).toContain('This window is in progress.');

    act(() => {
      vi.advanceTimersByTime(3_600_000);
    });
    expect(screen.getByTestId('vault-window-when').getAttribute('data-relation')).toBe('past');
    expect(screen.getByTestId('vault-window-when').textContent).toContain('This window has ended.');
  });

  it('refreshes the open-page label when the user returns to the tab', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-10T08:59:00Z'));
    render(
      <VaultConfidentialReading
        lang="en"
        reading={liveWindowReading}
        labels={VAULT_READING_PRESENTATION_COPY.en}
      />,
    );
    expect(screen.getByTestId('vault-window-when').getAttribute('data-relation')).toBe('upcoming');

    act(() => {
      vi.setSystemTime(new Date('2026-09-10T09:30:00Z'));
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(screen.getByTestId('vault-window-when').getAttribute('data-relation')).toBe('current');
    expect(screen.getByTestId('vault-window-when').textContent).toContain('This window is in progress.');
  });

  it('keeps an explicit now frozen when the live clock would otherwise move', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-10T08:59:00Z'));
    render(
      <VaultConfidentialReading
        lang="en"
        now={new Date('2026-09-10T08:59:00Z')}
        reading={liveWindowReading}
        labels={VAULT_READING_PRESENTATION_COPY.en}
      />,
    );
    expect(screen.getByTestId('vault-window-when').getAttribute('data-relation')).toBe('upcoming');
    act(() => {
      vi.advanceTimersByTime(3_660_000);
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(screen.getByTestId('vault-window-when').getAttribute('data-relation')).toBe('upcoming');
  });

  it('uses the current clock when a mounted page receives a new reading after time has elapsed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-10T08:59:00Z'));
    const { rerender } = render(
      <VaultConfidentialReading
        lang="en"
        reading={liveWindowReading}
        labels={VAULT_READING_PRESENTATION_COPY.en}
      />,
    );
    expect(screen.getByTestId('vault-window-when').getAttribute('data-relation')).toBe('upcoming');

    act(() => {
      vi.setSystemTime(new Date('2026-09-11T09:30:00Z'));
    });
    rerender(
      <VaultConfidentialReading
        lang="en"
        reading={{
          ...liveWindowReading,
          details: [
            { label: 'Posting', value: '10:00–11:00 · 80/100 · Europe/London', direction: 'ltr' },
            { label: 'Date', value: '2026-09-11' },
          ],
        }}
        labels={VAULT_READING_PRESENTATION_COPY.en}
      />,
    );
    expect(screen.getByTestId('vault-window-when').getAttribute('data-relation')).toBe('current');
    expect(screen.getByTestId('vault-window-when').textContent).toContain('2026-09-11 10:00–11:00 Europe/London');
    expect(screen.getByTestId('vault-window-when').textContent).toContain('This window is in progress.');
  });

  it('switches from an explicit frozen now back to the live clock', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-10T08:59:00Z'));
    const { rerender } = render(
      <VaultConfidentialReading
        lang="en"
        now={new Date('2026-09-10T08:59:00Z')}
        reading={liveWindowReading}
        labels={VAULT_READING_PRESENTATION_COPY.en}
      />,
    );
    expect(screen.getByTestId('vault-window-when').getAttribute('data-relation')).toBe('upcoming');

    act(() => {
      vi.setSystemTime(new Date('2026-09-10T09:30:00Z'));
    });
    rerender(
      <VaultConfidentialReading
        lang="en"
        reading={liveWindowReading}
        labels={VAULT_READING_PRESENTATION_COPY.en}
      />,
    );
    expect(screen.getByTestId('vault-window-when').getAttribute('data-relation')).toBe('current');
    expect(screen.getByTestId('vault-window-when').textContent).toContain('This window is in progress.');
  });
});
