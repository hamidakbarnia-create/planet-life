import type { AppLang } from './app-settings';

/**
 * Oracle — question-driven layer of the app.
 *
 * 6 modules × 5 questions = 30 concrete scenarios the user can ask about.
 * Each question maps to a backend `action_type` so the scoring engine can
 * weight it correctly. The same question definitions are used by:
 *   - The Oracle page (/ask) — user picks one and gets a scored answer
 *   - The Strategic Calendar — to compute per-module daily breakdown
 *   - Julia's CMS — to tag her readings by category
 */

export type OracleModuleId =
  | 'business'
  | 'love'
  | 'travel'
  | 'health'
  | 'work'
  | 'luck';

export interface OracleModule {
  id: OracleModuleId;
  icon: string;
  color: string;
  labels: Record<AppLang, string>;
  description: Record<AppLang, string>;
}

export interface OracleQuestion {
  id: string;
  module: OracleModuleId;
  /** Maps to the backend action_type for scoring. */
  actionType: string;
  /** Whether time of day matters (true) or only the date (false). */
  needsTime: boolean;
  labels: Record<AppLang, string>;
}

export const ORACLE_MODULES: OracleModule[] = [
  {
    id: 'business',
    icon: '📈',
    color: '#fbbf24',
    labels: {
      en: 'Business & Wealth',
      fa: 'تجارت و ثروت',
      ru: 'Бизнес и капитал',
      ar: 'الأعمال والثروة',
    },
    description: {
      en: 'Launches, contracts, money moves, investor meetings',
      fa: 'لانچ، قرارداد، جابجایی پول، جلسه سرمایه‌گذار',
      ru: 'Запуски, контракты, финансы, инвесторы',
      ar: 'الإطلاقات والعقود والمالية والمستثمرون',
    },
  },
  {
    id: 'love',
    icon: '💑',
    color: '#f472b6',
    labels: {
      en: 'Love & People',
      fa: 'عشق و افراد',
      ru: 'Любовь и люди',
      ar: 'الحب والناس',
    },
    description: {
      en: 'Reconciliation, hard talks, marriage, partings',
      fa: 'آشتی، گفتگوی سخت، ازدواج، جدایی',
      ru: 'Примирение, разговоры, брак, расставания',
      ar: 'المصالحة والحوار الصعب والزواج والانفصال',
    },
  },
  {
    id: 'travel',
    icon: '🌍',
    color: '#60a5fa',
    labels: {
      en: 'Travel & Place',
      fa: 'سفر و مکان',
      ru: 'Путешествия и место',
      ar: 'السفر والمكان',
    },
    description: {
      en: 'Trips, relocation, property, leases',
      fa: 'سفر، مهاجرت، ملک، اجاره‌نامه',
      ru: 'Поездки, переезд, недвижимость, аренда',
      ar: 'الرحلات والانتقال والعقارات والإيجار',
    },
  },
  {
    id: 'health',
    icon: '🩺',
    color: '#4ade80',
    labels: {
      en: 'Health & Body',
      fa: 'سلامتی و بدن',
      ru: 'Здоровье и тело',
      ar: 'الصحة والجسد',
    },
    description: {
      en: 'Surgery, fasting, treatments, fitness starts',
      fa: 'جراحی، روزه، درمان، شروع تمرین',
      ru: 'Операции, пост, лечение, спорт',
      ar: 'الجراحة والصيام والعلاج واللياقة',
    },
  },
  {
    id: 'work',
    icon: '🎙️',
    color: '#a78bfa',
    labels: {
      en: 'Work & Voice',
      fa: 'کار و صدا',
      ru: 'Работа и голос',
      ar: 'العمل والصوت',
    },
    description: {
      en: 'Social posts, interviews, pitches, creative launches',
      fa: 'پست سوشال، مصاحبه، ارائه، شروع کار خلاقانه',
      ru: 'Соцсети, интервью, питчи, творчество',
      ar: 'المنشورات والمقابلات والعروض والإبداع',
    },
  },
  {
    id: 'luck',
    icon: '🍀',
    color: '#fb923c',
    labels: {
      en: 'Luck & Crisis',
      fa: 'شانس و بحران',
      ru: 'Удача и кризис',
      ar: 'الحظ والأزمة',
    },
    description: {
      en: 'Risks, fresh starts, endings, big decisions',
      fa: 'ریسک، شروع تازه، پایان دادن، تصمیم بزرگ',
      ru: 'Риски, начала, окончания, решения',
      ar: 'المخاطر والبدايات والنهايات والقرارات',
    },
  },
];

