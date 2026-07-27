import type { AppLang } from './app-settings';

/** Canonical English Welcome copy — PRD-001 §5.1 */
export const WELCOME_COPY = {
  headline: 'Know your best next move.',
  subline: 'Personalized Decision Intelligence to help you make better life decisions.',
  start: 'Start',
  alreadyHaveAccount: 'Already have an account',
  languageAria: 'Language',
} as const;

export type WelcomeCopy = {
  headline: string;
  subline: string;
  start: string;
  alreadyHaveAccount: string;
  languageAria: string;
};

export const WELCOME_LANGS: Record<AppLang, WelcomeCopy> = {
  en: WELCOME_COPY,
  ru: {
    headline: 'Знай свой лучший следующий шаг.',
    subline:
      'Персонализированный Decision Intelligence, чтобы принимать более взвешенные жизненные решения.',
    start: 'Начать',
    alreadyHaveAccount: 'Уже есть аккаунт',
    languageAria: 'Язык',
  },
  fa: {
    headline: 'بهترین قدم بعدی خود را بشناسید.',
    subline: 'هوش تصمیم شخصی‌سازی‌شده برای کمک به تصمیم‌های بهتر در زندگی.',
    start: 'شروع',
    alreadyHaveAccount: 'قبلاً حساب دارید',
    languageAria: 'زبان',
  },
  ar: {
    headline: 'اعرف أفضل خطوتك التالية.',
    subline: 'ذكاء قرارات شخصي يساعدك على اتخاذ قرارات حياتية أفضل.',
    start: 'ابدأ',
    alreadyHaveAccount: 'لديك حساب بالفعل',
    languageAria: 'اللغة',
  },
};

export function getWelcomeCopy(lang: AppLang): WelcomeCopy {
  return WELCOME_LANGS[lang] ?? WELCOME_LANGS.en;
}

/** Stable goal ids — PRD-001 §5.2 (no Decision Domain mapping yet; §17 open). */
export const FTUE_GOAL_IDS = [
  'specific_decision',
  'relationship',
  'someone_affects_choices',
  'career',
  'business',
  'timing',
  'decision_patterns',
  'something_else',
] as const;

export type FtueGoalId = (typeof FTUE_GOAL_IDS)[number];

export type GoalSelectionCopy = {
  prompt: string;
  continue: string;
  skip: string;
  back: string;
  goalsAria: string;
  goals: Record<FtueGoalId, string>;
};

export const GOAL_SELECTION_COPY: GoalSelectionCopy = {
  prompt: 'What do you want to decide better?',
  continue: 'Continue',
  skip: 'Skip',
  back: 'Back',
  goalsAria: 'Goals',
  goals: {
    specific_decision: 'Make a specific decision',
    relationship: 'Navigate a relationship',
    someone_affects_choices: 'Understand how someone affects my choices',
    career: 'Move my career forward',
    business: 'Grow or start a business',
    timing: 'Get the timing of a decision right',
    decision_patterns: 'Understand my own decision patterns',
    something_else: 'Something else',
  },
};

