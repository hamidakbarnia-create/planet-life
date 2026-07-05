import { BRAND_I18N } from '@/lib/brand';
import type { AppLang } from '@/lib/app-settings';
import type { ChartData } from '@/lib/chart-types';
import { computeElementBalance, type ElementKey } from '@/lib/chart-insights';

export type ProfileLang = AppLang;

export const PROFILE_LANGS: Record<
  ProfileLang,
  {
    name: string;
    dir: 'ltr' | 'rtl';
    tagline: string;
    heroTitle: string;
    heroSubtitle: string;
    heroMessage: string;
    identitySnapshotTitle: string;
    birthControlsTitle: string;
    chartUnlockMessage: string;
    culturalCalendarTitle: string;
    chartRuler: string;
    dominantElement: string;
    profileSnapshot: string;
    buildStatus: string;
    statusReady: string;
    statusPending: string;
    statusLoading: string;
    yourData: string;
    currentSection: string;
    currentCity: string;
    confirmCurrent: string;
    currentConfirmed: string;
    currentPickFromList: string;
    currentSaveFailed: string;
    nameLabel: string;
    bdate: string;
    btime: string;
    city: string;
    calendarType: string;
    calendarGregorian: string;
    calendarPersian: string;
    calendarHijri: string;
    calendarTodo: string;
    generate: string;
    save: string;
    saved: string;
    loading: string;
    natalChart: string;
    identityTitle: string;
    sun: string;
    moon: string;
    ascendant: string;
    ascendantOf: string;
    signatureTitle: string;
    resonance: string;
    ruler: string;
    element: string;
    stone: string;
    color: string;
    lifePath: string;
    placeholder: string;
    searching: string;
    noResults: string;
    chartEmpty: string;
    elementsTitle: string;
    strengthsTitle: string;
    elFire: string;
    elEarth: string;
    elAir: string;
    elWater: string;
    chartAccuracy: string;
    geocodePending: string;
    chartErrorApi: string;
    chartErrorGeocode: string;
    chartErrorCoords: string;
    chartErrorIncomplete: string;
    chartErrorLocation: string;
    transparencyTitle: string;
  }
