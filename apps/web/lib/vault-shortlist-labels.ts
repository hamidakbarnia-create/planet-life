import type { AppLang } from './app-settings';

/** Display names for the fixed default shortlist. Identifiers stay English|coords. */
const FIXED_SHORTLIST_DISPLAY: Record<string, Record<AppLang, string>> = {
  London: { en: 'London', ru: 'Лондон', fa: 'لندن', ar: 'لندن' },
  Dubai: { en: 'Dubai', ru: 'Дубай', fa: 'دبی', ar: 'دبي' },
  'New York': { en: 'New York', ru: 'Нью-Йорк', fa: 'نیویورک', ar: 'نيويورك' },
  Tokyo: { en: 'Tokyo', ru: 'Токио', fa: 'توکیو', ar: 'طوكيو' },
  Tehran: { en: 'Tehran', ru: 'Тегеран', fa: 'تهران', ar: 'طهران' },
};

/** Localize a known shortlist city label. User-entered names are unchanged. */
export function localizeFixedShortlistLabel(label: string, lang: AppLang): string {
  const mapped = FIXED_SHORTLIST_DISPLAY[label.trim()];
  return mapped?.[lang] ?? label;
}