export const ORACLE_QUESTIONS: OracleQuestion[] = [
  // ── Business & Wealth ─────────────────────────────────────────────────────
  {
    id: 'launch-project',
    module: 'business',
    actionType: 'business_launch',
    needsTime: true,
    labels: {
      en: 'Best time to launch a new project or product',
      fa: 'بهترین زمان برای لانچ پروژه یا محصول جدید',
      ru: 'Лучшее время для запуска нового проекта или продукта',
      ar: 'أفضل وقت لإطلاق مشروع أو منتج جديد',
    },
  },
  {
    id: 'sign-contract',
    module: 'business',
    actionType: 'contract_signing',
    needsTime: true,
    labels: {
      en: 'Best time to sign a contract',
      fa: 'بهترین زمان برای امضای قرارداد',
      ru: 'Лучшее время для подписания контракта',
      ar: 'أفضل وقت لتوقيع عقد',
    },
  },
  {
    id: 'apply-loan',
    module: 'business',
    actionType: 'loan_application',
    needsTime: false,
    labels: {
      en: 'Apply for a loan or credit line',
      fa: 'درخواست وام یا اعتبار مالی',
      ru: 'Подать заявку на кредит',
      ar: 'التقدم بطلب قرض أو ائتمان',
    },
  },
  {
    id: 'buy-sell-asset',
    module: 'business',
    actionType: 'asset_trade',
    needsTime: true,
    labels: {
      en: 'Buy or sell stocks, gold, or crypto',
      fa: 'خرید یا فروش سهام، طلا یا کریپتو',
      ru: 'Купить или продать акции, золото или крипту',
      ar: 'شراء أو بيع الأسهم أو الذهب أو الكريبتو',
    },
  },
  {
    id: 'meet-investor',
    module: 'business',
    actionType: 'investor_meeting',
    needsTime: true,
    labels: {
      en: 'Meet an investor or pitch for funding',
      fa: 'جلسه با سرمایه‌گذار یا ارائه برای جذب سرمایه',
      ru: 'Встреча с инвестором или питч',
      ar: 'لقاء مستثمر أو عرض للتمويل',
    },
  },

  // ── Love & People ─────────────────────────────────────────────────────────
  {
    id: 'reconcile',
    module: 'love',
    actionType: 'reconciliation',
    needsTime: true,
    labels: {
      en: 'Reconcile after a fight',
      fa: 'آشتی بعد از دعوا',
      ru: 'Примириться после ссоры',
      ar: 'المصالحة بعد شجار',
    },
  },
  {
    id: 'hard-talk',
    module: 'love',
    actionType: 'difficult_conversation',
    needsTime: true,
    labels: {
      en: 'Have a difficult conversation',
      fa: 'داشتن یک گفتگوی سخت',
      ru: 'Провести трудный разговор',
      ar: 'إجراء محادثة صعبة',
    },
  },
  {
    id: 'first-date',
    module: 'love',
    actionType: 'first_meeting',
    needsTime: true,
    labels: {
      en: 'First date or first meeting',
      fa: 'اولین قرار یا اولین ملاقات',
      ru: 'Первое свидание или первая встреча',
      ar: 'موعد أول أو لقاء أول',
    },
  },
  {
    id: 'propose',
    module: 'love',
    actionType: 'marriage_proposal',
    needsTime: true,
    labels: {
      en: 'Propose marriage',
      fa: 'پیشنهاد ازدواج',
      ru: 'Сделать предложение',
      ar: 'تقديم عرض زواج',
    },
  },
  {
    id: 'end-relationship',
    module: 'love',
    actionType: 'relationship_ending',
    needsTime: false,
    labels: {
      en: 'End a relationship',
      fa: 'پایان دادن به یک رابطه',
      ru: 'Завершить отношения',
      ar: 'إنهاء علاقة',
    },
  },

  // ── Travel & Place ────────────────────────────────────────────────────────
  {
    id: 'start-trip',
    module: 'travel',
    actionType: 'travel_start',
    needsTime: true,
    labels: {
      en: 'Start a journey',
      fa: 'شروع یک سفر',
      ru: 'Начать поездку',
      ar: 'بدء رحلة',
    },
  },
  {
    id: 'business-trip',
    module: 'travel',
    actionType: 'business_trip',
    needsTime: false,
    labels: {
      en: 'Take a business trip',
      fa: 'سفر کاری',
      ru: 'Деловая поездка',
      ar: 'رحلة عمل',
    },
  },
  {
    id: 'relocate-city',
    module: 'travel',
    actionType: 'relocation',
    needsTime: false,
    labels: {
      en: 'Move to a new city or country',
      fa: 'مهاجرت به شهر یا کشور جدید',
      ru: 'Переехать в новый город или страну',
      ar: 'الانتقال إلى مدينة أو دولة جديدة',
    },
  },
  {
    id: 'buy-sell-property',
    module: 'travel',
    actionType: 'property_trade',
    needsTime: true,
    labels: {
      en: 'Buy or sell property',
      fa: 'خرید یا فروش ملک',
      ru: 'Купить или продать недвижимость',
      ar: 'شراء أو بيع عقار',
    },
  },
  {
    id: 'sign-lease',
    module: 'travel',
    actionType: 'lease_signing',
    needsTime: true,
    labels: {
      en: 'Sign a lease or move into a home',
      fa: 'امضای اجاره‌نامه یا اسباب‌کشی',
      ru: 'Подписать аренду или переехать',
      ar: 'توقيع عقد إيجار أو الانتقال إلى منزل',
    },
  },

  // ── Health & Body ─────────────────────────────────────────────────────────
  {
    id: 'surgery',
    module: 'health',
    actionType: 'surgery',
    needsTime: true,
    labels: {
      en: 'Schedule a surgery',
      fa: 'برنامه‌ریزی برای جراحی',
      ru: 'Запланировать операцию',
      ar: 'تحديد موعد عملية جراحية',
    },
  },
  {
    id: 'start-fast',
    module: 'health',
    actionType: 'fasting_start',
    needsTime: false,
    labels: {
      en: 'Start a fast or detox diet',
      fa: 'شروع روزه یا رژیم پاکسازی',
      ru: 'Начать пост или детокс',
      ar: 'بدء صيام أو حمية تطهير',
    },
  },
  {
    id: 'dentist',
    module: 'health',
    actionType: 'dental_visit',
    needsTime: true,
    labels: {
      en: 'Visit the dentist',
      fa: 'مراجعه به دندان‌پزشک',
      ru: 'Визит к стоматологу',
      ar: 'زيارة طبيب الأسنان',
    },
  },
  {
    id: 'fertility',
    module: 'health',
    actionType: 'fertility_treatment',
    needsTime: false,
    labels: {
      en: 'Fertility treatment or IVF cycle',
      fa: 'درمان ناباروری یا چرخه IVF',
      ru: 'Лечение бесплодия или ЭКО',
      ar: 'علاج الخصوبة أو دورة التلقيح الصناعي',
    },
  },
  {
    id: 'start-workout',
    module: 'health',
    actionType: 'workout_routine',
    needsTime: false,
    labels: {
      en: 'Start a new workout routine',
      fa: 'شروع برنامه تمرینی جدید',
      ru: 'Начать новую программу тренировок',
      ar: 'بدء روتين تمارين جديد',
    },
  },

  // ── Work & Voice ──────────────────────────────────────────────────────────
  {
    id: 'social-post',
    module: 'work',
    actionType: 'social_media_post',
    needsTime: true,
    labels: {
      en: 'Post on social media',
      fa: 'پست در شبکه اجتماعی',
      ru: 'Публикация в соцсетях',
      ar: 'نشر في وسائل التواصل',
    },
  },
  {
    id: 'job-interview',
    module: 'work',
    actionType: 'job_interview',
    needsTime: true,
    labels: {
      en: 'Job interview',
      fa: 'مصاحبه کاری',
      ru: 'Собеседование',
      ar: 'مقابلة عمل',
    },
  },
  {
    id: 'give-pitch',
    module: 'work',
    actionType: 'presentation',
    needsTime: true,
    labels: {
      en: 'Give a pitch or presentation',
      fa: 'ارائه یا پرزنتیشن',
      ru: 'Презентация или питч',
      ar: 'تقديم عرض أو بريزنتيشن',
    },
  },
  {
    id: 'send-resume',
    module: 'work',
    actionType: 'job_application',
    needsTime: false,
    labels: {
      en: 'Send a resume or job application',
      fa: 'ارسال رزومه یا درخواست شغل',
      ru: 'Отправить резюме',
      ar: 'إرسال السيرة الذاتية',
    },
  },
  {
    id: 'creative-launch',
    module: 'work',
    actionType: 'creative_project',
    needsTime: false,
    labels: {
      en: 'Launch a creative project (book, music, art)',
      fa: 'شروع پروژه خلاقانه (کتاب، موسیقی، هنر)',
      ru: 'Запустить творческий проект',
      ar: 'إطلاق مشروع إبداعي',
    },
  },

  // ── Luck & Crisis ─────────────────────────────────────────────────────────
  {
    id: 'take-risk',
    module: 'luck',
    actionType: 'risk_taking',
    needsTime: true,
    labels: {
      en: 'Take a calculated risk',
      fa: 'قبول یک ریسک حساب‌شده',
      ru: 'Пойти на просчитанный риск',
      ar: 'الإقدام على مخاطرة محسوبة',
    },
  },
  {
    id: 'fresh-start',
    module: 'luck',
    actionType: 'fresh_start',
    needsTime: false,
    labels: {
      en: 'Start something completely new',
      fa: 'شروع کاری کاملاً جدید',
      ru: 'Начать что-то совершенно новое',
      ar: 'بدء شيء جديد تمامًا',
    },
  },
  {
    id: 'cut-tie',
    module: 'luck',
    actionType: 'ending_chapter',
    needsTime: false,
    labels: {
      en: 'Close a chapter / cut something off',
      fa: 'بستن یک فصل / قطع کردن چیزی',
      ru: 'Закрыть главу / прервать что-то',
      ar: 'إغلاق فصل / قطع شيء',
    },
  },
  {
    id: 'big-decision',
    module: 'luck',
    actionType: 'major_decision',
    needsTime: true,
    labels: {
      en: 'Make a major life decision',
      fa: 'اتخاذ یک تصمیم بزرگ زندگی',
      ru: 'Принять важное решение',
      ar: 'اتخاذ قرار مهم في الحياة',
    },
  },
  {
    id: 'chance-event',
    module: 'luck',
    actionType: 'chance_event',
    needsTime: true,
    labels: {
      en: 'Buy a lottery ticket / chance opportunity',
      fa: 'خرید بلیط بخت‌آزمایی / فرصت شانسی',
      ru: 'Лотерея / случайная возможность',
      ar: 'شراء تذكرة يانصيب / فرصة',
    },
  },
];

