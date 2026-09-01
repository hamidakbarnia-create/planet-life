import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { TimingStrengthText } from './TimingStrengthText';
import { CalendarSelectedDayInsight } from '@/components/calendar/CalendarSelectedDayInsight';
import { DayIntelligencePanel } from '@/components/decision-intelligence/DayIntelligencePanel';
import { EvaluateProductResult } from '@/components/decision-case/EvaluateProductResult';
import { CALENDAR_PAGE_LANGS } from '@/lib/calendar-page-i18n';
import { getAskProductCopy, buildEvaluatePresentation } from '@/lib/ask-product';
import { bindDemoStubPackage } from '@/lib/decision-case';
import { formatTimingStrength } from '@/lib/decision-intelligence/product-copy';
import { buildDayIntelligenceView } from '@/lib/decision-intelligence/day-intelligence-view';
import { PREVIEW_MATRIX } from '@/lib/decision-intelligence/preview-fixtures';

afterEach(() => {
  cleanup();
});

function labelsFor(lang: 'en' | 'fa' | 'ar' | 'ru') {
  const t = CALENDAR_PAGE_LANGS[lang];
  return {
    dir: t.dir,
    loading: t.loading,
    whyTiming: t.whyTiming,
    whyTimingFallback: t.whyTimingFallback,
    supportingReasons: t.supportingReasons,
    seeDetails: t.seeDetails,
    hideDetails: t.hideDetails,
    advancedDetails: t.advancedDetails,
    transit: t.transit,
    signs: t.signs,
    planets: t.planets,
  };
}

function runtimePkg(score = 66) {
  const base = bindDemoStubPackage({
    caseId: '11111111-1111-4111-8111-111111111111',
    caseVersion: 1,
    intake: { target_date: '2026-09-01', role: 'Engineer' },
  });
  return {
    ...base,
    engine_id: 'decision-engine-car-interview-v1',
    timing: {
      ...base.timing,
      score,
      candidates: base.timing.candidates.map((c, i) =>
        i === 0 ? { ...c, score, date: '2026-09-01' } : c
      ),
    },
    confidence: { value: 70, precision_level: 'L3' as const, penalties: [] },
  };
}

function isolatedFraction(root: HTMLElement | Element) {
  const isolate = root.querySelector('bdi[data-ltr-numeric="fraction"]');
  expect(isolate).toBeTruthy();
  expect(isolate?.getAttribute('dir')).toBe('ltr');
  expect(isolate?.tagName.toLowerCase()).toBe('bdi');
  return isolate as HTMLElement;
}

describe('Timing strength fraction BiDi isolation', () => {
  it('keeps logical score → maximum formatting', () => {
    expect(formatTimingStrength(66)).toBe('66 / 100');
    expect(formatTimingStrength(66)).not.toBe('100 / 66');
  });

  it('isolates FA/AR 66 / 100 as LTR inside RTL', () => {
    for (const formatted of ['66 / 100', getAskProductCopy('fa').timingScoreOf(66), getAskProductCopy('ar').timingScoreOf(66)]) {
      const { container } = render(
        <div dir="rtl">
          <TimingStrengthText formatted={formatted} />
        </div>
      );
      const isolate = isolatedFraction(container);
      expect(isolate.textContent).toMatch(/66 \/ 100|۶۶ \/ ۱۰۰|٦٦ \/ ١٠٠/);
      expect(isolate.textContent?.indexOf('66') === 0 || isolate.textContent?.startsWith('۶۶') || isolate.textContent?.startsWith('٦٦')).toBe(true);
      expect(container.textContent).not.toMatch(/100 \/ 66|۱۰۰ \/ ۶۶|١٠٠ \/ ٦٦/);
      cleanup();
    }
  });

  it('keeps Calendar selected-day FA/AR accessible order and isolation', () => {
    for (const lang of ['fa', 'ar'] as const) {
      render(
        <div dir="rtl">
          <CalendarSelectedDayInsight
            lang={lang}
            labels={labelsFor(lang)}
            reasoning={null}
            transit={[]}
            transitMeta={{}}
            loadingTransit={false}
            score={66}
            dateLabel="2026-09-01"
          />
        </div>
      );
      const row = screen.getByTestId('calendar-selected-timing-strength');
      const isolate = isolatedFraction(row);
      expect(isolate.textContent).toBe('66 / 100');
      expect(row.textContent).toContain('66 / 100');
      expect(row.textContent).not.toContain('100 / 66');
      expect(row.textContent?.indexOf('66')).toBeLessThan(
        row.textContent?.indexOf('100') ?? -1
      );
      cleanup();
    }
  });

  it('keeps DayIntelligencePanel EN/RU and FA/AR score → maximum', () => {
    for (const locale of ['en', 'ru', 'fa', 'ar'] as const) {
      const view = buildDayIntelligenceView({
        explanation: PREVIEW_MATRIX.strongSelective,
        locale,
        score: 66,
        posture: 'selective',
      });
      expect(view?.timingStrengthValue).toBe('66 / 100');
      const { container } = render(<DayIntelligencePanel view={view!} />);
      const score = screen.getByTestId('day-intelligence-score');
      const isolate = isolatedFraction(score);
      expect(isolate.textContent).toBe('66 / 100');
      expect(score.textContent).toContain('66 / 100');
      expect(score.textContent).not.toContain('100 / 66');
      expect(container.textContent).not.toMatch(/powerBand|insight\./);
      cleanup();
    }
  });

  it('isolates Evaluate timing-score fraction without changing copy semantics', () => {
    for (const lang of ['en', 'fa', 'ar', 'ru'] as const) {
      const copy = getAskProductCopy(lang);
      const model = buildEvaluatePresentation(runtimePkg(66), lang);
      render(<EvaluateProductResult lang={lang} model={model!} />);
      const score = screen.getByTestId('result-score');
      expect(score.textContent).toBe(copy.timingScoreOf(66));
      const isolate = isolatedFraction(score);
      expect(isolate.textContent).toMatch(/66 \/ 100|۶۶ \/ ۱۰۰|٦٦ \/ ١٠٠/);
      expect(score.textContent).not.toMatch(/100 \/ 66|۱۰۰ \/ ۶۶|١٠٠ \/ ٦٦/);
      cleanup();
    }
  });
});
