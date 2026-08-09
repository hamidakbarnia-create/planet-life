import type { AppLang } from '@/lib/app-settings';
import type { DecisionEntryMode, HowItWorksStep } from './types';

export type AskHomeCopy = {
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  searchSubmitAria: string;
  popularTitle: string;
  seeAllDecisions: string;
  showPopularOnly: string;
  /** Badge for Popular cards that can start a real Case journey. */
  popularAvailableBadge: string;
  /** Badge for browseable Popular cards without a shipped runtime. */
  popularUnavailableBadge: string;
  entryTitle: string;
  entryModes: readonly DecisionEntryMode[];
  recentTitle: string;
  recentEmpty: string;
  recentColumns: {
    title: string;
    type: string;
    status: string;
    confidence: string;
    date: string;
  };
  unknownDecisionType: string;
  energyTitle: string;
  energyDescription: string;
  energyBestWindow: string;
  energySeeDetails: string;
  energyLoading: string;
  energyUnavailable: string;
  timingTitle: string;
  timingBestWindow: string;
  timingEmpty: string;
  timingLoading: string;
  howTitle: string;
  howSteps: readonly HowItWorksStep[];
  agencyLine1: string;
  agencyLine2: string;
  guidedTopicsLabel: string;
  newDecision: string;
  charCounter: (count: number, max: number) => string;
};

const ENTRY_EN: readonly DecisionEntryMode[] = [
  {
    id: 'help-me-decide',
    title: 'Help me Decide',
    description:
      'Browse decision topics. Supported timing decisions can start analysis; others stay unavailable until shipped.',
  },
  {
    id: 'ask-anything',
    title: 'Ask Anything',
    description:
      'Describe a decision in your own words. Only supported decision types can run analysis today.',
  },
];

const HOW_EN: readonly HowItWorksStep[] = [
  {
    id: 'share',
    title: 'Share',
    description: 'Describe the decision in your own words.',
  },
  {
    id: 'analyze',
    title: 'Analyze',
    description: 'We structure context, timing, and trade-offs.',
  },
  {
    id: 'guide',
    title: 'Guide',
    description: 'You receive clarity — then you decide.',
  },
];

const ASK_HOME_EN: AskHomeCopy = {
  heroTitle: 'What decision do you need help with today?',
  heroSubtitle:
    'Describe your decision in your own words. We’ll guide you step by step.',
  searchPlaceholder: "I'm thinking about...",
  searchAriaLabel: 'Describe your decision',
  searchSubmitAria: 'Start decision flow',
  popularTitle: 'Popular Decisions',
  seeAllDecisions: 'See All Decisions',
  showPopularOnly: 'Show popular',
  popularAvailableBadge: 'Available',
  popularUnavailableBadge: 'Coming soon',
  entryTitle: 'Decision Entry',
  entryModes: ENTRY_EN,
  recentTitle: 'Recent Decisions',
  recentEmpty: 'No recent decisions yet. Start with a question above.',
  recentColumns: {
    title: 'Decision',
    type: 'Type',
    status: 'Status',
    confidence: 'Confidence',
    date: 'Date',
  },
  unknownDecisionType: 'Decision briefing',
  energyTitle: "Today's Energy",
  energyDescription:
    'A readiness signal for making important decisions today.',
  energyBestWindow: 'Best time window',
  energySeeDetails: 'See Details',
  energyLoading: 'Calculating…',
  energyUnavailable: 'Set up timing on Today for a live score.',
  timingTitle: 'Best Time To Decide',
  timingBestWindow: 'Best window',
  timingEmpty: 'Hourly timing unavailable right now.',
  timingLoading: 'Loading timeline…',
  howTitle: 'How Ask Works',
  howSteps: HOW_EN,
  agencyLine1: 'METIORO never decides.',
  agencyLine2: 'The human always decides.',
  guidedTopicsLabel: 'Suggested topics',
  newDecision: 'New Decision',
  charCounter: (count, max) => `${count} of ${max} characters`,
};

