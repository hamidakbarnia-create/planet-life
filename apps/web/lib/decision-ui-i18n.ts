/**
 * Ask Decision Intelligence UI labels + enum/value localization.
 * Internal keys (kebab-case statuses, intents, bands) must never render raw.
 */

import type { AppLang } from './app-settings';
import type {
  ActionPriority,
  AskIntent,
  ConfidenceLevel,
  LikelihoodBand,
  RecommendationStatus,
  TimeHorizon,
  UrgencyLevel,
} from './ask-decision/types';

export type DecisionUiCopy = {
  dir: 'ltr' | 'rtl';
  loadingStages: [string, string, string, string];
  clarificationTitle: string;
  yourAnswer: string;
  continueAnalysis: string;
  continueWithAssumptions: string;
  errorTitle: string;
  retry: string;
  retryFull: string;
  profileHint: string;
  analysis: string;
  scenarios: string;
  bestCase: string;
  mostLikely: string;
  downside: string;
  mitigation: string;
  alternatives: string;
  bestFor: string;
  risk: string;
  assumptionsGaps: string;
  recommendation: string;
  confidence: string;
  actionPlan: string;
  now: string;
  next7Days: string;
  next30Days: string;
  scores: string;
  opportunity: string;
  timing: string;
  readiness: string;
  timingSection: string;
  timingNotApplicable: string;
  timingUnavailable: string;
  today: string;
  bestWindow: string;
  caution: string;
  relatedModules: string;
  followUpQuestions: string;
  urgency: string;
  horizon: string;
  outOf100: string;
  recommendationStatusAria: string;
  askIntro: string;
  decisionStyle: string;
  detectedIntent: string;
  examplePrompts: string[];
  briefingError: string;
  sectionTitles: Record<string, string>;
};

const SECTION_TITLES_EN: Record<string, string> = {
  situation: 'Situation',
  factors: 'Main Factors',
  opportunities: 'Opportunities',
  risks: 'Risks',
  tradeoffs: 'Trade-offs',
  'personal-fit': 'Personal Fit',
    'what-could-change': 'What would make this more precise',
    why: 'Why?',
};

const SECTION_TITLES_FA: Record<string, string> = {
  situation: 'وضعیت',
  factors: 'عوامل اصلی',
  opportunities: 'فرصت‌ها',
  risks: 'ریسک‌ها',
  tradeoffs: 'بده‌بستان‌ها',
  'personal-fit': 'تناسب شخصی',
    'what-could-change': 'چه اطلاعاتی پاسخ را دقیق‌تر می‌کند؟',
    why: 'چرا؟',
};

const SECTION_TITLES_RU: Record<string, string> = {
  situation: 'Ситуация',
  factors: 'Главные факторы',
  opportunities: 'Возможности',
  risks: 'Риски',
  tradeoffs: 'Компромиссы',
  'personal-fit': 'Личное соответствие',
    'what-could-change': 'Какая информация сделает ответ точнее?',
    why: 'Почему?',
};

const SECTION_TITLES_AR: Record<string, string> = {
  situation: 'الوضع',
  factors: 'العوامل الرئيسية',
  opportunities: 'الفرص',
  risks: 'المخاطر',
  tradeoffs: 'المقايضات',
  'personal-fit': 'الملاءمة الشخصية',
    'what-could-change': 'ما المعلومات التي تجعل الإجابة أدق؟',
    why: 'لماذا؟',
};