export const GOAL_SELECTION_LANGS: Record<AppLang, GoalSelectionCopy> = {
  en: GOAL_SELECTION_COPY,
  ru: {
    prompt: 'Что вы хотите решать лучше?',
    continue: 'Продолжить',
    skip: 'Пропустить',
    back: 'Назад',
    goalsAria: 'Цели',
    goals: {
      specific_decision: 'Принять конкретное решение',
      relationship: 'Разобраться в отношениях',
      someone_affects_choices: 'Понять, как кто-то влияет на мои решения',
      career: 'Продвинуть карьеру',
      business: 'Развить или начать бизнес',
      timing: 'Выбрать правильный момент для решения',
      decision_patterns: 'Понять свои паттерны принятия решений',
      something_else: 'Что-то другое',
    },
  },
  fa: {
    prompt: 'می‌خواهید در چه چیزی بهتر تصمیم بگیرید؟',
    continue: 'ادامه',
    skip: 'رد کردن',
    back: 'بازگشت',
    goalsAria: 'اهداف',
    goals: {
      specific_decision: 'گرفتن یک تصمیم مشخص',
      relationship: 'پیش بردن یک رابطه',
      someone_affects_choices: 'فهمیدن اینکه کسی چگونه بر انتخاب‌هایم اثر می‌گذارد',
      career: 'پیش بردن مسیر شغلی',
      business: 'رشد یا راه‌اندازی کسب‌وکار',
      timing: 'انتخاب زمان درست برای یک تصمیم',
      decision_patterns: 'فهمیدن الگوهای تصمیم‌گیری خودم',
      something_else: 'چیز دیگر',
    },
  },
  ar: {
    prompt: 'ماذا تريد أن تقرر بشكل أفضل؟',
    continue: 'متابعة',
    skip: 'تخطٍ',
    back: 'رجوع',
    goalsAria: 'الأهداف',
    goals: {
      specific_decision: 'اتخاذ قرار محدد',
      relationship: 'إدارة علاقة',
      someone_affects_choices: 'فهم كيف يؤثر شخص ما على خياراتي',
      career: 'المضي قدماً في مساري المهني',
      business: 'تنمية مشروع أو بدؤه',
      timing: 'اختيار التوقيت المناسب لقرار',
      decision_patterns: 'فهم أنماط قراراتي',
      something_else: 'شيء آخر',
    },
  },
};

export function getGoalSelectionCopy(lang: AppLang): GoalSelectionCopy {
  return GOAL_SELECTION_LANGS[lang] ?? GOAL_SELECTION_LANGS.en;
}

/** Canonical English Decision Profile copy — PRD-001 §5.3 */
export type DecisionProfileCopy = {
  body: string;
  continue: string;
  back: string;
};

export const DECISION_PROFILE_COPY: DecisionProfileCopy = {
  body: 'We use your information to personalize your Decision Intelligence. Your data helps us understand timing, personalize recommendations, and improve explainability. You always remain in control.',
  continue: 'Continue',
  back: 'Back',
};

export const DECISION_PROFILE_LANGS: Record<AppLang, DecisionProfileCopy> = {
  en: DECISION_PROFILE_COPY,
  ru: {
    body: 'Мы используем ваши данные, чтобы персонализировать Decision Intelligence. Они помогают понимать тайминг, персонализировать рекомендации и повышать объяснимость. Контроль всегда остаётся у вас.',
    continue: 'Продолжить',
    back: 'Назад',
  },
  fa: {
    body: 'از اطلاعات شما برای شخصی‌سازی Decision Intelligence استفاده می‌کنیم. این داده‌ها به درک زمان‌بندی، شخصی‌سازی پیشنهادها و بهبود توضیح‌پذیری کمک می‌کند. کنترل همیشه با شماست.',
    continue: 'ادامه',
    back: 'بازگشت',
  },
  ar: {
    body: 'نستخدم معلوماتك لتخصيص Decision Intelligence. تساعدنا بياناتك على فهم التوقيت وتخصيص التوصيات وتحسين قابلية الشرح. تبقى السيطرة دائماً بيدك.',
    continue: 'متابعة',
    back: 'رجوع',
  },
};

export function getDecisionProfileCopy(lang: AppLang): DecisionProfileCopy {
  return DECISION_PROFILE_LANGS[lang] ?? DECISION_PROFILE_LANGS.en;
}

/** Canonical English Birth Date copy — PRD-001 §5.4 */
export type BirthDateCopy = {
  title: string;
  description: string;
  dateLabel: string;
  continue: string;
  back: string;
  errors: {
    required: string;
    invalid: string;
    future: string;
    tooOld: string;
  };
};

export const BIRTH_DATE_COPY: BirthDateCopy = {
  title: 'When were you born?',
  description:
    'Your birth date provides one source of evidence used to personalize your recommendations.',
  dateLabel: 'Birth date',
  continue: 'Continue',
  back: 'Back',
  errors: {
    required: 'Enter your birth date.',
    invalid: 'Enter a valid calendar date.',
    future: 'Birth date cannot be in the future.',
    tooOld: 'Enter a birth date within a reasonable age range.',
  },
};