> = {
  en: {
    name: 'EN',
    dir: 'ltr',
    tagline: BRAND_I18N.en.tagline,
    heroTitle: 'Your Personal Intelligence Profile',
    heroSubtitle:
      'Your birth data, chart structure, and decision intelligence foundation.',
    heroMessage: 'Precision intelligence for your next decisive move.',
    identitySnapshotTitle: 'Identity Snapshot',
    birthControlsTitle: 'Birth Controls',
    chartUnlockMessage: 'Create your chart to unlock your profile intelligence.',
    culturalCalendarTitle: 'Cultural Calendar',
    chartRuler: 'Chart Ruler',
    dominantElement: 'Dominant Element',
    profileSnapshot: 'Profile Snapshot',
    buildStatus: 'Status',
    statusReady: 'Chart built',
    statusPending: 'Awaiting chart',
    statusLoading: 'Building chart…',
    yourData: 'Birth Data',
    currentSection: 'Current living location',
    currentCity: 'Current city',
    confirmCurrent: 'Use as current living location',
    currentConfirmed: 'Current location confirmed',
    currentPickFromList: 'Pick a city from the list to confirm coordinates.',
    currentSaveFailed: 'Could not resolve city coordinates. Select a city from the dropdown.',
    nameLabel: 'Name',
    bdate: 'Birth Date',
    btime: 'Birth Time',
    city: 'Birth City',
    calendarType: 'Calendar',
    calendarGregorian: 'Gregorian',
    calendarPersian: 'Persian Solar',
    calendarHijri: 'Hijri',
    calendarTodo: 'Alternate calendar display — conversion coming soon.',
    generate: 'Create Chart',
    save: 'Save Profile',
    saved: 'Saved ✓',
    loading: 'Loading...',
    natalChart: 'Natal Chart',
    identityTitle: 'Chart Identity',
    sun: 'Sun',
    moon: 'Moon',
    ascendant: 'Ascendant',
    ascendantOf: 'Ascendant',
    signatureTitle: 'Personal Signature',
    resonance: 'Resonance',
    ruler: 'Ruler',
    element: 'Element',
    stone: 'Signature Stone',
    color: 'Signature Color',
    lifePath: 'Life Path Number',
    placeholder: 'Type a city name...',
    searching: 'Searching...',
    noResults: 'No cities found',
    chartEmpty: 'Click Create Chart to generate your natal wheel',
    elementsTitle: 'Elemental balance',
    strengthsTitle: 'Your chart strengths',
    elFire: 'Fire',
    elEarth: 'Earth',
    elAir: 'Air',
    elWater: 'Water',
    chartAccuracy:
      'Chart accuracy depends on verified birth timezone, exact city coordinates, and Swiss Ephemeris calculation.',
    geocodePending: 'Geocoded location awaiting your confirmation in the dialog.',
    chartErrorApi: 'Cannot connect to API. Start the backend on port 8000.',
    chartErrorGeocode:
      'Geocoded location not confirmed. Pick a city from the dropdown for verified coordinates.',
    chartErrorCoords:
      'Selected city is missing coordinates. Pick another result or type coordinates manually.',
    chartErrorIncomplete: 'Chart data incomplete',
    chartErrorLocation: 'Location preview failed',
    transparencyTitle: 'Calculation Transparency',
  },
  ru: {
    name: 'RU',
    dir: 'ltr',
    tagline: BRAND_I18N.ru.tagline,
    heroTitle: 'Ваш персональный интеллектуальный профиль',
    heroSubtitle:
      'Данные рождения, структура карты и основа анализа решений.',
    heroMessage: 'Точный интеллект для вашего следующего решения.',
    identitySnapshotTitle: 'Снимок идентичности',
    birthControlsTitle: 'Данные рождения',
    chartUnlockMessage: 'Создайте карту, чтобы открыть интеллект профиля.',
    culturalCalendarTitle: 'Культурный календарь',
    chartRuler: 'Управитель карты',
    dominantElement: 'Доминирующая стихия',
    profileSnapshot: 'Снимок профиля',
    buildStatus: 'Статус',
    statusReady: 'Карта построена',
    statusPending: 'Ожидает построения',
    statusLoading: 'Построение карты…',
    yourData: 'Данные рождения',
    currentSection: 'Текущее место жительства',
    currentCity: 'Текущий город',
    confirmCurrent: 'Использовать как текущий город',
    currentConfirmed: 'Текущий город подтверждён',
    currentPickFromList: 'Выберите город из списка, чтобы подтвердить координаты.',
    currentSaveFailed: 'Не удалось определить координаты города. Выберите город из списка.',
    nameLabel: 'Имя',
    bdate: 'Дата рождения',
    btime: 'Время рождения',
    city: 'Город рождения',
    calendarType: 'Календарь',
    calendarGregorian: 'Григорианский',
    calendarPersian: 'Персидский солнечный',
    calendarHijri: 'Хиджра',
    calendarTodo: 'Альтернативный календарь — конвертация скоро.',
    generate: 'Построить карту',
    save: 'Сохранить профиль',
    saved: 'Сохранено ✓',
    loading: 'Загрузка...',
    natalChart: 'Натальная карта',
    identityTitle: 'Идентичность карты',
    sun: 'Солнце',
    moon: 'Луна',
    ascendant: 'Асцендент',
    ascendantOf: 'Асцендент',
    signatureTitle: 'Личная подпись',
    resonance: 'Резонанс',
    ruler: 'Управитель',
    element: 'Стихия',
    stone: 'Камень подписи',
    color: 'Цвет подписи',
    lifePath: 'Число жизненного пути',
    placeholder: 'Введите город...',
    searching: 'Поиск...',
    noResults: 'Города не найдены',
    chartEmpty: 'Нажмите «Построить карту»',
    elementsTitle: 'Баланс стихий',
    strengthsTitle: 'Сильные стороны карты',
    elFire: 'Огонь',
    elEarth: 'Земля',
    elAir: 'Воздух',
    elWater: 'Вода',
    chartAccuracy:
      'Точность карты зависит от подтверждённого часового пояса рождения, точных координат города и расчёта Swiss Ephemeris.',
    geocodePending: 'Геокодированное место ожидает подтверждения в диалоге.',
    chartErrorApi: 'Нет связи с API. Запустите бэкенд на порту 8000.',
    chartErrorGeocode:
      'Геокодированное место не подтверждено. Выберите город из списка для проверки координат.',
    chartErrorCoords:
      'У выбранного города нет координат. Выберите другой результат.',
    chartErrorIncomplete: 'Данные карты неполные',
    chartErrorLocation: 'Не удалось определить местоположение',
    transparencyTitle: 'Прозрачность расчёта',
  },
  fa: {
    name: 'FA',
    dir: 'rtl',
    tagline: BRAND_I18N.fa.tagline,
    heroTitle: 'پروفایل هوشمند شخصی شما',
    heroSubtitle: 'داده‌های تولد، ساختار چارت و پایه تحلیل تصمیم‌های شما.',
    heroMessage: 'هوش دقیق برای قدم بعدیِ تعیین‌کننده شما.',
    identitySnapshotTitle: 'نمای لحظه‌ای هویت',
    birthControlsTitle: 'کنترل‌های تولد',
    chartUnlockMessage: 'برای باز کردن هوش پروفایل، نمودار خود را بسازید.',
    culturalCalendarTitle: 'تقویم فرهنگی',
    chartRuler: 'سیاره حاکم چارت',
    dominantElement: 'عنصر غالب',
    profileSnapshot: 'نمایه پروفایل',
    buildStatus: 'وضعیت',
    statusReady: 'چارت ساخته شد',
    statusPending: 'در انتظار ساخت چارت',
    statusLoading: 'در حال ساخت چارت…',
    yourData: 'اطلاعات تولد',
    currentSection: 'محل زندگی فعلی',
    currentCity: 'شهر فعلی',
    confirmCurrent: 'تأیید به‌عنوان محل زندگی فعلی',
    currentConfirmed: 'محل زندگی فعلی تأیید شد',
    currentPickFromList: 'برای تأیید مختصات، شهری را از فهرست انتخاب کنید.',
    currentSaveFailed: 'مختصات شهر مشخص نشد. لطفاً از فهرست انتخاب کنید.',
    nameLabel: 'نام',
    bdate: 'تاریخ تولد',
    btime: 'زمان تولد',
    city: 'شهر تولد',
    calendarType: 'تقویم',
    calendarGregorian: 'میلادی',
    calendarPersian: 'هجری شمسی',
    calendarHijri: 'هجری قمری',
    calendarTodo: 'نمایش تقویم جایگزین — تبدیل به‌زودی.',
    generate: 'ساخت نمودار',
    save: 'ذخیره پروفایل',
    saved: 'ذخیره شد ✓',
    loading: 'در حال بارگذاری...',
    natalChart: 'نقشه تولد',
    identityTitle: 'هویت چارت',
    sun: 'خورشید',
    moon: 'ماه',
    ascendant: 'طالع',
    ascendantOf: 'طالع',
    signatureTitle: 'امضای شخصی',
    resonance: 'رزونانس',
    ruler: 'سیاره حاکم',
    element: 'عنصر',
    stone: 'سنگ امضا',
    color: 'رنگ امضا',
    lifePath: 'عدد مسیر زندگی',
    placeholder: 'نام شهر را بنویسید...',
    searching: 'جستجو...',
    noResults: 'شهری یافت نشد',
    chartEmpty: 'برای ساخت چارت روی «ساخت نمودار» کلیک کنید',
    elementsTitle: 'عناصر وجودی',
    strengthsTitle: 'نقاط قوت چارت شما',
    elFire: 'آتش',
    elEarth: 'خاک',
    elAir: 'باد',
    elWater: 'آب',
    chartAccuracy:
      'دقت نقشه به منطقه زمانی تأییدشده تولد، مختصات دقیق شهر و محاسبه Swiss Ephemeris بستگی دارد.',
    geocodePending: 'مکان جغرافیایی در انتظار تأیید شما در پنجره گفتگو است.',
    chartErrorApi: 'اتصال به API برقرار نیست. سرور را روی پورت ۸۰۰۰ اجرا کنید.',
    chartErrorGeocode:
      'مکان جغرافیایی تأیید نشد. شهر را از فهرست انتخاب کنید.',
    chartErrorCoords: 'مختصات شهر انتخاب‌شده موجود نیست. گزینه دیگری انتخاب کنید.',
    chartErrorIncomplete: 'داده‌های چارت ناقص است',
    chartErrorLocation: 'پیش‌نمایش مکان ناموفق بود',
    transparencyTitle: 'شفافیت محاسبه',
  },
  ar: {
    name: 'AR',
    dir: 'rtl',
    tagline: BRAND_I18N.ar.tagline,
    heroTitle: 'ملفك الشخصي الذكي',
    heroSubtitle: 'بيانات ميلادك وبنية خريطتك وأساس ذكاء قراراتك.',
    heroMessage: 'ذكاء دقيق لخطوتك القادمة الحاسمة.',
    identitySnapshotTitle: 'لمحة الهوية',
    birthControlsTitle: 'بيانات الميلاد',
    chartUnlockMessage: 'أنشئ خريطتك لفتح ذكاء ملفك الشخصي.',
    culturalCalendarTitle: 'التقويم الثقافي',
    chartRuler: 'حاكم الخريطة',
    dominantElement: 'العنصر السائد',
    profileSnapshot: 'لمحة الملف',
    buildStatus: 'الحالة',
    statusReady: 'تم بناء الخريطة',
    statusPending: 'بانتظار بناء الخريطة',
    statusLoading: 'جارٍ بناء الخريطة…',
    yourData: 'بيانات الميلاد',
    currentSection: 'مكان الإقامة الحالي',
    currentCity: 'المدينة الحالية',
    confirmCurrent: 'تأكيد كمكان الإقامة الحالي',
    currentConfirmed: 'تم تأكيد مكان الإقامة',
    currentPickFromList: 'اختر مدينة من القائمة لتأكيد الإحداثيات.',
    currentSaveFailed: 'تعذّر تحديد إحداثيات المدينة. اختر مدينة من القائمة.',
    nameLabel: 'الاسم',
    bdate: 'تاريخ الميلاد',
    btime: 'وقت الميلاد',
    city: 'مدينة الميلاد',
    calendarType: 'التقويم',
    calendarGregorian: 'ميلادي',
    calendarPersian: 'شمسي فارسي',
    calendarHijri: 'هجري',
    calendarTodo: 'عرض التقويم البديل — التحويل قريباً.',
    generate: 'إنشاء الخريطة',
    save: 'حفظ الملف',
    saved: 'تم الحفظ ✓',
    loading: 'جاري التحميل...',
    natalChart: 'خريطة الميلاد',
    identityTitle: 'هوية الخريطة',
    sun: 'الشمس',
    moon: 'القمر',
    ascendant: 'الطالع',
    ascendantOf: 'الطالع',
    signatureTitle: 'التوقيع الشخصي',
    resonance: 'الرنين',
    ruler: 'الحاكم',
    element: 'العنصر',
    stone: 'حجر التوقيع',
    color: 'لون التوقيع',
    lifePath: 'رقم مسار الحياة',
    placeholder: 'اكتب اسم مدينة...',
    searching: 'جاري البحث...',
    noResults: 'لا توجد مدن',
    chartEmpty: 'انقر «إنشاء الخريطة» لبناء عجلة الميلاد',
    elementsTitle: 'التوازن العنصري',
    strengthsTitle: 'نقاط قوة خريطتك',
    elFire: 'نار',
    elEarth: 'تراب',
    elAir: 'هواء',
    elWater: 'ماء',
    chartAccuracy:
      'تعتمد دقة الخريطة على المنطقة الزمنية المؤكدة للميلاد، والإحداثيات الدقيقة للمدينة، وحساب Swiss Ephemeris.',
    geocodePending: 'الموقع المُرمَّز جغرافياً بانتظار تأكيدك في الحوار.',
    chartErrorApi: 'تعذّر الاتصال بـ API. شغّل الخادم على المنفذ 8000.',
    chartErrorGeocode:
      'لم يتم تأكيد الموقع المُرمَّز. اختر مدينة من القائمة للإحداثيات الموثوقة.',
    chartErrorCoords: 'المدينة المختارة تفتقد إحداثيات. اختر نتيجة أخرى.',
    chartErrorIncomplete: 'بيانات الخريطة غير مكتملة',
    chartErrorLocation: 'فشل معاينة الموقع',
    transparencyTitle: 'شفافية الحساب',
  },
};

