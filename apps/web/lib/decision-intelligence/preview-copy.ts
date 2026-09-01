/** Debug chrome only. Semantic sentences come from the catalog renderer. */

import type { SemanticPreviewLocale } from './types';

export type PreviewChrome = {
  experimental: string;
  notForRanking: string;
  legacyUnchanged: string;
  timingNotProbability: string;
  currentResult: string;
  experimentalDi: string;
  score: string;
  posture: string;
  headline: string;
  summary: string;
  opportunity: string;
  postureMessage: string;
  tradeoff: string;
  supports: string;
  cautions: string;
  safety: string;
  policy: string;
  risk: string;
  debugDetails: string;
  unavailable: string;
  localeLabel: string;
  windowPolicy: string;
  daySequence: string;
};

export const PREVIEW_CHROME: Record<SemanticPreviewLocale, PreviewChrome> = {
  en: {
    experimental: 'EXPERIMENTAL / SHADOW',
    notForRanking: 'Not used for ranking',
    legacyUnchanged: 'Legacy ranking unchanged.',
    timingNotProbability: 'Timing strength is not probability of success.',
    currentResult: 'Current result',
    experimentalDi: 'Experimental Decision Intelligence',
    score: 'Executive score',
    posture: 'v3 posture',
    headline: 'Headline',
    summary: 'Summary',
    opportunity: 'Opportunity',
    postureMessage: 'Posture',
    tradeoff: 'Trade-off',
    supports: 'Supports',
    cautions: 'Cautions',
    safety: 'Safety',
    policy: 'Policy relation',
    risk: 'Risk level',
    debugDetails: 'Debug details',
    unavailable: 'Semantic preview unavailable',
    localeLabel: 'Preview locale',
    windowPolicy: 'Window policy',
    daySequence: 'Day posture sequence',
  },
  fa: {
    experimental: 'آزمایشی / سایه',
    notForRanking: 'در رتبه‌بندی فعلی استفاده نمی‌شود',
    legacyUnchanged: 'رتبه‌بندی فعلی بدون تغییر است.',
    timingNotProbability: 'قدرت زمان‌بندی احتمال موفقیت نیست.',
    currentResult: 'نتیجه فعلی',
    experimentalDi: 'هوش تصمیم آزمایشی',
    score: 'امتیاز اجرایی',
    posture: 'وضعیت v3',
    headline: 'عنوان',
    summary: 'خلاصه',
    opportunity: 'فرصت',
    postureMessage: 'وضعیت اجرا',
    tradeoff: 'بده‌بستان',
    supports: 'پشتیبان',
    cautions: 'هشدار',
    safety: 'ایمنی',
    policy: 'رابطه سیاست',
    risk: 'سطح ریسک',
    debugDetails: 'جزئیات اشکال‌زدایی',
    unavailable: 'پیش‌نمایش معنایی در دسترس نیست',
    localeLabel: 'زبان پیش‌نمایش',
    windowPolicy: 'سیاست بازه',
    daySequence: 'ترتیب وضعیت روزها',
  },
  ar: {
    experimental: 'تجريبي / ظل',
    notForRanking: 'لا يُستخدم للترتيب',
    legacyUnchanged: 'الترتيب الحالي دون تغيير.',
    timingNotProbability: 'قوة التوقيت ليست احتمال نجاح.',
    currentResult: 'النتيجة الحالية',
    experimentalDi: 'ذكاء القرار التجريبي',
    score: 'الدرجة التنفيذية',
    posture: 'وضعية v3',
    headline: 'العنوان',
    summary: 'الملخص',
    opportunity: 'الفرصة',
    postureMessage: 'وضع التنفيذ',
    tradeoff: 'المقايضة',
    supports: 'الداعم',
    cautions: 'التحذير',
    safety: 'السلامة',
    policy: 'علاقة السياسة',
    risk: 'مستوى المخاطر',
    debugDetails: 'تفاصيل التصحيح',
    unavailable: 'معاينة دلالية غير متاحة',
    localeLabel: 'لغة المعاينة',
    windowPolicy: 'سياسة الفترة',
    daySequence: 'تسلسل وضع الأيام',
  },
  ru: {
    experimental: 'ЭКСПЕРИМЕНТ / ТЕНЬ',
    notForRanking: 'Не используется для ранжирования',
    legacyUnchanged: 'Текущий рейтинг без изменений.',
    timingNotProbability: 'Сила временных условий — не вероятность успеха.',
    currentResult: 'Текущий результат',
    experimentalDi: 'Экспериментальный интеллект решения',
    score: 'Исполнительный балл',
    posture: 'Позиция v3',
    headline: 'Заголовок',
    summary: 'Кратко',
    opportunity: 'Возможность',
    postureMessage: 'Исполнение',
    tradeoff: 'Компромисс',
    supports: 'Поддержка',
    cautions: 'Предостережения',
    safety: 'Безопасность',
    policy: 'Отношение политики',
    risk: 'Уровень риска',
    debugDetails: 'Отладка',
    unavailable: 'Семантический предпросмотр недоступен',
    localeLabel: 'Язык предпросмотра',
    windowPolicy: 'Политика окна',
    daySequence: 'Последовательность позиций дней',
  },
};