export const DECISION_UI: Record<AppLang, DecisionUiCopy> = {
  en: {
    dir: 'ltr',
    loadingStages: [
      'Framing your decision',
      'Applying your intelligence profile',
      'Checking timing context',
      'Building your recommendation',
    ],
    clarificationTitle: 'One clarification',
    yourAnswer: 'Your answer',
    continueAnalysis: 'Continue analysis',
    continueWithAssumptions: 'Continue with assumptions',
    errorTitle: 'Decision briefing unavailable',
    retry: 'Retry',
    retryFull: 'Retry full briefing',
    profileHint:
      'Complete your profile to improve personalisation — Ask still works without it.',
    analysis: 'Analysis',
    scenarios: 'Scenarios',
    bestCase: 'Best case',
    mostLikely: 'Most likely',
    downside: 'Downside',
    mitigation: 'Mitigation',
    alternatives: 'Alternatives',
    bestFor: 'Best for',
    risk: 'Risk',
    assumptionsGaps: 'Assumptions & gaps',
    recommendation: 'Recommendation',
    confidence: 'Confidence',
    actionPlan: 'Action plan',
    now: 'Before you act',
    next7Days: 'Next 7 days',
    next30Days: 'Next 30 days',
    scores: 'Scores',
    opportunity: 'Opportunity',
    timing: 'Timing',
    readiness: 'Readiness',
    timingSection: 'Timing',
    timingNotApplicable: 'Not applicable for this question.',
    timingUnavailable: 'Timing data unavailable.',
    today: 'Today',
    bestWindow: 'Best window',
    caution: 'Caution',
    relatedModules: 'Related modules',
    followUpQuestions: 'Follow-up questions',
    urgency: 'Urgency',
    horizon: 'Horizon',
    outOf100: 'out of 100',
    recommendationStatusAria: 'Recommendation status',
    askIntro:
      'Ask turns your question into structured decision intelligence — recommendation, scores, timing, and next actions.',
    decisionStyle: 'Decision style',
    detectedIntent: 'Detected intent',
    examplePrompts: [
      'Should I accept this job offer?',
      'Is this a good week to negotiate?',
      'Should I wait before launching?',
      'How should I handle this relationship conflict?',
      'Is moving now better than waiting?',
      'What should I prioritise this month?',
    ],
    briefingError:
      'The decision briefing could not be completed. Your question is preserved — retry when ready.',
    sectionTitles: SECTION_TITLES_EN,
  },
  fa: {
    dir: 'rtl',
    loadingStages: [
      'در حال چارچوب‌بندی تصمیم شما',
      'اعمال پروفایل هوش شخصی',
      'بررسی بافت زمانی',
      'ساخت توصیه شما',
    ],
    clarificationTitle: 'یک توضیح تکمیلی',
    yourAnswer: 'پاسخ شما',
    continueAnalysis: 'ادامه تحلیل',
    continueWithAssumptions: 'ادامه با فرضیات',
    errorTitle: 'خلاصه تصمیم در دسترس نیست',
    retry: 'تلاش دوباره',
    retryFull: 'تلاش دوباره برای خلاصه کامل',
    profileHint:
      'برای شخصی‌سازی بهتر پروفایل را کامل کنید — بدون آن هم پرسش کار می‌کند.',
    analysis: 'تحلیل',
    scenarios: 'سناریوها',
    bestCase: 'بهترین حالت',
    mostLikely: 'محتمل‌ترین',
    downside: 'حالت نامطلوب',
    mitigation: 'کاهش ریسک',
    alternatives: 'گزینه‌های جایگزین',
    bestFor: 'مناسب برای',
    risk: 'ریسک',
    assumptionsGaps: 'فرضیات و شکاف‌ها',
    recommendation: 'توصیه',
    confidence: 'اطمینان',
    actionPlan: 'برنامه اقدام',
    now: 'قبل از اقدام چه کار کنید؟',
    next7Days: '۷ روز آینده',
    next30Days: '۳۰ روز آینده',
    scores: 'امتیازها',
    opportunity: 'فرصت',
    timing: 'زمان‌بندی',
    readiness: 'آمادگی',
    timingSection: 'زمان‌بندی',
    timingNotApplicable: 'برای این پرسش کاربرد ندارد.',
    timingUnavailable: 'دادهٔ زمان‌بندی در دسترس نیست.',
    today: 'امروز',
    bestWindow: 'بهترین پنجره',
    caution: 'احتیاط',
    relatedModules: 'ماژول‌های مرتبط',
    followUpQuestions: 'پرسش‌های پیگیری',
    urgency: 'فوریت',
    horizon: 'افق زمانی',
    outOf100: 'از ۱۰۰',
    recommendationStatusAria: 'وضعیت توصیه',
    askIntro:
      'Ask سؤال شما را به هوش تصمیم ساخت‌یافته تبدیل می‌کند — توصیه، امتیازها، زمان‌بندی و اقدامات بعدی.',
    decisionStyle: 'سبک تصمیم‌گیری',
    detectedIntent: 'قصد شناسایی‌شده',
    examplePrompts: [
      'آیا باید این پیشنهاد شغلی را بپذیرم؟',
      'این هفته زمان خوبی برای مذاکره است؟',
      'آیا قبل از راه‌اندازی باید صبر کنم؟',
      'چطور با این تعارض رابطه‌ای برخورد کنم؟',
      'الان جابه‌جا شدن بهتر است یا صبر؟',
      'این ماه روی چه چیزی اولویت بگذارم؟',
    ],
    briefingError:
      'خلاصه تصمیم کامل نشد. پرسش شما حفظ شده — وقتی آماده بودید دوباره تلاش کنید.',
    sectionTitles: SECTION_TITLES_FA,
  },
  ru: {
    dir: 'ltr',
    loadingStages: [
      'Формулируем ваше решение',
      'Применяем профиль интеллекта',
      'Проверяем временной контекст',
      'Формируем рекомендацию',
    ],
    clarificationTitle: 'Одно уточнение',
    yourAnswer: 'Ваш ответ',
    continueAnalysis: 'Продолжить анализ',
    continueWithAssumptions: 'Продолжить с допущениями',
    errorTitle: 'Брифинг решения недоступен',
    retry: 'Повторить',
    retryFull: 'Повторить полный брифинг',
    profileHint:
      'Заполните профиль для лучшей персонализации — Ask работает и без него.',
    analysis: 'Анализ',
    scenarios: 'Сценарии',
    bestCase: 'Лучший случай',
    mostLikely: 'Наиболее вероятно',
    downside: 'Негативный сценарий',
    mitigation: 'Смягчение',
    alternatives: 'Альтернативы',
    bestFor: 'Лучше для',
    risk: 'Риск',
    assumptionsGaps: 'Допущения и пробелы',
    recommendation: 'Рекомендация',
    confidence: 'Уверенность',
    actionPlan: 'План действий',
    now: 'Что сделать до действия?',
    next7Days: 'Следующие 7 дней',
    next30Days: 'Следующие 30 дней',
    scores: 'Оценки',
    opportunity: 'Возможность',
    timing: 'Тайминг',
    readiness: 'Готовность',
    timingSection: 'Тайминг',
    timingNotApplicable: 'Не применимо к этому вопросу.',
    timingUnavailable: 'Данные тайминга недоступны.',
    today: 'Сегодня',
    bestWindow: 'Лучшее окно',
    caution: 'Осторожность',
    relatedModules: 'Связанные модули',
    followUpQuestions: 'Уточняющие вопросы',
    urgency: 'Срочность',
    horizon: 'Горизонт',
    outOf100: 'из 100',
    recommendationStatusAria: 'Статус рекомендации',
    askIntro:
      'Ask превращает ваш вопрос в структурированный интеллект решений — рекомендация, оценки, тайминг и следующие шаги.',
    decisionStyle: 'Стиль решений',
    detectedIntent: 'Обнаруженное намерение',
    examplePrompts: [
      'Стоит ли принять это предложение о работе?',
      'Хорошая ли это неделя для переговоров?',
      'Стоит ли подождать перед запуском?',
      'Как разобраться с этим конфликтом в отношениях?',
      'Лучше переезжать сейчас или подождать?',
      'На чём сосредоточиться в этом месяце?',
    ],
    briefingError:
      'Не удалось завершить брифинг. Вопрос сохранён — повторите попытку позже.',
    sectionTitles: SECTION_TITLES_RU,
  },
  ar: {
    dir: 'rtl',
    loadingStages: [
      'صياغة قرارك',
      'تطبيق ملف الذكاء الشخصي',
      'فحص سياق التوقيت',
      'بناء توصيتك',
    ],
    clarificationTitle: 'توضيح واحد',
    yourAnswer: 'إجابتك',
    continueAnalysis: 'متابعة التحليل',
    continueWithAssumptions: 'المتابعة مع الافتراضات',
    errorTitle: 'ملخص القرار غير متاح',
    retry: 'إعادة المحاولة',
    retryFull: 'إعادة المحاولة للملخص الكامل',
    profileHint:
      'أكمل ملفك لتحسين التخصيص — اسأل يعمل حتى بدونه.',
    analysis: 'التحليل',
    scenarios: 'السيناريوهات',
    bestCase: 'أفضل حالة',
    mostLikely: 'الأكثر احتمالاً',
    downside: 'الحالة السلبية',
    mitigation: 'التخفيف',
    alternatives: 'البدائل',
    bestFor: 'الأنسب لـ',
    risk: 'المخاطر',
    assumptionsGaps: 'الافتراضات والثغرات',
    recommendation: 'التوصية',
    confidence: 'الثقة',
    actionPlan: 'خطة العمل',
    now: 'ماذا تفعل قبل أن تتصرف؟',
    next7Days: 'الـ٧ أيام القادمة',
    next30Days: 'الـ٣٠ يوماً القادمة',
    scores: 'الدرجات',
    opportunity: 'الفرصة',
    timing: 'التوقيت',
    readiness: 'الجاهزية',
    timingSection: 'التوقيت',
    timingNotApplicable: 'غير قابل للتطبيق على هذا السؤال.',
    timingUnavailable: 'بيانات التوقيت غير متاحة.',
    today: 'اليوم',
    bestWindow: 'أفضل نافذة',
    caution: 'حذر',
    relatedModules: 'الوحدات ذات الصلة',
    followUpQuestions: 'أسئلة المتابعة',
    urgency: 'الاستعجال',
    horizon: 'الأفق',
    outOf100: 'من ١٠٠',
    recommendationStatusAria: 'حالة التوصية',
    askIntro:
      'يحوّل اسأل سؤالك إلى ذكاء قرار منظّم — توصية ودرجات وتوقيت وخطوات تالية.',
    decisionStyle: 'أسلوب القرار',
    detectedIntent: 'النيّة المكتشفة',
    examplePrompts: [
      'هل يجب أن أقبل عرض العمل هذا؟',
      'هل هذا أسبوع جيد للتفاوض؟',
      'هل يجب أن أنتظر قبل الإطلاق؟',
      'كيف أتعامل مع هذا الصراع في العلاقة؟',
      'هل الانتقال الآن أفضل من الانتظار؟',
      'على ماذا أركّز هذا الشهر؟',
    ],
    briefingError:
      'تعذّر إكمال ملخص القرار. سؤالك محفوظ — أعد المحاولة عندما تكون جاهزاً.',
    sectionTitles: SECTION_TITLES_AR,
  },
};