export const ZODIAC_SIGNS = [
  { sign: 'Aries', symbol: '♈', element: 'Fire', planet: 'Mars', stone: 'Diamond', colorName: 'Crimson Red', colorBase: 'Crimson Red', color: '#ef4444' },
  { sign: 'Taurus', symbol: '♉', element: 'Earth', planet: 'Venus', stone: 'Emerald', colorName: 'Emerald Green', colorBase: 'Emerald Green', color: '#22c55e' },
  { sign: 'Gemini', symbol: '♊', element: 'Air', planet: 'Mercury', stone: 'Agate', colorName: 'Golden Yellow', colorBase: 'Yellow', sunTone: 'Golden', color: '#eab308' },
  { sign: 'Cancer', symbol: '♋', element: 'Water', planet: 'Moon', stone: 'Pearl', colorName: 'Silver Blue', colorBase: 'Blue', sunTone: 'Silver', color: '#a5f3fc' },
  { sign: 'Leo', symbol: '♌', element: 'Fire', planet: 'Sun', stone: 'Ruby', colorName: 'Gold Orange', colorBase: 'Orange', sunTone: 'Gold', color: '#f97316' },
  { sign: 'Virgo', symbol: '♍', element: 'Earth', planet: 'Mercury', stone: 'Blue Sapphire', colorName: 'Deep Sapphire Blue', colorBase: 'Sapphire Blue', sunTone: 'Deep', color: '#6366f1' },
  { sign: 'Libra', symbol: '♎', element: 'Air', planet: 'Venus', stone: 'Opal', colorName: 'Rose Pink', colorBase: 'Pink', sunTone: 'Rose', color: '#ec4899' },
  { sign: 'Scorpio', symbol: '♏', element: 'Water', planet: 'Pluto', stone: 'Topaz', colorName: 'Deep Garnet', colorBase: 'Garnet Red', sunTone: 'Deep', color: '#dc2626' },
  { sign: 'Sagittarius', symbol: '♐', element: 'Fire', planet: 'Jupiter', stone: 'Turquoise', colorName: 'Royal Purple', colorBase: 'Purple', sunTone: 'Royal', color: '#8b5cf6' },
  { sign: 'Capricorn', symbol: '♑', element: 'Earth', planet: 'Saturn', stone: 'Garnet', colorName: 'Slate Graphite', colorBase: 'Graphite', sunTone: 'Slate', color: '#64748b' },
  { sign: 'Aquarius', symbol: '♒', element: 'Air', planet: 'Uranus', stone: 'Amethyst', colorName: 'Electric Cyan', colorBase: 'Cyan', sunTone: 'Electric', color: '#06b6d4' },
  { sign: 'Pisces', symbol: '♓', element: 'Water', planet: 'Neptune', stone: 'Aquamarine', colorName: 'Ocean Blue', colorBase: 'Blue', sunTone: 'Ocean', color: '#0ea5e9' },
] as const;

