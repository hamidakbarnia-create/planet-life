import type { AppLang } from '@/lib/app-settings';

/** Shared legal navigation targets for production surfaces. Hrefs are stable. */
export const LEGAL_NAV_HREFS = [
  '/terms',
  '/privacy',
  '/cookies',
  '/disclaimer',
  '/contact',
] as const;

export type LegalNavHref = (typeof LEGAL_NAV_HREFS)[number];

type LegalNavLabelKey =
  | 'terms'
  | 'privacy'
  | 'cookies'
  | 'disclaimer'
  | 'contact';

const HREF_TO_KEY: Record<LegalNavHref, LegalNavLabelKey> = {
  '/terms': 'terms',
  '/privacy': 'privacy',
  '/cookies': 'cookies',
  '/disclaimer': 'disclaimer',
  '/contact': 'contact',
};

const LEGAL_NAV_LABELS: Record<AppLang, Record<LegalNavLabelKey, string>> = {
  en: {
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    cookies: 'Cookie Policy',
    disclaimer: 'Disclaimer',
    contact: 'Contact',
  },
  fa: {
    terms: 'شرایط استفاده',
    privacy: 'حریم خصوصی',
    cookies: 'سیاست کوکی',
    disclaimer: 'سلب مسئولیت',
    contact: 'تماس',
  },
  ar: {
    terms: 'شروط الخدمة',
    privacy: 'سياسة الخصوصية',
    cookies: 'سياسة ملفات تعريف الارتباط',
    disclaimer: 'إخلاء المسؤولية',
    contact: 'اتصل بنا',
  },
  ru: {
    terms: 'Условия использования',
    privacy: 'Политика конфиденциальности',
    cookies: 'Политика cookies',
    disclaimer: 'Отказ от ответственности',
    contact: 'Контакты',
  },
};

const LEGAL_NAV_ARIA: Record<AppLang, string> = {
  en: 'Legal',
  fa: 'حقوقی',
  ar: 'قانوني',
  ru: 'Правовая информация',
};

export type LegalNavLink = {
  href: LegalNavHref;
  label: string;
};

/** Locale-aware legal nav links; hrefs never change. */
export function getLegalNavLinks(lang: AppLang = 'en'): readonly LegalNavLink[] {
  const labels = LEGAL_NAV_LABELS[lang] ?? LEGAL_NAV_LABELS.en;
  return LEGAL_NAV_HREFS.map((href) => ({
    href,
    label: labels[HREF_TO_KEY[href]],
  }));
}

export function getLegalNavAriaLabel(lang: AppLang = 'en'): string {
  return LEGAL_NAV_ARIA[lang] ?? LEGAL_NAV_ARIA.en;
}

/** English default for callers that have not adopted locale yet. */
export const LEGAL_NAV_LINKS = getLegalNavLinks('en');