export function questionsByModule(moduleId: OracleModuleId): OracleQuestion[] {
  return ORACLE_QUESTIONS.filter((q) => q.module === moduleId);
}

export function findModule(id: OracleModuleId): OracleModule | undefined {
  return ORACLE_MODULES.find((m) => m.id === id);
}

export function findQuestion(id: string): OracleQuestion | undefined {
  return ORACLE_QUESTIONS.find((q) => q.id === id);
}

/**
 * Build a human-readable answer from a score for the given question.
 * This is the v1 template-based engine. Sprint 3 will replace this
 * with an LLM call that takes the same structured input.
 */
export function buildOracleAnswer(
  question: OracleQuestion,
  score: number | null,
  date: string,
  time: string | undefined,
  lang: AppLang
): { headline: string; body: string; band: 'gold' | 'green' | 'yellow' | 'red' | 'unknown' } {
  if (score == null) {
    return {
      headline: '—',
      body: ANSWER_TEMPLATES[lang]?.unknown ?? ANSWER_TEMPLATES.en.unknown,
      band: 'unknown',
    };
  }
  const band: 'gold' | 'green' | 'yellow' | 'red' =
    score >= 85 ? 'gold' : score >= 60 ? 'green' : score >= 40 ? 'yellow' : 'red';
  const pack = ANSWER_TEMPLATES[lang] ?? ANSWER_TEMPLATES.en;
  const tplPack = pack[band];
  const when = time
    ? pack.whenWithTime.replace('{date}', date).replace('{time}', time)
    : pack.whenDateOnly.replace('{date}', date);
  return {
    headline: tplPack.headline.replace('{score}', String(score)),
    body: tplPack.body.replace('{when}', when).replace('{score}', String(score)),
    band,
  };
}

