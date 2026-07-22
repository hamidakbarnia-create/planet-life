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
      eyebrow: 'PERSONAL DECISION INTELLIGENCE',
      headline: 'Every decision has a better time.',
      supporting:
        'METIORO helps you understand your most important timing periods, spot opportunities and risks, and decide your next step with confidence.',
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
          title: 'Multiple sources of evidence',
          description:
            'Every insight is supported by structured analysis, documented methods, and traceable data.',
        },
        {
          title: 'Transparent analysis',
          description:
            'We explain the reasoning behind every recommendation in clear, easy-to-understand language.',
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
      eyebrow: 'ПЕРСОНАЛЬНАЯ АНАЛИТИКА РЕШЕНИЙ',
      headline: 'У каждого решения есть лучшее время.',
      supporting:
        'METIORO анализирует важные для вас периоды, показывает возможности и риски и помогает определить следующие шаги.',
      primaryCta: 'Начать бесплатно',
      secondaryCta: 'Посмотреть как это работает',
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
          title: 'Несколько источников анализа',
          description:
            'Каждый вывод основан на структурированном анализе, документированных методах и проверяемых данных.',
        },
        {
          title: 'Прозрачный анализ',
          description:
            'Мы объясняем логику каждой рекомендации простым и понятным языком.',
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
      eyebrow: 'هوش شخصی برای تصمیم‌گیری',
      headline: 'هر تصمیمی زمان بهتری دارد.',
      supporting:
        'METIORO به شما کمک می‌کند زمان‌های مهم زندگی‌تان را بهتر بشناسید، فرصت‌ها و ریسک‌ها را ببینید و برای قدم بعدی با اطمینان بیشتری تصمیم بگیرید.',
      primaryCta: 'شروع رایگان',
      secondaryCta: 'نحوه کار را ببینید',
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
          title: 'چندین منبع برای تحلیل',
          description:
            'هر تحلیل بر پایه داده‌های ساختاریافته، روش‌های مستند و اطلاعات قابل بررسی ارائه می‌شود.',
        },
        {
          title: 'تحلیل شفاف',
          description:
            'دلیل هر پیشنهاد را با زبانی ساده و قابل‌فهم توضیح می‌دهیم.',
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
      eyebrow: 'ذكاء شخصي لاتخاذ القرار',
      headline: 'لكل قرار وقت أفضل.',
      supporting:
        'يساعدك METIORO على فهم الفترات المهمة في حياتك، واكتشاف الفرص والمخاطر، واتخاذ خطوتك التالية بثقة أكبر.',
      primaryCta: 'ابدأ مجانًا',
      secondaryCta: 'شاهد كيف يعمل',
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
          title: 'مصادر متعددة للتحليل',
          description:
            'كل نتيجة تستند إلى تحليل منظم، وأساليب موثقة، وبيانات يمكن التحقق منها.',
        },
        {
          title: 'تحليل واضح',
          description:
            'نشرح المنطق وراء كل توصية بلغة واضحة وسهلة الفهم.',
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
