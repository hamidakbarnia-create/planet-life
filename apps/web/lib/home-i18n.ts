import type { AppLang, HomeViewMode } from './app-settings';

export const HOME_LANGS: Record<
  AppLang,
  {
    dir: 'ltr' | 'rtl';
    nav: Record<string, string>;
    onboardingTitle: string;
    onboardingSub: string;
    optionA: string;
    optionADesc: string;
    optionB: string;
    optionBDesc: string;
    optionC: string;
    optionCDesc: string;
    continueBtn: string;
    dailyBrief: string;
    todayScore: string;
    goldenHours: string;
    warnings: string;
    synergyAlerts: string;
    noGolden: string;
    noWarnings: string;
    noSynergy: string;
    askAi: string;
    askPlaceholder: string;
    askLoading: string;
    bestWindow: string;
    avoidWindow: string;
    whyTiming: string;
    whyTimingFallback: string;
    supportingReasons: string;
    calendarCta: string;
    hourlyLabel: string;
    noWindow: string;
    todayLabel: string;
    heatmapTitle: string;
    loading: string;
    calculatingScore: string;
    noProfile: string;
    goProfile: string;
    months: string[];
    weekdays: string[];
    settingsTitle: string;
    settingsSub: string;
    homeViewLabel: string;
    languageLabel: string;
    houseLabel: string;
    zodiacLabel: string;
    placidus: string;
    wholeSign: string;
    tropical: string;
    sidereal: string;
    calendarLabel: string;
    calendarGregorian: string;
    calendarShamsi: string;
    calendarHijri: string;
    saved: string;
    saveAll: string;
    discard: string;
    unsaved: string;
    viewLabels: Record<HomeViewMode, string>;
  }
