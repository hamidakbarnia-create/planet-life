import { LocaleDecisionProofClient } from './LocaleDecisionProofClient';
import type { AppLang } from '@/lib/app-settings';

/** Staging/dev Decision Result locale proof. Renders clarification + Personal Fit fixtures. */
export default async function LocaleDecisionProofPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const raw = (params.lang ?? 'fa').toLowerCase();
  const lang: AppLang =
    raw === 'ar' || raw === 'ru' || raw === 'fa' || raw === 'en' ? raw : 'fa';

  return <LocaleDecisionProofClient lang={lang} />;
}
