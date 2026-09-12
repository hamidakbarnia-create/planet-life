/**
 * Vault presentation helpers that are not scores, ranking, or policy.
 * Partner-type requirements only — eligibility rules stay unchanged.
 */

import type { AppLang } from './app-settings';

export const VAULT_UX_COPY: Record<
  AppLang,
  {
    partnerNeeds: string;
    partnerProfileNeeds: string;
  }
> = {
  en: {
    partnerNeeds:
      'Needs a person in People: romantic partner, spouse, friend, or business partner.',
    partnerProfileNeeds:
      'Needs a person in People: romantic partner, spouse, or business partner — not Friend.',
  },
  ru: {
    partnerNeeds:
      'Нужен человек в «Люди»: романтический партнёр, супруг/а, друг или деловой партнёр.',
    partnerProfileNeeds:
      'Нужен человек в «Люди»: романтический партнёр, супруг/а или деловой партнёр — не друг.',
  },
  fa: {
    partnerNeeds:
      'به فردی در «افراد» نیاز دارد: شریک عاطفی، همسر، دوست یا شریک کاری.',
    partnerProfileNeeds:
      'به فردی در «افراد» نیاز دارد: شریک عاطفی، همسر یا شریک کاری — نه دوست.',
  },
  ar: {
    partnerNeeds:
      'يلزم شخص في «الأشخاص»: شريك عاطفي أو زوج/ة أو صديق أو شريك عمل.',
    partnerProfileNeeds:
      'يلزم شخص في «الأشخاص»: شريك عاطفي أو زوج/ة أو شريك عمل — وليس صديقاً.',
  },
};

/** Collapsed-card requirement. Does not change who can run a reading. */
export function partnerRequirementHint(
  apiKey: string | undefined,
  lang: AppLang,
): string | null {
  if (apiKey === 'partner') return VAULT_UX_COPY[lang].partnerProfileNeeds;
  if (
    apiKey === 'compatibility' ||
    apiKey === 'radar' ||
    apiKey === 'trust' ||
    apiKey === 'communication'
  ) {
    return VAULT_UX_COPY[lang].partnerNeeds;
  }
  return null;
}
