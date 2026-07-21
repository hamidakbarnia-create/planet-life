import { notFound } from 'next/navigation';
import { LocaleDecisionProofClient } from './LocaleDecisionProofClient';
import type { AppLang } from '@/lib/app-settings';

/** Dev-only Decision Result locale proof. Renders English provider payload through AskDecisionView. */
export default async function LocaleDecisionProofPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const allow =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_CHART_TEST === '1' ||
    process.env.NEXT_PUBLIC_APP_ENV === 'staging';
  if (!allow) notFound();

  const params = await searchParams;
  const raw = (params.lang ?? 'fa').toLowerCase();
  const lang: AppLang =
    raw === 'ar' || raw === 'ru' || raw === 'fa' || raw === 'en' ? raw : 'fa';

  return <LocaleDecisionProofClient lang={lang} />;
}
