import type { AppLang } from './app-settings';

export type CalendarPageLangPack = {
  dir: 'ltr' | 'rtl';
  title: string;
  subtitle: string;
  prev: string;
  next: string;
  loading: string;
  noProfile: string;
  goProfile: string;
  noCurrentLocation: string;
  timingLocation: string;
  selected: string;
  hourly: string;
  golden: string;
  danger: string;
  neutral: string;
  export: string;
  exportAll: string;
  exportImportant: string;
  exportNotify: string;
  exportDownload: string;
  exportDisabled: string;
  score: string;
  dayScore: string;
  whyTiming: string;
  /** Shown when producer reasoning is not in the active UI language. */
  whyTimingFallback: string;
  supportingReasons: string;
  seeDetails: string;
  hideDetails: string;
  advancedDetails: string;
  uncertaintyDisclosure: string;
  weekdays: string[];
  nav: Record<string, string>;
  months: string[];
  insight: {
    decisionPowerScore: string;
    powerDistribution: string;
    weeklyTrend: string;
    avg: string;
    excellent: string;
    good: string;
    moderate: string;
    low: string;
    /** Default / `other` template. Prefer `bandCountForms` for plural-sensitive locales. */
    bandCount: string;
    /**
     * Optional CLDR plural forms for `{count} … ({percent}…)`.
     * `formatBandDayCount` selects with `Intl.PluralRules`; missing categories
     * fall back to `other`, then `bandCount`.
     */
    bandCountForms?: Partial<Record<Intl.LDMLPluralRule, string>>;
    weekBest: string;
    monthBest: string;
    viewWeek: string;
    selectedDayInsight: string;
    bestWindow: string;
    riskWindow: string;
    selectDayForHourly: string;
    agencyFooter: string;
  };
  legend: {
    title: string;
    hint: string;
    bands: { range: string; label: string; color: string }[];
  };
  transit: {
    title: string;
    hint: string;
    retrograde: string;
    in: string;
    house: string;
    empty: string;
    detailsSummary: string;
    detailsPlace: string;
    detailsLocalTime: string;
    detailsUtc: string;
    detailsTimezone: string;
  };
  signs: string[];
  planets: Record<string, string>;
};

