import type { AppLang } from './app-settings';

/**
 * Vault section static presentation copy (EN/FA/AR/RU).
 * Titles, subtitles, purpose, takeaway labels, and locked/empty copy only.
 * Producer routing stays on the section page.
 */

export type VaultSectionKey =
  | 'sensuality'
  | 'cycle'
  | 'provider'
  | 'shadow'
  | 'look'
  | 'power'
  | 'lounge';

export const VAULT_SECTION_ORDER: VaultSectionKey[] = [
  'sensuality',
  'cycle',
  'provider',
  'shadow',
  'look',
  'power',
  'lounge',
];

export type VaultSectionCopy = {
  title: string;
  sub: string;
  intro: string;
  items: { label: string; hint: string }[];
  coming: string;
};

export type VaultSectionLangPack = Record<VaultSectionKey, VaultSectionCopy> & {
  back: string;
  vaultHome: string;
  previewNote: string;
};

export type VaultReadingUiCopy = {
  liveLabel: string;
  loading: string;
  needProfile: string;
  goProfile: string;
  apiError: string;
  tryThis: string;
};

/** Vault-scoped selected partner identity / choice / relationship gating. */
export type VaultPartnerSelectionCopy = {
  readingFor: string;
  selectLabel: string;
  /** Select placeholder label (interactive control is the native select). */
  choosePartner: string;
  /** Sole explanatory message when multiple people exist and none is selected. */
  choosePartnerHint: string;
  noPeopleBody: string;
  addPersonCta: string;
  unsupportedRelationship: string;
  changeRelationshipCta: string;
  /** Extra line when Partner Profile is unavailable for a relationship Compat/Shadow may still allow. */
  partnerProfileVsCompatNote: string;
  loading: string;
  apiError: string;
};

export const VAULT_PARTNER_SELECTION_COPY: Record<
  AppLang,
  VaultPartnerSelectionCopy
> = {
  en: {
    readingFor: 'Reading for',
    selectLabel: 'Person',
    choosePartner: 'Choose Partner',
    choosePartnerHint:
      'Partner Profile, Compatibility, and Shadow share the same selected person.',
    noPeopleBody:
      'Add someone in People before this reading can run.',
    addPersonCta: 'Add Person',
    unsupportedRelationship:
      'This module is unavailable for the selected person’s relationship type. Changing birth date, time, or place will not unlock it. Compatibility and Shadow support romantic partner, spouse, friend, or business partner. Partner Profile supports romantic partner, spouse, or business partner.',
    changeRelationshipCta: 'Change Relationship',
    partnerProfileVsCompatNote:
      'Compatibility or Shadow may still be available for this person if their relationship is supported there.',
    loading: 'Preparing this person’s reading…',
    apiError:
      'This reading could not load. Check your connection, then open this module again.',
  },
  fa: {
    readingFor: 'خوانش برای',
    selectLabel: 'فرد',
    choosePartner: 'انتخاب شریک',
    choosePartnerHint:
      'پروفایل شریک، سازگاری و سایه از همان فرد انتخاب‌شده استفاده می‌کنند.',
    noPeopleBody:
      'قبل از اجرای این خوانش، کسی را در افراد اضافه کن.',
    addPersonCta: 'افزودن فرد',
    unsupportedRelationship:
      'این بخش برای نوع رابطهٔ فرد انتخاب‌شده در دسترس نیست. تغییر تاریخ، ساعت یا مکان تولد آن را باز نمی‌کند. سازگاری و سایه: شریک عاطفی، همسر، دوست یا شریک تجاری. پروفایل شریک: شریک عاطفی، همسر یا شریک تجاری.',
    changeRelationshipCta: 'تغییر نوع رابطه',
    partnerProfileVsCompatNote:
      'اگر نوع رابطه در آنجا پشتیبانی شود، سازگاری یا سایه ممکن است همچنان برای همین فرد در دسترس باشد.',
    loading: 'در حال آماده‌سازی خوانش این فرد…',
    apiError:
      'این خوانش بارگذاری نشد. اتصال را بررسی کن و دوباره این بخش را باز کن.',
  },
  ar: {
    readingFor: 'قراءة لـ',
    selectLabel: 'الشخص',
    choosePartner: 'اختيار الشريك',
    choosePartnerHint:
      'ملف الشريك والتوافق والظل يستخدمون الشخص المحدد نفسه.',
    noPeopleBody:
      'يلزم إضافة شخص في الأشخاص قبل تشغيل هذه القراءة.',
    addPersonCta: 'إضافة شخص',
    unsupportedRelationship:
      'هذه الوحدة غير متاحة لنوع علاقة الشخص المحدد. تغيير تاريخ أو وقت أو مكان الميلاد لن يفتحها. التوافق والظل: شريك عاطفي أو زوج/ة أو صديق أو شريك عمل. ملف الشريك: شريك عاطفي أو زوج/ة أو شريك عمل.',
    changeRelationshipCta: 'تغيير نوع العلاقة',
    partnerProfileVsCompatNote:
      'قد يظل التوافق أو الظل متاحاً لهذا الشخص إذا كان نوع العلاقة مدعوماً هناك.',
    loading: 'جارٍ إعداد قراءة هذا الشخص…',
    apiError:
      'تعذّر تحميل هذه القراءة. يُرجى التحقق من الاتصال ثم إعادة فتح هذه الوحدة.',
  },
  ru: {
    readingFor: 'Разбор для',
    selectLabel: 'Человек',
    choosePartner: 'Выбрать партнёра',
    choosePartnerHint:
      'Профиль партнёра, совместимость и Тень используют одного и того же выбранного человека.',
    noPeopleBody:
      'Добавьте человека в раздел «Люди», прежде чем запускать этот разбор.',
    addPersonCta: 'Добавить человека',
    unsupportedRelationship:
      'Этот модуль недоступен для типа отношений выбранного человека. Изменение даты, времени или места рождения его не откроет. Совместимость и Тень: романтический партнёр, супруг/а, друг или деловой партнёр. Профиль партнёра: романтический партнёр, супруг/а или деловой партнёр.',
    changeRelationshipCta: 'Изменить тип отношений',
    partnerProfileVsCompatNote:
      'Совместимость или Тень могут оставаться доступны для этого человека, если тип отношений там поддерживается.',
    loading: 'Готовим разбор для этого человека…',
    apiError:
      'Не удалось загрузить разбор. Проверьте соединение и откройте модуль снова.',
  },
};

