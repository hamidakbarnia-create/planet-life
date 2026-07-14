import type { AppLang } from './app-settings';

export const WELCOME_COPY = {
  headline: 'Know your best next move.',
  subline: 'Structured timing guidance with visible reasoning.',
  steps: [
    'Set your birth context once',
    "See today's decision window",
    'Ask one real question and see why',
  ],
  getStarted: 'Get started',
  howItWorks: 'See how it works',
  howItWorksHide: 'Hide',
  offlineCta: 'Connect to continue',
  disclaimerLink: 'Educational use disclaimer',
} as const;

export const PROFILE_ONBOARDING_COPY = {
  step: 'Step 3 of 3',
  title: 'Your birth context',
  sub: 'We use date, time, and city to anchor timing — not personality labels.',
  nameLabel: 'Name (optional)',
  namePlaceholder: 'How we address you',
  dateLabel: 'Birth date',
  timeLabel: 'Birth time',
  timeHint: 'Use local time at birth. Approximate time is OK.',
  cityLabel: 'Birth city',
  cityPlaceholder: 'Start typing a city…',
  citySearching: 'Searching cities…',
  cityNoResults: 'No cities found',
  whyTitle: 'Why we need this',
  whyBody:
    'Date, time, and place set the astronomical reference for timing windows. We show the reasoning behind every suggestion.',
  save: 'Save and continue',
  saving: 'Saving…',
  back: 'Back to sign in',
  discardTitle: 'Discard profile progress?',
  discardBody: 'Unsaved changes will be kept as a draft unless you discard.',
  discardConfirm: 'Discard draft',
  discardCancel: 'Keep editing',
  required: 'Required',
} as const;

export const PREPARING_COPY = {
  step: 'Step 4 of 8',
  title: 'Preparing your first insight',
  sub: 'METIORO is building timing context from your birth profile. This usually takes a few seconds.',
  statusLoading: 'Preparing your intelligence…',
  statusSuccess: 'Ready — opening your brief',
  statusError: 'Preparation paused',
  offlineError: 'Connect to prepare your brief.',
  retry: 'Try again',
  continueAnyway: 'Continue without score',
  stepDone: 'Complete',
  stepActive: 'In progress',
  stepPending: 'Waiting',
} as const;

export const TODAY_COPY = {
  step: 'Step 5 of 8',
  title: 'Your Today is ready',
  briefEyebrow: 'Today brief',
  briefBody:
    'Your timing context is set. Focus on one decision at a time — ask a specific question to see scored guidance for your situation.',
  previewNote:
    'Early preview — this is your first personalized insight. It will grow richer as you use METIORO.',
  scoreUnavailable: 'Score unavailable today. You can still ask your first question.',
  cta: 'Ask your first question',
  personalizedWithNameAndCity: (name: string, city: string) =>
    `${name}, your timing context is anchored to ${city}.`,
  personalizedWithName: (name: string) =>
    `${name}, your timing context is ready for today.`,
  personalizedWithCity: (city: string) =>
    `Your timing context is anchored to ${city}.`,
  personalizedDefault: 'Your timing context is ready for today.',
} as const;

export const ASK_COPY = {
  step: 'Step 6 of 8',
  title: 'Ask METIORO',
  sub: 'Your first question helps introduce how METIORO delivers personalized guidance.',
  inputLabel: 'Your question',
  inputPlaceholder: 'What would you like guidance on?',
  suggestionsLabel: 'Suggested topics',
  submit: 'Get guidance',
  charCounter: (count: number, max: number) => `${count} of ${max} characters`,
} as const;

export type AskSuggestion = {
  id: 'career' | 'relationships' | 'todays-focus' | 'energy' | 'opportunities';
  label: string;
  text: string;
};

export type AskSuggestionId = string;

export type AskCopy = {
  step: string;
  title: string;
  sub: string;
  inputLabel: string;
  inputPlaceholder: string;
  suggestionsLabel: string;
  submit: string;
  charCounter: (count: number, max: number) => string;
  suggestions: readonly AskSuggestion[];
};