export type ZodiacSignMeta = (typeof ZODIAC_SIGNS)[number];

const ELEMENT_NAME_TO_KEY: Record<string, ElementKey> = {
  Fire: 'fire',
  Earth: 'earth',
  Air: 'air',
  Water: 'water',
};

const ELEMENT_KEY_TO_NAME: Record<ElementKey, string> = {
  fire: 'Fire',
  earth: 'Earth',
  air: 'Air',
  water: 'Water',
};

const DOMINANT_ELEMENT_HEX: Record<ElementKey, string> = {
  fire: '#f97316',
  earth: '#84cc16',
  air: '#67e8f9',
  water: '#60a5fa',
};

/** Dominant-element tone applied to sun color base (separate from sun's built-in tone). */
const DOMINANT_COMPOSITE_TONE: Record<ElementKey, Record<ProfileLang, string>> = {
  fire: { en: 'Radiant', ru: 'Сияющий', fa: 'درخشان', ar: 'مشرق' },
  earth: { en: 'Deep', ru: 'Глубокий', fa: 'عمیق', ar: 'عميق' },
  air: { en: 'Clear', ru: 'Спокойный', fa: 'آرام', ar: 'هادئ' },
  water: { en: 'Misty', ru: 'Туманный', fa: 'مه‌آلود', ar: 'ضبابي' },
};