export const BIRTH_DATE_LANGS: Record<AppLang, BirthDateCopy> = {
  en: BIRTH_DATE_COPY,
  ru: {
    title: 'Когда вы родились?',
    description:
      'Дата рождения — один источник данных, который помогает персонализировать рекомендации.',
    dateLabel: 'Дата рождения',
    continue: 'Продолжить',
    back: 'Назад',
    errors: {
      required: 'Укажите дату рождения.',
      invalid: 'Введите корректную календарную дату.',
      future: 'Дата рождения не может быть в будущем.',
      tooOld: 'Укажите дату рождения в разумном возрастном диапазоне.',
    },
  },
  fa: {
    title: 'تاریخ تولد شما چیست؟',
    description:
      'تاریخ تولد یک منبع شواهد برای شخصی‌سازی پیشنهادهای شماست.',
    dateLabel: 'تاریخ تولد',
    continue: 'ادامه',
    back: 'بازگشت',
    errors: {
      required: 'تاریخ تولد را وارد کنید.',
      invalid: 'یک تاریخ تقویمی معتبر وارد کنید.',
      future: 'تاریخ تولد نمی‌تواند در آینده باشد.',
      tooOld: 'تاریخی در بازه سنی معقول وارد کنید.',
    },
  },
  ar: {
    title: 'متى وُلدت؟',
    description:
      'تاريخ ميلادك مصدر أدلة واحد يُستخدم لتخصيص توصياتك.',
    dateLabel: 'تاريخ الميلاد',
    continue: 'متابعة',
    back: 'رجوع',
    errors: {
      required: 'أدخل تاريخ ميلادك.',
      invalid: 'أدخل تاريخاً تقويمياً صالحاً.',
      future: 'لا يمكن أن يكون تاريخ الميلاد في المستقبل.',
      tooOld: 'أدخل تاريخ ميلاد ضمن نطاق عمري معقول.',
    },
  },
};

export function getBirthDateCopy(lang: AppLang): BirthDateCopy {
  return BIRTH_DATE_LANGS[lang] ?? BIRTH_DATE_LANGS.en;
}

/** Canonical English Birth Time copy — PRD-001 §5.5 */
export type BirthTimeAccuracy = 'exact' | 'approximate' | 'unknown';

export type BirthTimeCopy = {
  title: string;
  accuracyAria: string;
  exact: string;
  approximate: string;
  unknown: string;
  unknownReassurance: string;
  approximateNote: string;
  timeLabel: string;
  continue: string;
  back: string;
  errors: {
    accuracyRequired: string;
    timeRequired: string;
    timeInvalid: string;
  };
};

export const BIRTH_TIME_COPY: BirthTimeCopy = {
  title: 'Do you know your birth time?',
  accuracyAria: 'Birth time accuracy',
  exact: 'Exact',
  approximate: 'Approximate',
  unknown: "I don't know",
  unknownReassurance:
    "That's okay. We can still provide useful recommendations. You can improve accuracy later.",
  approximateNote:
    'Approximate times are fine — we treat this as a window, not a precise moment.',
  timeLabel: 'Birth time',
  continue: 'Continue',
  back: 'Back',
  errors: {
    accuracyRequired: 'Choose how well you know your birth time.',
    timeRequired: 'Enter your birth time.',
    timeInvalid: 'Enter a valid time.',
  },
};

