/**
 * Consumer-facing ASK product copy (EN/FA/AR/RU).
 * Internal Frame/Package/engine terms must never appear here as user chrome.
 */

import type { AppLang } from '@/lib/app-settings';
import type { ConfidenceBand, StrengthBand } from '@/lib/decision-frame/types';

export type AskProductCopy = {
  dir: 'ltr' | 'rtl';
  clarificationEyebrow: string;
  clarificationTitle: string;
  yourDecision: string;
  examinePrompt: string;
  examineEvaluate: string;
  examineCompare: string;
  examineFind: string;
  comingSoon: string;
  datePrompt: string;
  dateHint: string;
  dateContinue: string;
  dateMissing: string;
  persistAndEvaluate: string;
  evaluating: string;
  unsupportedTitle: string;
  unsupportedBody: string;
  unsupportedBack: string;
  blockedEyebrow: string;
  blockedTitle: string;
  blockedBody: string;
  blockedRequired: string;
  blockedNatalItem: string;
  blockedNoVerdict: string;
  blockedAddEvidence: string;
  resultRecommendation: string;
  resultWhy: string;
  resultScope: string;
  resultConfidence: string;
  resultScoreOf: (score: number) => string;
  agencyLine: string;
  errorGeneric: string;
  loadFrameError: string;
  strength: Record<Exclude<StrengthBand, 'unknown'>, string>;
  confidence: Record<Exclude<ConfidenceBand, 'unknown'>, string>;
  /** Restrained strength→label only — never invents domain claims. */
  meaningByStrength: Record<Exclude<StrengthBand, 'unknown'>, string>;
  /** Generic timing scope when decision type has no domain-specific Package limit. */
  scopeTimingGeneric: string;
  /** car-interview only — mirrors Runtime-1 negotiation-timing contract. */
  scopeInterviewTiming: string;
  evidenceSupportive: string;
  evidenceCaution: string;
  evidenceNeutral: string;
  topicCarInterview: string;
  topicGeneric: string;
  intakeEyebrow: string;
  intakeTitle: string;
  intakeBody: string;
  intakeOptional: string;
  intakeSelect: string;
  intakeSave: string;
  intakeComplete: string;
  intakeRequiredFilled: string;
  intakeRequiredRemaining: (fields: string) => string;
  intakeFieldTargetDate: string;
  intakeFieldRole: string;
  intakeFieldCompany: string;
  intakeFieldInterviewType: string;
  intakeLoadError: string;
  intakeSaveError: string;
  intakeCompleteError: string;
  backToAsk: string;
  /** Evaluate disabled when Decision Type has no production runtime. */
  evaluateUnavailableForType: string;
  capabilityTitle: string;
  capabilityBody: string;
  capabilitySecondary: string;
  capabilityBack: string;
  capabilityEdit: string;
  apiErrors: {
    UNSUPPORTED_DECISION_TYPE: string;
    OPERATION_NOT_IMPLEMENTED: string;
    FRAMING_REQUIRED: string;
    FRAMING_UNRESOLVED: string;
    INTAKE_INCOMPLETE: string;
    VERSION_CONFLICT: string;
    PROVIDER_FAILURE: string;
    CASE_NOT_FOUND: string;
    UNKNOWN_DECISION_TYPE: string;
    ENTRY_MODE_UNAVAILABLE: string;
    VALIDATION_ERROR: string;
    ILLEGAL_TRANSITION: string;
  };
};

