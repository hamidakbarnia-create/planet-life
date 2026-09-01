import type { AppLang } from './app-settings';

/**
 * Vault Home presentation only.
 * Visible order and copy are independent of VAULT_SECTION_ORDER / section pages.
 */

export type VaultHomeCardKey =
  | 'power'
  | 'provider'
  | 'shadow'
  | 'look'
  | 'sensuality';

export type VaultHomeCardRole = 'primary' | 'secondary' | 'experimental';

/** Home-only visible order — Decision value first. */
export const VAULT_HOME_VISIBLE_ORDER: readonly VaultHomeCardKey[] = [
  'power',
  'provider',
  'shadow',
  'look',
  'sensuality',
] as const;

/** Still valid section routes; not rendered on Vault Home. */
export const VAULT_HOME_HIDDEN_SECTIONS = ['cycle', 'lounge'] as const;

export const VAULT_HOME_CARD_ROLE: Record<VaultHomeCardKey, VaultHomeCardRole> = {
  power: 'primary',
  provider: 'secondary',
  shadow: 'secondary',
  look: 'secondary',
  sensuality: 'experimental',
};

export type VaultHomeCardCopy = {
  title: string;
  sub: string;
  preview: string;
  /** Outcome CTA shown on the card once navigation is unlocked. */
  cta: string;
  /** Flagship / Experimental marker; empty for plain Secondary. */
  badge: string;
};

export type VaultHomeLangPack = {
  eyebrow: string;
  title: string;
  subtitle: string;
  promise: string;
  cta: string;
  ctaInside: string;
  ctaHint: string;
  backToToday: string;
  inside: string;
  tapHint: string;
  cards: Record<VaultHomeCardKey, VaultHomeCardCopy>;
};