/** Built-in sun tone labels (stripped before dominant-element composition). */
const SUN_TONE_LABELS: Record<string, Record<ProfileLang, string>> = {
  Deep: { en: 'Deep', ru: 'Глубокий', fa: 'عمیق', ar: 'عميق' },
  Golden: { en: 'Golden', ru: 'Золотистый', fa: 'طلایی', ar: 'ذهبي' },
  Silver: { en: 'Silver', ru: 'Серебристый', fa: 'نقره‌ای', ar: 'فضي' },
  Gold: { en: 'Gold', ru: 'Золотой', fa: 'طلایی', ar: 'ذهبي' },
  Rose: { en: 'Rose', ru: 'Розовый', fa: 'گل‌سرخی', ar: 'وردي' },
  Royal: { en: 'Royal', ru: 'Королевский', fa: 'سلطنتی', ar: 'ملكي' },
  Slate: { en: 'Slate', ru: 'Графитовый', fa: 'سربی', ar: 'أردوي' },
  Electric: { en: 'Electric', ru: 'Электрический', fa: 'برقی', ar: 'كهربائي' },
  Ocean: { en: 'Ocean', ru: 'Океанический', fa: 'اقیانوسی', ar: 'محيطي' },
};

/** Chart ruler (ascendant lord) + ascendant sign → signature stone */
const STONE_BY_RULER_AND_ASC: Record<string, Record<string, string>> = {};
for (const z of ZODIAC_SIGNS) {
  if (!STONE_BY_RULER_AND_ASC[z.planet]) {
    STONE_BY_RULER_AND_ASC[z.planet] = {};
  }
  STONE_BY_RULER_AND_ASC[z.planet][z.sign] = z.stone;
}