const EN: AskProductCopy = {
  dir: 'ltr',
  clarificationEyebrow: 'Clarify your decision',
  clarificationTitle: 'A few details before we evaluate',
  yourDecision: 'Your decision',
  examinePrompt: 'What would you like to examine?',
  examineEvaluate: 'Check a specific date',
  examineCompare: 'Compare several dates',
  examineFind: 'Find the best date',
  comingSoon: 'Coming soon',
  datePrompt: 'Which date should we evaluate?',
  dateHint: 'Enter an explicit calendar date. METIORO never assumes today.',
  dateContinue: 'Continue',
  dateMissing: 'Please enter a date.',
  persistAndEvaluate: 'Evaluate this date',
  evaluating: 'Evaluating timing…',
  unsupportedTitle: 'This analysis is not available yet',
  unsupportedBody:
    'Comparing dates and finding the best date are not available in this release. You can evaluate one specific date.',
  unsupportedBack: 'Choose a different option',
  blockedEyebrow: 'More information needed',
  blockedTitle: 'More information is needed before METIORO can evaluate this date.',
  blockedBody: 'Birth evidence is required for timing evaluation.',
  blockedRequired: 'Required to continue',
  blockedNatalItem: 'Add birth date, birth time, and birth place',
  blockedNoVerdict:
    'No timing recommendation was produced. This is not a Favorable, Mixed, or Unfavorable verdict.',
  blockedAddEvidence: 'Add birth evidence and re-evaluate',
  resultRecommendation: 'Recommendation',
  resultWhy: 'Why',
  resultScope: 'Important limit',
  resultConfidence: 'Confidence',
  resultScoreOf: (score) => `${Math.round(score)} / 100`,
  agencyLine: 'METIORO never decides. The human always decides.',
  errorGeneric: 'Something went wrong. Please try again.',
  loadFrameError: 'Unable to load this decision. Return to Ask and try again.',
  strength: {
    strong: 'Highly favorable',
    favorable: 'Favorable',
    mixed: 'Mixed',
    unfavorable: 'Unfavorable',
  },
  confidence: {
    high: 'High',
    'medium-high': 'Medium-high',
    medium: 'Medium',
    low: 'Low',
  },
  meaningByStrength: {
    strong: 'Timing signal is strongly supportive.',
    favorable: 'Timing signal is supportive.',
    mixed: 'Timing signal is mixed.',
    unfavorable: 'Timing signal is challenging.',
  },
  scopeTimingGeneric:
    'This analysis covers timing for the requested date only. It does not assess outcomes beyond that timing question.',
  scopeInterviewTiming:
    'This analysis covers interview negotiation and communication timing for the requested date. It does not assess employer fit, role fit, salary, or interview outcome.',
  evidenceSupportive: 'Supportive timing signal',
  evidenceCaution: 'Cautionary timing signal',
  evidenceNeutral: 'Timing signal',
  topicCarInterview: 'Attend job interview',
  topicGeneric: 'Your decision',
  intakeEyebrow: 'Interview timing',
  intakeTitle: 'Attend job interview',
  intakeBody:
    'Share the interview details. We’ll evaluate the timing for the date you provide.',
  intakeOptional: 'optional',
  intakeSelect: 'Select…',
  intakeSave: 'Save answers',
  intakeComplete: 'Continue to evaluation',
  intakeRequiredFilled: 'Required details are ready.',
  intakeRequiredRemaining: (fields) => `Still needed: ${fields}`,
  intakeFieldTargetDate: 'Interview date',
  intakeFieldRole: 'Role',
  intakeFieldCompany: 'Company',
  intakeFieldInterviewType: 'Interview type',
  intakeLoadError: 'Unable to load this decision.',
  intakeSaveError: 'Could not save answers.',
  intakeCompleteError: 'Unable to continue.',
  backToAsk: 'Back to Ask',
  evaluateUnavailableForType:
    'Not available for this decision type yet',
  capabilityTitle: 'Timing analysis is not available for this decision yet',
  capabilityBody:
    'This kind of decision is not enabled for timing evaluation in this release.',
  capabilitySecondary:
    'Your decision is kept, but METIORO cannot produce a reliable evaluation for it yet.',
  capabilityBack: 'Back',
  capabilityEdit: 'Edit decision',
  apiErrors: {
    UNSUPPORTED_DECISION_TYPE:
      'Timing analysis is not available for this decision yet.',
    OPERATION_NOT_IMPLEMENTED:
      'That analysis option is not available in this release.',
    FRAMING_REQUIRED: 'A few more details are needed before evaluation.',
    FRAMING_UNRESOLVED: 'Please clarify what you want to examine first.',
    INTAKE_INCOMPLETE: 'Please complete the required details to continue.',
    VERSION_CONFLICT: 'This decision was updated elsewhere. Please reload.',
    PROVIDER_FAILURE: 'Timing analysis is temporarily unavailable. Try again.',
    CASE_NOT_FOUND: 'This decision could not be found.',
    UNKNOWN_DECISION_TYPE:
      'Timing analysis is not available for this decision yet.',
    ENTRY_MODE_UNAVAILABLE: 'This way of starting the decision is unavailable.',
    VALIDATION_ERROR: 'Some details could not be accepted. Please check and try again.',
    ILLEGAL_TRANSITION: 'This step is not available right now.',
  },
};