export type VaultMissingInputCopy = {
  goProfile: string;
  /** CTA when the selected partner’s birth details are incomplete. */
  completeProfile: string;
  genericPartial: string;
  byKind: Record<
    | 'birth_profile'
    | 'current_location'
    | 'place_shortlist'
    | 'partner_profile'
    | 'partner_birth_time',
    string
  >;
};

export const VAULT_MISSING_INPUT_COPY: Record<AppLang, VaultMissingInputCopy> = {
  en: {
    goProfile: 'Go to Profile',
    completeProfile: 'Complete Profile',
    genericPartial:
      'This reading is partial. Add a few more details to refine the guidance.',
    byKind: {
      birth_profile:
        'This reading is partial. Birth time is missing, so some timing details remain broad.',
      current_location:
        'This reading is partial. Add your current location to improve place-based guidance.',
      place_shortlist:
        'This reading is partial. Place guidance needs a clearer shortlist of locations to compare.',
      partner_profile:
        'This reading is partial. Complete this person’s profile — add their birth date and place.',
      partner_birth_time:
        'This reading is partial. Add their birth time so timing details can sharpen.',
    },
  },
  fa: {
    goProfile: 'رفتن به پروفایل',
    completeProfile: 'تکمیل پروفایل',
    genericPartial:
      'این خوانش ناقص است. چند جزئیات بیشتر اضافه کن تا راهنمایی دقیق‌تر شود.',
    byKind: {
      birth_profile:
        'این خوانش ناقص است. ساعت تولد نیست، پس بعضی جزئیات تایمینگ کلی می‌ماند.',
      current_location:
        'این خوانش ناقص است. مکان فعلی‌ات را اضافه کن تا راهنمایی مکانی بهتر شود.',
      place_shortlist:
        'این خوانش ناقص است. برای مقایسه مکان‌ها به فهرست واضح‌تری از جاها نیاز است.',
      partner_profile:
        'این خوانش ناقص است. پروفایل این فرد را کامل کن — تاریخ و مکان تولدش را اضافه کن.',
      partner_birth_time:
        'این خوانش ناقص است. ساعت تولد او را اضافه کن تا جزئیات تایمینگ دقیق‌تر شود.',
    },
  },
  ru: {
    goProfile: 'В профиль',
    completeProfile: 'Дополнить профиль',
    genericPartial:
      'Разбор частичный. Добавьте ещё несколько деталей, чтобы уточнить подсказки.',
    byKind: {
      birth_profile:
        'Разбор частичный. Нет времени рождения — часть тайминга остаётся общей.',
      current_location:
        'Разбор частичный. Добавьте текущее местоположение для более точных подсказок по местам.',
      place_shortlist:
        'Разбор частичный. Для сравнения мест нужен более ясный список локаций.',
      partner_profile:
        'Разбор частичный. Дополните профиль этого человека — укажите дату и место рождения.',
      partner_birth_time:
        'Разбор частичный. Добавьте его/её время рождения — тайминг станет точнее.',
    },
  },
  ar: {
    goProfile: 'إلى الملف',
    completeProfile: 'إكمال الملف',
    genericPartial:
      'هذه القراءة جزئية. أضيفي بعض التفاصيل لتحسين الإرشاد.',
    byKind: {
      birth_profile:
        'هذه القراءة جزئية. وقت الميلاد ناقص، لذا تبقى بعض تفاصيل التوقيت عامة.',
      current_location:
        'هذه القراءة جزئية. أضيفي موقعك الحالي لتحسين الإرشاد المكاني.',
      place_shortlist:
        'هذه القراءة جزئية. إرشاد الأماكن يحتاج قائمة أوضح للمقارنة.',
      partner_profile:
        'هذه القراءة جزئية. يلزم إكمال ملف هذا الشخص — بإضافة تاريخ ومكان الميلاد.',
      partner_birth_time:
        'هذه القراءة جزئية. أضيفي وقت ميلاده/ها لتدقيق تفاصيل التوقيت.',
    },
  },
};