const ASK_HOME_RU: AskHomeCopy = {
  heroTitle: 'Какое решение вам нужно принять сегодня?',
  heroSubtitle:
    'Опишите решение своими словами. Мы проведём вас шаг за шагом.',
  searchPlaceholder: 'Я думаю о…',
  searchAriaLabel: 'Опишите ваше решение',
  searchSubmitAria: 'Начать поток решения',
  popularTitle: 'Популярные решения',
  seeAllDecisions: 'Все решения',
  showPopularOnly: 'Популярные',
  popularAvailableBadge: 'Доступно',
  popularUnavailableBadge: 'Скоро',
  entryTitle: 'Точка входа',
  entryModes: [
    {
      id: 'help-me-decide',
      title: 'Помогите решить',
      description:
        'Просмотрите темы решений. Поддерживаемые тайминг-решения можно анализировать; остальные пока недоступны.',
    },
    {
      id: 'ask-anything',
      title: 'Спросите что угодно',
      description:
        'Опишите решение своими словами. Сегодня анализ доступен только для поддерживаемых типов решений.',
    },
  ],
  recentTitle: 'Недавние решения',
  recentEmpty: 'Пока нет недавних решений. Начните с вопроса выше.',
  recentColumns: {
    title: 'Решение',
    type: 'Тип',
    status: 'Статус',
    confidence: 'Уверенность',
    date: 'Дата',
  },
  unknownDecisionType: 'Брифинг решения',
  energyTitle: 'Энергия сегодня',
  energyDescription: 'Сигнал готовности к важным решениям сегодня.',
  energyBestWindow: 'Лучшее окно',
  energySeeDetails: 'Подробнее',
  energyLoading: 'Вычисление…',
  energyUnavailable: 'Настройте тайминг на экране Today для живой оценки.',
  timingTitle: 'Лучшее время решить',
  timingBestWindow: 'Лучшее окно',
  timingEmpty: 'Почасовой тайминг сейчас недоступен.',
  timingLoading: 'Загрузка шкалы…',
  howTitle: 'Как работает Ask',
  howSteps: [
    {
      id: 'share',
      title: 'Поделиться',
      description: 'Опишите решение своими словами.',
    },
    {
      id: 'analyze',
      title: 'Анализ',
      description: 'Мы структурируем контекст, тайминг и компромиссы.',
    },
    {
      id: 'guide',
      title: 'Направление',
      description: 'Вы получаете ясность — решение остаётся за вами.',
    },
  ],
  agencyLine1: 'METIORO никогда не решает.',
  agencyLine2: 'Решает всегда человек.',
  guidedTopicsLabel: 'Предложенные темы',
  newDecision: 'Новое решение',
  charCounter: (count, max) => `${count} из ${max} символов`,
};

const ASK_HOME_FA: AskHomeCopy = {
  heroTitle: 'امروز برای کدام تصمیم کمک می‌خواهید؟',
  heroSubtitle:
    'تصمیم را با کلمات خودتان بنویسید. قدم‌به‌قدم راهنمایی‌تان می‌کنیم.',
  searchPlaceholder: 'دارم فکر می‌کنم به…',
  searchAriaLabel: 'تصمیم خود را توصیف کنید',
  searchSubmitAria: 'شروع جریان تصمیم',
  popularTitle: 'تصمیم‌های پرتکرار',
  seeAllDecisions: 'همه تصمیم‌ها',
  showPopularOnly: 'پرتکرارها',
  popularAvailableBadge: 'فعال',
  popularUnavailableBadge: 'به‌زودی',
  entryTitle: 'ورود به تصمیم',
  entryModes: [
    {
      id: 'help-me-decide',
      title: 'کمکم کن تصمیم بگیرم',
      description:
        'موضوع‌های تصمیم را مرور کنید. تصمیم‌های زمان‌بندی پشتیبانی‌شده قابل تحلیل‌اند؛ بقیه فعلاً در دسترس نیستند.',
    },
    {
      id: 'ask-anything',
      title: 'هر چیزی بپرس',
      description:
        'تصمیم را با کلمات خودتان بنویسید. امروز فقط انواع تصمیم پشتیبانی‌شده تحلیل می‌شوند.',
    },
  ],
  recentTitle: 'تصمیم‌های اخیر',
  recentEmpty: 'هنوز تصمیم اخیری نیست. از سؤال بالا شروع کنید.',
  recentColumns: {
    title: 'تصمیم',
    type: 'نوع',
    status: 'وضعیت',
    confidence: 'اطمینان',
    date: 'تاریخ',
  },
  unknownDecisionType: 'خلاصه تصمیم',
  energyTitle: 'انرژی امروز',
  energyDescription: 'نشانه آمادگی برای تصمیم‌های مهم امروز.',
  energyBestWindow: 'بهترین بازه',
  energySeeDetails: 'جزئیات',
  energyLoading: 'در حال محاسبه…',
  energyUnavailable: 'برای امتیاز زنده، زمان‌بندی را در Today تنظیم کنید.',
  timingTitle: 'بهترین زمان تصمیم',
  timingBestWindow: 'بهترین بازه',
  timingEmpty: 'زمان‌بندی ساعتی در دسترس نیست.',
  timingLoading: 'بارگذاری خط زمان…',
  howTitle: 'Ask چگونه کار می‌کند',
  howSteps: [
    {
      id: 'share',
      title: 'اشتراک',
      description: 'تصمیم را با کلمات خودتان بگویید.',
    },
    {
      id: 'analyze',
      title: 'تحلیل',
      description: 'زمینه، زمان‌بندی و بده‌بستان‌ها ساخت‌یافته می‌شوند.',
    },
    {
      id: 'guide',
      title: 'راهنمایی',
      description: 'شفافیت می‌گیرید — تصمیم با شماست.',
    },
  ],
  agencyLine1: 'METIORO هرگز تصمیم نمی‌گیرد.',
  agencyLine2: 'انسان همیشه تصمیم می‌گیرد.',
  guidedTopicsLabel: 'موضوعات پیشنهادی',
  newDecision: 'تصمیم جدید',
  charCounter: (count, max) => `${count} از ${max} نویسه`,
};

