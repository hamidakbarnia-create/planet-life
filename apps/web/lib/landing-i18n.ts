export type LandingLang = 'en' | 'ru' | 'fa' | 'ar';

export const LANDING_LANG_OPTIONS: readonly LandingLang[] = ['en', 'ru', 'fa', 'ar'] as const;

export type LandingNavCopy = {
  features: string;
  how: string;
  profile: string;
  cta: string;
};

export type LandingDomainCopy = {
  icon: string;
  title: string;
  desc: string;
};

export type LandingStepCopy = {
  step: string;
  title: string;
  desc: string;
};

export type LandingCopy = {
  dir: 'ltr' | 'rtl';
  nav: LandingNavCopy;
  domainsTitle: string;
  domains: LandingDomainCopy[];
  howTitle: string;
  steps: LandingStepCopy[];
  ctaTitle: string;
  ctaSub: string;
  ctaBtn: string;
};

export const LANDING_I18N: Record<LandingLang, LandingCopy> = {
  en: {
    dir: 'ltr',
    nav: { features: 'Features', how: 'How it works', profile: 'Profile', cta: 'Get Started' },
    domainsTitle: 'Three domains. One blueprint.',
    domains: [
      { icon: '🏢', title: 'Business', desc: 'Launch timing, negotiations, hiring, networking and creative work.' },
      { icon: '💰', title: 'Finance', desc: 'Investment windows, contract signing, financial transactions.' },
      { icon: '🏠', title: 'Real Estate', desc: 'Property acquisition, valuations, structural soundness timing.' },
    ],
    howTitle: 'How it works',
    steps: [
      { step: '01', title: 'Enter your birth data', desc: 'Date, time, and location of birth.' },
      { step: '02', title: 'Choose your action', desc: 'Business launch, investment, real estate purchase, and more.' },
      { step: '03', title: 'Get your score', desc: 'Receive a 0–100 score with opportunities, risks, and recommendations.' },
    ],
    ctaTitle: 'Ready to decide with clarity?',
    ctaSub: 'Start your first analysis in 30 seconds.',
    ctaBtn: 'Go to home',
  },
  ru: {
    dir: 'ltr',
    nav: { features: 'Возможности', how: 'Как это работает', profile: 'Профиль', cta: 'Начать' },
    domainsTitle: 'Три сферы. Один план.',
    domains: [
      { icon: '🏢', title: 'Бизнес', desc: 'Запуск, переговоры, найм, нетворкинг и творчество.' },
      { icon: '💰', title: 'Финансы', desc: 'Окна для инвестиций, подписания контрактов и сделок.' },
      { icon: '🏠', title: 'Недвижимость', desc: 'Покупка объектов, оценка, проверка надёжности.' },
    ],
    howTitle: 'Как это работает',
    steps: [
      { step: '01', title: 'Введите данные рождения', desc: 'Дата, время и место рождения.' },
      { step: '02', title: 'Выберите действие', desc: 'Запуск бизнеса, инвестиция, покупка недвижимости и другое.' },
      { step: '03', title: 'Получите оценку', desc: 'Балл 0–100 с возможностями, рисками и рекомендациями.' },
    ],
    ctaTitle: 'Готовы принимать решения яснее?',
    ctaSub: 'Первый анализ за 30 секунд.',
    ctaBtn: 'На главную',
  },
  fa: {
    dir: 'rtl',
    nav: { features: 'ویژگی‌ها', how: 'چگونه کار می‌کند', profile: 'پروفایل', cta: 'شروع' },
    domainsTitle: 'سه حوزه. یک نقشه.',
    domains: [
      { icon: '🏢', title: 'کسب‌وکار', desc: 'تایمینگ راه‌اندازی، مذاکره، استخدام، شبکه‌سازی و کار خلاقانه.' },
      { icon: '💰', title: 'مالی', desc: 'پنجره‌های سرمایه‌گذاری، امضای قرارداد، تراکنش مالی.' },
      { icon: '🏠', title: 'املاک', desc: 'خرید ملک، ارزش‌گذاری، تایمینگ سلامت ساختار.' },
    ],
    howTitle: 'چگونه کار می‌کند',
    steps: [
      { step: '۰۱', title: 'اطلاعات تولد را وارد کن', desc: 'تاریخ، ساعت و محل تولد.' },
      { step: '۰۲', title: 'اقدامت را انتخاب کن', desc: 'راه‌اندازی کسب‌وکار، سرمایه‌گذاری، خرید ملک و بیشتر.' },
      { step: '۰۳', title: 'امتیاز بگیر', desc: 'امتیاز ۰ تا ۱۰۰ همراه با فرصت‌ها، ریسک‌ها و پیشنهادها.' },
    ],
    ctaTitle: 'آماده تصمیم‌گیری با وضوح بیشتر هستید؟',
    ctaSub: 'اولین تحلیل را در ۳۰ ثانیه شروع کن.',
    ctaBtn: 'برو به خانه',
  },
  ar: {
    dir: 'rtl',
    nav: { features: 'الميزات', how: 'كيف يعمل', profile: 'الملف', cta: 'ابدأ الآن' },
    domainsTitle: 'ثلاثة مجالات. مخطط واحد.',
    domains: [
      { icon: '🏢', title: 'الأعمال', desc: 'توقيت الإطلاق والمفاوضات والتوظيف والتواصل والأعمال الإبداعية.' },
      { icon: '💰', title: 'المال', desc: 'نوافذ الاستثمار وتوقيع العقود والمعاملات المالية.' },
      { icon: '🏠', title: 'العقارات', desc: 'شراء العقارات والتقييم وتوقيت السلامة الإنشائية.' },
    ],
    howTitle: 'كيف يعمل',
    steps: [
      { step: '٠١', title: 'أدخلي بيانات ميلادك', desc: 'تاريخ ووقت ومكان الميلاد.' },
      { step: '٠٢', title: 'اختاري إجراءك', desc: 'إطلاق عمل، استثمار، شراء عقار وغيرها.' },
      { step: '٠٣', title: 'احصلي على درجتك', desc: 'درجة من 0 إلى 100 مع الفرص والمخاطر والتوصيات.' },
    ],
    ctaTitle: 'مستعدة للقرار بوضوح أكبر؟',
    ctaSub: 'ابدئي أول تحليل خلال 30 ثانية.',
    ctaBtn: 'إلى الصفحة الرئيسية',
  },
};

const LANDING_LANG_SET = new Set<string>(LANDING_LANG_OPTIONS);

export function isLandingLang(value: string | null | undefined): value is LandingLang {
  return value != null && LANDING_LANG_SET.has(value);
}

export function resolveLandingLang(): LandingLang {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('planet-life-lang');
  return isLandingLang(stored) ? stored : 'en';
}

export function getLandingCopy(lang: LandingLang): LandingCopy {
  return LANDING_I18N[lang];
}

export function getLandingFontFamily(lang: LandingLang): string {
  if (lang === 'fa') return "'Vazirmatn', sans-serif";
  if (lang === 'ar') return "'Cairo', 'Vazirmatn', sans-serif";
  return 'Inter, sans-serif';
}
