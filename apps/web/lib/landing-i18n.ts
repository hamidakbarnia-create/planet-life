export type LandingLang = 'en' | 'ru' | 'fa' | 'ar';

export const LANDING_LANG_OPTIONS: readonly LandingLang[] = ['en', 'ru', 'fa', 'ar'] as const;

export type LandingNavCopy = {
  features: string;
  how: string;
  profile: string;
  cta: string;
};

export type LandingHeroCopy = {
  eyebrow: string;
  headline: string;
  supporting: string;
  primaryCta: string;
  secondaryCta: string;
};

export type LandingTrustPillar = {
  title: string;
  description: string;
};

export type LandingTrustCopy = {
  title: string;
  pillars: LandingTrustPillar[];
};

export type LandingHowCopy = {
  title: string;
  steps: [string, string, string];
  philosophy: [string, string, string];
  note: string;
};

export type LandingPreviewModuleId = 'today' | 'calendar' | 'ask' | 'people' | 'julia';

export type LandingPreviewModule = {
  id: LandingPreviewModuleId;
  title: string;
  description: string;
};

export type LandingPreviewCopy = {
  title: string;
  modules: LandingPreviewModule[];
};

export type LandingCtaCopy = {
  title: string;
  subtitle: string;
  btn: string;
};

export type LandingCopy = {
  dir: 'ltr' | 'rtl';
  nav: LandingNavCopy;
  hero: LandingHeroCopy;
  trust: LandingTrustCopy;
  how: LandingHowCopy;
  preview: LandingPreviewCopy;
  cta: LandingCtaCopy;
};