> = {
  en: {
    dir: 'ltr',
    nav: {
      '/home': 'Today',
      '/calendar': 'Calendar',
      '/ask': 'Ask',
      '/people': 'People',
      '/pathfinder': 'Pathfinder',
      '/world': 'World',
      '/profile': 'My Profile',
      '/vault': 'Vault',
      '/dashboard': 'Dashboard',
      '/settings': 'Settings',
      '/upgrade': 'Upgrade',
      more: 'More',
      signIn: 'Sign in',
    },
    onboardingTitle: 'How do you want to start your day?',
    onboardingSub: 'Choose your default home screen. You can change this anytime in Settings.',
    optionA: 'Daily Brief',
    optionADesc: "Today's score, highlights, people, and Ask AI",
    optionB: 'Strategic Calendar',
    optionBDesc: 'Month heatmap with high-readiness and caution windows',
    optionC: 'Heatmap Monthly',
    optionCDesc: 'Full-width month heatmap at a glance',
    continueBtn: 'Continue',
    dailyBrief: 'Daily Brief',
    todayScore: "Today's decision score",
    goldenHours: 'High-readiness hours',
    warnings: 'Lower-readiness hours',
    synergyAlerts: 'Synergy alerts',
    noGolden: 'No high-readiness windows detected for today yet.',
    noWarnings: 'No lower-readiness windows flagged for today.',
    noSynergy: 'No synergy alerts — add people to track alignment.',
    askAi: 'Ask AI',
    askPlaceholder: 'What should I focus on today?',
    askLoading: 'Analyzing…',
    bestWindow: 'Best window',
    avoidWindow: 'Lower-readiness window',
    whyTiming: 'Why this timing',
    whyTimingFallback:
      'A localized timing explanation is not available for this day.',
    supportingReasons: 'Supporting details',
    calendarCta: 'Open Calendar for more detail',
    hourlyLabel: 'Hourly outlook',
    noWindow: '—',
    todayLabel: 'Today',
    heatmapTitle: 'Monthly heatmap',
    loading: 'Analyzing…',
    calculatingScore: 'Calculating…',
    noProfile: 'Set up profile first',
    goProfile: 'Go to Profile',
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    settingsTitle: 'Settings',
    settingsSub: 'Personalize your METIORO experience',
    homeViewLabel: 'Default home view',
    languageLabel: 'Language',
    houseLabel: 'House system',
    zodiacLabel: 'Zodiac',
    placidus: 'Placidus',
    wholeSign: 'Whole Sign',
    tropical: 'Tropical',
    sidereal: 'Sidereal',
    calendarLabel: 'Calendar',
    calendarGregorian: 'Gregorian',
    calendarShamsi: 'Solar Hijri (Shamsi)',
    calendarHijri: 'Lunar Hijri (Ghamari)',
    saved: 'Saved ✓',
    saveAll: 'Save changes',
    discard: 'Discard',
    unsaved: 'Unsaved changes',
    viewLabels: {
      'daily-brief': 'Daily Brief',
      calendar: 'Strategic Calendar',
      heatmap: 'Heatmap Monthly',
    },
  },
  ru: {
    dir: 'ltr',
    nav: {
      '/home': 'Сегодня',
      '/calendar': 'Календарь',
      '/ask': 'Спросить',
      '/people': 'Люди',
      '/pathfinder': 'Маршрут',
      '/world': 'Мир',
      '/profile': 'Мой профиль',
      '/vault': 'Хранилище',
      '/dashboard': 'Панель',
      '/settings': 'Настройки',
      '/upgrade': 'Тариф',
      more: 'Ещё',
      signIn: 'Войти',
    },
    onboardingTitle: 'Как вы хотите начинать день?',
    onboardingSub: 'Выберите экран по умолчанию. Изменить можно в Настройках.',
    optionA: 'Обзор на день',
    optionADesc: 'Оценка дня, главные акценты, люди а так же задать свой вопрос',
    optionB: 'Стратегический календарь',
    optionBDesc: 'Транзитные календари с окнами высокой и низкой готовности',
    optionC: 'Транзитные календари',
    optionCDesc: 'Полноэкранный транзитный календарь как главный экран',
    continueBtn: 'Продолжить',
    dailyBrief: 'Обзор на день',
    todayScore: 'Оценка решений на сегодня',
    goldenHours: 'Часы высокой готовности',
    warnings: 'Часы низкой готовности',
    synergyAlerts: 'Синергия',
    noGolden: 'Окна высокой готовности на сегодня пока не найдены.',
    noWarnings: 'Окна низкой готовности на сегодня не отмечены.',
    noSynergy: 'Нет алертов — добавьте людей для синергии.',
    askAi: 'Спросить AI',
    askPlaceholder: 'На чём сфокусироваться сегодня?',
    askLoading: 'Анализ…',
    bestWindow: 'Лучшее окно',
    avoidWindow: 'Окно низкой готовности',
    whyTiming: 'Почему этот тайминг',
    whyTimingFallback: 'Локализованное объяснение тайминга для этого дня недоступно.',
    supportingReasons: 'Дополнительные детали',
    calendarCta: 'Открыть календарь для деталей',
    hourlyLabel: 'Часовой прогноз',
    noWindow: '—',
    todayLabel: 'Сегодня',
    heatmapTitle: 'Транзитные календари',
    loading: 'Анализ…',
    calculatingScore: 'Вычисление…',
    noProfile: 'Сначала укажите данные рождения в Профиле.',
    goProfile: 'В профиль',
    months: [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
    ],
    weekdays: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    settingsTitle: 'Настройки',
    settingsSub: 'Настройте METIORO под себя',
    homeViewLabel: 'Главный экран',
    languageLabel: 'Язык',
    houseLabel: 'Система домов',
    zodiacLabel: 'Зодиак',
    placidus: 'Плацидус',
    wholeSign: 'Целознаковые дома',
    tropical: 'Тропический',
    sidereal: 'Сидерический',
    calendarLabel: 'Календарь',
    calendarGregorian: 'Григорианский',
    calendarShamsi: 'Солнечная хиджра (Шамси)',
    calendarHijri: 'Лунная хиджра (Камари)',
    saved: 'Сохранено ✓',
    saveAll: 'Сохранить',
    discard: 'Отменить',
    unsaved: 'Несохранённые изменения',
    viewLabels: {
      'daily-brief': 'Обзор на день',
      calendar: 'Стратегический календарь',
      heatmap: 'Транзитные календари',
    },
  },
  fa: {
    dir: 'rtl',
    nav: {
      '/home': 'امروز',
      '/calendar': 'تقویم',
      '/ask': 'طرح پرسش',
      '/people': 'افراد',
      '/pathfinder': 'مسیر',
      '/world': 'جهان',
      '/profile': 'پروفایل من',
      '/vault': 'محرمانه',
      '/dashboard': 'داشبورد',
      '/settings': 'تنظیمات',
      '/upgrade': 'ارتقا',
      more: 'بیشتر',
      signIn: 'ورود',
    },
    onboardingTitle: 'چطور می‌خواهید روزتان را شروع کنید؟',
    onboardingSub: 'صفحهٔ پیش‌فرض را انتخاب کنید. هر زمان در تنظیمات قابل تغییر است.',
    optionA: 'خلاصه روزانه',
    optionADesc: 'امتیاز امروز، نکات، افراد و پرسش از AI',
    optionB: 'تقویم استراتژیک',
    optionBDesc: 'نقشه حرارتی ماه با پنجره‌های آمادگی بالا و پایین',
    optionC: 'نقشه حرارتی ماهانه',
    optionCDesc: 'نقشه حرارتی تمام‌عرض در خانه',
    continueBtn: 'ادامه',
    dailyBrief: 'خلاصه روزانه',
    todayScore: 'امتیاز تصمیم امروز',
    goldenHours: 'ساعات آمادگی بالا',
    warnings: 'ساعات آمادگی پایین',
    synergyAlerts: 'هشدارهای هم‌افزایی',
    noGolden: 'هنوز بازهٔ آمادگی بالا برای امروز پیدا نشده.',
    noWarnings: 'بازهٔ آمادگی پایین برای امروز ثبت نشده.',
    noSynergy: 'هشداری نیست — افراد را اضافه کنید.',
    askAi: 'پرسش از هوش مصنوعی',
    askPlaceholder: 'امروز روی چه چیزی تمرکز کنم؟',
    askLoading: 'در حال تحلیل…',
    bestWindow: 'بهترین بازه',
    avoidWindow: 'بازهٔ آمادگی پایین',
    whyTiming: 'چرا این زمان‌بندی',
    whyTimingFallback: 'توضیح فارسی این زمان‌بندی برای این روز در دسترس نیست.',
    supportingReasons: 'جزئیات پشتیبان',
    calendarCta: 'باز کردن تقویم برای جزئیات بیشتر',
    hourlyLabel: 'پیش‌بینی ساعتی',
    noWindow: '—',
    todayLabel: 'امروز',
    heatmapTitle: 'نقشه حرارتی ماهانه',
    loading: 'در حال تحلیل…',
    calculatingScore: 'در حال محاسبه...',
    noProfile: 'ابتدا اطلاعات تولد را در پروفایل وارد کنید.',
    goProfile: 'رفتن به پروفایل',
    months: [
      'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
      'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر',
    ],
    weekdays: ['یک', 'دو', 'سه', 'چه', 'پن', 'جم', 'شن'],
    settingsTitle: 'تنظیمات',
    settingsSub: 'تجربه METIORO را شخصی‌سازی کنید',
    homeViewLabel: 'نمای پیش‌فرض خانه',
    languageLabel: 'زبان',
    houseLabel: 'سیستم خانه‌ها',
    zodiacLabel: 'زودیاک',
    placidus: 'پلاسیدوس',
    wholeSign: 'برج کامل',
    tropical: 'استوایی',
    sidereal: 'نجومی',
    calendarLabel: 'تقویم',
    calendarGregorian: 'میلادی',
    calendarShamsi: 'هجری شمسی',
    calendarHijri: 'هجری قمری',
    saved: 'ذخیره شد ✓',
    saveAll: 'ذخیره تغییرات',
    discard: 'لغو',
    unsaved: 'تغییرات ذخیره‌نشده',
    viewLabels: {
      'daily-brief': 'خلاصه روزانه',
      calendar: 'تقویم استراتژیک',
      heatmap: 'نقشه حرارتی ماهانه',
    },
  },
  ar: {
    dir: 'rtl',
    nav: {
      '/home': 'اليوم',
      '/calendar': 'التقويم',
      '/ask': 'إسأل',
      '/people': 'الأشخاص',
      '/pathfinder': 'المسار',
      '/world': 'العالم',
      '/profile': 'ملفي الشخصي',
      '/vault': 'الخزانة',
      '/dashboard': 'لوحة التحكم',
      '/settings': 'الإعدادات',
      '/upgrade': 'ترقية',
      more: 'المزيد',
      signIn: 'تسجيل الدخول',
    },
    onboardingTitle: 'كيف تريد أن تبدأ يومك؟',
    onboardingSub: 'اختر الشاشة الافتراضية. يمكنك تغييرها في الإعدادات.',
    optionA: 'ملخص يومي',
    optionADesc: 'درجة اليوم، نقاط بارزة، أشخاص، واسأل AI',
    optionB: 'تقويم استراتيجي',
    optionBDesc: 'خريطة حرارية للشهر مع نوافذ جاهزية عالية ومنخفضة',
    optionC: 'خريطة حرارية شهرية',
    optionCDesc: 'خريطة حرارية بعرض كامل في الرئيسية',
    continueBtn: 'متابعة',
    dailyBrief: 'ملخص يومي',
    todayScore: 'درجة قرار اليوم',
    goldenHours: 'ساعات جاهزية عالية',
    warnings: 'ساعات جاهزية منخفضة',
    synergyAlerts: 'تنبيهات التآزر',
    noGolden: 'لم تُكتشف نوافذ جاهزية عالية لليوم بعد.',
    noWarnings: 'لا نوافذ جاهزية منخفضة لليوم.',
    noSynergy: 'لا تنبيهات — أضف أشخاصاً لتتبع التوافق.',
    askAi: 'اسأل AI',
    askPlaceholder: 'على ماذا أركز اليوم؟',
    askLoading: 'جاري التحليل…',
    bestWindow: 'أفضل نافذة',
    avoidWindow: 'نافذة جاهزية منخفضة',
    whyTiming: 'لماذا هذا التوقيت',
    whyTimingFallback: 'الشرح المحلي لهذا التوقيت غير متاح لهذا اليوم.',
    supportingReasons: 'تفاصيل داعمة',
    calendarCta: 'افتح التقويم لمزيد من التفاصيل',
    hourlyLabel: 'التوقع الساعي',
    noWindow: '—',
    todayLabel: 'اليوم',
    heatmapTitle: 'خريطة حرارية شهرية',
    loading: 'جاري التحليل…',
    calculatingScore: 'جاري الحساب…',
    noProfile: 'أدخل بيانات الميلاد في الملف أولاً.',
    goProfile: 'إلى الملف',
    months: [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
    ],
    weekdays: ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'],
    settingsTitle: 'الإعدادات',
    settingsSub: 'خصص تجربة METIORO',
    homeViewLabel: 'الشاشة الرئيسية الافتراضية',
    languageLabel: 'اللغة',
    houseLabel: 'نظام البيوت',
    zodiacLabel: 'الزودياك',
    placidus: 'بلاسيدوس',
    wholeSign: 'البروج الكاملة',
    tropical: 'استوائي',
    sidereal: 'النجمي',
    calendarLabel: 'التقويم',
    calendarGregorian: 'ميلادي',
    calendarShamsi: 'هجري شمسي',
    calendarHijri: 'هجري قمري',
    saved: 'تم الحفظ ✓',
    saveAll: 'حفظ التغييرات',
    discard: 'إلغاء',
    unsaved: 'تغييرات غير محفوظة',
    viewLabels: {
      'daily-brief': 'ملخص يومي',
      calendar: 'تقويم استراتيجي',
      heatmap: 'خريطة حرارية شهرية',
    },
  },
};
