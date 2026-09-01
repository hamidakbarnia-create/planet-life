import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';

import { PowerBandLabel } from './PowerBandLabel';
import { PowerDistributionChart } from './PowerDistributionChart';
import { DecisionPowerLegend } from './DecisionPowerLegend';
import { formatPowerBandLabel } from '@/lib/calendar-page-i18n';
import {
  POWER_BAND_ORDER,
  POWER_BAND_RANGES,
} from '@/lib/calendar-power-presentation';

afterEach(() => {
  cleanup();
});

const SAMPLE_SCORES = {
  '2026-09-01': 90,
  '2026-09-02': 75,
  '2026-09-03': 55,
  '2026-09-04': 20,
};

function isolatedRange(container: HTMLElement, band: string) {
  const label = container.querySelector(`[data-power-band-label="${band}"]`);
  expect(label).toBeTruthy();
  const isolate = label?.querySelector('bdi');
  expect(isolate).toBeTruthy();
  return isolate as HTMLElement;
}

describe('PowerBandLabel BiDi isolation', () => {
  it('isolates Persian 85–100 as LTR min-to-max inside RTL', () => {
    const { container } = render(
      <div dir="rtl">
        <PowerBandLabel lang="fa" band="excellent" />
      </div>
    );
    const isolate = isolatedRange(container, 'excellent');
    expect(isolate.getAttribute('dir')).toBe('ltr');
    expect(isolate.tagName.toLowerCase()).toBe('bdi');
    expect(isolate.textContent).toBe('۸۵–۱۰۰');
    expect(isolate.textContent).not.toBe('۱۰۰–۸۵');
    expect(container.textContent).toBe('عالی (۸۵–۱۰۰)');
  });

  it('isolates Arabic 85–100 as LTR min-to-max inside RTL', () => {
    const { container } = render(
      <div dir="rtl">
        <PowerBandLabel lang="ar" band="excellent" />
      </div>
    );
    const isolate = isolatedRange(container, 'excellent');
    expect(isolate.getAttribute('dir')).toBe('ltr');
    expect(isolate.textContent).toBe('85–100');
    expect(isolate.textContent).not.toBe('100–85');
    expect(container.textContent).toBe('ممتاز (85–100)');
  });

  it('keeps every band min-to-max in both LTR and RTL parents', () => {
    for (const dir of ['ltr', 'rtl'] as const) {
      for (const lang of ['en', 'fa', 'ar', 'ru'] as const) {
        for (const band of POWER_BAND_ORDER) {
          const { container } = render(
            <div dir={dir}>
              <PowerBandLabel lang={lang} band={band} />
            </div>
          );
          const isolate = isolatedRange(container, band);
          const logical = isolate.textContent ?? '';
          expect(logical.indexOf('–')).toBeGreaterThan(0);
          if (lang === 'en' || lang === 'ru' || lang === 'ar') {
            const { min, max } = POWER_BAND_RANGES[band];
            const [left, right] = logical.split('–');
            expect(left).toBe(String(min));
            expect(right).toBe(String(max));
          }
          expect(container.textContent).toBe(formatPowerBandLabel(lang, band));
          expect(container.textContent).not.toMatch(/powerBand|insight\.|{range}/);
          cleanup();
        }
      }
    }
  });

  it('preserves accessible min-to-max order in the distribution list and legend', () => {
    const { container: chart } = render(
      <PowerDistributionChart lang="fa" scores={SAMPLE_SCORES} />
    );
    const excellent = chart.querySelector(
      '[data-power-band-row="excellent"]'
    );
    expect(excellent?.textContent).toContain('عالی (۸۵–۱۰۰)');
    expect(excellent?.textContent).not.toContain('۱۰۰–۸۵');
    expect(excellent?.querySelector('bdi')?.getAttribute('dir')).toBe('ltr');

    const { container: legend } = render(
      <DecisionPowerLegend lang="fa" />
    );
    expect(legend.textContent).toContain('عالی (۸۵–۱۰۰)');
    expect(legend.textContent).toContain('خوب (۷۰–۸۴)');
    expect(legend.textContent).toContain('متوسط (۵۰–۶۹)');
    expect(legend.textContent).toContain('پایین (۰–۴۹)');
    expect(legend.textContent).not.toContain('۱۰۰–۸۵');
  });

  it('does not add per-language conditionals in chart markup', () => {
    const { container } = render(
      <PowerDistributionChart lang="ar" scores={SAMPLE_SCORES} />
    );
    expect(container.querySelector('[data-power-band-list]')).toBeTruthy();
    expect(container.textContent).not.toContain('insight.excellent');
    expect(container.textContent).toContain('ممتاز (85–100)');
  });
});