const ASK_HOME_AR: AskHomeCopy = {
  heroTitle: 'أي قرار تحتاج مساعدة فيه اليوم؟',
  heroSubtitle: 'صف قرارك بكلماتك. سنرشدك خطوة بخطوة.',
  searchPlaceholder: 'أفكّر في…',
  searchAriaLabel: 'صف قرارك',
  searchSubmitAria: 'ابدأ مسار القرار',
  popularTitle: 'قرارات شائعة',
  seeAllDecisions: 'كل القرارات',
  showPopularOnly: 'الشائعة',
  popularAvailableBadge: 'متاح',
  popularUnavailableBadge: 'قريباً',
  entryTitle: 'مدخل القرار',
  entryModes: [
    {
      id: 'help-me-decide',
      title: 'ساعدني لأقرّر',
      description:
        'تصفّح موضوعات القرار. قرارات التوقيت المدعومة يمكن تحليلها؛ الباقي غير متاح بعد.',
    },
    {
      id: 'ask-anything',
      title: 'اسأل أي شيء',
      description:
        'صف قرارك بكلماتك. التحليل متاح اليوم لأنواع القرار المدعومة فقط.',
    },
  ],
  recentTitle: 'قرارات حديثة',
  recentEmpty: 'لا قرارات حديثة بعد. ابدأ بسؤال أعلاه.',
  recentColumns: {
    title: 'القرار',
    type: 'النوع',
    status: 'الحالة',
    confidence: 'الثقة',
    date: 'التاريخ',
  },
  unknownDecisionType: 'ملخص القرار',
  energyTitle: 'طاقة اليوم',
  energyDescription: 'إشارة جاهزية لاتخاذ قرارات مهمة اليوم.',
  energyBestWindow: 'أفضل نافذة',
  energySeeDetails: 'التفاصيل',
  energyLoading: 'جاري الحساب…',
  energyUnavailable: 'اضبط التوقيت في Today لدرجة مباشرة.',
  timingTitle: 'أفضل وقت للقرار',
  timingBestWindow: 'أفضل نافذة',
  timingEmpty: 'التوقيت بالساعة غير متاح الآن.',
  timingLoading: 'تحميل الخط الزمني…',
  howTitle: 'كيف يعمل اسأل',
  howSteps: [
    {
      id: 'share',
      title: 'شارك',
      description: 'صف القرار بكلماتك.',
    },
    {
      id: 'analyze',
      title: 'حلّل',
      description: 'ننظّم السياق والتوقيت والمقايضات.',
    },
    {
      id: 'guide',
      title: 'أرشد',
      description: 'تحصل على وضوح — والقرار يبقى لك.',
    },
  ],
  agencyLine1: 'METIORO لا يقرّر أبداً.',
  agencyLine2: 'الإنسان يقرّر دائماً.',
  guidedTopicsLabel: 'مواضيع مقترحة',
  newDecision: 'قرار جديد',
  charCounter: (count, max) => `${count} من ${max} حرفاً`,
};

export const ASK_HOME_LANGS: Record<AppLang, AskHomeCopy> = {
  en: ASK_HOME_EN,
  ru: ASK_HOME_RU,
  fa: ASK_HOME_FA,
  ar: ASK_HOME_AR,
};

export function getAskHomeCopy(lang: AppLang): AskHomeCopy {
  return ASK_HOME_LANGS[lang] ?? ASK_HOME_LANGS.en;
}