export const BIRTH_TIME_LANGS: Record<AppLang, BirthTimeCopy> = {
  en: BIRTH_TIME_COPY,
  ru: {
    title: 'Вы знаете время рождения?',
    accuracyAria: 'Точность времени рождения',
    exact: 'Точное',
    approximate: 'Приблизительное',
    unknown: 'Не знаю',
    unknownReassurance:
      'Ничего страшного. Мы всё равно сможем дать полезные рекомендации. Точность можно улучшить позже.',
    approximateNote:
      'Приблизительное время подходит — мы воспринимаем его как окно, а не точный момент.',
    timeLabel: 'Время рождения',
    continue: 'Продолжить',
    back: 'Назад',
    errors: {
      accuracyRequired: 'Укажите, насколько точно вы знаете время рождения.',
      timeRequired: 'Укажите время рождения.',
      timeInvalid: 'Введите корректное время.',
    },
  },
  fa: {
    title: 'زمان تولدتان را می‌دانید؟',
    accuracyAria: 'دقت زمان تولد',
    exact: 'دقیق',
    approximate: 'تقریبی',
    unknown: 'نمی‌دانم',
    unknownReassurance:
      'اشکالی ندارد. همچنان می‌توانیم پیشنهادهای مفید ارائه دهیم. بعداً می‌توانید دقت را بهتر کنید.',
    approximateNote:
      'زمان تقریبی کافی است — آن را به‌عنوان یک بازه در نظر می‌گیریم، نه یک لحظه دقیق.',
    timeLabel: 'زمان تولد',
    continue: 'ادامه',
    back: 'بازگشت',
    errors: {
      accuracyRequired: 'مشخص کنید زمان تولد را چقدر دقیق می‌دانید.',
      timeRequired: 'زمان تولد را وارد کنید.',
      timeInvalid: 'یک زمان معتبر وارد کنید.',
    },
  },
  ar: {
    title: 'هل تعرف وقت ميلادك؟',
    accuracyAria: 'دقة وقت الميلاد',
    exact: 'دقيق',
    approximate: 'تقريبي',
    unknown: 'لا أعرف',
    unknownReassurance:
      'لا بأس. ما زلنا نستطيع تقديم توصيات مفيدة. يمكنك تحسين الدقة لاحقاً.',
    approximateNote:
      'الأوقات التقريبية مناسبة — نتعامل معها كنافذة زمنية وليس لحظة دقيقة.',
    timeLabel: 'وقت الميلاد',
    continue: 'متابعة',
    back: 'رجوع',
    errors: {
      accuracyRequired: 'اختر مدى معرفتك بوقت ميلادك.',
      timeRequired: 'أدخل وقت ميلادك.',
      timeInvalid: 'أدخل وقتاً صالحاً.',
    },
  },
};

export function getBirthTimeCopy(lang: AppLang): BirthTimeCopy {
  return BIRTH_TIME_LANGS[lang] ?? BIRTH_TIME_LANGS.en;
}

/** Canonical English Birth Place copy — PRD-001 §5.6 (title/description not specified in PRD). */
export type BirthPlaceCopy = {
  title: string;
  description: string;
  searchLabel: string;
  searchPlaceholder: string;
  resultsAria: string;
  noResults: string;
  selectedLabel: string;
  continue: string;
  back: string;
  errors: {
    required: string;
  };
};

export const BIRTH_PLACE_COPY: BirthPlaceCopy = {
  title: 'Where were you born?',
  description:
    'Your birth place is one source of evidence used to personalize your recommendations.',
  searchLabel: 'Birth city',
  searchPlaceholder: 'Start typing a city…',
  resultsAria: 'City suggestions',
  noResults: 'No cities found',
  selectedLabel: 'Selected',
  continue: 'Continue',
  back: 'Back',
  errors: {
    required: 'Select a city from the list.',
  },
};

export const BIRTH_PLACE_LANGS: Record<AppLang, BirthPlaceCopy> = {
  en: BIRTH_PLACE_COPY,
  ru: {
    title: 'Где вы родились?',
    description:
      'Место рождения — один источник данных, который помогает персонализировать рекомендации.',
    searchLabel: 'Город рождения',
    searchPlaceholder: 'Начните вводить город…',
    resultsAria: 'Подсказки городов',
    noResults: 'Города не найдены',
    selectedLabel: 'Выбрано',
    continue: 'Продолжить',
    back: 'Назад',
    errors: {
      required: 'Выберите город из списка.',
    },
  },
  fa: {
    title: 'کجا متولد شده‌اید؟',
    description:
      'محل تولد یک منبع شواهد برای شخصی‌سازی پیشنهادهای شماست.',
    searchLabel: 'شهر تولد',
    searchPlaceholder: 'نام شهر را تایپ کنید…',
    resultsAria: 'پیشنهاد شهرها',
    noResults: 'شهری یافت نشد',
    selectedLabel: 'انتخاب‌شده',
    continue: 'ادامه',
    back: 'بازگشت',
    errors: {
      required: 'یک شهر را از فهرست انتخاب کنید.',
    },
  },
  ar: {
    title: 'أين وُلدت؟',
    description:
      'مكان الميلاد مصدر أدلة واحد يُستخدم لتخصيص توصياتك.',
    searchLabel: 'مدينة الميلاد',
    searchPlaceholder: 'ابدأ بكتابة اسم مدينة…',
    resultsAria: 'اقتراحات المدن',
    noResults: 'لم يتم العثور على مدن',
    selectedLabel: 'تم الاختيار',
    continue: 'متابعة',
    back: 'رجوع',
    errors: {
      required: 'اختر مدينة من القائمة.',
    },
  },
};