const RECOMMENDATION_STATUS: Record<AppLang, Record<RecommendationStatus, string>> = {
  en: {
    proceed: 'Proceed',
    'proceed-with-caution': 'Proceed with caution',
    wait: 'Wait',
    'gather-more-information': 'Gather more information',
    'avoid-for-now': 'Avoid for now',
    neutral: 'Neutral',
  },
  fa: {
    proceed: 'ادامه دهید',
    'proceed-with-caution': 'با احتیاط ادامه دهید',
    wait: 'صبر کنید',
    'gather-more-information': 'اطلاعات بیشتری جمع‌آوری کنید',
    'avoid-for-now': 'فعلاً اجتناب کنید',
    neutral: 'خنثی',
  },
  ru: {
    proceed: 'Действовать',
    'proceed-with-caution': 'Действовать осторожно',
    wait: 'Подождать',
    'gather-more-information': 'Собрать больше информации',
    'avoid-for-now': 'Пока избегать',
    neutral: 'Нейтрально',
  },
  ar: {
    proceed: 'تابع',
    'proceed-with-caution': 'تابع بحذر',
    wait: 'انتظر',
    'gather-more-information': 'اجمع مزيداً من المعلومات',
    'avoid-for-now': 'تجنّب حالياً',
    neutral: 'محايد',
  },
};