export const ASK_LANGS: Record<AppLang, AskCopy> = {
  en: {
    ...ASK_COPY,
    suggestions: [
      {
        id: 'career',
        label: 'Career',
        text: 'What should I focus on in my career this week?',
      },
      {
        id: 'relationships',
        label: 'Relationships',
        text: 'How can I strengthen an important relationship right now?',
      },
      {
        id: 'todays-focus',
        label: "Today's focus",
        text: 'What deserves my attention most today?',
      },
      {
        id: 'energy',
        label: 'Energy',
        text: 'How can I use my energy wisely today?',
      },
      {
        id: 'opportunities',
        label: 'Opportunities',
        text: 'What opportunity should I pay attention to right now?',
      },
    ],
  },
  ru: {
    step: 'Шаг 6 из 8',
    title: 'Спросить METIORO',
    sub: 'Ваш первый вопрос показывает, как METIORO даёт персональные рекомендации.',
    inputLabel: 'Ваш вопрос',
    inputPlaceholder: 'О чём вы хотите спросить?',
    suggestionsLabel: 'Темы для вопроса',
    submit: 'Получить рекомендацию',
    charCounter: (count, max) => `${count} из ${max} символов`,
    suggestions: [
      {
        id: 'career',
        label: 'Карьера',
        text: 'На чём мне сфокусироваться в карьере на этой неделе?',
      },
      {
        id: 'relationships',
        label: 'Отношения',
        text: 'Как укрепить важные отношения прямо сейчас?',
      },
      {
        id: 'todays-focus',
        label: 'Фокус на сегодня',
        text: 'Что заслуживает моего внимания сегодня?',
      },
      {
        id: 'energy',
        label: 'Энергия',
        text: 'Как разумно распорядиться энергией сегодня?',
      },
      {
        id: 'opportunities',
        label: 'Возможности',
        text: 'На какую возможность обратить внимание?',
      },
    ],
  },
  fa: {
    step: 'گام ۶ از ۸',
    title: 'از METIORO بپرسید',
    sub: 'اولین پرسش شما نشان می‌دهد METIORO چگونه راهنمایی شخصی‌سازی‌شده ارائه می‌دهد.',
    inputLabel: 'پرسش شما',
    inputPlaceholder: 'دربارهٔ چه موضوعی راهنمایی می‌خواهید؟',
    suggestionsLabel: 'موضوعات پیشنهادی',
    submit: 'دریافت راهنمایی',
    charCounter: (count, max) => `${count} از ${max} نویسه`,
    suggestions: [
      {
        id: 'career',
        label: 'شغل',
        text: 'این هفته روی چه چیزی در مسیر شغلی‌ام تمرکز کنم؟',
      },
      {
        id: 'relationships',
        label: 'روابط',
        text: 'چطور می‌توانم یک رابطه مهم را همین حالا تقویت کنم؟',
      },
      {
        id: 'todays-focus',
        label: 'تمرکز امروز',
        text: 'امروز چه چیزی بیش از همه شایسته توجه من است؟',
      },
      {
        id: 'energy',
        label: 'انرژی',
        text: 'چطور می‌توانم امروز انرژی‌ام را هوشمندانه مدیریت کنم؟',
      },
      {
        id: 'opportunities',
        label: 'فرصت‌ها',
        text: 'به کدام فرصت باید همین حالا توجه کنم؟',
      },
    ],
  },
  ar: {
    step: 'الخطوة ٦ من ٨',
    title: 'اسأل METIORO',
    sub: 'سؤالك الأول يوضح كيف يقدّم METIORO إرشادًا شخصيًا.',
    inputLabel: 'سؤالك',
    inputPlaceholder: 'في أي موضوع تريد الإرشاد؟',
    suggestionsLabel: 'مواضيع مقترحة',
    submit: 'احصل على الإرشاد',
    charCounter: (count, max) => `${count} من ${max} حرفًا`,
    suggestions: [
      {
        id: 'career',
        label: 'المهنة',
        text: 'على ماذا يجب أن أركّز في مسيرتي المهنية هذا الأسبوع؟',
      },
      {
        id: 'relationships',
        label: 'العلاقات',
        text: 'كيف أقوّي علاقة مهمة الآن؟',
      },
      {
        id: 'todays-focus',
        label: 'تركيز اليوم',
        text: 'ما الذي يستحق اهتمامي اليوم؟',
      },
      {
        id: 'energy',
        label: 'الطاقة',
        text: 'كيف أستخدم طاقتي بحكمة اليوم؟',
      },
      {
        id: 'opportunities',
        label: 'الفرص',
        text: 'أي فرصة يجب أن أنتبه لها الآن؟',
      },
    ],
  },
};

export function getAskCopy(lang: AppLang): AskCopy {
  return ASK_LANGS[lang] ?? ASK_LANGS.en;
}

export const ASK_SUGGESTIONS = ASK_LANGS.en.suggestions;

export const RESULT_COPY = {
  step: 'Step 7 of 8',
  title: 'Your Journey Begins',
  questionLabel: 'Your question',
  insightEyebrow: 'Early preview',
  insightBody:
    'Today is best used for clarity, prioritization, and one deliberate action. Start with the question you asked, choose the smallest useful next step, and return later for deeper guidance.',
  previewNote:
    'This is your first personalized preview. The full guidance engine will improve as METIORO learns your context.',
  cta: 'Complete onboarding',
  loadingLabel: 'Loading…',
  chartLoadingLabel: 'Loading your chart…',
  chartEmptyLabel: 'Chart preview unavailable',
  shareLabel: 'Share insight',
} as const;