const ANSWER_TEMPLATES: Record<
  AppLang,
  {
    whenWithTime: string;
    whenDateOnly: string;
    unknown: string;
    gold: { headline: string; body: string };
    green: { headline: string; body: string };
    yellow: { headline: string; body: string };
    red: { headline: string; body: string };
  }
> = {
  en: {
    whenWithTime: '{date} at {time}',
    whenDateOnly: '{date}',
    unknown:
      'Could not compute a score right now. Make sure your birth profile is set and the server is reachable.',
    gold: {
      headline: 'Golden window — {score}/100',
      body:
        '{when} scores {score}/100 for this action. The cosmic gates are wide open: supportive transits dominate and friction is minimal. Move with confidence; this is one of your strongest windows.',
    },
    green: {
      headline: 'Favorable — {score}/100',
      body:
        '{when} scores {score}/100. Conditions are supportive but not exceptional. Proceed with your normal level of care — this is a solid, safe window for this action.',
    },
    yellow: {
      headline: 'Neutral — {score}/100',
      body:
        '{when} scores {score}/100. No strong tailwind, no strong blocker. If the action is not urgent, postponing 1–3 days may find a clearer window. If you proceed, double-check details.',
    },
    red: {
      headline: 'Caution — {score}/100',
      body:
        '{when} scores {score}/100. Hard aspects are active and friction is high for this action. Unless the timing is forced, consider waiting. If you must proceed, expect resistance and prepare a fallback.',
    },
  },
  fa: {
    whenWithTime: '{date} ساعت {time}',
    whenDateOnly: '{date}',
    unknown:
      'الان نتونستم امتیاز رو محاسبه کنم. مطمئن شو پروفایل تولدت ذخیره شده و سرور در دسترسه.',
    gold: {
      headline: 'پنجره طلایی — {score} از ۱۰۰',
      body:
        '{when} امتیاز {score} از ۱۰۰ برای این اقدام دارد. دروازه‌های کیهانی کاملاً باز هستند: ترانزیت‌های حامی غالب و اصطکاک حداقل است. با اطمینان جلو برو؛ این یکی از قوی‌ترین پنجره‌های توست.',
    },
    green: {
      headline: 'مساعد — {score} از ۱۰۰',
      body:
        '{when} امتیاز {score} از ۱۰۰ دارد. شرایط حمایت‌کننده ولی نه فوق‌العاده. با احتیاط معمول جلو برو — این پنجره‌ای ایمن و قابل اتکا برای این اقدام است.',
    },
    yellow: {
      headline: 'خنثی — {score} از ۱۰۰',
      body:
        '{when} امتیاز {score} از ۱۰۰ دارد. نه نیروی محرک قوی، نه مانع جدی. اگر اقدام فوری نیست، تأخیر ۱-۳ روز ممکن است پنجره بهتری پیدا کند. اگر جلو می‌روی، جزئیات را دو بار چک کن.',
    },
    red: {
      headline: 'احتیاط — {score} از ۱۰۰',
      body:
        '{when} امتیاز {score} از ۱۰۰ دارد. زوایای سخت فعال هستند و اصطکاک برای این اقدام بالاست. مگر زمان‌بندی اجباری باشد، صبر کن. اگر مجبوری جلو بروی، انتظار مقاومت داشته باش و یک plan B آماده کن.',
    },
  },
  ru: {
    whenWithTime: '{date} в {time}',
    whenDateOnly: '{date}',
    unknown:
      'Сейчас не удалось рассчитать оценку. Убедитесь, что профиль рождения сохранён и сервер доступен.',
    gold: {
      headline: 'Золотое окно — {score}/100',
      body:
        '{when} получает {score}/100 для этого действия. Космические врата широко открыты: поддерживающие транзиты доминируют, сопротивление минимально. Действуйте уверенно — это одно из ваших сильнейших окон.',
    },
    green: {
      headline: 'Благоприятно — {score}/100',
      body:
        '{when} получает {score}/100. Условия поддерживают, но не исключительны. Действуйте с обычной осторожностью — это надёжное и безопасное окно.',
    },
    yellow: {
      headline: 'Нейтрально — {score}/100',
      body:
        '{when} получает {score}/100. Ни сильной поддержки, ни сильной блокировки. Если действие не срочное, перенос на 1–3 дня может найти лучшее окно. Если идёте — проверьте детали дважды.',
    },
    red: {
      headline: 'Осторожно — {score}/100',
      body:
        '{when} получает {score}/100. Активны жёсткие аспекты, сопротивление высокое. Если время не обязывает, подождите. Если необходимо действовать — ожидайте сопротивления и подготовьте план Б.',
    },
  },
  ar: {
    whenWithTime: '{date} في الساعة {time}',
    whenDateOnly: '{date}',
    unknown:
      'لم أتمكن من حساب الدرجة الآن. تأكد من حفظ ملف ميلادك ومن أن الخادم متاح.',
    gold: {
      headline: 'نافذة ذهبية — {score}/100',
      body:
        '{when} يحصل على {score}/100 لهذا الإجراء. البوابات الكونية مفتوحة على مصراعيها: العبور الداعم مهيمن والاحتكاك ضئيل. تحرّك بثقة — هذه إحدى أقوى نوافذك.',
    },
    green: {
      headline: 'موات — {score}/100',
      body:
        '{when} يحصل على {score}/100. الظروف داعمة لكنها ليست استثنائية. تابع بحذر طبيعي — نافذة موثوقة وآمنة.',
    },
    yellow: {
      headline: 'محايد — {score}/100',
      body:
        '{when} يحصل على {score}/100. لا دفع قوي ولا حاجز قوي. إذا لم يكن الإجراء عاجلاً، فقد يجد التأجيل 1–3 أيام نافذة أفضل. إذا تابعت، فراجع التفاصيل مرتين.',
    },
    red: {
      headline: 'تحذير — {score}/100',
      body:
        '{when} يحصل على {score}/100. زوايا صعبة نشطة والاحتكاك عالٍ. ما لم يكن التوقيت مفروضًا، انتظر. إذا اضطررت للمتابعة، توقع مقاومة وحضّر خطة بديلة.',
    },
  },
};