const INTENT_LABELS: Record<AppLang, Record<AskIntent, string>> = {
  en: {
    career: 'Career',
    business: 'Business',
    money: 'Money',
    relationship: 'Relationship',
    education: 'Education',
    health: 'Health',
    family: 'Family',
    relocation: 'Relocation',
    travel: 'Travel',
    investment: 'Investment',
    legal: 'Legal',
    wellbeing: 'Wellbeing',
    general: 'General',
    unknown: 'Unknown',
  },
  fa: {
    career: 'شغلی',
    business: 'کسب‌وکار',
    money: 'مالی',
    relationship: 'رابطه',
    education: 'تحصیلی',
    health: 'سلامت',
    family: 'خانواده',
    relocation: 'جابه‌جایی',
    travel: 'سفر',
    investment: 'سرمایه‌گذاری',
    legal: 'حقوقی',
    wellbeing: 'رفاه',
    general: 'عمومی',
    unknown: 'نامشخص',
  },
  ru: {
    career: 'Карьера',
    business: 'Бизнес',
    money: 'Деньги',
    relationship: 'Отношения',
    education: 'Образование',
    health: 'Здоровье',
    family: 'Семья',
    relocation: 'Переезд',
    travel: 'Путешествие',
    investment: 'Инвестиции',
    legal: 'Юридическое',
    wellbeing: 'Благополучие',
    general: 'Общее',
    unknown: 'Неизвестно',
  },
  ar: {
    career: 'مهنة',
    business: 'أعمال',
    money: 'مال',
    relationship: 'علاقة',
    education: 'تعليم',
    health: 'صحة',
    family: 'عائلة',
    relocation: 'انتقال',
    travel: 'سفر',
    investment: 'استثمار',
    legal: 'قانوني',
    wellbeing: 'رفاه',
    general: 'عام',
    unknown: 'غير معروف',
  },
};