export type ResultCopy = {
  step: string;
  title: string;
  questionLabel: string;
  insightEyebrow: string;
  insightBody: string;
  previewNote: string;
  cta: string;
  loadingLabel: string;
  chartLoadingLabel: string;
  chartEmptyLabel: string;
  shareLabel: string;
};

export const RESULT_LANGS: Record<AppLang, ResultCopy> = {
  en: RESULT_COPY,
  ru: {
    step: 'Шаг 7 из 8',
    title: 'Начало вашего пути',
    questionLabel: 'Ваш вопрос',
    insightEyebrow: 'Ранний просмотр',
    insightBody:
      'Сегодня лучше сосредоточиться на ясности, приоритетах и одном осознанном действии. Начните с заданного вопроса, выберите самый маленький полезный шаг и вернитесь позже за более глубоким руководством.',
    previewNote:
      'Это ваш первый персональный просмотр. Полный движок рекомендаций улучшится по мере того, как METIORO изучает ваш контекст.',
    cta: 'Завершить онбординг',
    loadingLabel: 'Загрузка…',
    chartLoadingLabel: 'Загрузка карты…',
    chartEmptyLabel: 'Предпросмотр карты недоступен',
    shareLabel: 'Поделиться',
  },
  fa: {
    step: 'گام ۷ از ۸',
    title: 'آغاز مسیر شما',
    questionLabel: 'پرسش شما',
    insightEyebrow: 'پیش‌نمایش اولیه',
    insightBody:
      'امروز بهترین استفاده برای وضوح، اولویت‌بندی و یک اقدام آگاهانه است. از پرسشی که مطرح کردید شروع کنید، کوچک‌ترین گام مفید بعدی را انتخاب کنید و بعداً برای راهنمایی عمیق‌تر بازگردید.',
    previewNote:
      'این اولین پیش‌نمایش شخصی‌سازی‌شده شماست. موتور راهنمایی کامل با شناخت بیشتر METIORO از زمینه شما بهتر می‌شود.',
    cta: 'تکمیل فرآیند شروع',
    loadingLabel: 'در حال بارگذاری…',
    chartLoadingLabel: 'در حال بارگذاری نمودار…',
    chartEmptyLabel: 'پیش‌نمایش نمودار در دسترس نیست',
    shareLabel: 'اشتراک‌گذاری',
  },
  ar: {
    step: 'الخطوة ٧ من ٨',
    title: 'بداية رحلتك',
    questionLabel: 'سؤالك',
    insightEyebrow: 'معاينة مبكرة',
    insightBody:
      'اليوم يُستخدم أفضل للوضوح وترتيب الأولويات واتخاذ إجراء واحد مدروس. ابدأ بالسؤال الذي طرحته، واختر أصغر خطوة مفيدة تالية، وعد لاحقًا للحصول على إرشاد أعمق.',
    previewNote:
      'هذه معاينتك الشخصية الأولى. سيتحسّن محرك الإرشاد الكامل مع تعلّم METIORO سياقك.',
    cta: 'إكمال الإعداد',
    loadingLabel: 'جارٍ التحميل…',
    chartLoadingLabel: 'جارٍ تحميل الخريطة…',
    chartEmptyLabel: 'معاينة الخريطة غير متاحة',
    shareLabel: 'مشاركة',
  },
};

/** Safe share text — insight content only; never include profile or location data. */
export function buildResultShareText(copy: ResultCopy, questionText: string): string {
  const question = questionText.trim();
  return [
    copy.title,
    '',
    copy.questionLabel,
    question,
    '',
    copy.insightEyebrow,
    copy.insightBody,
    '',
    copy.previewNote,
  ].join('\n');
}

export function getResultCopy(lang: AppLang): ResultCopy {
  return RESULT_LANGS[lang] ?? RESULT_LANGS.en;
}

export const LOGIN_FTUE_COPY = {
  title: 'Sign in to continue',
  sub: 'Save your profile and decision guidance securely.',
  oauthSoon: 'Social sign-in is coming soon. Use email or phone for now.',
  backWelcome: 'Back to welcome',
  termsPrefix: 'By continuing, you agree to the',
  termsLink: 'Terms of Service',
  privacyMid: 'and acknowledge the',
  privacyLink: 'Privacy Policy',
  rateLimited: 'Too many attempts. Try again in a few minutes.',
} as const;