export const VAULT_HOME_LANGS: Record<AppLang, VaultHomeLangPack> = {
  en: {
    eyebrow: '· Decision depth ·',
    title: 'The Vault',
    subtitle:
      'A calm Decision Intelligence space for timing, place, trust signals, and personal context — so your next move has a better window.',
    promise:
      'Readings stay personal to your session. No prophecy. Signals, patterns, and windows — you decide.',
    cta: 'Step inside',
    ctaInside: 'Welcome — cards unlocked',
    ctaHint: 'Power Calendar is the strongest place to start.',
    backToToday: '← Back to Today',
    inside: 'Inside the Vault',
    tapHint: 'Begin with Power — then open deeper context as you need it.',
    cards: {
      power: {
        title: 'Power Calendar',
        sub: 'Ask · Commit · Pause · Stronger windows',
        preview:
          'See when to act, ask, lean in, or wait. Heat, money, distance, and yes-day windows for your next move.',
        cta: 'See timing windows',
        badge: 'Recommended',
      },
      provider: {
        title: 'The Provider',
        sub: 'Place · Support · Partnership',
        preview:
          'Place and support patterns, partnership context, and compatibility scores — where and with whom decisions land.',
        cta: 'Open Provider',
        badge: '',
      },
      shadow: {
        title: 'Shadow Room',
        sub: 'Trust · Clarity · Caution',
        preview:
          'Trust and communication signals to verify before you decide. Patterns, never verdicts.',
        cta: 'Open Shadow',
        badge: '',
      },
      look: {
        title: 'Style Timing',
        sub: 'Color · Scent · Presence',
        preview:
          'Light daily guidance for color, scent, and presence — supportive, not the main decision tool.',
        cta: 'Open Look',
        badge: '',
      },
      sensuality: {
        title: 'Sensuality',
        sub: 'Mars desire signature',
        preview:
          'A limited Mars-based reading of desire and pursuit patterns in your chart. Not a full timing suite.',
        cta: 'View limited reading',
        badge: 'Experimental',
      },
    },
  },
  ru: {
    eyebrow: '· Глубина решений ·',
    title: 'Хранилище',
    subtitle:
      'Спокойное пространство для точных решений: тайминг, место, сигналы доверия и личный контекст — чтобы следующий шаг имел лучшее окно.',
    promise:
      'Разборы остаются личными для вашей сессии. Без пророчеств. Сигналы, паттерны и окна — решаете вы.',
    cta: 'Войти',
    ctaInside: 'Добро пожаловать — карточки открыты',
    ctaHint: 'Календарь силы — лучшее место, чтобы начать.',
    backToToday: '← Назад к Сегодня',
    inside: 'Внутри Хранилища',
    tapHint: 'Начните с Календаря силы — затем открывайте более глубокий контекст.',
    cards: {
      power: {
        title: 'Календарь силы',
        sub: 'Спросить · Решиться · Пауза · Сильные окна',
        preview:
          'Когда действовать, просить, сближаться или ждать. Окна жара, денег, дистанции и «да» для следующего шага.',
        cta: 'Смотреть окна тайминга',
        badge: 'Рекомендуем',
      },
      provider: {
        title: 'Покровитель',
        sub: 'Место · Поддержка · Партнёрство',
        preview:
          'Паттерны места и поддержки, контекст партнёрства и совместимость — где и с кем решения опираются.',
        cta: 'Открыть Покровителя',
        badge: '',
      },
      shadow: {
        title: 'Теневая комната',
        sub: 'Доверие · Ясность · Осторожность',
        preview:
          'Сигналы доверия и общения для проверки перед решением. Паттерны, не приговоры.',
        cta: 'Открыть Тень',
        badge: '',
      },
      look: {
        title: 'Стиль и тайминг',
        sub: 'Цвет · Аромат · Присутствие',
        preview:
          'Лёгкие дневные подсказки по цвету, аромату и присутствию — поддержка, не главный инструмент.',
        cta: 'Открыть Стиль',
        badge: '',
      },
      sensuality: {
        title: 'Чувственность',
        sub: 'Сигнатура желания (Марс)',
        preview:
          'Ограниченный разбор желания и стремления по Марсу в карте. Не полный набор тайминга.',
        cta: 'Смотреть ограниченный разбор',
        badge: 'Эксперимент',
      },
    },
  },
  fa: {
    eyebrow: '· عمق تصمیم ·',
    title: 'گنجینه',
    subtitle:
      'فضایی آرام برای هوش تصمیم: تایمینگ، مکان، سیگنال اعتماد و بافت شخصی — تا حرکت بعدی پنجره بهتری داشته باشد.',
    promise:
      'خوانش‌ها برای نشست تو شخصی می‌مانند. بدون پیشگویی. سیگنال، الگو و پنجره — تصمیم با توست.',
    cta: 'برو داخل',
    ctaInside: 'خوش اومدی — کارت‌ها باز شد',
    ctaHint: 'تقویم قدرت بهترین جا برای شروع است.',
    backToToday: '→ بازگشت به امروز',
    inside: 'داخل گنجینه',
    tapHint: 'با تقویم قدرت شروع کن — بعد در صورت نیاز بافت عمیق‌تر را باز کن.',
    cards: {
      power: {
        title: 'تقویم قدرت',
        sub: 'بخواه · تعهد · مکث · پنجره‌های قوی‌تر',
        preview:
          'کی عمل کنی، بخواهی، نزدیک شوی یا صبر کنی. پنجره‌های حرارت، پول، فاصله و «بله» برای حرکت بعدی.',
        cta: 'دیدن پنجره‌های تایمینگ',
        badge: 'پیشنهادی',
      },
      provider: {
        title: 'حامی',
        sub: 'مکان · حمایت · شراکت',
        preview:
          'الگوهای مکان و حمایت، بافت شراکت و امتیاز هم‌خوانی — کجا و با چه کسی تصمیم‌ها تکیه می‌کنند.',
        cta: 'باز کردن حامی',
        badge: '',
      },
      shadow: {
        title: 'اتاق سایه',
        sub: 'اعتماد · وضوح · احتیاط',
        preview:
          'سیگنال‌های اعتماد و ارتباط برای بررسی قبل از تصمیم. الگو، نه حکم.',
        cta: 'باز کردن سایه',
        badge: '',
      },
      look: {
        title: 'زمان‌بندی استایل',
        sub: 'رنگ · عطر · حضور',
        preview:
          'راهنمای سبک روزانه برای رنگ، عطر و حضور — حمایت‌گر، نه ابزار اصلی تصمیم.',
        cta: 'باز کردن استایل',
        badge: '',
      },
      sensuality: {
        title: 'جذابیت',
        sub: 'امضای میل (مریخ)',
        preview:
          'خوانش محدود مریخ درباره الگوهای میل و پیگیری در چارت. مجموعه کامل تایمینگ نیست.',
        cta: 'دیدن خوانش محدود',
        badge: 'آزمایشی',
      },
    },
  },
  ar: {
    eyebrow: '· عمق القرار ·',
    title: 'الخزانة',
    subtitle:
      'مساحة هادئة لذكاء القرار: توقيت ومكان وإشارات ثقة وسياق شخصي — حتى يكون لخطوتك التالية نافذة أفضل.',
    promise:
      'تبقى القراءات شخصية لجلستك. بلا نبوءة. إشارات وأنماط ونوافذ — القرار لك.',
    cta: 'ادخل',
    ctaInside: 'أهلاً بك — البطاقات مفتوحة',
    ctaHint: 'تقويم القوة هو أفضل مكان للبدء.',
    backToToday: '← العودة إلى اليوم',
    inside: 'داخل الخزانة',
    tapHint: 'ابدأ بتقويم القوة — ثم افتح سياقاً أعمق عند الحاجة.',
    cards: {
      power: {
        title: 'تقويم القوة',
        sub: 'اطلب · التزم · توقّف · نوافذ أقوى',
        preview:
          'متى تتصرف أو تطلب أو تقترب أو تنتظر. نوافذ الحرارة والمال والمسافة و«نعم» لخطوتك التالية.',
        cta: 'عرض نوافذ التوقيت',
        badge: 'موصى به',
      },
      provider: {
        title: 'العائل',
        sub: 'مكان · دعم · شراكة',
        preview:
          'أنماط المكان والدعم وسياق الشراكة ودرجات التوافق — أين ومع من تستند القرارات.',
        cta: 'فتح العائل',
        badge: '',
      },
      shadow: {
        title: 'غرفة الظل',
        sub: 'ثقة · وضوح · حذر',
        preview:
          'إشارات ثقة وتواصل للتحقق قبل القرار. أنماط، لا أحكام.',
        cta: 'فتح الظل',
        badge: '',
      },
      look: {
        title: 'توقيت الأسلوب',
        sub: 'لون · عطر · حضور',
        preview:
          'إرشاد يومي خفيف للون والعطر والحضور — داعم، وليس أداة القرار الرئيسية.',
        cta: 'فتح الأسلوب',
        badge: '',
      },
      sensuality: {
        title: 'الحسّية',
        sub: 'بصمة الرغبة (المريخ)',
        preview:
          'قراءة محدودة بالمريخ لأنماط الرغبة والسعي في خريطتك. ليست مجموعة توقيت كاملة.',
        cta: 'عرض قراءة محدودة',
        badge: 'تجريبي',
      },
    },
  },
};
