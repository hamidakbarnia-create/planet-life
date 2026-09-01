/** Product chrome for Day Intelligence. Semantic sentences come from catalogs. */

import type { SemanticPreviewLocale } from './types';

export type DayIntelligenceChrome = {
  beta: string;
  conditions: string;
  timingStrength: string;
  supports: string;
  watch: string;
  why: string;
  safety: string;
};

export const DAY_INTELLIGENCE_CHROME: Record<
  SemanticPreviewLocale,
  DayIntelligenceChrome
> = {
  en: {
    beta: 'Decision Intelligence — Beta',
    conditions: 'Decision conditions',
    timingStrength: 'Timing strength',
    supports: 'Supports',
    watch: 'Watch',
    why: 'Why this day?',
    safety: 'Safety',
  },
  fa: {
    beta: 'هوش تصمیم — آزمایشی',
    conditions: 'شرایط تصمیم',
    timingStrength: 'قدرت زمان‌بندی',
    supports: 'پشتیبان',
    watch: 'توجه',
    why: 'چرا این روز؟',
    safety: 'ایمنی',
  },
  ar: {
    beta: 'ذكاء القرار — تجريبي',
    conditions: 'شروط القرار',
    timingStrength: 'قوة التوقيت',
    supports: 'الداعم',
    watch: 'انتبه',
    why: 'لماذا هذا اليوم؟',
    safety: 'السلامة',
  },
  ru: {
    beta: 'Интеллект решения — бета',
    conditions: 'Условия решения',
    timingStrength: 'Сила временных условий',
    supports: 'Поддержка',
    watch: 'Внимание',
    why: 'Почему этот день?',
    safety: 'Безопасность',
  },
};

export function formatTimingStrength(score: number): string {
  return `${Math.round(score)} / 100`;
}