export function getBirthPlaceCopy(lang: AppLang): BirthPlaceCopy {
  return BIRTH_PLACE_LANGS[lang] ?? BIRTH_PLACE_LANGS.en;
}

/** Canonical English Living Location copy — PRD-001 §5.7 */
export type LivingLocationCopy = {
  title: string;
  description: string;
  searchLabel: string;
  searchPlaceholder: string;
  resultsAria: string;
  noResults: string;
  selectedLabel: string;
  continue: string;
  back: string;
  errors: {
    required: string;
  };
};

export const LIVING_LOCATION_COPY: LivingLocationCopy = {
  title: 'Where do you live now?',
  description:
    'Your current location helps us calculate local timing and recommendations.',
  searchLabel: 'Current city',
  searchPlaceholder: 'Start typing a city…',
  resultsAria: 'City suggestions',
  noResults: 'No cities found',
  selectedLabel: 'Selected',
  continue: 'Continue',
  back: 'Back',
  errors: {
    required: 'Select a city from the list.',
  },
};

export const LIVING_LOCATION_LANGS: Record<AppLang, LivingLocationCopy> = {
  en: LIVING_LOCATION_COPY,
  ru: {
    title: 'Где вы живёте сейчас?',
    description:
      'Текущее местоположение помогает рассчитывать локальный тайминг и рекомендации.',
    searchLabel: 'Текущий город',
    searchPlaceholder: 'Начните вводить город…',
    resultsAria: 'Подсказки городов',
    noResults: 'Города не найдены',
    selectedLabel: 'Выбрано',
    continue: 'Продолжить',
    back: 'Назад',
    errors: {
      required: 'Выберите город из списка.',
    },
  },
  fa: {
    title: 'الان کجا زندگی می‌کنید؟',
    description:
      'موقعیت فعلی شما به محاسبه زمان‌بندی محلی و پیشنهادها کمک می‌کند.',
    searchLabel: 'شهر فعلی',
    searchPlaceholder: 'نام شهر را تایپ کنید…',
    resultsAria: 'پیشنهاد شهرها',
    noResults: 'شهری یافت نشد',
    selectedLabel: 'انتخاب‌شده',
    continue: 'ادامه',
    back: 'بازگشت',
    errors: {
      required: 'یک شهر را از فهرست انتخاب کنید.',
    },
  },
  ar: {
    title: 'أين تعيش الآن؟',
    description:
      'موقعك الحالي يساعدنا على حساب التوقيت المحلي والتوصيات.',
    searchLabel: 'المدينة الحالية',
    searchPlaceholder: 'ابدأ بكتابة اسم مدينة…',
    resultsAria: 'اقتراحات المدن',
    noResults: 'لم يتم العثور على مدن',
    selectedLabel: 'تم الاختيار',
    continue: 'متابعة',
    back: 'رجوع',
    errors: {
      required: 'اختر مدينة من القائمة.',
    },
  },
};

export function getLivingLocationCopy(lang: AppLang): LivingLocationCopy {
  return LIVING_LOCATION_LANGS[lang] ?? LIVING_LOCATION_LANGS.en;
}

/** Stable notification preference keys — PRD-001 §5.8 / §10. */
export const FTUE_NOTIFICATION_IDS = [
  'decision_windows',
  'calendar_reminders',
  'relationship_insights',
  'important_changes',
  'weekly_summary',
] as const;

export type FtueNotificationId = (typeof FTUE_NOTIFICATION_IDS)[number];

/** Canonical English Notification Preferences copy — PRD-001 §5.8 */
export type NotificationsCopy = {
  prompt: string;
  preferencesAria: string;
  continue: string;
  skip: string;
  back: string;
  options: Record<FtueNotificationId, string>;
};