const FA: AskProductCopy = {
  dir: 'rtl',
  clarificationEyebrow: 'شفاف‌سازی تصمیم',
  clarificationTitle: 'چند جزئیات قبل از ارزیابی',
  yourDecision: 'تصمیم شما',
  examinePrompt: 'چه چیزی را می‌خواهید بررسی کنیم؟',
  examineEvaluate: 'بررسی یک تاریخ مشخص',
  examineCompare: 'مقایسه چند تاریخ',
  examineFind: 'پیدا کردن بهترین تاریخ',
  comingSoon: 'به‌زودی',
  datePrompt: 'کدام تاریخ را ارزیابی کنیم؟',
  dateHint: 'یک تاریخ مشخص وارد کنید. METIORO هرگز «امروز» را فرض نمی‌کند.',
  dateContinue: 'ادامه',
  dateMissing: 'لطفاً یک تاریخ وارد کنید.',
  persistAndEvaluate: 'ارزیابی این تاریخ',
  evaluating: 'در حال ارزیابی زمان‌بندی…',
  unsupportedTitle: 'این تحلیل هنوز در دسترس نیست',
  unsupportedBody:
    'مقایسه تاریخ‌ها و پیدا کردن بهترین تاریخ در این نسخه فعال نیست. می‌توانید یک تاریخ مشخص را ارزیابی کنید.',
  unsupportedBack: 'انتخاب گزینه دیگر',
  blockedEyebrow: 'اطلاعات بیشتری لازم است',
  blockedTitle: 'قبل از ارزیابی این تاریخ، اطلاعات بیشتری لازم است.',
  blockedBody: 'برای ارزیابی زمان‌بندی، شواهد تولد لازم است.',
  blockedRequired: 'برای ادامه لازم است',
  blockedNatalItem: 'تاریخ، ساعت و محل تولد را اضافه کنید',
  blockedNoVerdict:
    'هیچ توصیهٔ زمان‌بندی‌ای تولید نشد. این یک نتیجهٔ مساعد / مختلط / نامساعد نیست.',
  blockedAddEvidence: 'افزودن شواهد تولد و ارزیابی دوباره',
  resultRecommendation: 'توصیه',
  resultWhy: 'چرا؟',
  resultScope: 'محدودیت مهم',
  resultConfidence: 'اعتماد تحلیل',
  resultScoreOf: (score) => `${Math.round(score)} / ۱۰۰`,
  agencyLine: 'METIORO هرگز تصمیم نمی‌گیرد. تصمیم همیشه با انسان است.',
  errorGeneric: 'مشکلی پیش آمد. دوباره تلاش کنید.',
  loadFrameError: 'بارگذاری این تصمیم ممکن نشد. به ASK برگردید.',
  strength: {
    strong: 'بسیار مناسب',
    favorable: 'مناسب',
    mixed: 'مختلط',
    unfavorable: 'نامساعد',
  },
  confidence: {
    high: 'بالا',
    'medium-high': 'نسبتاً بالا',
    medium: 'متوسط',
    low: 'پایین',
  },
  meaningByStrength: {
    strong: 'سیگنال زمان‌بندی به‌طور قوی حمایت‌کننده است.',
    favorable: 'سیگنال زمان‌بندی حمایت‌کننده است.',
    mixed: 'سیگنال زمان‌بندی مختلط است.',
    unfavorable: 'سیگنال زمان‌بندی چالش‌برانگیز است.',
  },
  scopeTimingGeneric:
    'این تحلیل فقط زمان‌بندی تاریخ درخواست‌شده را پوشش می‌دهد و فراتر از آن نتیجه‌ای را ارزیابی نمی‌کند.',
  scopeInterviewTiming:
    'این تحلیل زمان‌بندی مذاکره و ارتباط مصاحبه را برای تاریخ درخواست‌شده بررسی می‌کند. تناسب کارفرما، نقش، حقوق یا نتیجهٔ مصاحبه را ارزیابی نمی‌کند.',
  evidenceSupportive: 'سیگنال زمان‌بندی حمایت‌کننده',
  evidenceCaution: 'سیگنال زمان‌بندی احتیاطی',
  evidenceNeutral: 'سیگنال زمان‌بندی',
  topicCarInterview: 'مصاحبه کاری',
  topicGeneric: 'تصمیم شما',
  intakeEyebrow: 'زمان‌بندی مصاحبه',
  intakeTitle: 'مصاحبه کاری',
  intakeBody:
    'جزئیات مصاحبه را وارد کنید. زمان‌بندی را برای تاریخی که می‌دهید ارزیابی می‌کنیم.',
  intakeOptional: 'اختیاری',
  intakeSelect: 'انتخاب…',
  intakeSave: 'ذخیره پاسخ‌ها',
  intakeComplete: 'ادامه به ارزیابی',
  intakeRequiredFilled: 'اطلاعات لازم آماده است.',
  intakeRequiredRemaining: (fields) => `هنوز لازم است: ${fields}`,
  intakeFieldTargetDate: 'تاریخ مصاحبه',
  intakeFieldRole: 'نقش',
  intakeFieldCompany: 'شرکت',
  intakeFieldInterviewType: 'نوع مصاحبه',
  intakeLoadError: 'بارگذاری این تصمیم ممکن نشد.',
  intakeSaveError: 'ذخیره پاسخ‌ها ممکن نشد.',
  intakeCompleteError: 'ادامه ممکن نیست.',
  backToAsk: 'بازگشت به ASK',
  evaluateUnavailableForType: 'برای این نوع تصمیم هنوز در دسترس نیست',
  capabilityTitle: 'این نوع تصمیم هنوز برای تحلیل زمان‌بندی فعال نشده است.',
  capabilityBody:
    'این نوع تصمیم هنوز برای تحلیل زمان‌بندی فعال نشده است.',
  capabilitySecondary:
    'تصمیم شما ذخیره می‌شود، اما METIORO هنوز نمی‌تواند برای آن ارزیابی قابل اتکا تولید کند.',
  capabilityBack: 'بازگشت',
  capabilityEdit: 'ویرایش تصمیم',
  apiErrors: {
    UNSUPPORTED_DECISION_TYPE:
      'این نوع تصمیم هنوز برای تحلیل زمان‌بندی فعال نشده است.',
    OPERATION_NOT_IMPLEMENTED:
      'این گزینهٔ تحلیل در این نسخه در دسترس نیست.',
    FRAMING_REQUIRED: 'قبل از ارزیابی، چند جزئیات دیگر لازم است.',
    FRAMING_UNRESOLVED: 'لطفاً ابتدا مشخص کنید چه چیزی را بررسی کنیم.',
    INTAKE_INCOMPLETE: 'برای ادامه، جزئیات لازم را کامل کنید.',
    VERSION_CONFLICT: 'این تصمیم جای دیگری به‌روز شده. لطفاً دوباره بارگذاری کنید.',
    PROVIDER_FAILURE: 'تحلیل زمان‌بندی موقتاً در دسترس نیست. دوباره تلاش کنید.',
    CASE_NOT_FOUND: 'این تصمیم پیدا نشد.',
    UNKNOWN_DECISION_TYPE:
      'این نوع تصمیم هنوز برای تحلیل زمان‌بندی فعال نشده است.',
    ENTRY_MODE_UNAVAILABLE: 'این روش شروع تصمیم در دسترس نیست.',
    VALIDATION_ERROR: 'برخی جزئیات پذیرفته نشد. بررسی کنید و دوباره تلاش کنید.',
    ILLEGAL_TRANSITION: 'این مرحله اکنون در دسترس نیست.',
  },
};

