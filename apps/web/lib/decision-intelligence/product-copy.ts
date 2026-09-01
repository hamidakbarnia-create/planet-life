/** Product chrome for Day Intelligence. Semantic sentences come from catalogs. */

import type { SemanticPreviewLocale } from './types';

export type ConditionsKind =
  | 'supportive'
  | 'mixed'
  | 'cautionary'
  | 'insufficient';

export type DayIntelligenceChrome = {
  beta: string;
  conditions: string;
  timingStrength: string;
  supports: string;
  watch: string;
  why: string;
  safety: string;
  conditionsKinds: Record<ConditionsKind, string>;
  mixedBridge: string;
  conflictNamed: string;
  conflictGeneric: string;
  dimensionNames: Record<string, string>;
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
    conditionsKinds: {
      supportive: 'Supportive',
      mixed: 'Mixed',
      cautionary: 'Cautionary',
      insufficient: 'Insufficient information',
    },
    mixedBridge:
      'The score is timing strength. Mixed means support and caution are both present — not that the number is wrong.',
    conflictNamed: '{factor} both supports and cautions.',
    conflictGeneric: 'Some influences create both opportunity and risk.',
    dimensionNames: {
      opportunity: 'Opportunity',
      momentum: 'Momentum',
      clarity: 'Decision clarity',
      stability: 'Stability',
      cooperation: 'Cooperation',
      pressure: 'Pressure',
      reversibility_safety: 'Reversibility',
    },
  },
  fa: {
    beta: 'هوش تصمیم — آزمایشی',
    conditions: 'شرایط تصمیم',
    timingStrength: 'قدرت زمان‌بندی',
    supports: 'پشتیبان',
    watch: 'توجه',
    why: 'چرا این روز؟',
    safety: 'ایمنی',
    conditionsKinds: {
      supportive: 'پشتیبان',
      mixed: 'مختلط',
      cautionary: 'احتیاطی',
      insufficient: 'اطلاعات ناکافی',
    },
    mixedBridge:
      'امتیاز، قدرت زمان‌بندی است. مختلط یعنی هم حمایت هست و هم احتیاط — نه اینکه عدد غلط باشد.',
    conflictNamed: '{factor} هم پشتیبان است و هم هشدار.',
    conflictGeneric: 'برخی اثرها هم فرصت می‌سازند و هم ریسک.',
    dimensionNames: {
      opportunity: 'فرصت',
      momentum: 'شتاب',
      clarity: 'وضوح تصمیم',
      stability: 'پایداری',
      cooperation: 'همکاری',
      pressure: 'فشار',
      reversibility_safety: 'برگشت‌پذیری',
    },
  },
  ar: {
    beta: 'ذكاء القرار — تجريبي',
    conditions: 'شروط القرار',
    timingStrength: 'قوة التوقيت',
    supports: 'الداعم',
    watch: 'انتبه',
    why: 'لماذا هذا اليوم؟',
    safety: 'السلامة',
    conditionsKinds: {
      supportive: 'داعمة',
      mixed: 'مختلطة',
      cautionary: 'تحذيرية',
      insufficient: 'معلومات غير كافية',
    },
    mixedBridge:
      'الدرجة هي قوة التوقيت. مختلط يعني وجود دعم وتحذير معاً — وليس أن الرقم خطأ.',
    conflictNamed: '{factor} يدعم ويحذّر في الوقت نفسه.',
    conflictGeneric: 'بعض التأثيرات تخلق فرصة ومخاطرة معاً.',
    dimensionNames: {
      opportunity: 'الفرصة',
      momentum: 'الزخم',
      clarity: 'وضوح القرار',
      stability: 'الاستقرار',
      cooperation: 'التعاون',
      pressure: 'الضغط',
      reversibility_safety: 'قابلية التراجع',
    },
  },
  ru: {
    beta: 'Интеллект решения — бета',
    conditions: 'Условия решения',
    timingStrength: 'Сила временных условий',
    supports: 'Поддержка',
    watch: 'Внимание',
    why: 'Почему этот день?',
    safety: 'Безопасность',
    conditionsKinds: {
      supportive: 'Поддерживающие',
      mixed: 'Смешанные',
      cautionary: 'Осторожные',
      insufficient: 'Недостаточно данных',
    },
    mixedBridge:
      'Оценка — сила тайминга. Смешанные условия значат, что есть и поддержка, и осторожность — не то, что число неверно.',
    conflictNamed: '{factor} и поддерживает, и предостерегает.',
    conflictGeneric: 'Некоторые влияния создают и возможность, и риск.',
    dimensionNames: {
      opportunity: 'возможность',
      momentum: 'импульс',
      clarity: 'ясность решения',
      stability: 'устойчивость',
      cooperation: 'сотрудничество',
      pressure: 'давление',
      reversibility_safety: 'обратимость',
    },
  },
};

export function formatTimingStrength(score: number): string {
  return `${Math.round(score)} / 100`;
}

const PREFIXED_NUMERIC_SEQUENCE =
  /[\d۰-۹٠-٩]+(?:\s*[–\/]\s*[\d۰-۹٠-٩]+)+/u;

/** Splits a localized prefix from a numeric interval or fraction. */
export function splitPrefixedNumericSequence(value: string): {
  prefix: string;
  sequence: string;
} {
  const match = value.match(PREFIXED_NUMERIC_SEQUENCE);
  if (!match || match.index == null) {
    return { prefix: '', sequence: value };
  }
  return {
    prefix: value.slice(0, match.index),
    sequence: value.slice(match.index),
  };
}

const FORWARD = new Set(['high_leverage', 'action', 'build', 'selective']);
const RESTRICTIVE = new Set(['defensive', 'recovery', 'review']);

export function conditionsKindFromPosture(
  posture: string | null | undefined
): ConditionsKind | null {
  if (!posture) return null;
  if (posture === 'mixed') return 'mixed';
  if (posture === 'insufficient') return 'insufficient';
  if (FORWARD.has(posture)) return 'supportive';
  if (RESTRICTIVE.has(posture)) return 'cautionary';
  return null;
}

const KNOWN_DIMENSIONS = new Set([
  'opportunity',
  'momentum',
  'clarity',
  'stability',
  'cooperation',
  'pressure',
  'reversibility_safety',
]);

export function namedConflictCopy(
  locale: SemanticPreviewLocale,
  dimensionIds: readonly string[]
): string | null {
  const known = dimensionIds.filter((id) => KNOWN_DIMENSIONS.has(id));
  if (known.length !== 1) return null;
  const chrome = DAY_INTELLIGENCE_CHROME[locale];
  const factor = chrome.dimensionNames[known[0]];
  if (!factor) return null;
  return chrome.conflictNamed.replace('{factor}', factor);
}
