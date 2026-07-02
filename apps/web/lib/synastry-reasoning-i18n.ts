import type { AppLang } from './app-settings';
import {
  insightSectionLabel,
  relationshipProfileLabel,
} from './relationship-profile-i18n';
import type { RelationshipProfile, RelationshipType } from './relationship-profile';
import type { SynastryReason } from './synastry-reasoning';

type ScoreRating = 'strong' | 'mixed' | 'challenging';

const RATING_LABELS: Record<AppLang, Record<ScoreRating, string>> = {
  en: { strong: 'strong', mixed: 'mixed', challenging: 'challenging' },
  ru: { strong: 'высокая', mixed: 'смешанная', challenging: 'сложная' },
  fa: { strong: 'قوی', mixed: 'ترکیبی', challenging: 'چالش‌برانگیز' },
  ar: { strong: 'قوية', mixed: 'مختلطة', challenging: 'صعبة' },
};

const QUALITY_LABELS: Record<AppLang, { helpful: string; sensitive: string }> = {
  en: { helpful: 'helpful', sensitive: 'sensitive' },
  ru: { helpful: 'полезен', sensitive: 'деликатен' },
  fa: { helpful: 'مفید', sensitive: 'حساس' },
  ar: { helpful: 'مفيد', sensitive: 'حساس' },
};

function scoreRating(score: number): ScoreRating {
  if (score >= 70) return 'strong';
  if (score >= 40) return 'mixed';
  return 'challenging';
}

export function localizedExecutiveSummary(
  lang: AppLang,
  relationshipType: RelationshipType,
  score: number,
  priorityCategory: RelationshipProfile['scoringPriorities'][number]
): string {
  const profileLabel = relationshipProfileLabel(lang, relationshipType);
  const priority = insightSectionLabel(lang, priorityCategory);
  const rating = RATING_LABELS[lang][scoreRating(score)];

  switch (lang) {
    case 'fa':
      return `سازگاری ${profileLabel}: ${score}/100 (${rating}). محور اصلی: ${priority}.`;
    case 'ar':
      return `توافق ${profileLabel}: ${score}/100 (${rating}). المحور الرئيسي: ${priority}.`;
    case 'ru':
      return `Совместимость (${profileLabel}): ${score}/100 (${rating}). Главный фокус: ${priority}.`;
    default:
      return `${profileLabel} compatibility scores ${score}/100 (${rating}). Primary lens: ${priority.replace(/_/g, ' ')}.`;
  }
}

export function localizedReasonExplanation(
  lang: AppLang,
  relationshipType: RelationshipType,
  reason: SynastryReason
): string {
  const profileLabel = relationshipProfileLabel(lang, relationshipType);
  const category = insightSectionLabel(lang, reason.category);
  const quality =
    reason.evidence.tone === 'harmony'
      ? QUALITY_LABELS[lang].helpful
      : QUALITY_LABELS[lang].sensitive;
  const orb = reason.evidence.orb.toFixed(1);

  switch (lang) {
    case 'fa':
      return `برای رابطه ${profileLabel}، این زاویه برای ${category} ${quality} است (فاصله ${orb}°).`;
    case 'ar':
      return `في علاقة ${profileLabel}، هذا الجانب ${quality} لـ${category} (المدار ${orb}°).`;
    case 'ru':
      return `Для связи «${profileLabel}» этот аспект ${quality} для ${category} (орб ${orb}°).`;
    default:
      return `For a ${profileLabel.toLowerCase()} connection, this aspect is ${quality} for ${category} (orb ${orb}°).`;
  }
}
