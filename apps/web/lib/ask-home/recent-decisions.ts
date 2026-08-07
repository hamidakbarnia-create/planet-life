import type { AppLang } from '@/lib/app-settings';
import {
  loadAskDecisionsFromVault,
  type AskVaultSavePayload,
} from '@/lib/ask-decision/vault-adapter';
import { localizeRecommendationStatus } from '@/lib/decision-ui-i18n';
import type { RecentDecisionRow } from './types';

const LOCALE_MAP: Record<AppLang, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  fa: 'fa-IR',
  ar: 'ar-EG',
};

function formatDecisionDate(iso: string, lang: AppLang): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(LOCALE_MAP[lang], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return iso;
  }
}

function toRecentRow(
  payload: AskVaultSavePayload,
  index: number,
  lang: AppLang,
  unknownTypeLabel: string
): RecentDecisionRow {
  return {
    id: `${payload.generatedAt}-${index}`,
    title: payload.question,
    decisionType: unknownTypeLabel,
    status: localizeRecommendationStatus(payload.recommendationStatus, lang),
    confidence: Math.round(payload.scores.confidence),
    date: formatDecisionDate(payload.generatedAt, lang),
    href: '/vault',
  };
}

/** Maps existing vault Ask saves into Recent Decisions rows. No fake data. */
export function listRecentDecisions(
  lang: AppLang,
  unknownTypeLabel: string
): RecentDecisionRow[] {
  return loadAskDecisionsFromVault().map((payload, index) =>
    toRecentRow(payload, index, lang, unknownTypeLabel)
  );
}