export const ZODIAC_TRANS: Record<string, Record<string, string>> = {
  ru: {
    Aries: 'Овен', Taurus: 'Телец', Gemini: 'Близнецы', Cancer: 'Рак', Leo: 'Лев',
    Virgo: 'Дева', Libra: 'Весы', Scorpio: 'Скорпион', Sagittarius: 'Стрелец',
    Capricorn: 'Козерог', Aquarius: 'Водолей', Pisces: 'Рыбы',
    Fire: 'Огонь', Earth: 'Земля', Air: 'Воздух', Water: 'Вода',
    Mars: 'Марс', Venus: 'Венера', Mercury: 'Меркурий', Moon: 'Луна', Sun: 'Солнце',
    Pluto: 'Плутон', Jupiter: 'Юпитер', Saturn: 'Сатурн', Uranus: 'Уран', Neptune: 'Нептун',
    Diamond: 'Бриллиант', Emerald: 'Изумруд', Agate: 'Агат', Pearl: 'Жемчуг', Ruby: 'Рубин',
    'Blue Sapphire': 'Сапфир', Opal: 'Опал', Topaz: 'Топаз', Turquoise: 'Бирюза', Garnet: 'Гранат',
    Amethyst: 'Аметист', Aquamarine: 'Аквамарин',
    'Crimson Red': 'Алый', 'Emerald Green': 'Изумрудный', 'Golden Yellow': 'Золотисто-жёлтый',
    'Silver Blue': 'Серебристо-синий', 'Gold Orange': 'Золотисто-оранжевый',
    'Deep Sapphire Blue': 'Глубокий сапфировый синий', 'Rose Pink': 'Розовый', 'Deep Garnet': 'Тёмно-гранатовый',
    'Royal Purple': 'Королевский фиолетовый', 'Slate Graphite': 'Графитовый', 'Electric Cyan': 'Бирюзовый',
    'Ocean Blue': 'Морской синий',
    Yellow: 'жёлтый', Blue: 'синий', Orange: 'оранжевый', 'Sapphire Blue': 'сапфировый синий',
    Pink: 'розовый', 'Garnet Red': 'гранатовый', Purple: 'фиолетовый', Graphite: 'графитовый', Cyan: 'бирюзовый',
  },
  fa: {
    Aries: 'حمل', Taurus: 'ثور', Gemini: 'جوزا', Cancer: 'سرطان', Leo: 'اسد',
    Virgo: 'سنبله', Libra: 'میزان', Scorpio: 'عقرب', Sagittarius: 'قوس',
    Capricorn: 'جدی', Aquarius: 'دلو', Pisces: 'حوت',
    Fire: 'آتش', Earth: 'خاک', Air: 'باد', Water: 'آب',
    Mars: 'مریخ', Venus: 'زهره', Mercury: 'عطارد', Moon: 'ماه', Sun: 'خورشید',
    Pluto: 'پلوتون', Jupiter: 'مشتری', Saturn: 'زحل', Uranus: 'اورانوس', Neptune: 'نپتون',
    Diamond: 'الماس', Emerald: 'زمرد', Agate: 'عقیق', Pearl: 'مروارید', Ruby: 'یاقوت',
    'Blue Sapphire': 'یاقوت کبود', Opal: 'اوپال', Topaz: 'توپاز', Turquoise: 'فیروزه', Garnet: 'گارنت',
    Amethyst: 'آمتیست', Aquamarine: 'آکوامارین',
    'Crimson Red': 'قرمز لعل', 'Emerald Green': 'سبز زمردی', 'Golden Yellow': 'زرد طلایی',
    'Silver Blue': 'آبی نقره‌ای', 'Gold Orange': 'نارنجی طلایی',
    'Deep Sapphire Blue': 'آبی یاقوتی عمیق', 'Rose Pink': 'صورتی', 'Deep Garnet': 'گارنت تیره',
    'Royal Purple': 'بنفش سلطنتی', 'Slate Graphite': 'خاکستری گرافیت', 'Electric Cyan': 'فیروزه‌ای',
    'Ocean Blue': 'آبی اقیانوسی',
    Yellow: 'زرد', Blue: 'آبی', Orange: 'نارنجی', 'Sapphire Blue': 'آبی یاقوتی',
    Pink: 'صورتی', 'Garnet Red': 'گارنت', Purple: 'بنفش', Graphite: 'گرافیت', Cyan: 'فیروزه‌ای',
  },
  ar: {
    Aries: 'الحمل', Taurus: 'الثور', Gemini: 'الجوزاء', Cancer: 'السرطان', Leo: 'الأسد',
    Virgo: 'العذراء', Libra: 'الميزان', Scorpio: 'العقرب', Sagittarius: 'القوس',
    Capricorn: 'الجدي', Aquarius: 'الدلو', Pisces: 'الحوت',
    Fire: 'نار', Earth: 'أرض', Air: 'هواء', Water: 'ماء',
    Mars: 'المريخ', Venus: 'الزهرة', Mercury: 'عطارد', Moon: 'القمر', Sun: 'الشمس',
    Pluto: 'بلوتو', Jupiter: 'المشتري', Saturn: 'زحل', Uranus: 'أورانوس', Neptune: 'نبتون',
    Diamond: 'ألماس', Emerald: 'زمرد', Agate: 'عقيق', Pearl: 'لؤلؤ', Ruby: 'ياقوت',
    'Blue Sapphire': 'ياقوت أزرق', Opal: 'أوبال', Topaz: 'توباز', Turquoise: 'فيروز', Garnet: 'جارنت',
    Amethyst: 'أميثيست', Aquamarine: 'أكوامارين',
    'Crimson Red': 'أحمر قرمزي', 'Emerald Green': 'أخضر زمردي', 'Golden Yellow': 'أصفر ذهبي',
    'Silver Blue': 'أزرق فضي', 'Gold Orange': 'برتقالي ذهبي',
    'Deep Sapphire Blue': 'أزرق ياقوتي عميق', 'Rose Pink': 'وردي', 'Deep Garnet': 'عقيقي داكن',
    'Royal Purple': 'بنفسجي ملكي', 'Slate Graphite': 'رمادي غرافيتي', 'Electric Cyan': 'سماوي',
    'Ocean Blue': 'أزرق محيطي',
    Yellow: 'أصفر', Blue: 'أزرق', Orange: 'برتقالي', 'Sapphire Blue': 'أزرق ياقوتي',
    Pink: 'وردي', 'Garnet Red': 'عقيقي', Purple: 'بنفسجي', Graphite: 'غرافيتي', Cyan: 'سماوي',
  },
};