export type VaultPowerTimingCopy = {
  topDays: string;
  ask: string;
  commit: string;
  sign: string;
  strongest: string;
  supportive: string;
  lighter: string;
  /** Response-level advisory confidence label (not outcome certainty). */
  confidence: string;
  confidenceHigh: string;
  confidenceMedium: string;
  confidenceLow: string;
};

export const VAULT_POWER_TIMING_COPY: Record<AppLang, VaultPowerTimingCopy> = {
  en: {
    topDays: 'Top days',
    ask: 'Ask',
    commit: 'Commit',
    sign: 'Sign',
    strongest: 'Strongest',
    supportive: 'Supportive',
    lighter: 'Lighter',
    confidence: 'Advisory confidence',
    confidenceHigh: 'Higher',
    confidenceMedium: 'Moderate',
    confidenceLow: 'Lower',
  },
  fa: {
    topDays: 'روزهای برتر',
    ask: 'پرسیدن',
    commit: 'تعهد',
    sign: 'امضا',
    strongest: 'قوی‌ترین',
    supportive: 'حمایت‌گر',
    lighter: 'سبک‌تر',
    confidence: 'اطمینان مشورتی',
    confidenceHigh: 'بالاتر',
    confidenceMedium: 'متوسط',
    confidenceLow: 'پایین‌تر',
  },
  ar: {
    topDays: 'أفضل الأيام',
    ask: 'اطلب',
    commit: 'التزم',
    sign: 'وقّع',
    strongest: 'الأقوى',
    supportive: 'داعم',
    lighter: 'أخف',
    confidence: 'ثقة استرشادية',
    confidenceHigh: 'أعلى',
    confidenceMedium: 'متوسطة',
    confidenceLow: 'أقل',
  },
  ru: {
    topDays: 'Лучшие дни',
    ask: 'Спросить',
    commit: 'Решиться',
    sign: 'Подписать',
    strongest: 'Сильнее всего',
    supportive: 'Поддерживает',
    lighter: 'Слабее',
    confidence: 'Ориентир уверенности',
    confidenceHigh: 'Выше',
    confidenceMedium: 'Средняя',
    confidenceLow: 'Ниже',
  },
};

/** Map API confidence token to localized advisory label; unknown values pass through. */
export function powerAdvisoryConfidenceLabel(
  raw: string | undefined,
  copy: VaultPowerTimingCopy,
): string | null {
  if (!raw || !raw.trim()) return null;
  const key = raw.trim().toLowerCase();
  if (key === 'high') return copy.confidenceHigh;
  if (key === 'medium') return copy.confidenceMedium;
  if (key === 'low') return copy.confidenceLow;
  return raw.trim();
}

export type VaultPreviewLockCopy = {
  sampleLabel: string;
  teaser: string;
  unlock: string;
  premium: string;
  expand: string;
  collapse: string;
  unlockedBadge: string;
  unlockedNote: string;
  comingSoon: string;
};

export const READING_UI: Record<AppLang, VaultReadingUiCopy> = {
  en: {
    liveLabel: 'Your reading',
    loading: 'Reading your chart…',
    needProfile:
      'Save your birth date, time and city in Profile — then this reading is built from your chart.',
    goProfile: 'Go to Profile',
    apiError: 'Could not reach METIORO. Is the API running on port 8000?',
    tryThis: 'Your next move',
  },
  fa: {
    liveLabel: 'خوانش تو',
    loading: 'در حال خواندن چارت…',
    needProfile:
      'تاریخ، ساعت و شهر تولد رو در پروفایل ذخیره کن — بعد این خوانش از چارتت ساخته می‌شه.',
    goProfile: 'رفتن به پروفایل',
    apiError: 'به سرور وصل نشد. API روی پورت ۸۰۰۰ روشن هست؟',
    tryThis: 'قدم بعدی تو',
  },
  ru: {
    liveLabel: 'Ваш разбор',
    loading: 'Читаем карту…',
    needProfile:
      'Сохраните дату, время и город в Профиле — тогда разбор строится по вашей карте.',
    goProfile: 'В профиль',
    apiError: 'Нет связи с API. Запущен ли сервер на порту 8000?',
    tryThis: 'Ваш следующий шаг',
  },
  ar: {
    liveLabel: 'قراءتكِ',
    loading: 'نقرأ خريطتكِ…',
    needProfile:
      'احفظي تاريخ الميلاد والوقت والمدينة في الملف — ثم يُبنى هذا التحليل من خريطتكِ.',
    goProfile: 'إلى الملف',
    apiError: 'تعذّر الاتصال. هل يعمل الخادم على المنفذ 8000؟',
    tryThis: 'خطوتكِ التالية',
  },
};