export const LANDING_I18N: Record<LandingLang, LandingCopy> = {
  en: {
    dir: 'ltr',
    nav: { features: 'Features', how: 'How it works', profile: 'Profile', cta: 'Get Started' },
    hero: {
      eyebrow: 'Personal Decision Intelligence',
      headline: 'Every decision has a better time.',
      supporting:
        'Some decisions deserve more than instinct and less than a guarantee. METIORO connects precise signals to clear explanations—so you understand the moment before you act.',
      primaryCta: 'Start Free',
      secondaryCta: 'See How It Works',
    },
    trust: {
      title: 'Built for trust',
      pillars: [
        {
          title: 'Explainable recommendations',
          description: 'Every score comes with reasoning you can read and question.',
        },
        {
          title: 'Human decision stays in control',
          description: 'METIORO recommends. You decide. Nothing compels your choice.',
        },
        {
          title: 'Multiple evidence frameworks',
          description: 'Structured signals, documented methods, traceable inputs.',
        },
        {
          title: 'Transparent reasoning',
          description: 'Assumptions and uncertainty are stated—not hidden.',
        },
      ],
    },
    how: {
      title: 'How it works',
      steps: ['Signals', 'Reasoning', 'Your Decision'],
      philosophy: [
        'Astronomy provides the signals.',
        'AI provides the reasoning.',
        'Humans make the decision.',
      ],
      note: 'Guidance, not prophecy. METIORO supports your judgment—it does not replace it.',
    },
    preview: {
      title: 'Inside METIORO',
      modules: [
        {
          id: 'today',
          title: 'Today',
          description: 'Your daily decision brief—score, context, and orientation at a glance.',
        },
        {
          id: 'calendar',
          title: 'Calendar',
          description: 'See how timing shifts across the month with scored decision windows.',
        },
        {
          id: 'ask',
          title: 'Ask',
          description: 'Pose a concrete question and receive a scored, explained recommendation.',
        },
        {
          id: 'people',
          title: 'People',
          description: 'Decisions that involve others—relationships, timing, and shared context.',
        },
        {
          id: 'julia',
          title: 'Julia',
          description: 'A private session for deeper context behind the score and your options.',
        },
      ],
    },
    cta: {
      title: 'Know your next move.',
      subtitle: 'Begin with clarity. Stay in control of every decision.',
      btn: 'Start Free',
    },
  },
  ru: {
    dir: 'ltr',
    nav: { features: 'Возможности', how: 'Как это работает', profile: 'Профиль', cta: 'Начать' },
    hero: {
      eyebrow: 'Персональный интеллект решений',
      headline: 'У каждого решения есть лучшее время.',
      supporting:
        'Важные решения редко терпят неудачу из‑за нехватки информации. Они застревают без перспективы. METIORO соединяет точные сигналы с ясными объяснениями — чтобы вы понимали момент, прежде чем действовать.',
      primaryCta: 'Начать бесплатно',
      secondaryCta: 'Как это работает',
    },
    trust: {
      title: 'Создан для доверия',
      pillars: [
        {
          title: 'Объяснимые рекомендации',
          description: 'Каждая оценка сопровождается рассуждением, которое можно прочитать и обсудить.',
        },
        {
          title: 'Решение остаётся за вами',
          description: 'METIORO рекомендует. Вы решаете. Ничто не принуждает к выбору.',
        },
        {
          title: 'Несколько основ доказательств',
          description: 'Структурированные сигналы, документированные методы, прослеживаемые входные данные.',
        },
        {
          title: 'Прозрачное рассуждение',
          description: 'Допущения и неопределённость указаны явно — не скрыты.',
        },
      ],
    },
    how: {
      title: 'Как это работает',
      steps: ['Сигналы', 'Рассуждение', 'Ваше решение'],
      philosophy: [
        'Астрономия даёт сигналы.',
        'ИИ даёт рассуждение.',
        'Человек принимает решение.',
      ],
      note: 'Руководство, а не пророчество. METIORO поддерживает ваше суждение — не заменяет его.',
    },
    preview: {
      title: 'Внутри METIORO',
      modules: [
        {
          id: 'today',
          title: 'Сегодня',
          description: 'Ежедневный обзор решений — оценка, контекст и ориентация.',
        },
        {
          id: 'calendar',
          title: 'Календарь',
          description: 'Как меняется время в течение месяца — окна решений с оценками.',
        },
        {
          id: 'ask',
          title: 'Спросить',
          description: 'Задайте конкретный вопрос и получите оценку с объяснением.',
        },
        {
          id: 'people',
          title: 'Люди',
          description: 'Решения с участием других — отношения, время и общий контекст.',
        },
        {
          id: 'julia',
          title: 'Julia',
          description: 'Приватная сессия для глубокого контекста за оценкой и вашими вариантами.',
        },
      ],
    },
    cta: {
      title: 'Знайте свой следующий шаг.',
      subtitle: 'Начните с ясности. Сохраняйте контроль над каждым решением.',
      btn: 'Начать бесплатно',
    },
  },
  fa: {
    dir: 'rtl',
    nav: { features: 'ویژگی‌ها', how: 'چگونه کار می‌کند', profile: 'پروفایل', cta: 'شروع' },
    hero: {
      eyebrow: 'هوش تصمیم‌گیری شخصی',
      headline: 'هر تصمیمی زمان بهتری دارد.',
      supporting:
        'برخی تصمیم‌ها به چیزی بیش از حس درونی و کمتر از تضمین نیاز دارند. METIORO سیگنال‌های دقیق را به توضیحات روشن وصل می‌کند — تا قبل از اقدام، لحظه را درک کنید.',
      primaryCta: 'شروع رایگان',
      secondaryCta: 'چگونه کار می‌کند',
    },
    trust: {
      title: 'ساخته‌شده برای اعتماد',
      pillars: [
        {
          title: 'توصیه‌های قابل‌توضیح',
          description: 'هر امتیاز همراه با استدلالی است که می‌توانید بخوانید و بررسی کنید.',
        },
        {
          title: 'تصمیم با انسان می‌ماند',
          description: 'METIORO توصیه می‌کند. شما تصمیم می‌گیرید. هیچ‌چیز شما را مجبور نمی‌کند.',
        },
        {
          title: 'چارچوب‌های متعدد شواهد',
          description: 'سیگنال‌های ساختاریافته، روش‌های مستند، ورودی‌های قابل‌ردیابی.',
        },
        {
          title: 'استدلال شفاف',
          description: 'فرضیات و عدم‌قطعیت بیان می‌شوند — پنهان نمی‌شوند.',
        },
      ],
    },
    how: {
      title: 'چگونه کار می‌کند',
      steps: ['سیگنال‌ها', 'استدلال', 'تصمیم شما'],
      philosophy: [
        'نجوم سیگنال‌ها را فراهم می‌کند.',
        'هوش مصنوعی استدلال را فراهم می‌کند.',
        'انسان تصمیم را می‌گیرد.',
      ],
      note: 'راهنمایی، نه پیشگویی. METIORO از قضاوت شما پشتیبانی می‌کند — جایگزین آن نمی‌شود.',
    },
    preview: {
      title: 'درون METIORO',
      modules: [
        {
          id: 'today',
          title: 'امروز',
          description: 'خلاصه تصمیم روزانه — امتیاز، زمینه و جهت‌گیری در یک نگاه.',
        },
        {
          id: 'calendar',
          title: 'تقویم',
          description: 'تغییر زمان‌بندی در طول ماه — پنجره‌های تصمیم با امتیاز.',
        },
        {
          id: 'ask',
          title: 'بپرس',
          description: 'سؤالی مشخص بپرسید و توصیه‌ای امتیازدار با توضیح دریافت کنید.',
        },
        {
          id: 'people',
          title: 'افراد',
          description: 'تصمیم‌هایی که دیگران را دربرمی‌گیرند — روابط، زمان و زمینه مشترک.',
        },
        {
          id: 'julia',
          title: 'Julia',
          description: 'جلسه خصوصی برای زمینه عمیق‌تر پشت امتیاز و گزینه‌های شما.',
        },
      ],
    },
    cta: {
      title: 'قدم بعدی خود را بشناسید.',
      subtitle: 'با وضوح شروع کنید. کنترل هر تصمیم را حفظ کنید.',
      btn: 'شروع رایگان',
    },
  },
  ar: {
    dir: 'rtl',
    nav: { features: 'الميزات', how: 'كيف يعمل', profile: 'الملف', cta: 'ابدأ الآن' },
    hero: {
      eyebrow: 'ذكاء القرار الشخصي',
      headline: 'لكل قرار وقتٌ أفضل.',
      supporting:
        'بعض القرارات تحتاج إلى أكثر من الحدس وأقل من الضمان. يربط METIORO الإشارات الدقيقة بتفسيرات واضحة — لتفهمي اللحظة قبل أن تتصرفي.',
      primaryCta: 'ابدئي مجانًا',
      secondaryCta: 'كيف يعمل',
    },
    trust: {
      title: 'مبني على الثقة',
      pillars: [
        {
          title: 'توصيات قابلة للتفسير',
          description: 'كل درجة تأتي مع تعليل يمكنك قراءته ومناقشته.',
        },
        {
          title: 'القرار يبقى للإنسان',
          description: 'METIORO يوصي. أنتِ تقررين. لا شيء يُجبرك على الاختيار.',
        },
        {
          title: 'أطر أدلة متعددة',
          description: 'إشارات منظمة، منهجيات موثقة، مدخلات قابلة للتتبع.',
        },
        {
          title: 'تعليل شفاف',
          description: 'الافتراضات وعدم اليقين مذكورة — لا مخفية.',
        },
      ],
    },
    how: {
      title: 'كيف يعمل',
      steps: ['الإشارات', 'التعليل', 'قرارك'],
      philosophy: [
        'علم الفلك يوفّر الإشارات.',
        'الذكاء الاصطناعي يوفّر التعليل.',
        'الإنسان يتخذ القرار.',
      ],
      note: 'إرشاد، لا نبوءة. METIORO يدعم حكمك — ولا يحل محله.',
    },
    preview: {
      title: 'داخل METIORO',
      modules: [
        {
          id: 'today',
          title: 'اليوم',
          description: 'ملخص قرارك اليومي — الدرجة والسياق والتوجه في لمحة.',
        },
        {
          id: 'calendar',
          title: 'التقويم',
          description: 'كيف يتغير التوقيت عبر الشهر — نوافذ قرار مُقيّمة.',
        },
        {
          id: 'ask',
          title: 'اسألي',
          description: 'اطرحي سؤالًا محددًا واحصلي على توصية مُفسَّرة ومُقيّمة.',
        },
        {
          id: 'people',
          title: 'الأشخاص',
          description: 'قرارات تتعلق بآخرين — العلاقات والتوقيت والسياق المشترك.',
        },
        {
          id: 'julia',
          title: 'Julia',
          description: 'جلسة خاصة لسياق أعمق وراء الدرجة وخياراتك.',
        },
      ],
    },
    cta: {
      title: 'اعرفي خطوتك التالية.',
      subtitle: 'ابدئي بوضوح. حافظي على السيطرة في كل قرار.',
      btn: 'ابدئي مجانًا',
    },
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