export const PLANET_LABELS: Record<string, Record<string, string>> = {
  en: {
    sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
    jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
    pluto: 'Pluto', north_node: 'Mean Node (☊)',
  },
  ru: {
    sun: 'Солнце', moon: 'Луна', mercury: 'Меркурий', venus: 'Венера', mars: 'Марс',
    jupiter: 'Юпитер', saturn: 'Сатурн', uranus: 'Уран', neptune: 'Нептун',
    pluto: 'Плутон', north_node: 'Северный узел',
  },
  fa: {
    sun: 'خورشید', moon: 'ماه', mercury: 'عطارد', venus: 'زهره', mars: 'مریخ',
    jupiter: 'مشتری', saturn: 'زحل', uranus: 'اورانوس', neptune: 'نپتون',
    pluto: 'پلوتون', north_node: 'گره شمالی',
  },
  ar: {
    sun: 'الشمس', moon: 'القمر', mercury: 'عطارد', venus: 'الزهرة', mars: 'المريخ',
    jupiter: 'المشتري', saturn: 'زحل', uranus: 'أورانوس', neptune: 'نبتون',
    pluto: 'بلوتو', north_node: 'العقدة الشمالية',
  },
};

export const ASPECT_LABELS: Record<string, Record<string, string>> = {
  en: { trine: 'Trine', square: 'Square', sextile: 'Sextile', opposition: 'Opposition', conjunction: 'Conjunction' },
  ru: { trine: 'Трин', square: 'Квадрат', sextile: 'Секстиль', opposition: 'Оппозиция', conjunction: 'Соединение' },
  fa: { trine: 'تثلیث', square: 'تربیع', sextile: 'سدسی', opposition: 'مقابله', conjunction: 'اقتران' },
  ar: { trine: 'تثليث', square: 'تربيع', sextile: 'تسديس', opposition: 'مقابلة', conjunction: 'اقتران' },
};

export function trZodiac(text: string, lang: ProfileLang): string {
  if (lang === 'en') return text;
  return ZODIAC_TRANS[lang]?.[text] ?? text;
}

export function buildSignNames(lang: ProfileLang): Record<string, string> {
  const out: Record<string, string> = {};
  ZODIAC_SIGNS.forEach((z) => {
    out[z.sign] = trZodiac(z.sign, lang);
  });
  return out;
}

export function formatPlacement(longitude: number, lang: ProfileLang): string {
  const normalized = ((longitude % 360) + 360) % 360;
  const signIndex = Math.min(Math.floor(normalized / 30), 11);
  const sign = ZODIAC_SIGNS[signIndex].sign;
  const inSign = normalized % 30;
  const deg = Math.floor(inSign);
  const min = Math.round((inSign - deg) * 60);
  const signLabel = trZodiac(sign, lang);
  const minStr = String(min === 60 ? 0 : min).padStart(2, '0');
  return `${signLabel} ${deg}°${minStr}′`;
}

export function signFromLongitude(longitude: number): ZodiacSignMeta {
  const normalized = ((longitude % 360) + 360) % 360;
  const index = Math.min(Math.floor(normalized / 30), 11);
  return ZODIAC_SIGNS[index];
}

/** Life path / resonance number from birth date (YYYY-MM-DD). */
export function getResonanceNumber(birthDate: string): number {
  if (!birthDate) return 1;
  const digits = birthDate.replace(/-/g, '').split('').map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum
      .toString()
      .split('')
      .map(Number)
      .reduce((a, b) => a + b, 0);
  }
  return sum;
}

export type PersonalSignature = {
  color: string;
  colorHex: string;
  stone: string;
  resonance: number;
  element: string;
  ruler: string;
  /** Internal only — true when dominant element could not be computed from chart */
  elementIsFallback?: boolean;
};

