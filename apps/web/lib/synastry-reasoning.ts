/**
 * Profile-aware synastry reasoning — deterministic interpretation from the same
 * aspect list, weighted by RelationshipProfile.
 */

import type { SynastryAspect } from './synergy';
import {
  aspectSynastryWeight,
  planetSynastryWeight,
  type ReasoningCategory,
  type RelationshipProfile,
} from './relationship-profile';

export interface SynastryReasonEvidence {
  my_planet: string;
  their_planet: string;
  aspect: string;
  orb: number;
  tone: 'harmony' | 'tension';
}

export interface SynastryReason {
  category: ReasoningCategory;
  planet?: string | null;
  importance: 'high' | 'medium' | 'low';
  score: number;
  title: string;
  explanation: string;
  evidence: SynastryReasonEvidence;
}

export interface SynastryReasoning {
  summary: string;
  confidence: number;
  reasons: SynastryReason[];
  profileKey: string;
}

const HARMONY_ASPECTS = new Set(['trine', 'sextile', 'conjunction']);

function orbStrength(orb: number, max = 8): number {
  return Math.max(0, 1 - orb / max);
}

function aspectTone(aspect: string): 'harmony' | 'tension' {
  return HARMONY_ASPECTS.has(aspect) ? 'harmony' : 'tension';
}

function categorizeAspect(
  profile: RelationshipProfile,
  row: SynastryAspect
): ReasoningCategory {
  const planets = new Set([row.myPlanet, row.theirPlanet]);
  for (const category of profile.scoringPriorities) {
    const section = profile.insightSections.find((s) => s.key === category);
    if (section && section.planets.some((p) => planets.has(p))) {
      return category;
    }
  }
  return profile.reasoningCategories[0] ?? 'communication';
}

function aspectInfluence(profile: RelationshipProfile, row: SynastryAspect): number {
  const tone = aspectTone(row.aspect);
  const pw = planetSynastryWeight(profile, row.myPlanet, row.theirPlanet);
  const aw = aspectSynastryWeight(profile, row.aspect, tone);
  const tight = orbStrength(row.orb);
  return pw * aw * (0.5 + tight);
}

function importanceFromInfluence(influence: number): 'high' | 'medium' | 'low' {
  if (influence >= 280) return 'high';
  if (influence >= 140) return 'medium';
  return 'low';
}

function titleFor(row: SynastryAspect, tone: 'harmony' | 'tension'): string {
  const verb = tone === 'harmony' ? 'supports' : 'challenges';
  return `Your ${row.myPlanet} ${row.aspect} their ${row.theirPlanet} ${verb} this bond`;
}

function explanationFor(
  profile: RelationshipProfile,
  row: SynastryAspect,
  category: ReasoningCategory,
  tone: 'harmony' | 'tension'
): string {
  const focus = profile.label.toLowerCase();
  const quality = tone === 'harmony' ? 'helpful' : 'sensitive';
  return `For a ${focus} connection, this aspect is ${quality} for ${category.replace(/_/g, ' ')} (orb ${row.orb.toFixed(1)}°).`;
}

function confidenceFromAspects(
  harmony: SynastryAspect[],
  tension: SynastryAspect[],
  score: number
): number {
  const count = harmony.length + tension.length;
  const balance = Math.abs(harmony.length - tension.length);
  const spread = Math.min(1, count / 12);
  const scoreFactor = Math.min(1, Math.abs(score - 50) / 50);
  const balancePenalty = Math.min(0.2, balance / 20);
  return Math.max(0.35, Math.min(0.95, 0.45 + spread * 0.25 + scoreFactor * 0.25 - balancePenalty));
}

function executiveSummary(profile: RelationshipProfile, score: number): string {
  const rating = score >= 70 ? 'strong' : score >= 40 ? 'mixed' : 'challenging';
  const priority = profile.scoringPriorities[0]?.replace(/_/g, ' ') ?? 'connection';
  return `${profile.label} compatibility scores ${score}/100 (${rating}). Primary lens: ${priority}.`;
}

export function buildSynastryReasoning(
  profile: RelationshipProfile,
  score: number,
  harmony: SynastryAspect[],
  tension: SynastryAspect[]
): SynastryReasoning {
  const rows = [...harmony, ...tension]
    .map((row) => ({ row, influence: aspectInfluence(profile, row) }))
    .sort((a, b) => b.influence - a.influence)
    .slice(0, 8);

  const reasons: SynastryReason[] = rows.map(({ row, influence }) => {
    const tone = aspectTone(row.aspect);
    const category = categorizeAspect(profile, row);
    const signed = tone === 'harmony' ? influence / 40 : -(influence / 40);
    return {
      category,
      planet: row.myPlanet,
      importance: importanceFromInfluence(influence),
      score: Math.round(signed * 10) / 10,
      title: titleFor(row, tone),
      explanation: explanationFor(profile, row, category, tone),
      evidence: {
        my_planet: row.myPlanet,
        their_planet: row.theirPlanet,
        aspect: row.aspect,
        orb: row.orb,
        tone,
      },
    };
  });

  return {
    summary: executiveSummary(profile, score),
    confidence: Math.round(confidenceFromAspects(harmony, tension, score) * 100) / 100,
    reasons,
    profileKey: profile.key,
  };
}
