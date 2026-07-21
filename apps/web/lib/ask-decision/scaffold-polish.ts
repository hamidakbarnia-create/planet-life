/**
 * Narrow polish for known mechanical scaffolds in analysis / assumptions /
 * score rationales. Does not freely rewrite arbitrary provider prose.
 */

import type { AppLang } from '@/lib/app-settings';

type LocaleMap = Partial<Record<'en' | 'fa' | 'ar' | 'ru', string>>;

/** Exact or contained mechanical phrases → natural locale variants. */
const SCAFFOLD_ENTRIES: Array<{ match: RegExp; map: LocaleMap }> = [
  {
    match: /Primary concern not fully stated/gi,
    map: {
      en: 'the main worry is still unclear',
      fa: 'هنوز نگفته‌اید از چه می‌ترسید',
      ar: 'ما زال القلق الأساسي غير واضح',
      ru: 'главное опасение всё ещё неясно',
    },
  },
  {
    match: /Main concern not fully stated/gi,
    map: {
      en: 'the main worry is still unclear',
      fa: 'هنوز نگرانی اصلی روشن نیست',
      ar: 'ما زال القلق الأساسي غير واضح',
      ru: 'главное опасение всё ещё неясно',
    },
  },
  {
    match: /القلق الرئيسي غير مذكور بالكامل/g,
    map: {
      ar: 'ما زال القلق الأساسي غير واضح',
      fa: 'هنوز نگفته‌اید از چه می‌ترسید',
      en: 'the main concern is still unclear',
      ru: 'главное опасение всё ещё неясно',
    },
  },
  {
    match: /Основная озабоченность указана не полностью/g,
    map: {
      ru: 'главное опасение всё ещё неясно',
      en: 'the main concern is still unclear',
      fa: 'هنوز نگفته‌اید از چه می‌ترسید',
      ar: 'ما زال القلق الأساسي غير واضح',
    },
  },
  {
    match: /Time horizon not stated/gi,
    map: {
      en: 'the timing window is still unclear',
      fa: 'هنوز زمان دقیق مشخص نیست',
      ar: 'الأفق الزمني ما زال غير واضح',
      ru: 'временной горизонт всё ещё неясен',
    },
  },
  {
    match: /Explicit options not stated/gi,
    map: {
      en: 'concrete options are still missing',
      fa: 'گزینه‌های روشن هنوز معلوم نیست',
      ar: 'الخيارات الواضحة ما زالت ناقصة',
      ru: 'явные варианты всё ещё не указаны',
    },
  },
  {
    match: /الخيارات الصريحة غير مذكورة/g,
    map: {
      ar: 'الخيارات الواضحة ما زالت ناقصة',
    },
  },
  {
    match: /Явные варианты не указаны/g,
    map: {
      ru: 'явные варианты всё ещё не указаны',
    },
  },
  {
    match: /Unknown — reversibility not stated/gi,
    map: {
      en: 'how reversible this is still unclear',
      fa: 'هنوز معلوم نیست چقدر قابل‌برگشت است',
      ar: 'مدى قابلية الرجوع ما زال غير واضح',
      ru: 'насколько это обратимо — всё ещё неясно',
    },
  },
  {
    match: /غير معروف — قابلية الرجوع غير مذكورة/g,
    map: {
      ar: 'مدى قابلية الرجوع ما زال غير واضح',
    },
  },
  {
    match: /Неизвестно — обратимость не указана/g,
    map: {
      ru: 'насколько это обратимо — всё ещё неясно',
    },
  },
  {
    match: /Identify the highest-leverage next move for the stated question/gi,
    map: {
      en: 'find the highest-leverage next step for this question',
      fa: 'پیدا کردن بهترین گام بعدی برای این سؤال',
      ar: 'تحديد الخطوة التالية الأكثر تأثيراً لهذا السؤال',
      ru: 'найти наиболее эффективный следующий шаг по этому вопросу',
    },
  },
  {
    match: /Primary concern:\s*/gi,
    map: {
      en: 'Main risk: ',
      fa: 'اصلی‌ترین ریسک: ',
      ar: 'أهم مخاطرة: ',
      ru: 'Главный риск: ',
    },
  },
  {
    match: /Objective:\s*/gi,
    map: {
      en: 'Goal: ',
      fa: 'هدفتان: ',
      ar: 'هدفك: ',
      ru: 'Цель: ',
    },
  },
  {
    match: /Concern:\s*/gi,
    map: {
      en: 'Watchpoint: ',
      fa: 'دغدغه‌تان: ',
      ar: 'قلقك: ',
      ru: 'Опасение: ',
    },
  },
  {
    match: /Reversibility:\s*/gi,
    map: {
      en: 'Reversibility: ',
      fa: 'میزان برگشت‌پذیری: ',
      ar: 'قابلية الرجوع: ',
      ru: 'Обратимость: ',
    },
  },
  {
    match: /Unknowns:\s*/gi,
    map: {
      en: 'Still open: ',
      fa: 'چیزهایی که هنوز روشن نیست: ',
      ar: 'ما لم يتضح بعد: ',
      ru: 'Что ещё неясно: ',
    },
  },
];

/**
 * Replace only recognized mechanical scaffolds. Leaves other prose untouched.
 */
export function polishMechanicalScaffolds(
  text: string,
  locale: AppLang
): string {
  if (!text.trim()) return text;
  let out = text;
  for (const entry of SCAFFOLD_ENTRIES) {
    const replacement = entry.map[locale] ?? entry.map.en;
    if (!replacement) continue;
    out = out.replace(entry.match, replacement);
  }
  return out;
}