function blendHex(base: string, tint: string, weight: number): string {
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ] as const;
  };
  const [r1, g1, b1] = parse(base);
  const [r2, g2, b2] = parse(tint);
  const w = Math.min(1, Math.max(0, weight));
  const mix = (a: number, b: number) => Math.round(a * (1 - w) + b * w);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(mix(r1, r2))}${toHex(mix(g1, g2))}${toHex(mix(b1, b2))}`;
}

function trColorBase(baseKey: string, lang: ProfileLang): string {
  if (lang === 'en') return baseKey;
  return ZODIAC_TRANS[lang]?.[baseKey] ?? baseKey;
}

function trSunTone(toneKey: string, lang: ProfileLang): string {
  if (lang === 'en') return toneKey;
  return SUN_TONE_LABELS[toneKey]?.[lang] ?? toneKey;
}

/** True when localized base already ends with or contains the tone word. */
function colorAlreadyHasTone(base: string, tone: string): boolean {
  if (!tone) return true;
  const norm = (s: string) => s.trim().toLowerCase();
  const b = norm(base);
  const t = norm(tone);
  return b === t || b.endsWith(` ${t}`) || b.startsWith(`${t} `) || b.includes(` ${t} `);
}

/**
 * Compose localized color label from base hue + tone modifier.
 * FA/AR: tone after base ("آبی یاقوتی عمیق"). EN/RU: tone before base.
 */
function composeColorLabel(
  base: string,
  tone: string,
  lang: ProfileLang
): string {
  if (!tone || colorAlreadyHasTone(base, tone)) return base;
  if (lang === 'fa' || lang === 'ar') return `${base} ${tone}`;
  return `${tone} ${base}`;
}

/** Full sun-sign color (base + built-in sun tone, no dominant overlay). */
function localizedSunColorFull(
  sunSign: ZodiacSignMeta & { colorBase: string; sunTone?: string },
  lang: ProfileLang
): string {
  if (lang !== 'en') {
    const full = trZodiac(sunSign.colorName, lang);
    if (full !== sunSign.colorName) return full;
  }
  const base = trColorBase(sunSign.colorBase, lang);
  if (!sunSign.sunTone) return base;
  const tone = trSunTone(sunSign.sunTone, lang);
  return composeColorLabel(base, tone, lang);
}

/** Base hue only — sun's built-in tone stripped for dominant-element overlay. */
function localizedSunColorBase(sunSign: ZodiacSignMeta & { colorBase: string }, lang: ProfileLang): string {
  return trColorBase(sunSign.colorBase, lang);
}

function resolveDominantElement(
  chart: ChartData,
  ascSign: ZodiacSignMeta
): { key: ElementKey; isFallback: boolean } {
  const balance = computeElementBalance(chart.planets);
  const planetTotal =
    balance.counts.fire +
    balance.counts.earth +
    balance.counts.air +
    balance.counts.water;

  if (planetTotal > 0) {
    return { key: balance.dominant, isFallback: false };
  }

  // TODO: replace fallback with full chart dominant element calculation.
  const fallbackKey = ELEMENT_NAME_TO_KEY[ascSign.element] ?? 'earth';
  return { key: fallbackKey, isFallback: true };
}

/** Sun sign palette blended with chart dominant element. */
function deriveSignatureColor(
  sunSign: ZodiacSignMeta & { colorBase: string; sunTone?: string },
  dominant: ElementKey,
  lang: ProfileLang
): { color: string; colorHex: string } {
  const sunElementKey = ELEMENT_NAME_TO_KEY[sunSign.element];

  if (sunElementKey === dominant) {
    return {
      color: localizedSunColorFull(sunSign, lang),
      colorHex: sunSign.color,
    };
  }

  const base = localizedSunColorBase(sunSign, lang);
  const tone = DOMINANT_COMPOSITE_TONE[dominant][lang];
  return {
    color: composeColorLabel(base, tone, lang),
    colorHex: blendHex(sunSign.color, DOMINANT_ELEMENT_HEX[dominant], 0.38),
  };
}

function elementLabel(key: ElementKey, lang: ProfileLang): string {
  return trZodiac(ELEMENT_KEY_TO_NAME[key], lang);
}

/** Chart ruler + ascendant sign → signature stone. */
function deriveSignatureStone(ascSign: ZodiacSignMeta, lang: ProfileLang): string {
  const stone =
    STONE_BY_RULER_AND_ASC[ascSign.planet]?.[ascSign.sign] ?? ascSign.stone;
  return trZodiac(stone, lang);
}

/** Resonance from birth date; ruler from ascendant lord; element from chart distribution. */
export function buildPersonalSignature(
  chart: ChartData | null,
  birthDate: string,
  lang: ProfileLang
): PersonalSignature | null {
  if (!chart || !Number.isFinite(chart.ascendant)) return null;
  const sunLon = chart.planets.sun?.longitude;
  if (!Number.isFinite(sunLon)) return null;

  const sunSign = signFromLongitude(sunLon!);
  const ascSign = signFromLongitude(chart.ascendant);
  const { key: dominantKey, isFallback } = resolveDominantElement(chart, ascSign);
  const { color, colorHex } = deriveSignatureColor(sunSign, dominantKey, lang);

  return {
    color,
    colorHex,
    stone: deriveSignatureStone(ascSign, lang),
    resonance: getResonanceNumber(birthDate),
    element: elementLabel(dominantKey, lang),
    ruler: trZodiac(ascSign.planet, lang),
    ...(isFallback ? { elementIsFallback: true } : {}),
  };
}