export const PREVIEW_LOCK_LANGS: Record<AppLang, VaultPreviewLockCopy> = {
  en: {
    sampleLabel: 'Sample reading',
    teaser:
      'A live, personal reading flows here once Premium is on — pulled from your birth chart, today’s sky, and your personal rhythm.',
    unlock: 'Unlock full reading',
    premium: 'Coming Soon',
    expand: 'Open',
    collapse: 'Close',
    unlockedBadge: 'Unlocked',
    unlockedNote:
      'Unlocked with your membership — your live personal reading activates as each tool ships.',
    comingSoon: 'Coming Soon',
  },
  ru: {
    sampleLabel: 'Пример разбора',
    teaser:
      'Здесь появится живой персональный разбор после активации Премиум — из карты рождения, неба дня и вашего ритма.',
    unlock: 'Открыть полный разбор',
    premium: 'Скоро',
    expand: 'Открыть',
    collapse: 'Закрыть',
    unlockedBadge: 'Открыто',
    unlockedNote:
      'Открыто по подписке — живой персональный разбор появится по мере выхода инструментов.',
    comingSoon: 'Скоро',
  },
  fa: {
    sampleLabel: 'نمونه خوانش',
    teaser:
      'با فعال شدن پریمیوم اینجا یه خوانش زنده و شخصی می‌بینی — از چارت تولدت، آسمان امروز و ریتم شخصی‌ات.',
    unlock: 'باز کردن خوانش کامل',
    premium: 'به‌زودی',
    expand: 'باز کن',
    collapse: 'ببند',
    unlockedBadge: 'باز شد',
    unlockedNote:
      'با اشتراکت باز شد — خوانش زنده‌ی شخصی با آماده‌شدن هر ابزار فعال می‌شه.',
    comingSoon: 'به‌زودی',
  },
  ar: {
    sampleLabel: 'قراءة تجريبية',
    teaser:
      'ستظهر قراءة شخصية حيّة هنا عند تفعيل البريميوم — من خريطة ميلادك وسماء اليوم وإيقاعك الشخصي.',
    unlock: 'افتحي القراءة الكاملة',
    premium: 'قريباً',
    expand: 'افتح',
    collapse: 'إغلاق',
    unlockedBadge: 'مفتوح',
    unlockedNote:
      'مفتوح باشتراكك — تُفعّل قراءتك الشخصية الحيّة مع إطلاق كل أداة.',
    comingSoon: 'قريباً',
  },
};

