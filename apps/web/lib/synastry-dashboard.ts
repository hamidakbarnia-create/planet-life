/**
 * Cinergy Relationship Intelligence Dashboard view model.
 * Presentation adapter over existing synergy + reasoning — no scoring changes.
 */

import type { AppLang } from './app-settings';
import { trAspect, trPlanet } from './astrology-i18n';
import type { RelationshipProfile, RelationshipProfileKey } from './relationship-profile';
import { relationshipProfileLabel } from './relationship-profile-i18n';
import {
  BUSINESS_INTELLIGENCE_KEYS,
  PROFILE_INTELLIGENCE_DIMENSIONS,
  ROMANTIC_INTELLIGENCE_KEYS,
  type IntelligenceDimensionDef,
} from './synastry-dashboard-dimensions';
import {
  DASHBOARD_SECTION_LABELS,
  intelligenceDimensionLabel,
  profileIntelligenceSectionTitle,
} from './synastry-dashboard-i18n';
import type { SynastryReason, SynastryReasoning } from './synastry-reasoning';
import type { SynergyResult, SynastryAspect } from './synergy';
import type { SynergyBadge } from './people-storage';

const PLANET_CONTEXT_HOUSE: Record<string, number> = {
  sun: 5,
  moon: 4,
  mercury: 3,
  venus: 7,
  mars: 1,
  jupiter: 9,
  saturn: 10,
};

export interface DashboardCard {
  id: string;
  icon: string;
  title: string;
  scoreContribution: number;
  explanation: string;
  evidenceId: string;
}

export interface ProfileIntelligenceItem {
  key: string;
  label: string;
  icon: string;
  pct: number;
}

export interface DashboardRecommendations {
  doMore: Array<{ text: string; evidenceIds: string[] }>;
  watchCarefully: Array<{ text: string; evidenceIds: string[] }>;
  avoid: Array<{ text: string; evidenceIds: string[] }>;
}

export interface DashboardEvidenceRow {
  id: string;
  planet: string;
  aspect: string;
  house: string;
  orb: number;
  importance: 'high' | 'medium' | 'low';
  linkedRecommendationIndexes: number[];
}

export interface SynergyDashboardView {
  overall: {
    score: number;
    confidence: number;
    profileKey: RelationshipProfileKey;
    profileLabel: string;
    relationshipTypeLabel: string;
    summary: string;
    badge: SynergyBadge;
  };
  sectionTitle: string;
  strengths: DashboardCard[];
  risks: DashboardCard[];
  profileIntelligence: ProfileIntelligenceItem[];
  recommendations: DashboardRecommendations;
  evidence: DashboardEvidenceRow[];
}

function orbStrength(orb: number, max = 8): number {
  return Math.max(0, 1 - orb / max);
}

function computeDimensionPct(
  profile: RelationshipProfile,
  dimension: IntelligenceDimensionDef,
  harmony: SynastryAspect[],
  tension: SynastryAspect[]
): number {
  const set = new Set(dimension.planets);
  let score = profile.baseScore;
  for (const h of harmony) {
    if (set.has(h.myPlanet as any) || set.has(h.theirPlanet as any)) {
      score += 11 * orbStrength(h.orb);
    }
  }
  for (const t of tension) {
    if (set.has(t.myPlanet as any) || set.has(t.theirPlanet as any)) {
      score -= 12 * orbStrength(t.orb);
    }
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function bestDimension(
  profileKey: RelationshipProfileKey,
  reason: SynastryReason
): IntelligenceDimensionDef | null {
  const dimensions = PROFILE_INTELLIGENCE_DIMENSIONS[profileKey];
  const planets = new Set([reason.evidence.my_planet, reason.evidence.their_planet]);
  let best: IntelligenceDimensionDef | null = null;
  let bestOverlap = 0;
  for (const dim of dimensions) {
    const overlap = dim.planets.filter((p) => planets.has(p)).length;
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      best = dim;
    }
  }
  return best;
}

function cardTitle(
  lang: AppLang,
  profileKey: RelationshipProfileKey,
  reason: SynastryReason,
  tone: 'strength' | 'risk'
): string {
  const dim = bestDimension(profileKey, reason);
  if (!dim) {
    return intelligenceDimensionLabel(lang, reason.category);
  }
  if (tone === 'risk' && (reason.evidence.tone === 'tension' || reason.score < 0)) {
    if (dim.key === 'leadership_balance') {
      return intelligenceDimensionLabel(lang, 'leadership_conflict');
    }
    const base = intelligenceDimensionLabel(lang, dim.key);
    return base.includes('Conflict') ? base : `${base} Risk`;
  }
  return intelligenceDimensionLabel(lang, dim.key);
}

function shortExplanation(reason: SynastryReason, lang: AppLang): string {
  const my = trPlanet(reason.evidence.my_planet, lang);
  const their = trPlanet(reason.evidence.their_planet, lang);
  const asp = trAspect(reason.evidence.aspect, lang);
  const tone =
    reason.evidence.tone === 'harmony'
      ? 'supports'
      : 'challenges';
  return `Strong ${my}/${their} ${asp} ${tone} this area. ${reason.explanation.split('.')[0]}.`;
}

function inferHouse(profile: RelationshipProfile, reason: SynastryReason): string {
  const weighted = Object.entries(profile.weightedHouses).sort((a, b) => b[1] - a[1]);
  const contextHouse =
    PLANET_CONTEXT_HOUSE[reason.evidence.my_planet] ??
    PLANET_CONTEXT_HOUSE[reason.evidence.their_planet];
  const profileHouse = weighted[0]?.[0];
  const house = profileHouse ?? contextHouse ?? 7;
  return `H${house}`;
}

function buildCards(
  lang: AppLang,
  profileKey: RelationshipProfileKey,
  allReasons: SynastryReason[],
  tone: 'strength' | 'risk'
): DashboardCard[] {
  const filtered =
    tone === 'strength'
      ? allReasons.filter((r) => r.score > 0)
      : allReasons.filter((r) => r.score < 0);
  return filtered
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, 6)
    .map((reason, index) => {
      const reasonIndex = reasoningReasonIndex(reason, allReasons);
      const dim = bestDimension(profileKey, reason);
      return {
        id: `${tone}-${index}`,
        icon: dim?.icon ?? (tone === 'strength' ? '↑' : '↓'),
        title: cardTitle(lang, profileKey, reason, tone),
        scoreContribution: reason.score,
        explanation: shortExplanation(reason, lang),
        evidenceId: `evidence-${reasonIndex}`,
      };
    });
}