const AR: AskProductCopy = {
  dir: 'rtl',
  clarificationEyebrow: 'توضيح القرار',
  clarificationTitle: 'بعض التفاصيل قبل التقييم',
  yourDecision: 'قرارك',
  examinePrompt: 'ماذا تريد أن نفحص؟',
  examineEvaluate: 'فحص تاريخ محدد',
  examineCompare: 'مقارنة عدة تواريخ',
  examineFind: 'إيجاد أفضل تاريخ',
  comingSoon: 'قريباً',
  datePrompt: 'أي تاريخ نقيّم؟',
  dateHint: 'أدخل تاريخاً صريحاً. لا تفترض METIORO «اليوم».',
  dateContinue: 'متابعة',
  dateMissing: 'يرجى إدخال تاريخ.',
  persistAndEvaluate: 'تقييم هذا التاريخ',
  evaluating: 'جارٍ تقييم التوقيت…',
  unsupportedTitle: 'هذا التحليل غير متاح بعد',
  unsupportedBody:
    'مقارنة التواريخ وإيجاد أفضل تاريخ غير متاحين في هذا الإصدار. يمكنك تقييم تاريخ واحد محدد.',
  unsupportedBack: 'اختر خياراً آخر',
  blockedEyebrow: 'يلزم مزيد من المعلومات',
  blockedTitle: 'يلزم مزيد من المعلومات قبل أن تقيّم METIORO هذا التاريخ.',
  blockedBody: 'أدلة الميلاد مطلوبة لتقييم التوقيت.',
  blockedRequired: 'مطلوب للمتابعة',
  blockedNatalItem: 'أضف تاريخ الميلاد ووقته ومكانه',
  blockedNoVerdict:
    'لم يُنتج توصية توقيت. هذا ليس حكماً ملائماً / مختلطاً / غير ملائم.',
  blockedAddEvidence: 'أضف أدلة الميلاد وأعد التقييم',
  resultRecommendation: 'التوصية',
  resultWhy: 'لماذا؟',
  resultScope: 'حد مهم',
  resultConfidence: 'ثقة التحليل',
  resultScoreOf: (score) => `${Math.round(score)} / 100`,
  agencyLine: 'METIORO لا تقرر أبداً. القرار دائماً للإنسان.',
  errorGeneric: 'حدث خطأ. حاول مرة أخرى.',
  loadFrameError: 'تعذّر تحميل هذا القرار. عد إلى ASK.',
  strength: {
    strong: 'مواتٍ جداً',
    favorable: 'مواتٍ',
    mixed: 'مختلط',
    unfavorable: 'غير مواتٍ',
  },
  confidence: {
    high: 'عالية',
    'medium-high': 'متوسطة-عالية',
    medium: 'متوسطة',
    low: 'منخفضة',
  },
  meaningByStrength: {
    strong: 'إشارة التوقيت داعمة بقوة.',
    favorable: 'إشارة التوقيت داعمة.',
    mixed: 'إشارة التوقيت مختلطة.',
    unfavorable: 'إشارة التوقيت صعبة.',
  },
  scopeTimingGeneric:
    'يغطي هذا التحليل توقيت التاريخ المطلوب فقط. ولا يقيّم نتائجًا خارج سؤال التوقيت.',
  scopeInterviewTiming:
    'يغطي هذا التحليل توقيت التفاوض والتواصل للمقابلة في التاريخ المطلوب. لا يقيّم ملاءمة صاحب العمل أو الدور أو الراتب أو نتيجة المقابلة.',
  evidenceSupportive: 'إشارة توقيت داعمة',
  evidenceCaution: 'إشارة توقيت تحذيرية',
  evidenceNeutral: 'إشارة توقيت',
  topicCarInterview: 'مقابلة عمل',
  topicGeneric: 'قرارك',
  intakeEyebrow: 'توقيت المقابلة',
  intakeTitle: 'مقابلة عمل',
  intakeBody:
    'شارك تفاصيل المقابلة. سنقيّم التوقيت للتاريخ الذي تقدّمه.',
  intakeOptional: 'اختياري',
  intakeSelect: 'اختر…',
  intakeSave: 'حفظ الإجابات',
  intakeComplete: 'المتابعة إلى التقييم',
  intakeRequiredFilled: 'التفاصيل المطلوبة جاهزة.',
  intakeRequiredRemaining: (fields) => `ما زال مطلوبًا: ${fields}`,
  intakeFieldTargetDate: 'تاريخ المقابلة',
  intakeFieldRole: 'الدور',
  intakeFieldCompany: 'الشركة',
  intakeFieldInterviewType: 'نوع المقابلة',
  intakeLoadError: 'تعذّر تحميل هذا القرار.',
  intakeSaveError: 'تعذّر حفظ الإجابات.',
  intakeCompleteError: 'تعذّرت المتابعة.',
  backToAsk: 'العودة إلى ASK',
  evaluateUnavailableForType: 'غير متاح لهذا النوع من القرار بعد',
  capabilityTitle: 'تحليل التوقيت غير مفعّل لهذا القرار بعد.',
  capabilityBody: 'تحليل التوقيت غير مفعّل لهذا النوع من القرار في هذا الإصدار.',
  capabilitySecondary:
    'يُحتفظ بقرارك، لكن METIORO لا تستطيع بعد إنتاج تقييم موثوق له.',
  capabilityBack: 'رجوع',
  capabilityEdit: 'تعديل القرار',
  apiErrors: {
    UNSUPPORTED_DECISION_TYPE:
      'تحليل التوقيت غير مفعّل لهذا النوع من القرار بعد.',
    OPERATION_NOT_IMPLEMENTED: 'خيار التحليل هذا غير متاح في هذا الإصدار.',
    FRAMING_REQUIRED: 'يلزم مزيد من التفاصيل قبل التقييم.',
    FRAMING_UNRESOLVED: 'يرجى توضيح ما تريد فحصه أولاً.',
    INTAKE_INCOMPLETE: 'أكمل التفاصيل المطلوبة للمتابعة.',
    VERSION_CONFLICT: 'تم تحديث هذا القرار في مكان آخر. أعد التحميل.',
    PROVIDER_FAILURE: 'تحليل التوقيت غير متاح مؤقتاً. حاول مرة أخرى.',
    CASE_NOT_FOUND: 'تعذّر العثور على هذا القرار.',
    UNKNOWN_DECISION_TYPE:
      'تحليل التوقيت غير مفعّل لهذا النوع من القرار بعد.',
    ENTRY_MODE_UNAVAILABLE: 'طريقة بدء القرار هذه غير متاحة.',
    VALIDATION_ERROR: 'بعض التفاصيل لم تُقبل. راجعها وحاول مرة أخرى.',
    ILLEGAL_TRANSITION: 'هذه الخطوة غير متاحة الآن.',
  },
};

