import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';

import {
  formatHourWindow,
  SelectedDayInsightPanel,
} from './SelectedDayInsightPanel';
import { CALENDAR_PAGE_LANGS } from '@/lib/calendar-page-i18n';
import type { HourScore } from '@/lib/calendar-scores';

afterEach(() => {
  cleanup();
});

function hour(hour: number, score: number, band: HourScore['band']): HourScore {
  return {
    hour,
    time: `${String(hour).padStart(2, '0')}:00`,
    score,
    band,
  };
}

function renderWindows(lang: 'en' | 'fa' | 'ar' | 'ru') {
  return render(
    <div dir={CALENDAR_PAGE_LANGS[lang].dir}>
      <SelectedDayInsightPanel
        lang={lang}
        dateLabel="2026-09-01"
        bestHour={hour(4, 80, 'green')}
        riskHour={hour(22, 20, 'red')}
        loading={false}
        loadingLabel={CALENDAR_PAGE_LANGS[lang].loading}
      />
    </div>
  );
}

function isolatedWindow(root: Element, testId: string) {
  const row = root.querySelector(`[${testId}]`);
  expect(row).toBeTruthy();
  const isolate = row?.querySelector('bdi[data-ltr-numeric="interval"]');
  expect(isolate).toBeTruthy();
  expect(isolate?.getAttribute('dir')).toBe('ltr');
  return isolate as HTMLElement;
}

describe('Hourly Best/Risk BiDi isolation', () => {
  it('keeps FA/AR intervals start → end', () => {
    expect(formatHourWindow(4, 'fa')).toBe('04:00 – 05:00');
    expect(formatHourWindow(22, 'fa')).toBe('22:00 – 23:00');
    expect(formatHourWindow(4, 'ar')).toBe('04:00 – 05:00');
    expect(formatHourWindow(22, 'ar')).toBe('22:00 – 23:00');
    expect(formatHourWindow(4, 'fa')).not.toBe('05:00 – 04:00');
    expect(formatHourWindow(22, 'fa')).not.toBe('23:00 – 22:00');
  });

  it('keeps EN 12-hour and RU 24-hour intervals unchanged', () => {
    expect(formatHourWindow(4, 'en')).toBe('4:00 AM – 5:00 AM');
    expect(formatHourWindow(16, 'en')).toBe('4:00 PM – 5:00 PM');
    expect(formatHourWindow(22, 'en')).toBe('10:00 PM – 11:00 PM');
    expect(formatHourWindow(4, 'ru')).toBe('04:00 – 05:00');
    expect(formatHourWindow(22, 'ru')).toBe('22:00 – 23:00');
  });

  it('isolates the complete FA interval as LTR in markup', () => {
    const { container } = renderWindows('fa');
    const best = isolatedWindow(container, 'data-insight-best-window');
    const risk = isolatedWindow(container, 'data-insight-risk-window');
    expect(best.textContent).toBe('04:00 – 05:00');
    expect(risk.textContent).toBe('22:00 – 23:00');
    expect(container.textContent).toContain('04:00 – 05:00');
    expect(container.textContent).toContain('22:00 – 23:00');
    expect(container.textContent).not.toContain('05:00 – 04:00');
    expect(container.textContent).not.toContain('23:00 – 22:00');
  });

  it('isolates the complete AR interval as LTR in markup', () => {
    const { container } = renderWindows('ar');
    expect(
      isolatedWindow(container, 'data-insight-best-window').textContent
    ).toBe('04:00 – 05:00');
    expect(
      isolatedWindow(container, 'data-insight-risk-window').textContent
    ).toBe('22:00 – 23:00');
  });

  it('keeps EN/RU accessible text and isolation without changing values', () => {
    const en = renderWindows('en');
    expect(
      isolatedWindow(en.container, 'data-insight-best-window').textContent
    ).toBe('4:00 AM – 5:00 AM');
    expect(
      isolatedWindow(en.container, 'data-insight-risk-window').textContent
    ).toBe('10:00 PM – 11:00 PM');
    cleanup();

    const ru = renderWindows('ru');
    expect(
      isolatedWindow(ru.container, 'data-insight-best-window').textContent
    ).toBe('04:00 – 05:00');
    expect(
      isolatedWindow(ru.container, 'data-insight-risk-window').textContent
    ).toBe('22:00 – 23:00');
  });

  it('does not reverse start/end in the formatter', () => {
    const source = readFileSync(
      resolve(__dirname, './SelectedDayInsightPanel.tsx'),
      'utf8'
    );
    expect(source).toContain('${start} – ${end}');
    expect(source).not.toContain('${end} – ${start}');
    expect(source).not.toMatch(/\\u202[a-eA-E]|\\u206[6-9]|\\u200[eE]|\\u200[fF]/);
  });
});