export const NOTIFICATIONS_COPY: NotificationsCopy = {
  prompt: 'What would you like to receive?',
  preferencesAria: 'Notification preferences',
  continue: 'Continue',
  skip: 'Skip',
  back: 'Back',
  options: {
    decision_windows: 'Best decision windows',
    calendar_reminders: 'Calendar reminders',
    relationship_insights: 'Relationship insights',
    important_changes: 'Important changes',
    weekly_summary: 'Weekly summary',
  },
};

export const NOTIFICATIONS_LANGS: Record<AppLang, NotificationsCopy> = {
  en: NOTIFICATIONS_COPY,
  ru: {
    prompt: 'Что вы хотите получать?',
    preferencesAria: 'Настройки уведомлений',
    continue: 'Продолжить',
    skip: 'Пропустить',
    back: 'Назад',
    options: {
      decision_windows: 'Лучшие окна для решений',
      calendar_reminders: 'Напоминания календаря',
      relationship_insights: 'Инсайты об отношениях',
      important_changes: 'Важные изменения',
      weekly_summary: 'Еженедельная сводка',
    },
  },
  fa: {
    prompt: 'مایلید چه چیزهایی دریافت کنید؟',
    preferencesAria: 'ترجیحات اعلان',
    continue: 'ادامه',
    skip: 'رد کردن',
    back: 'بازگشت',
    options: {
      decision_windows: 'بهترین پنجره‌های تصمیم',
      calendar_reminders: 'یادآورهای تقویم',
      relationship_insights: 'بینش‌های رابطه‌ای',
      important_changes: 'تغییرات مهم',
      weekly_summary: 'خلاصه هفتگی',
    },
  },
  ar: {
    prompt: 'ماذا تود أن تتلقى؟',
    preferencesAria: 'تفضيلات الإشعارات',
    continue: 'متابعة',
    skip: 'تخطٍ',
    back: 'رجوع',
    options: {
      decision_windows: 'أفضل نوافذ القرار',
      calendar_reminders: 'تذكيرات التقويم',
      relationship_insights: 'رؤى العلاقات',
      important_changes: 'تغييرات مهمة',
      weekly_summary: 'ملخص أسبوعي',
    },
  },
};

export function getNotificationsCopy(lang: AppLang): NotificationsCopy {
  return NOTIFICATIONS_LANGS[lang] ?? NOTIFICATIONS_LANGS.en;
}

/** Canonical English Snapshot copy — PRD-001 §5.9 progress acknowledgement only. */
export type SnapshotCopy = {
  title: string;
  checklist: readonly [string, string, string];
  done: string;
  back: string;
  continueToToday: string;
};

export const SNAPSHOT_COPY: SnapshotCopy = {
  title: 'Preparing your Personal Intelligence…',
  checklist: [
    'Building your profile',
    'Personalizing your timeline',
    "Preparing today's intelligence",
  ],
  done: 'Done.',
  back: 'Back',
  continueToToday: 'Continue to Today',
};

export const SNAPSHOT_LANGS: Record<AppLang, SnapshotCopy> = {
  en: SNAPSHOT_COPY,
  ru: {
    title: 'Готовим ваш Personal Intelligence…',
    checklist: [
      'Создаём ваш профиль',
      'Персонализируем таймлайн',
      'Готовим интеллект на сегодня',
    ],
    done: 'Готово.',
    back: 'Назад',
    continueToToday: 'Перейти к Today',
  },
  fa: {
    title: 'در حال آماده‌سازی Personal Intelligence شما…',
    checklist: [
      'ساخت پروفایل شما',
      'شخصی‌سازی جدول زمانی',
      'آماده‌سازی هوش امروز',
    ],
    done: 'انجام شد.',
    back: 'بازگشت',
    continueToToday: 'ادامه به Today',
  },
  ar: {
    title: 'جارٍ إعداد Personal Intelligence الخاص بك…',
    checklist: [
      'بناء ملفك',
      'تخصيص خطك الزمني',
      'إعداد ذكاء اليوم',
    ],
    done: 'تم.',
    back: 'رجوع',
    continueToToday: 'المتابعة إلى Today',
  },
};

export function getSnapshotCopy(lang: AppLang): SnapshotCopy {
  return SNAPSHOT_LANGS[lang] ?? SNAPSHOT_LANGS.en;
}

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
