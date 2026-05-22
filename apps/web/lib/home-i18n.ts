import type { AppLang, HomeViewMode, HouseSystem, ZodiacSystem } from './app-settings';

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
    hourlyLabel: string;
    noWindow: string;
    todayLabel: string;
    heatmapTitle: string;
    loading: string;
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
      '/calendar': 'Map',
      '/ask': 'Ask',
      '/people': 'People',
      '/world': 'World',
      '/profile': 'Me',
      '/vault': 'Vault',
      '/dashboard': 'Dashboard',
      '/settings': 'Settings',
    },
    onboardingTitle: 'How do you want to start your day?',
    onboardingSub: 'Choose your default home screen. You can change this anytime in Settings.',
    optionA: 'Daily Brief',
    optionADesc: "Today's score, highlights, people, and Ask AI",
    optionB: 'Strategic Calendar',
    optionBDesc: 'Month heatmap with golden and danger windows',
    optionC: 'Heatmap Monthly',
    optionCDesc: 'Full-width month heatmap at a glance',
    continueBtn: 'Continue',
    dailyBrief: 'Daily Brief',
    todayScore: "Today's cosmic score",
    goldenHours: 'Golden hours',
    warnings: 'Warnings',
    synergyAlerts: 'Synergy alerts',
    noGolden: 'No golden windows detected for today yet.',
    noWarnings: 'No danger zones flagged for today.',
    noSynergy: 'No synergy alerts — add people to track alignment.',
    askAi: 'Ask AI',
    askPlaceholder: 'What should I focus on today?',
    askLoading: 'Consulting the stars…',
    bestWindow: 'Best window',
    avoidWindow: 'Avoid',
    hourlyLabel: 'Hourly outlook',
    noWindow: '—',
    todayLabel: 'Today',
    heatmapTitle: 'Monthly heatmap',
    loading: 'Reading the sky…',
    noProfile: 'Set up profile first',
    goProfile: 'Go to Profile',
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    settingsTitle: 'Settings',
    settingsSub: 'Personalize your Planet Life experience',
    homeViewLabel: 'Default home view',
    languageLabel: 'Language',
    houseLabel: 'House system',
    zodiacLabel: 'Zodiac',
    placidus: 'Placidus',
    wholeSign: 'Whole Sign',
    tropical: 'Tropical',
    sidereal: 'Sidereal',
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
      '/calendar': 'Карта',
      '/ask': 'Оракул',
      '/people': 'Люди',
      '/world': 'Мир',
      '/profile': 'Я',
      '/vault': 'Хранилище',
      '/dashboard': 'Панель',
      '/settings': 'Настройки',
    },
    onboardingTitle: 'Как вы хотите начинать день?',
    onboardingSub: 'Выберите экран по умолчанию. Изменить можно в Настройках.',
    optionA: 'Обзор на день',
    optionADesc: 'Оценка дня, главные акценты, люди а так же задать свой вопрос',
    optionB: 'Стратегический календарь',
    optionBDesc: 'Транзитные календари с золотыми и опасными окнами месяца',
    optionC: 'Транзитные календари',
    optionCDesc: 'Полноэкранный транзитный календарь как главный экран',
    continueBtn: 'Продолжить',
    dailyBrief: 'Обзор на день',
    todayScore: 'Космическая оценка дня',
    goldenHours: 'Золотые часы',
    warnings: 'Предупреждения',
    synergyAlerts: 'Синергия',
    noGolden: 'Золотые окна на сегодня пока не найдены.',
    noWarnings: 'Опасные зоны на сегодня не отмечены.',
    noSynergy: 'Нет алертов — добавьте людей для синергии.',
    askAi: 'Спросить AI',
    askPlaceholder: 'На чём сфокусироваться сегодня?',
    askLoading: 'Читаем небо…',
    bestWindow: 'Лучшее окно',
    avoidWindow: 'Избегать',
    hourlyLabel: 'Часовой прогноз',
    noWindow: '—',
    todayLabel: 'Сегодня',
    heatmapTitle: 'Транзитные календари',
    loading: 'Читаем небо…',
    noProfile: 'Сначала укажите данные рождения в Профиле.',
    goProfile: 'В профиль',
    months: [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
    ],
    weekdays: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    settingsTitle: 'Настройки',
    settingsSub: 'Настройте Planet Life под себя',
    homeViewLabel: 'Главный экран',
    languageLabel: 'Язык',
    houseLabel: 'Система домов',
    zodiacLabel: 'Зодиак',
    placidus: 'Плацидус',
    wholeSign: 'Целознаковые дома',
    tropical: 'Тропический',
    sidereal: 'Сидерический',
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
      '/calendar': 'نقشه',
      '/ask': 'پرسش',
      '/people': 'افراد',
      '/world': 'جهان',
      '/profile': 'من',
      '/vault': 'محرمانه',
      '/dashboard': 'داشبورد',
      '/settings': 'تنظیمات',
    },
    onboardingTitle: 'چطور می‌خواهید روزتان را شروع کنید؟',
    onboardingSub: 'صفحهٔ پیش‌فرض را انتخاب کنید. هر زمان در تنظیمات قابل تغییر است.',
    optionA: 'خلاصه روزانه',
    optionADesc: 'امتیاز امروز، نکات، افراد و پرسش از AI',
    optionB: 'تقویم استراتژیک',
    optionBDesc: 'نقشه حرارتی ماه با پنجره‌های طلایی و خطر',
    optionC: 'نقشه حرارتی ماهانه',
    optionCDesc: 'نقشه حرارتی تمام‌عرض در خانه',
    continueBtn: 'ادامه',
    dailyBrief: 'خلاصه روزانه',
    todayScore: 'امتیاز کیهانی امروز',
    goldenHours: 'ساعات طلایی',
    warnings: 'هشدارها',
    synergyAlerts: 'هشدارهای هم‌افزایی',
    noGolden: 'هنوز پنجره طلایی برای امروز یافت نشد.',
    noWarnings: 'منطقه خطر برای امروز ثبت نشده.',
    noSynergy: 'هشداری نیست — افراد را اضافه کنید.',
    askAi: 'پرسش از هوش مصنوعی',
    askPlaceholder: 'امروز روی چه چیزی تمرکز کنم؟',
    askLoading: 'در حال خواندن آسمان…',
    bestWindow: 'بهترین پنجره',
    avoidWindow: 'پرهیز کنید',
    hourlyLabel: 'پیش‌بینی ساعتی',
    noWindow: '—',
    todayLabel: 'امروز',
    heatmapTitle: 'نقشه حرارتی ماهانه',
    loading: 'در حال خواندن آسمان…',
    noProfile: 'ابتدا اطلاعات تولد را در پروفایل وارد کنید.',
    goProfile: 'رفتن به پروفایل',
    months: [
      'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
      'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر',
    ],
    weekdays: ['یک', 'دو', 'سه', 'چه', 'پن', 'جم', 'شن'],
    settingsTitle: 'تنظیمات',
    settingsSub: 'تجربه Planet Life را شخصی‌سازی کنید',
    homeViewLabel: 'نمای پیش‌فرض خانه',
    languageLabel: 'زبان',
    houseLabel: 'سیستم خانه‌ها',
    zodiacLabel: 'زودیاک',
    placidus: 'پلاسیدوس',
    wholeSign: 'برج کامل',
    tropical: 'استوایی',
    sidereal: 'نجومی',
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
      '/calendar': 'الخريطة',
      '/ask': 'الاستشارة',
      '/people': 'الأشخاص',
      '/world': 'العالم',
      '/profile': 'أنا',
      '/vault': 'الخزانة',
      '/dashboard': 'لوحة التحكم',
      '/settings': 'الإعدادات',
    },
    onboardingTitle: 'كيف تريد أن تبدأ يومك؟',
    onboardingSub: 'اختر الشاشة الافتراضية. يمكنك تغييرها في الإعدادات.',
    optionA: 'ملخص يومي',
    optionADesc: 'درجة اليوم، نقاط بارزة، أشخاص، واسأل AI',
    optionB: 'تقويم استراتيجي',
    optionBDesc: 'خريطة حرارية للشهر مع نوافذ ذهبية وخطرة',
    optionC: 'خريطة حرارية شهرية',
    optionCDesc: 'خريطة حرارية بعرض كامل في الرئيسية',
    continueBtn: 'متابعة',
    dailyBrief: 'ملخص يومي',
    todayScore: 'درجة اليوم الكونية',
    goldenHours: 'ساعات ذهبية',
    warnings: 'تحذيرات',
    synergyAlerts: 'تنبيهات التآزر',
    noGolden: 'لم تُكتشف نوافذ ذهبية لليوم بعد.',
    noWarnings: 'لا مناطق خطر لليوم.',
    noSynergy: 'لا تنبيهات — أضف أشخاصاً لتتبع التوافق.',
    askAi: 'اسأل AI',
    askPlaceholder: 'على ماذا أركز اليوم؟',
    askLoading: 'نقرأ السماء…',
    bestWindow: 'أفضل نافذة',
    avoidWindow: 'تجنّب',
    hourlyLabel: 'التوقع الساعي',
    noWindow: '—',
    todayLabel: 'اليوم',
    heatmapTitle: 'خريطة حرارية شهرية',
    loading: 'نقرأ السماء…',
    noProfile: 'أدخل بيانات الميلاد في الملف أولاً.',
    goProfile: 'إلى الملف',
    months: [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
    ],
    weekdays: ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'],
    settingsTitle: 'الإعدادات',
    settingsSub: 'خصص تجربة Planet Life',
    homeViewLabel: 'الشاشة الرئيسية الافتراضية',
    languageLabel: 'اللغة',
    houseLabel: 'نظام البيوت',
    zodiacLabel: 'الزودياك',
    placidus: 'بلاسيدوس',
    wholeSign: 'البروج الكاملة',
    tropical: 'استوائي',
    sidereal: 'النجمي',
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