const LEVEL_LABELS: Record<AppLang, Record<string, string>> = {
  en: {
    low: 'Low',
    medium: 'Medium',
    moderate: 'Moderate',
    high: 'High',
    immediate: 'Immediate',
    uncertain: 'Uncertain',
    critical: 'Critical',
    unknown: 'Unknown',
    inferred: 'Inferred',
    'not-stated': 'Not stated',
    'not_stated': 'Not stated',
    'not-applicable': 'Not applicable',
    'not_applicable': 'Not applicable',
    'n/a': 'N/A',
    today: 'Today',
    days: 'Days',
    weeks: 'Weeks',
    months: 'Months',
    'long-term': 'Long-term',
  },
  fa: {
    low: 'کم',
    medium: 'متوسط',
    moderate: 'متوسط',
    high: 'بالا',
    immediate: 'فوری',
    uncertain: 'نامطمئن',
    critical: 'بحرانی',
    unknown: 'نامشخص',
    inferred: 'استنباط‌شده',
    'not-stated': 'بیان‌نشده',
    'not_stated': 'بیان‌نشده',
    'not-applicable': 'قابل اعمال نیست',
    'not_applicable': 'قابل اعمال نیست',
    'n/a': 'نامشخص',
    today: 'امروز',
    days: 'روزها',
    weeks: 'هفته‌ها',
    months: 'ماه‌ها',
    'long-term': 'بلندمدت',
  },
  ru: {
    low: 'Низкий',
    medium: 'Средний',
    moderate: 'Умеренный',
    high: 'Высокий',
    immediate: 'Немедленный',
    uncertain: 'Неопределённый',
    critical: 'Критический',
    unknown: 'Неизвестно',
    inferred: 'Выведено',
    'not-stated': 'Не указано',
    'not_stated': 'Не указано',
    'not-applicable': 'Не применимо',
    'not_applicable': 'Не применимо',
    'n/a': 'Н/Д',
    today: 'Сегодня',
    days: 'Дни',
    weeks: 'Недели',
    months: 'Месяцы',
    'long-term': 'Долгосрочно',
  },
  ar: {
    low: 'منخفض',
    medium: 'متوسط',
    moderate: 'معتدل',
    high: 'مرتفع',
    immediate: 'فوري',
    uncertain: 'غير مؤكد',
    critical: 'حرج',
    unknown: 'غير معروف',
    inferred: 'مُستنتج',
    'not-stated': 'غير مذكور',
    'not_stated': 'غير مذكور',
    'not-applicable': 'غير قابل للتطبيق',
    'not_applicable': 'غير قابل للتطبيق',
    'n/a': 'غ/م',
    today: 'اليوم',
    days: 'أيام',
    weeks: 'أسابيع',
    months: 'أشهر',
    'long-term': 'طويل الأمد',
  },
};

export function getDecisionUi(lang: AppLang): DecisionUiCopy {
  return DECISION_UI[lang] ?? DECISION_UI.en;
}

function normalizeEnumKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export function localizeRecommendationStatus(
  status: RecommendationStatus | string,
  lang: AppLang
): string {
  const map = RECOMMENDATION_STATUS[lang] ?? RECOMMENDATION_STATUS.en;
  if (status in map) return map[status as RecommendationStatus];
  const normalized = normalizeEnumKey(status) as RecommendationStatus;
  if (normalized in map) return map[normalized];
  // Never Title-Case English leftovers for non-en locales
  if (lang !== 'en') {
    return map.neutral ?? localizeStructuredValue('unknown', lang);
  }
  return localizeStructuredValue(status, lang);
}