const RU: AskProductCopy = {
  dir: 'ltr',
  clarificationEyebrow: 'Уточнение решения',
  clarificationTitle: 'Несколько деталей перед оценкой',
  yourDecision: 'Ваше решение',
  examinePrompt: 'Что вы хотите проверить?',
  examineEvaluate: 'Проверить конкретную дату',
  examineCompare: 'Сравнить несколько дат',
  examineFind: 'Найти лучшую дату',
  comingSoon: 'Скоро',
  datePrompt: 'Какую дату оценить?',
  dateHint: 'Укажите явную дату. METIORO никогда не подставляет «сегодня».',
  dateContinue: 'Продолжить',
  dateMissing: 'Пожалуйста, укажите дату.',
  persistAndEvaluate: 'Оценить эту дату',
  evaluating: 'Оценка тайминга…',
  unsupportedTitle: 'Этот анализ пока недоступен',
  unsupportedBody:
    'Сравнение дат и поиск лучшей даты в этом релизе недоступны. Можно оценить одну конкретную дату.',
  unsupportedBack: 'Выбрать другой вариант',
  blockedEyebrow: 'Нужно больше данных',
  blockedTitle: 'Нужно больше данных, прежде чем METIORO сможет оценить эту дату.',
  blockedBody: 'Для оценки тайминга нужны данные рождения.',
  blockedRequired: 'Требуется для продолжения',
  blockedNatalItem: 'Добавьте дату, время и место рождения',
  blockedNoVerdict:
    'Рекомендация по таймингу не сформирована. Это не вердикт Благоприятно / Смешанно / Неблагоприятно.',
  blockedAddEvidence: 'Добавить данные рождения и переоценить',
  resultRecommendation: 'Рекомендация',
  resultWhy: 'Почему',
  resultScope: 'Важное ограничение',
  resultConfidence: 'Уверенность анализа',
  resultScoreOf: (score) => `${Math.round(score)} / 100`,
  agencyLine: 'METIORO никогда не решает. Решение всегда за человеком.',
  errorGeneric: 'Что-то пошло не так. Попробуйте снова.',
  loadFrameError: 'Не удалось загрузить решение. Вернитесь в ASK.',
  strength: {
    strong: 'Очень благоприятно',
    favorable: 'Благоприятно',
    mixed: 'Смешанно',
    unfavorable: 'Неблагоприятно',
  },
  confidence: {
    high: 'Высокая',
    'medium-high': 'Средне-высокая',
    medium: 'Средняя',
    low: 'Низкая',
  },
  meaningByStrength: {
    strong: 'Сигнал тайминга сильно поддерживающий.',
    favorable: 'Сигнал тайминга поддерживающий.',
    mixed: 'Сигнал тайминга смешанный.',
    unfavorable: 'Сигнал тайминга сложный.',
  },
  scopeTimingGeneric:
    'Этот анализ касается только тайминга запрошенной даты. Он не оценивает исходы вне этого вопроса тайминга.',
  scopeInterviewTiming:
    'Этот анализ касается тайминга переговоров и коммуникации на запрошенную дату интервью. Он не оценивает соответствие работодателю, роли, зарплате или исходу интервью.',
  evidenceSupportive: 'Поддерживающий сигнал тайминга',
  evidenceCaution: 'Предупреждающий сигнал тайминга',
  evidenceNeutral: 'Сигнал тайминга',
  topicCarInterview: 'Собеседование',
  topicGeneric: 'Ваше решение',
  intakeEyebrow: 'Тайминг собеседования',
  intakeTitle: 'Собеседование',
  intakeBody:
    'Укажите детали собеседования. Мы оценим тайминг для указанной даты.',
  intakeOptional: 'необязательно',
  intakeSelect: 'Выберите…',
  intakeSave: 'Сохранить ответы',
  intakeComplete: 'Перейти к оценке',
  intakeRequiredFilled: 'Обязательные поля заполнены.',
  intakeRequiredRemaining: (fields) => `Ещё нужно: ${fields}`,
  intakeFieldTargetDate: 'Дата собеседования',
  intakeFieldRole: 'Роль',
  intakeFieldCompany: 'Компания',
  intakeFieldInterviewType: 'Тип собеседования',
  intakeLoadError: 'Не удалось загрузить это решение.',
  intakeSaveError: 'Не удалось сохранить ответы.',
  intakeCompleteError: 'Не удалось продолжить.',
  backToAsk: 'Назад в Ask',
  evaluateUnavailableForType: 'Пока недоступно для этого типа решения',
  capabilityTitle: 'Анализ тайминга для этого решения ещё не включён.',
  capabilityBody:
    'Этот тип решения пока не включён для оценки тайминга в этом релизе.',
  capabilitySecondary:
    'Ваше решение сохраняется, но METIORO пока не может дать для него надёжную оценку.',
  capabilityBack: 'Назад',
  capabilityEdit: 'Изменить решение',
  apiErrors: {
    UNSUPPORTED_DECISION_TYPE:
      'Анализ тайминга для этого типа решения ещё не включён.',
    OPERATION_NOT_IMPLEMENTED:
      'Этот вариант анализа недоступен в этом релизе.',
    FRAMING_REQUIRED: 'Перед оценкой нужны ещё несколько деталей.',
    FRAMING_UNRESOLVED: 'Сначала уточните, что нужно проверить.',
    INTAKE_INCOMPLETE: 'Заполните обязательные поля, чтобы продолжить.',
    VERSION_CONFLICT: 'Решение обновлено в другом месте. Перезагрузите.',
    PROVIDER_FAILURE: 'Анализ тайминга временно недоступен. Попробуйте снова.',
    CASE_NOT_FOUND: 'Это решение не найдено.',
    UNKNOWN_DECISION_TYPE:
      'Анализ тайминга для этого типа решения ещё не включён.',
    ENTRY_MODE_UNAVAILABLE: 'Этот способ начать решение недоступен.',
    VALIDATION_ERROR: 'Часть данных не принята. Проверьте и попробуйте снова.',
    ILLEGAL_TRANSITION: 'Этот шаг сейчас недоступен.',
  },
};

export const ASK_PRODUCT_COPY: Record<AppLang, AskProductCopy> = {
  en: EN,
  fa: FA,
  ar: AR,
  ru: RU,
};

export function getAskProductCopy(lang: AppLang): AskProductCopy {
  return ASK_PRODUCT_COPY[lang] ?? ASK_PRODUCT_COPY.en;
}

export function localizeStrength(
  lang: AppLang,
  band: StrengthBand
): string | null {
  if (band === 'unknown') return null;
  return getAskProductCopy(lang).strength[band];
}

export function localizeConfidence(
  lang: AppLang,
  band: ConfidenceBand
): string | null {
  if (band === 'unknown') return null;
  return getAskProductCopy(lang).confidence[band];
}