function reasoningReasonIndex(reason: SynastryReason, all: SynastryReason[]): number {
  const idx = all.indexOf(reason);
  return idx >= 0 ? idx : 0;
}

function linkEvidenceIds(reasoning: SynastryReasoning, category?: string): string[] {
  return reasoning.reasons
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => !category || r.category === category)
    .slice(0, 2)
    .map(({ i }) => `evidence-${i}`);
}

function buildRecommendations(
  profile: RelationshipProfile,
  reasoning: SynastryReasoning
): DashboardRecommendations {
  return {
    doMore: profile.recommendationTemplates.aligned.map((text, i) => ({
      text,
      evidenceIds: linkEvidenceIds(reasoning).length
        ? linkEvidenceIds(reasoning)
        : [`evidence-${i % Math.max(reasoning.reasons.length, 1)}`],
    })),
    watchCarefully: profile.recommendationTemplates.caution.map((text, i) => ({
      text,
      evidenceIds: linkEvidenceIds(
        reasoning,
        profile.scoringPriorities[1] ?? profile.scoringPriorities[0]
      ).length
        ? linkEvidenceIds(
            reasoning,
            profile.scoringPriorities[1] ?? profile.scoringPriorities[0]
          )
        : [`evidence-${i % Math.max(reasoning.reasons.length, 1)}`],
    })),
    avoid: profile.recommendationTemplates.tension.map((text, i) => ({
      text,
      evidenceIds: reasoning.reasons
        .map((r, idx) => ({ r, idx }))
        .filter(({ r }) => r.score < 0)
        .slice(0, 2)
        .map(({ idx }) => `evidence-${idx}`)
        .concat(i === 0 && reasoning.reasons.length ? [`evidence-0`] : [])
        .filter((v, pos, arr) => arr.indexOf(v) === pos)
        .slice(0, 2),
    })),
  };
}

function buildEvidence(
  lang: AppLang,
  profile: RelationshipProfile,
  reasoning: SynastryReasoning,
  recommendations: DashboardRecommendations
): DashboardEvidenceRow[] {
  const recIndexes = [
    ...recommendations.doMore,
    ...recommendations.watchCarefully,
    ...recommendations.avoid,
  ];

  return reasoning.reasons.map((reason, index) => {
    const linkedRecommendationIndexes: number[] = [];
    recIndexes.forEach((rec, recIndex) => {
      if (rec.evidenceIds.includes(`evidence-${index}`)) {
        linkedRecommendationIndexes.push(recIndex);
      }
    });

    return {
      id: `evidence-${index}`,
      planet: `${trPlanet(reason.evidence.my_planet, lang)} / ${trPlanet(reason.evidence.their_planet, lang)}`,
      aspect: trAspect(reason.evidence.aspect, lang),
      house: inferHouse(profile, reason),
      orb: reason.evidence.orb,
      importance: reason.importance,
      linkedRecommendationIndexes,
    };
  });
}

export function buildSynergyDashboardView(
  lang: AppLang,
  profile: RelationshipProfile,
  result: SynergyResult
): SynergyDashboardView {
  const { reasoning, harmony, tension, score, badge } = result;
  const recommendations = buildRecommendations(profile, reasoning);

  return {
    overall: {
      score,
      confidence: reasoning.confidence,
      profileKey: profile.key,
      profileLabel: relationshipProfileLabel(lang, profile.key),
      relationshipTypeLabel: relationshipProfileLabel(lang, profile.key),
      summary: reasoning.summary,
      badge,
    },
    sectionTitle: profileIntelligenceSectionTitle(lang, profile.key),
    strengths: buildCards(lang, profile.key, reasoning.reasons, 'strength'),
    risks: buildCards(lang, profile.key, reasoning.reasons, 'risk'),
    profileIntelligence: PROFILE_INTELLIGENCE_DIMENSIONS[profile.key].map((dim) => ({
      key: dim.key,
      label: intelligenceDimensionLabel(lang, dim.key),
      icon: dim.icon,
      pct: computeDimensionPct(profile, dim, harmony, tension),
    })),
    recommendations,
    evidence: buildEvidence(lang, profile, reasoning, recommendations),
  };
}

export function dashboardIntelligenceKeys(view: SynergyDashboardView): string[] {
  return view.profileIntelligence.map((item) => item.key);
}

export function dashboardContainsRomanticIntelligence(view: SynergyDashboardView): boolean {
  return dashboardIntelligenceKeys(view).some((key) => ROMANTIC_INTELLIGENCE_KEYS.has(key));
}

export function dashboardContainsBusinessIntelligence(view: SynergyDashboardView): boolean {
  return dashboardIntelligenceKeys(view).some((key) => BUSINESS_INTELLIGENCE_KEYS.has(key));
}

export function dashboardSectionLabels(lang: AppLang) {
  return DASHBOARD_SECTION_LABELS[lang] ?? DASHBOARD_SECTION_LABELS.en;
}