export function localizeIntent(intent: AskIntent | string, lang: AppLang): string {
  const map = INTENT_LABELS[lang] ?? INTENT_LABELS.en;
  const key = normalizeEnumKey(intent) as AskIntent;
  if (key in map) return map[key];
  if (lang !== 'en') {
    return map.unknown ?? localizeStructuredValue('unknown', lang);
  }
  return localizeStructuredValue(intent, lang);
}

export function localizeConfidenceLevel(
  level: ConfidenceLevel | string,
  lang: AppLang
): string {
  return localizeStructuredValue(level, lang);
}

export function localizeLikelihoodBand(
  band: LikelihoodBand | string,
  lang: AppLang
): string {
  return localizeStructuredValue(band, lang);
}

export function localizeActionPriority(
  priority: ActionPriority | string,
  lang: AppLang
): string {
  return localizeStructuredValue(priority, lang);
}

export function localizeUrgency(urgency: UrgencyLevel | string, lang: AppLang): string {
  return localizeStructuredValue(urgency, lang);
}

export function localizeTimeHorizon(
  horizon: TimeHorizon | string,
  lang: AppLang
): string {
  return localizeStructuredValue(horizon, lang);
}

/** Localize known structured API/enum values; never show kebab/snake raw keys. */
export function localizeStructuredValue(raw: string, lang: AppLang): string {
  const levels = LEVEL_LABELS[lang] ?? LEVEL_LABELS.en;
  const key = normalizeEnumKey(raw);
  if (key in levels) return levels[key];
  const underscored = key.replace(/-/g, '_');
  if (underscored in levels) return levels[underscored];
  // Non-en: never emit Title-Case English humanization
  if (lang !== 'en') {
    return levels.unknown ?? raw;
  }
  // Humanize unknown kebab/snake without exposing raw form
  if (/[-_]/.test(raw)) {
    return raw
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return raw;
}

/** Provider invents English titles; map known aliases → canonical section ids. */
const ANALYSIS_TITLE_ALIASES: Record<string, string> = {
  situation: 'situation',
  'current-situation': 'situation',
  'current-situation-analysis': 'situation',
  'market-premise-and-readiness': 'situation',
  'market-premise': 'situation',
  readiness: 'situation',
  factors: 'factors',
  'main-factors': 'factors',
  'key-factors': 'factors',
  opportunities: 'opportunities',
  opportunity: 'opportunities',
  risks: 'risks',
  risk: 'risks',
  tradeoffs: 'tradeoffs',
  'trade-offs': 'tradeoffs',
  'personal-fit': 'personal-fit',
  'personal-fit-analysis': 'personal-fit',
  'what-could-change': 'what-could-change',
  'what-could-change-the-recommendation': 'what-could-change',
  why: 'why',
  'why-this-recommendation': 'why',
};

const KNOWN_ANALYSIS_IDS = new Set(Object.keys(SECTION_TITLES_EN));

/**
 * Resolve provider/card id + title to a canonical analysis section id.
 */
export function resolveAnalysisSectionId(id: string, title?: string): string {
  const idKey = normalizeEnumKey(id);
  if (KNOWN_ANALYSIS_IDS.has(idKey)) return idKey;
  if (KNOWN_ANALYSIS_IDS.has(id)) return id;
  if (title) {
    const alias = ANALYSIS_TITLE_ALIASES[normalizeEnumKey(title)];
    if (alias) return alias;
  }
  return idKey || id;
}

export function localizeAnalysisTitle(
  id: string,
  fallbackTitle: string,
  lang: AppLang
): string {
  const titles = getDecisionUi(lang).sectionTitles;
  const resolved = resolveAnalysisSectionId(id, fallbackTitle);
  if (titles[resolved]) return titles[resolved];
  if (titles[id]) return titles[id];
  // Non-en: never show provider English title
  if (lang !== 'en') {
    return titles.situation ?? localizeStructuredValue('unknown', lang);
  }
  return localizeStructuredValue(fallbackTitle, lang);
}