export const CALENDAR_PAGE_LANGS: Record<AppLang, CalendarPageLangPack> = {
  en: {
    dir: 'ltr',
    title: 'Strategic Calendar',
    subtitle: 'Know when to move. Plan with greater clarity.',
    prev: 'Prev',
    next: 'Next',
    loading: 'Analyzing…',
    noProfile: 'Set your birth data on Profile first.',
    goProfile: 'Go to Profile',
    noCurrentLocation:
      'Add your current living city in Profile — calendar timing uses where you live now, not your birth city.',
    timingLocation: 'Timing location',
    selected: 'Selected day',
    hourly: 'Hourly timeline',
    golden: 'Strong window',
    danger: 'Danger zone',
    neutral: 'Neutral',
    export: 'Export',
    exportAll: 'All events (every scored day)',
    exportImportant: 'Important only (85+ and 0–39)',
    exportNotify: 'App notifications only',
    exportDownload: 'Download .ics',
    exportDisabled: 'Enable an export option above to download.',
    score: 'Score',
    dayScore: 'Day score',
    whyTiming: 'Why this timing',
    whyTimingFallback:
      'A localized timing explanation is not available for this day.',
    supportingReasons: 'Supporting details',
    seeDetails: 'See details',
    hideDetails: 'Hide details',
    advancedDetails: 'Advanced details',
    uncertaintyDisclosure: 'Timing scores are relative estimates, not guarantees.',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    nav: {
      '/dashboard': 'Dashboard',
      '/calendar': 'Calendar',
      '/people': 'People',
      '/profile': 'Profile',
    },
    months: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    legend: {
      title: 'What the numbers mean',
      hint: 'Each cell shows your daily readiness score (0–100) for this action.',
      bands: [
        { range: '85–100', label: 'Stronger window to consider action', color: '#4ade80' },
        { range: '60–84', label: 'Favorable — good window to proceed', color: '#fbbf24' },
        { range: '40–59', label: 'Neutral — proceed carefully', color: '#fb923c' },
        { range: '0–39', label: 'Lower-readiness window; delay if practical', color: '#f87171' },
      ],
    },
    insight: {
      decisionPowerScore: 'Decision power score',
      powerDistribution: 'Power distribution',
      weeklyTrend: 'Weekly trend',
      avg: 'Avg',
      excellent: 'Excellent (85–100)',
      good: 'Good (70–84)',
      moderate: 'Moderate (50–69)',
      low: 'Low (0–49)',
      bandCount: '{count} days ({percent}%)',
      bandCountForms: {
        one: '{count} day ({percent}%)',
        other: '{count} days ({percent}%)',
      },
      weekBest: 'Week best',
      monthBest: 'Month best',
      viewWeek: 'View week',
      selectedDayInsight: 'Selected day insight',
      bestWindow: 'Best window',
      riskWindow: 'Risk window',
      selectDayForHourly: 'Select a day to load hourly guidance.',
      agencyFooter:
        'Scores are calculated from celestial and behavioral factors. You always make the final decision.',
    },
    transit: {
      title: 'Sky on this day',
      hint: 'Planetary positions for the selected day at local noon where you live.',
      retrograde: 'Retrograde',
      in: 'in',
      house: 'House',
      empty: 'No transit data yet.',
      detailsSummary: 'Calculation details',
      detailsPlace: 'Living location',
      detailsLocalTime: 'Local time used',
      detailsUtc: 'UTC instant',
      detailsTimezone: 'Timezone',
    },
    signs: [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
    ],
    planets: {
      sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
      jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
      pluto: 'Pluto', north_node: 'North Node',
    },
  },
  ru: {
    dir: 'ltr',
    title: 'Стратегический календарь',
    subtitle: 'Знайте, когда действовать. Планируйте яснее.',
    prev: 'Назад',
    next: 'Вперёд',
    loading: 'Анализ…',
    noProfile: 'Сначала укажите данные рождения в Профиле.',
    goProfile: 'В профиль',
    noCurrentLocation:
      'Добавьте текущий город в Профиле — календарь использует место проживания, а не город рождения.',
    timingLocation: 'Город для тайминга',
    selected: 'Выбранный день',
    hourly: 'Почасовой таймлайн',
    golden: 'Сильное окно',
    danger: 'Опасная зона',
    neutral: 'Нейтрально',
    export: 'Экспорт',
    exportAll: 'Все события (каждый день со счётом)',
    exportImportant: 'Только важные (85+ и 0–39)',
    exportNotify: 'Только уведомления в приложении',
    exportDownload: 'Скачать .ics',
    exportDisabled: 'Выберите режим экспорта выше.',
    score: 'Счёт',
    dayScore: 'Счёт дня',
    whyTiming: 'Почему этот тайминг',
    whyTimingFallback: 'Локализованное объяснение тайминга для этого дня недоступно.',
    supportingReasons: 'Дополнительные детали',
    seeDetails: 'Показать детали',
    hideDetails: 'Скрыть детали',
    advancedDetails: 'Расширенные детали',
    uncertaintyDisclosure: 'Оценки тайминга относительны и не являются гарантией.',
    weekdays: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    nav: {
      '/dashboard': 'Панель',
      '/calendar': 'Календарь',
      '/people': 'Люди',
      '/profile': 'Профиль',
    },
    months: [
      'Январь',
      'Февраль',
      'Март',
      'Апрель',
      'Май',
      'Июнь',
      'Июль',
      'Август',
      'Сентябрь',
      'Октябрь',
      'Ноябрь',
      'Декабрь',
    ],
    legend: {
      title: 'Что означают числа',
      hint: 'Каждая ячейка — ваш балл готовности (0–100) для этого действия.',
      bands: [
        { range: '85–100', label: 'Более сильное окно для рассмотрения действия', color: '#4ade80' },
        { range: '60–84', label: 'Благоприятно — хорошее окно', color: '#fbbf24' },
        { range: '40–59', label: 'Нейтрально — осторожно', color: '#fb923c' },
        { range: '0–39', label: 'Низкая готовность; отложите, если можно', color: '#f87171' },
      ],
    },
    insight: {
      decisionPowerScore: 'Оценка силы решения',
      powerDistribution: 'Распределение силы',
      weeklyTrend: 'Недельный тренд',
      avg: 'Ср.',
      excellent: 'Отлично (85–100)',
      good: 'Хорошо (70–84)',
      moderate: 'Умеренно (50–69)',
      low: 'Низко (0–49)',
      bandCount: '{count} дн. ({percent}%)',
      weekBest: 'Лучший день недели',
      monthBest: 'Лучший день месяца',
      viewWeek: 'Показать неделю',
      selectedDayInsight: 'Обзор выбранного дня',
      bestWindow: 'Лучшее окно',
      riskWindow: 'Рискованное окно',
      selectDayForHourly: 'Выберите день, чтобы загрузить почасовые подсказки.',
      agencyFooter:
        'Оценки рассчитаны по небесным и поведенческим факторам. Итоговое решение всегда за вами.',
    },
    transit: {
      title: 'Небо в этот день',
      hint: 'Положения планет на выбранный день в полдень по месту проживания.',
      retrograde: 'Ретроград',
      in: 'в',
      house: 'Дом',
      empty: 'Данных о транзитах пока нет.',
      detailsSummary: 'Детали расчёта',
      detailsPlace: 'Место проживания',
      detailsLocalTime: 'Местное время',
      detailsUtc: 'Момент UTC',
      detailsTimezone: 'Часовой пояс',
    },
    signs: [
      'Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева',
      'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы',
    ],
    planets: {
      sun: 'Солнце', moon: 'Луна', mercury: 'Меркурий', venus: 'Венера', mars: 'Марс',
      jupiter: 'Юпитер', saturn: 'Сатурн', uranus: 'Уран', neptune: 'Нептун',
      pluto: 'Плутон', north_node: 'Сев. узел',
    },
  },
  fa: {
    dir: 'rtl',
    title: 'تقویم استراتژیک',
    subtitle: 'بدانید کی حرکت کنید. با وضوح بیشتر برنامه‌ریزی کنید.',
    prev: 'قبلی',
    next: 'بعدی',
    loading: 'در حال تحلیل…',
    noProfile: 'ابتدا اطلاعات تولد را در پروفایل وارد کنید.',
    goProfile: 'رفتن به پروفایل',
    noCurrentLocation:
      'شهر محل زندگی فعلی را در پروفایل اضافه کن — تقویم از محل زندگی فعلی استفاده می‌کند، نه شهر تولد.',
    timingLocation: 'مکان زمان‌بندی',
    selected: 'روز انتخاب‌شده',
    hourly: 'خط زمانی ساعتی',
    golden: 'پنجره قوی',
    danger: 'منطقه خطر',
    neutral: 'خنثی',
    export: 'خروجی',
    exportAll: 'همه رویدادها (هر روز با امتیاز)',
    exportImportant: 'فقط مهم (۸۵+ و ۰–۳۹)',
    exportNotify: 'فقط اعلان در برنامه',
    exportDownload: 'دانلود .ics',
    exportDisabled: 'یک گزینه خروجی بالا را انتخاب کنید.',
    score: 'امتیاز',
    dayScore: 'امتیاز روز',
    whyTiming: 'چرا این زمان‌بندی',
    whyTimingFallback: 'توضیح فارسی این زمان‌بندی برای این روز در دسترس نیست.',
    supportingReasons: 'جزئیات پشتیبان',
    seeDetails: 'دیدن جزئیات',
    hideDetails: 'پنهان کردن جزئیات',
    advancedDetails: 'جزئیات پیشرفته',
    uncertaintyDisclosure: 'امتیازهای زمان‌بندی برآورد نسبی‌اند، نه تضمین.',
    weekdays: ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'],
    nav: {
      '/dashboard': 'داشبورد',
      '/calendar': 'تقویم',
      '/people': 'افراد',
      '/profile': 'پروفایل',
    },
    months: [
      'ژانویه',
      'فوریه',
      'مارس',
      'آوریل',
      'مه',
      'ژوئن',
      'ژوئیه',
      'اوت',
      'سپتامبر',
      'اکتبر',
      'نوامبر',
      'دسامبر',
    ],
    legend: {
      title: 'معنای اعداد',
      hint: 'هر خانه امتیاز آمادگی روزانه شما (۰ تا ۱۰۰) برای این اقدام است.',
      bands: [
        { range: '۸۵ تا ۱۰۰', label: 'پنجره قوی‌تر برای در نظر گرفتن اقدام', color: '#4ade80' },
        { range: '۶۰ تا ۸۴', label: 'مساعد — پنجره مناسب برای ادامه', color: '#fbbf24' },
        { range: '۴۰ تا ۵۹', label: 'خنثی — با احتیاط', color: '#fb923c' },
        { range: '۰ تا ۳۹', label: 'آمادگی پایین‌تر؛ در صورت امکان به تعویق بیندازید', color: '#f87171' },
      ],
    },
    insight: {
      decisionPowerScore: 'امتیاز قدرت تصمیم',
      powerDistribution: 'توزیع قدرت',
      weeklyTrend: 'روند هفتگی',
      avg: 'میانگین',
      excellent: 'عالی (۸۵–۱۰۰)',
      good: 'خوب (۷۰–۸۴)',
      moderate: 'متوسط (۵۰–۶۹)',
      low: 'پایین (۰–۴۹)',
      bandCount: '{count} روز ({percent}٪)',
      weekBest: 'بهترین روز هفته',
      monthBest: 'بهترین روز ماه',
      viewWeek: 'دیدن هفته',
      selectedDayInsight: 'بینش روز انتخاب‌شده',
      bestWindow: 'بهترین بازه',
      riskWindow: 'بازهٔ ریسک',
      selectDayForHourly: 'یک روز را انتخاب کنید تا راهنمای ساعتی بارگذاری شود.',
      agencyFooter:
        'امتیازها از عوامل آسمانی و رفتاری محاسبه می‌شوند. تصمیم نهایی همیشه با شماست.',
    },
    transit: {
      title: 'آسمان این روز',
      hint: 'موقعیت سیارات برای روز انتخاب‌شده در ظهر محلی محل زندگی شما.',
      retrograde: 'برگشتی',
      in: 'در',
      house: 'خانه',
      empty: 'هنوز داده‌ای از ترانزیت‌ها نیست.',
      detailsSummary: 'جزئیات محاسبه',
      detailsPlace: 'محل زندگی',
      detailsLocalTime: 'زمان محلی استفاده‌شده',
      detailsUtc: 'لحظهٔ UTC',
      detailsTimezone: 'منطقهٔ زمانی',
    },
    signs: [
      'حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله',
      'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت',
    ],
    planets: {
      sun: 'خورشید', moon: 'ماه', mercury: 'عطارد', venus: 'زهره', mars: 'مریخ',
      jupiter: 'مشتری', saturn: 'زحل', uranus: 'اورانوس', neptune: 'نپتون',
      pluto: 'پلوتو', north_node: 'گره شمالی',
    },
  },
  ar: {
    dir: 'rtl',
    title: 'التقويم الاستراتيجي',
    subtitle: 'اعرف متى تتحرك. خطط بوضوح أكبر.',
    prev: 'السابق',
    next: 'التالي',
    loading: 'جاري التحليل…',
    noProfile: 'أدخل بيانات الميلاد في الملف أولاً.',
    goProfile: 'الذهاب للملف',
    noCurrentLocation:
      'أضف مدينة إقامتك الحالية في الملف — التقويم يستخدم مكان إقامتك الآن وليس مدينة الميلاد.',
    timingLocation: 'موقع التوقيت',
    selected: 'اليوم المحدد',
    hourly: 'الجدول الزمني بالساعة',
    golden: 'نافذة قوية',
    danger: 'منطقة خطر',
    neutral: 'محايد',
    export: 'تصدير',
    exportAll: 'كل الأحداث (كل يوم بدرجة)',
    exportImportant: 'المهم فقط (85+ و 0–39)',
    exportNotify: 'إشعارات التطبيق فقط',
    exportDownload: 'تنزيل .ics',
    exportDisabled: 'اختر خيار تصدير أعلاه.',
    score: 'الدرجة',
    dayScore: 'درجة اليوم',
    whyTiming: 'لماذا هذا التوقيت',
    whyTimingFallback: 'الشرح المحلي لهذا التوقيت غير متاح لهذا اليوم.',
    supportingReasons: 'تفاصيل داعمة',
    seeDetails: 'عرض التفاصيل',
    hideDetails: 'إخفاء التفاصيل',
    advancedDetails: 'تفاصيل متقدمة',
    uncertaintyDisclosure: 'درجات التوقيت تقديرات نسبية وليست ضمانات.',
    weekdays: ['أح', 'إث', 'ث', 'أر', 'خ', 'ج', 'س'],
    nav: {
      '/dashboard': 'لوحة',
      '/calendar': 'التقويم',
      '/people': 'الأشخاص',
      '/profile': 'الملف',
    },
    months: [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ],
    legend: {
      title: 'معنى الأرقام',
      hint: 'كل خلية تظهر درجة جاهزيتك اليومية (0–100) لهذا الإجراء.',
      bands: [
        { range: '85–100', label: 'نافذة أقوى للنظر في اتخاذ إجراء', color: '#4ade80' },
        { range: '60–84', label: 'مواتٍ — نافذة جيدة للمتابعة', color: '#fbbf24' },
        { range: '40–59', label: 'محايد — بحذر', color: '#fb923c' },
        { range: '0–39', label: 'جاهزية أقل؛ أجّل إن أمكن', color: '#f87171' },
      ],
    },
    insight: {
      decisionPowerScore: 'درجة قوة القرار',
      powerDistribution: 'توزيع القوة',
      weeklyTrend: 'الاتجاه الأسبوعي',
      avg: 'متوسط',
      excellent: 'ممتاز (85–100)',
      good: 'جيد (70–84)',
      moderate: 'متوسط (50–69)',
      low: 'منخفض (0–49)',
      bandCount: '{count} يوم ({percent}٪)',
      bandCountForms: {
        zero: '{count} يوم ({percent}٪)',
        one: '{count} يوم ({percent}٪)',
        two: 'يومان ({percent}٪)',
        few: '{count} أيام ({percent}٪)',
        many: '{count} يوماً ({percent}٪)',
        other: '{count} يوم ({percent}٪)',
      },
      weekBest: 'أفضل يوم في الأسبوع',
      monthBest: 'أفضل يوم في الشهر',
      viewWeek: 'عرض الأسبوع',
      selectedDayInsight: 'تحليل اليوم المحدد',
      bestWindow: 'أفضل نافذة',
      riskWindow: 'نافذة المخاطر',
      selectDayForHourly: 'اختر يوماً لتحميل الإرشاد الساعي.',
      agencyFooter:
        'تُحسب الدرجات من عوامل سماوية وسلوكية. القرار النهائي دائماً لك.',
    },
    transit: {
      title: 'سماء هذا اليوم',
      hint: 'مواقع الكواكب لليوم المحدد عند الظهيرة المحلية في مكان إقامتك.',
      retrograde: 'تراجعي',
      in: 'في',
      house: 'البيت',
      empty: 'لا توجد بيانات عبور بعد.',
      detailsSummary: 'تفاصيل الحساب',
      detailsPlace: 'مكان الإقامة',
      detailsLocalTime: 'الوقت المحلي المستخدم',
      detailsUtc: 'لحظة UTC',
      detailsTimezone: 'المنطقة الزمنية',
    },
    signs: [
      'الحمل', 'الثور', 'الجوزاء', 'السرطان', 'الأسد', 'العذراء',
      'الميزان', 'العقرب', 'القوس', 'الجدي', 'الدلو', 'الحوت',
    ],
    planets: {
      sun: 'الشمس', moon: 'القمر', mercury: 'عطارد', venus: 'الزهرة', mars: 'المريخ',
      jupiter: 'المشتري', saturn: 'زحل', uranus: 'أورانوس', neptune: 'نبتون',
      pluto: 'بلوتو', north_node: 'العقدة الشمالية',
    },
  },
};

const NUMBER_LOCALES: Record<AppLang, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  fa: 'fa-IR',
  ar: 'ar',
};

export function formatCalendarInteger(lang: AppLang, n: number): string {
  return new Intl.NumberFormat(NUMBER_LOCALES[lang], {
    useGrouping: false,
  }).format(n);
}

export function formatBandDayCount(
  lang: AppLang,
  count: number,
  percent: number
): string {
  const pack = CALENDAR_PAGE_LANGS[lang].insight;
  const category = new Intl.PluralRules(NUMBER_LOCALES[lang]).select(
    Math.abs(count)
  );
  const template =
    pack.bandCountForms?.[category] ??
    pack.bandCountForms?.other ??
    pack.bandCount;
  return template
    .replace('{count}', formatCalendarInteger(lang, count))
    .replace('{percent}', formatCalendarInteger(lang, percent));
}
