export const BRAND = {
  name: 'METIORO',
  category: 'AI-powered Personal Decision Intelligence Platform',
  tagline: 'Know your best next move.',
  appTagline: 'Personal Decision Intelligence',
  siteUrl: 'https://metioro.com',
  themeColor: '#0A0F1C',
  description:
    'METIORO is an AI-powered personal decision intelligence platform that scores business, financial, and real estate decisions from 0 to 100.',
} as const;

export type BrandLang = 'en' | 'ru' | 'fa' | 'ar';

export const BRAND_I18N: Record<
  BrandLang,
  { category: string; tagline: string; appTagline: string; settingsSub: string }
> = {
  en: {
    category: BRAND.category,
    tagline: BRAND.tagline,
    appTagline: BRAND.appTagline,
    settingsSub: 'Personalize your METIORO experience',
  },
  ru: {
    category: 'Платформа персонального интеллекта решений на базе ИИ',
    tagline: 'Знайте свой следующий лучший шаг.',
    appTagline: 'Персональный интеллект решений',
    settingsSub: 'Настройте METIORO под себя',
  },
  fa: {
    category: 'پلتفرم هوش تصمیم‌گیری شخصی مبتنی بر هوش مصنوعی',
    tagline: 'بهترین قدم بعدی خود را بشناسید.',
    appTagline: 'هوش تصمیم‌گیری شخصی',
    settingsSub: 'تجربه METIORO را شخصی‌سازی کنید',
  },
  ar: {
    category: 'منصة ذكاء القرار الشخصي المدعومة بالذكاء الاصطناعي',
    tagline: 'اعرف أفضل خطوتك التالية.',
    appTagline: 'ذكاء القرار الشخصي',
    settingsSub: 'خصص تجربة METIORO',
  },
};