export const SECTION_LANGS: Record<AppLang, VaultSectionLangPack> = {
  en: {
    back: '← Back to Vault',
    vaultHome: 'The Vault',
    previewNote: 'Preview mode — full tools unlock with Premium.',
    sensuality: {
      title: 'Sensuality',
      sub: 'Desire, fantasy and magnetism — interpreted through your personal timing.',
      intro:
        'Read the geometry of desire, fantasy, and magnetism through your chart — then choose when to lean in.',
      items: [
        { label: 'Mars Desire Signature', hint: 'How Mars shapes desire and pursuit in your chart' },
        { label: 'Deep Fantasies', hint: 'Private themes of longing and intensity' },
        { label: 'Hidden Magnetism', hint: 'Presence you do not announce' },
        { label: 'Attraction Today', hint: 'Hours when your appeal peaks' },
      ],
      coming: 'Coming soon — connects to your birth profile.',
    },
    cycle: {
      title: 'Body & Cycle',
      sub: 'Personal rhythms, energy shifts and cycle reflection — for wellness awareness only.',
      intro:
        'Reflect on energy shifts and personal rhythm alongside the sky — wellness awareness, not medical advice.',
      items: [
        { label: 'Rhythm Sync', hint: 'Sky rhythm vs your personal pace' },
        { label: 'Energy Peak', hint: 'Days that often feel more open' },
        { label: 'Energy Calendar', hint: 'Weekly energy rhythm' },
        { label: 'Protect Days', hint: 'Days to guard rest and boundaries' },
      ],
      coming: 'Coming soon — cycle reflection with sky rhythm. Wellness awareness only.',
    },
    provider: {
      title: 'The Provider',
      sub: 'Patterns around security, resources, partnership and supportive environments.',
      intro:
        'Where support and resources tend to gather — places, partnership patterns, and stability signals to act on.',
      items: [
        { label: 'Prosperity Geography', hint: 'Places that score higher for expansion and resources' },
        { label: 'Love Lines Map', hint: 'Places that score higher for connection' },
        { label: 'Partner Profile', hint: 'Ideal traits and compatibility patterns' },
        { label: 'Compatibility', hint: 'Emotional, chemistry, and stability scores' },
      ],
      coming: 'Coming soon — place maps and partner timing.',
    },
    shadow: {
      title: 'Shadow Room',
      sub: 'Patterns of trust, privacy and emotional protection. Signals, never verdicts.',
      intro:
        'Patterns of secrecy, trust, and emotional protection. We show signals — never verdicts. Verify before you decide.',
      items: [
        { label: 'Cheating Radar', hint: 'Signals to verify — never verdicts' },
        { label: 'Trust Patterns', hint: 'Building, pressure, repair — not verdicts' },
        { label: 'Communication Risk', hint: 'Clarity, reactivity, escalation — not verdicts' },
        { label: 'Private Conversation Timing', hint: 'Quieter windows for private talks — reflection only' },
      ],
      coming: 'Coming soon — timing tools. Educational only.',
    },
    look: {
      title: 'Style Timing',
      sub: 'Daily guidance for colour, scent, presentation and personal presence.',
      intro:
        'What to wear, scent, and share today so your presence lands with intention.',
      items: [
        { label: "Today's Color", hint: 'Dress code for today' },
        { label: "Today's Perfume", hint: 'Soft vs deep scent notes' },
        { label: 'Best Post Time', hint: 'Best hour to post' },
        { label: 'Date Outfit', hint: 'Presentation that matches tonight’s tone' },
      ],
      coming: 'Coming soon — daily dress code.',
    },
    power: {
      title: 'Power Calendar',
      sub: 'Timing patterns for confidence, money, connection, distance and deliberate action.',
      intro:
        'Heat days, money days, distance days, and yes-days — choose when to ask, lean in, or step back.',
      items: [
        { label: 'Heat Days', hint: 'Peak chemistry windows' },
        { label: 'Money Days', hint: 'Best days to ask' },
        { label: 'Ghost Days', hint: 'Strategic distance' },
        { label: 'Yes Day', hint: 'Big asks and proposals' },
      ],
      coming:
        'Live ranked timing windows for heat, money, distance, and yes-days — advisory guidance only.',
    },
    lounge: {
      title: 'Pink Lounge',
      sub: 'A private editorial space for intimacy, confidence, emotional reflection and relationship rituals.',
      intro:
        'Quiet, member-only editorial rooms for intimacy, confidence, emotional reflection, and relationship rituals — aliases only.',
      items: [
        {
          label: 'Secret Circles',
          hint: 'Themed rooms for intimacy and emotional reflection',
        },
        {
          label: 'Ask Julia (anon)',
          hint: 'One anonymous question on confidence or connection',
        },
        {
          label: 'Verified Queens',
          hint: 'Light verification — badge on your alias',
        },
        {
          label: 'Leave No Trace',
          hint: 'One-tap wipe for this private session',
        },
      ],
      coming: 'Coming soon — private editorial rooms and rituals.',
    },
  },
  ru: {
    back: '← Назад в Хранилище',
    vaultHome: 'Хранилище',
    previewNote: 'Режим превью — полные инструменты с Премиум.',
    sensuality: {
      title: 'Чувственность',
      sub: 'Желание, фантазия и магнетизм — через ваш личный тайминг.',
      intro:
        'Геометрия желания, фантазии и магнетизма по вашей карте — и момент, когда стоит шагнуть ближе.',
      items: [
        { label: 'Сигнатура желания (Марс)', hint: 'Как Марс формирует желание и стремление в карте' },
        { label: 'Глубокие фантазии', hint: 'Личные темы томления и интенсивности' },
        { label: 'Скрытый магнетизм', hint: 'Присутствие без объявления' },
        { label: 'Притяжение сегодня', hint: 'Часы пика притягательности' },
      ],
      coming: 'Скоро — связь с картой рождения.',
    },
    cycle: {
      title: 'Тело и цикл',
      sub: 'Личные ритмы, сдвиги энергии и рефлексия цикла — только для осознанности здоровья.',
      intro:
        'Рефлексия энергии и личного ритма рядом с небом — осознанность, не медицинский совет.',
      items: [
        { label: 'Синхрон ритма', hint: 'Ритм неба и ваш темп' },
        { label: 'Пик энергии', hint: 'Дни большей открытости' },
        { label: 'Календарь энергии', hint: 'Ритм недели' },
        { label: 'Дни защиты', hint: 'Дни беречь отдых и границы' },
      ],
      coming: 'Скоро — рефлексия цикла с ритмом неба. Только осознанность.',
    },
    provider: {
      title: 'Покровитель',
      sub: 'Паттерны безопасности, ресурсов, партнёрства и поддерживающих сред.',
      intro:
        'Где собираются поддержка и ресурсы — места, паттерны партнёрства и сигналы стабильности.',
      items: [
        { label: 'География процветания', hint: 'Места с более высоким баллом для роста и ресурсов' },
        { label: 'Карта любви', hint: 'Места с более высоким баллом связи' },
        { label: 'Профиль партнёра', hint: 'Черты и паттерны совместимости' },
        { label: 'Совместимость', hint: 'Эмоции, химия и стабильность' },
      ],
      coming: 'Скоро — карты мест и тайминг партнёра.',
    },
    shadow: {
      title: 'Теневая комната',
      sub: 'Паттерны доверия, приватности и эмоциональной защиты. Сигналы, не приговоры.',
      intro:
        'Паттерны скрытности, доверия и защиты. Мы показываем сигналы — не приговоры. Проверяйте перед решением.',
      items: [
        { label: 'Радар верности', hint: 'Сигналы для проверки — не приговоры' },
        { label: 'Паттерны доверия', hint: 'Строительство, давление, ремонт — не приговоры' },
        { label: 'Риск общения', hint: 'Ясность, реактивность, эскалация — не приговоры' },
        { label: 'Время для частных разговоров', hint: 'Более тихие окна для личных бесед — только рефлексия' },
      ],
      coming: 'Скоро — тайминг. Только обучение.',
    },
    look: {
      title: 'Стиль и тайминг',
      sub: 'Ежедневные подсказки по цвету, аромату, подаче и присутствию.',
      intro: 'Что надеть, какой аромат выбрать и когда делиться — с намерением.',
      items: [
        { label: 'Цвет дня', hint: 'Код стиля на сегодня' },
        { label: 'Аромат дня', hint: 'Мягкие и глубокие ноты' },
        { label: 'Время лайва', hint: 'Лучший час' },
        { label: 'Образ на свидание', hint: 'Подача под тон вечера' },
      ],
      coming: 'Скоро — ежедневный код стиля.',
    },
    power: {
      title: 'Календарь силы',
      sub: 'Тайминг уверенности, денег, связи, дистанции и осознанных шагов.',
      intro:
        'Горячие дни, дни денег, дни дистанции и дни «да» — когда просить, сближаться или отойти.',
      items: [
        { label: 'Горячие дни', hint: 'Окна жара' },
        { label: 'Дни денег', hint: 'Лучшие дни спросить' },
        { label: 'Дни тишины', hint: 'Дистанция' },
        { label: 'День «да»', hint: 'Большие просьбы' },
      ],
      coming:
        'Живые окна тайминга для жара, денег, дистанции и дней «да» — только ориентиры, не гарантии.',
    },
    lounge: {
      title: 'Pink Lounge',
      sub: 'Закрытое редакционное пространство для близости, уверенности, эмоциональной рефлексии и ритуалов отношений.',
      intro:
        'Тихие комнаты только для участниц: близость, уверенность, рефлексия и ритуалы отношений — только псевдонимы.',
      items: [
        {
          label: 'Секретные круги',
          hint: 'Тематические комнаты для близости и рефлексии',
        },
        {
          label: 'Спросить Юлию',
          hint: 'Один анонимный вопрос об уверенности или связи',
        },
        {
          label: 'Verified Queens',
          hint: 'Лёгкая проверка — значок у псевдонима',
        },
        {
          label: 'Без следа',
          hint: 'Очистка этой приватной сессии одним касанием',
        },
      ],
      coming: 'Скоро — закрытые редакционные комнаты и ритуалы.',
    },
  },
  fa: {
    back: '→ بازگشت به محرمانه',
    vaultHome: 'محرمانه',
    previewNote: 'حالت پیش‌نمایش — ابزار کامل با پریمیوم.',
    sensuality: {
      title: 'شهوت و جذابیت',
      sub: 'میل، فانتزی و مگنتیسم — از مسیر تایمینگ شخصی تو.',
      intro:
        'هندسه میل، فانتزی و مگنتیسم از روی چارت — بعد انتخاب کن کی نزدیک‌تر بشی.',
      items: [
        { label: 'امضای میل (مریخ)', hint: 'مریخ چطور میل و پیگیری را در چارتت شکل می‌دهد' },
        { label: 'فانتزی‌های عمیق', hint: 'تم‌های خصوصی اشتیاق و شدت' },
        { label: 'مگنتیسم پنهان', hint: 'حضوری که اعلام نمی‌کنی' },
        { label: 'جذابیت امروز', hint: 'ساعات اوج جذابیت' },
      ],
      coming: 'به‌زودی — اتصال به پروفایل تولد.',
    },
    cycle: {
      title: 'بدن و چرخه',
      sub: 'ریتم شخصی، جابه‌جایی انرژی و بازتاب چرخه — فقط برای آگاهی سلامتی.',
      intro:
        'بازتاب انرژی و ریتم شخصی کنار آسمان — آگاهی سلامتی، نه توصیه پزشکی.',
      items: [
        { label: 'هم‌گام ریتم', hint: 'ریتم آسمان و آهنگ شخصی تو' },
        { label: 'اوج انرژی', hint: 'روزهایی که معمولاً بازتر حس می‌شن' },
        { label: 'تقویم انرژی', hint: 'ریتم هفتگی' },
        { label: 'روزهای محافظت', hint: 'روزهای مراقبت از استراحت و مرزها' },
      ],
      coming: 'به‌زودی — بازتاب چرخه با ریتم آسمان. فقط آگاهی سلامتی.',
    },
    provider: {
      title: 'حامی',
      sub: 'الگوهای امنیت، منابع، شراکت و محیط‌های حمایتی.',
      intro:
        'جایی که حمایت و منابع جمع می‌شن — مکان‌ها، الگوهای شراکت و سیگنال‌های ثبات.',
      items: [
        { label: 'جغرافیای رفاه', hint: 'جاهایی با امتیاز بالاتر برای گسترش و منابع' },
        { label: 'نقشه عشق', hint: 'جاهایی با امتیاز بالاتر برای ارتباط' },
        { label: 'پروفایل شریک', hint: 'ویژگی ایده‌آل و الگوهای هم‌خوانی' },
        { label: 'هم‌خوانی', hint: 'عاطفی، شیمی و ثبات' },
      ],
      coming: 'به‌زودی — نقشه مکان و تایمینگ شریک.',
    },
    shadow: {
      title: 'اتاق سایه',
      sub: 'الگوهای اعتماد، حریم خصوصی و محافظت احساسی. نشانه، نه حکم.',
      intro:
        'الگوهای پنهان‌کاری، اعتماد و محافظت احساسی. ما نشانه می‌دهیم — نه حکم. قبل از تصمیم بررسی کن.',
      items: [
        { label: 'رادار خیانت', hint: 'نشانه‌هایی برای بررسی — نه حکم' },
        { label: 'الگوهای اعتماد', hint: 'ساخت، فشار، ترمیم — نه حکم' },
        { label: 'ریسک ارتباط', hint: 'وضوح، واکنش، تشدید — نه حکم' },
        { label: 'زمان گفت‌وگوی خصوصی', hint: 'پنجره‌های آرام‌تر برای حرف خصوصی — فقط بازتاب' },
      ],
      coming: 'به‌زودی — تایمینگ. فقط آموزشی.',
    },
    look: {
      title: 'زمان‌بندی استایل',
      sub: 'راهنمای روزانه برای رنگ، عطر، ارائه و حضور شخصی.',
      intro: 'امروز چه بپوشی، چه عطری بزنی و کی به اشتراک بذاری — با نیت.',
      items: [
        { label: 'رنگ امروز', hint: 'کد لباس امروز' },
        { label: 'عطر امروز', hint: 'نت‌های نرم در برابر عمیق' },
        { label: 'ساعت لایو', hint: 'بهترین پست' },
        { label: 'استایل قرار', hint: 'ارائه‌ای هم‌خوان با حال امشب' },
      ],
      coming: 'به‌زودی — کد لباس روزانه.',
    },
    power: {
      title: 'تقویم قدرت',
      sub: 'الگوهای تایمینگ برای اعتمادبه‌نفس، پول، ارتباط، فاصله و اقدام آگاهانه.',
      intro:
        'روزهای داغ، روز پول، روز فاصله و روز «بله» — کی بخواهی، نزدیک شی یا فاصله بگیری.',
      items: [
        { label: 'روزهای داغ', hint: 'پنجره‌های حرارت' },
        { label: 'روز پول', hint: 'بهترین روز درخواست' },
        { label: 'روز غیبت', hint: 'دوری استراتژیک' },
        { label: 'روز بله', hint: 'درخواست بزرگ' },
      ],
      coming:
        'پنجره‌های تایمینگ زنده برای حرارت، پول، فاصله و روز بله — فقط راهنمایی مشورتی.',
    },
    lounge: {
      title: 'لانژ صورتی',
      sub: 'فضای تحریریه‌ی خصوصی برای صمیمیت، اعتمادبه‌نفس، بازتاب احساسی و آیین‌های رابطه.',
      intro:
        'اتاق‌های آرام فقط برای اعضا: صمیمیت، اعتمادبه‌نفس، بازتاب احساسی و آیین رابطه — فقط نام مستعار.',
      items: [
        {
          label: 'حلقه‌های سکرت',
          hint: 'اتاق‌های موضوعی برای صمیمیت و بازتاب احساسی',
        },
        {
          label: 'سوال از جولیا',
          hint: 'یک سوال ناشناس درباره اعتمادبه‌نفس یا ارتباط',
        },
        {
          label: 'ملکه تأییدشده',
          hint: 'چک سبک — نشان روی نام مستعار',
        },
        {
          label: 'بدون ردپا',
          hint: 'پاک‌سازی این نشست خصوصی با یک کلیک',
        },
      ],
      coming: 'به‌زودی — اتاق‌های تحریریه‌ی خصوصی و آیین‌ها.',
    },
  },
  ar: {
    back: '← العودة إلى الخزانة',
    vaultHome: 'الخزانة',
    previewNote: 'وضع المعاينة — الأدوات الكاملة مع البريميوم.',
    sensuality: {
      title: 'الحسّية',
      sub: 'الرغبة والخيال والجاذبية — عبر توقيتكِ الشخصي.',
      intro:
        'هندسة الرغبة والخيال والجاذبية من خريطتكِ — ثم اختاري متى تقتربين.',
      items: [
        { label: 'بصمة الرغبة (المريخ)', hint: 'كيف يشكّل المريخ الرغبة والسعي في خريطتكِ' },
        { label: 'خيالات عميقة', hint: 'ثيمات خاصة من الشوق والشدّة' },
        { label: 'جاذبية خفية', hint: 'حضور بلا إعلان' },
        { label: 'جاذبية اليوم', hint: 'ساعات الذروة' },
      ],
      coming: 'قريباً — ربط بملف الميلاد.',
    },
    cycle: {
      title: 'الجسد والدورة',
      sub: 'إيقاعات شخصية وتحوّلات طاقة وتأمّل الدورة — للتوعية بالعافية فقط.',
      intro:
        'تأمّلي تحوّلات الطاقة وإيقاعكِ الشخصي مع السماء — توعية بالعافية، لا نصيحة طبية.',
      items: [
        { label: 'مزامنة الإيقاع', hint: 'إيقاع السماء ووتيرتكِ' },
        { label: 'ذروة الطاقة', hint: 'أيام غالباً أكثر انفتاحاً' },
        { label: 'تقويم الطاقة', hint: 'إيقاع الأسبوع' },
        { label: 'أيام الحماية', hint: 'أيام لحراسة الراحة والحدود' },
      ],
      coming: 'قريباً — تأمّل الدورة مع إيقاع السماء. توعية فقط.',
    },
    provider: {
      title: 'العائل',
      sub: 'أنماط الأمن والموارد والشراكة والبيئات الداعمة.',
      intro:
        'أين تتجمّع الدعم والموارد — أماكن وأنماط شراكة وإشارات استقرار للعمل عليها.',
      items: [
        { label: 'جغرافيا الازدهار', hint: 'أماكن بدرجات أعلى للتوسّع والموارد' },
        { label: 'خريطة الحب', hint: 'أماكن بدرجات أعلى للارتباط' },
        { label: 'ملف الشريك', hint: 'سمات مثالية وأنماط توافق' },
        { label: 'التوافق', hint: 'عاطفي وكيمياء واستقرار' },
      ],
      coming: 'قريباً — خرائط الأماكن وتوقيت الشريك.',
    },
    shadow: {
      title: 'غرفة الظل',
      sub: 'أنماط الثقة والخصوصية والحماية العاطفية. إشارات، لا أحكام.',
      intro:
        'أنماط الكتمان والثقة والحماية العاطفية. نعرض إشارات — لا أحكاماً. تحقّقي قبل القرار.',
      items: [
        { label: 'رادار الخيانة', hint: 'إشارات للتحقّق — لا أحكام' },
        { label: 'أنماط الثقة', hint: 'بناء وضغط وإصلاح — لا أحكام' },
        { label: 'مخاطر التواصل', hint: 'وضوح وردة فعل وتصعيد — لا أحكام' },
        { label: 'توقيت المحادثة الخاصة', hint: 'نوافذ أهدأ لأحاديث خاصة — تأمّل فقط' },
      ],
      coming: 'قريباً — توقيت. تعليمي فقط.',
    },
    look: {
      title: 'توقيت الأسلوب',
      sub: 'إرشاد يومي للون والعطر والتقديم والحضور الشخصي.',
      intro: 'ماذا ترتدين وتتعطّرين ومتى تشاركين — بقصد.',
      items: [
        { label: 'لون اليوم', hint: 'كود الإطلالة اليوم' },
        { label: 'عطر اليوم', hint: 'نغمات ناعمة مقابل عميقة' },
        { label: 'وقت البث', hint: 'أفضل ساعة' },
        { label: 'إطلالة الموعد', hint: 'تقديم يناسب نبرة الليلة' },
      ],
      coming: 'قريباً — كود إطلالة يومي.',
    },
    power: {
      title: 'تقويم القوة',
      sub: 'أنماط توقيت للثقة والمال والارتباط والمسافة والفعل الواعي.',
      intro:
        'أيام حارّة وأيام مال وأيام مسافة وأيام «نعم» — متى تطلبين أو تقتربين أو تتراجعين.',
      items: [
        { label: 'أيام حارّة', hint: 'نوافذ الذروة' },
        { label: 'أيام المال', hint: 'أفضل أيام الطلب' },
        { label: 'أيام الغياب', hint: 'مسافة استراتيجية' },
        { label: 'يوم نعم', hint: 'طلبات كبيرة' },
      ],
      coming:
        'نوافذ توقيت حيّة للحرارة والمال والمسافة وأيام النعم — إرشاد استرشادي فقط.',
    },
    lounge: {
      title: 'صالون الوردي',
      sub: 'مساحة تحريرية خاصة للحميمية والثقة والتأمّل العاطفي وطقوس العلاقة.',
      intro:
        'غرف هادئة للأعضاء فقط: حميمية وثقة وتأمّل عاطفي وطقوس علاقة — أسماء مستعارة فقط.',
      items: [
        {
          label: 'دوائر سرّية',
          hint: 'غرف حسب الموضوع للحميمية والتأمّل العاطفي',
        },
        {
          label: 'اسألي جوليا',
          hint: 'سؤال مجهول واحد عن الثقة أو الارتباط',
        },
        {
          label: 'ملكات موثّقات',
          hint: 'تحقّق خفيف — الشارة على الاسم المستعار',
        },
        {
          label: 'بلا أثر',
          hint: 'مسح هذه الجلسة الخاصة بضغطة',
        },
      ],
      coming: 'قريباً — غرف تحريرية خاصة وطقوس.',
    },
  },
};

export function isValidVaultSection(s: string | undefined): s is VaultSectionKey {
  return !!s && VAULT_SECTION_ORDER.includes(s as VaultSectionKey);
}
