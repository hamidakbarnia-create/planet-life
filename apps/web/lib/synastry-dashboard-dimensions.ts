/**
 * Profile-specific intelligence dimensions for Section 4.
 * Presentation only — scores derived from existing aspect lists.
 */

import type { RelationshipProfileKey, SynastryPlanet } from './relationship-profile';

export interface IntelligenceDimensionDef {
  key: string;
  planets: readonly SynastryPlanet[];
  icon: string;
}

export const PROFILE_INTELLIGENCE_DIMENSIONS: Record<
  RelationshipProfileKey,
  readonly IntelligenceDimensionDef[]
> = {
  business_partner: [
    { key: 'financial_trust', planets: ['mercury', 'saturn', 'jupiter'], icon: '◈' },
    { key: 'leadership_balance', planets: ['sun', 'mars', 'saturn'], icon: '⚖' },
    { key: 'execution_speed', planets: ['mars', 'mercury', 'sun'], icon: '▸' },
    { key: 'innovation', planets: ['jupiter', 'mercury', 'sun'], icon: '✦' },
    { key: 'negotiation', planets: ['mercury', 'venus', 'jupiter'], icon: '⇄' },
    { key: 'ownership', planets: ['saturn', 'sun', 'mars'], icon: '⬡' },
    { key: 'exit_strategy', planets: ['saturn', 'jupiter', 'sun'], icon: '↗' },
  ],
  cofounder: [
    { key: 'financial_trust', planets: ['mercury', 'saturn', 'jupiter'], icon: '◈' },
    { key: 'leadership_balance', planets: ['sun', 'mars', 'saturn'], icon: '⚖' },
    { key: 'execution_speed', planets: ['mars', 'mercury', 'sun'], icon: '▸' },
    { key: 'innovation', planets: ['jupiter', 'mercury', 'sun'], icon: '✦' },
    { key: 'negotiation', planets: ['mercury', 'venus', 'jupiter'], icon: '⇄' },
    { key: 'ownership', planets: ['saturn', 'sun', 'mars'], icon: '⬡' },
    { key: 'exit_strategy', planets: ['saturn', 'jupiter', 'mars'], icon: '↗' },
  ],
  investor: [
    { key: 'governance', planets: ['saturn', 'sun', 'jupiter'], icon: '⬢' },
    { key: 'transparency', planets: ['mercury', 'saturn', 'jupiter'], icon: '◎' },
    { key: 'capital_growth', planets: ['jupiter', 'venus', 'saturn'], icon: '↗' },
    { key: 'exit_timing', planets: ['saturn', 'jupiter', 'mars'], icon: '⏱' },
    { key: 'board_dynamics', planets: ['sun', 'saturn', 'mercury'], icon: '⊞' },
  ],
  client: [
    { key: 'service_delivery', planets: ['mercury', 'saturn', 'venus'], icon: '✓' },
    { key: 'communication', planets: ['mercury', 'moon'], icon: '💬' },
    { key: 'trust', planets: ['saturn', 'jupiter', 'venus'], icon: '◉' },
    { key: 'scope_clarity', planets: ['mercury', 'saturn'], icon: '▭' },
    { key: 'reliability', planets: ['saturn', 'sun'], icon: '⟡' },
    { key: 'accountability', planets: ['saturn', 'mars'], icon: '⊡' },
  ],
  spouse: [
    { key: 'love', planets: ['venus', 'moon', 'mars'], icon: '♥' },
    { key: 'trust', planets: ['saturn', 'jupiter', 'venus'], icon: '◉' },
    { key: 'emotional_bond', planets: ['moon', 'sun', 'venus'], icon: '∞' },
    { key: 'shared_home', planets: ['moon', 'saturn', 'venus'], icon: '⌂' },
    { key: 'parenting', planets: ['moon', 'saturn', 'jupiter'], icon: '✿' },
    { key: 'conflict_recovery', planets: ['mars', 'moon', 'mercury'], icon: '↺' },
    { key: 'commitment', planets: ['saturn', 'sun', 'venus'], icon: '⛓' },
  ],
  romantic_partner: [
    { key: 'love', planets: ['venus', 'moon', 'mars'], icon: '♥' },
    { key: 'chemistry', planets: ['venus', 'mars'], icon: '✦' },
    { key: 'trust', planets: ['saturn', 'jupiter', 'venus'], icon: '◉' },
    { key: 'emotional_bond', planets: ['moon', 'sun', 'venus'], icon: '∞' },
    { key: 'communication', planets: ['mercury', 'moon'], icon: '💬' },
    { key: 'conflict_recovery', planets: ['mars', 'moon', 'mercury'], icon: '↺' },
    { key: 'commitment', planets: ['saturn', 'sun'], icon: '⛓' },
  ],
  friend: [
    { key: 'fun', planets: ['venus', 'jupiter', 'sun'], icon: '☺' },
    { key: 'loyalty', planets: ['saturn', 'moon', 'sun'], icon: '⟡' },
    { key: 'support', planets: ['moon', 'jupiter'], icon: '⊕' },
    { key: 'reliability', planets: ['saturn', 'mercury'], icon: '✓' },
    { key: 'adventure', planets: ['jupiter', 'mars', 'sun'], icon: '✈' },
    { key: 'communication', planets: ['mercury', 'moon'], icon: '💬' },
  ],
  family: [
    { key: 'emotional_bond', planets: ['moon', 'sun', 'venus'], icon: '∞' },
    { key: 'stability', planets: ['saturn', 'jupiter', 'moon'], icon: '⌂' },
    { key: 'boundaries', planets: ['saturn', 'mars'], icon: '⊡' },
    { key: 'communication', planets: ['mercury', 'moon'], icon: '💬' },
    { key: 'shared_history', planets: ['moon', 'saturn', 'sun'], icon: '◷' },
    { key: 'conflict_recovery', planets: ['mars', 'moon'], icon: '↺' },
    { key: 'support', planets: ['moon', 'jupiter'], icon: '⊕' },
  ],
  parent_child: [
    { key: 'emotional_bond', planets: ['moon', 'sun', 'venus'], icon: '∞' },
    { key: 'boundaries', planets: ['saturn', 'mars', 'sun'], icon: '⊡' },
    { key: 'growth', planets: ['jupiter', 'mercury', 'sun'], icon: '↗' },
    { key: 'communication', planets: ['mercury', 'moon'], icon: '💬' },
    { key: 'respect', planets: ['sun', 'saturn'], icon: '◎' },
    { key: 'conflict_recovery', planets: ['mars', 'moon'], icon: '↺' },
    { key: 'support', planets: ['moon', 'jupiter'], icon: '⊕' },
  ],
  employee: [
    { key: 'practical_fit', planets: ['mercury', 'saturn', 'sun'], icon: '✓' },
    { key: 'communication', planets: ['mercury', 'moon'], icon: '💬' },
    { key: 'boundaries', planets: ['saturn', 'mars'], icon: '⊡' },
    { key: 'growth', planets: ['jupiter', 'mercury'], icon: '↗' },
    { key: 'reliability', planets: ['saturn', 'sun'], icon: '⟡' },
    { key: 'accountability', planets: ['saturn', 'mars'], icon: '⊡' },
    { key: 'teamwork', planets: ['moon', 'mercury', 'jupiter'], icon: '⊞' },
  ],
  employer: [
    { key: 'authority_clarity', planets: ['saturn', 'sun', 'mars'], icon: '⚖' },
    { key: 'stability', planets: ['saturn', 'jupiter'], icon: '⌂' },
    { key: 'trust', planets: ['saturn', 'jupiter', 'mercury'], icon: '◉' },
    { key: 'communication', planets: ['mercury', 'moon'], icon: '💬' },
    { key: 'growth_paths', planets: ['jupiter', 'sun'], icon: '↗' },
    { key: 'accountability', planets: ['saturn', 'mars'], icon: '⊡' },
    { key: 'fairness', planets: ['venus', 'saturn', 'jupiter'], icon: '⚖' },
  ],
  mentor: [
    { key: 'growth', planets: ['jupiter', 'sun', 'mercury'], icon: '↗' },
    { key: 'trust', planets: ['saturn', 'jupiter', 'mercury'], icon: '◉' },
    { key: 'communication', planets: ['mercury', 'moon'], icon: '💬' },
    { key: 'boundaries', planets: ['saturn', 'mars'], icon: '⊡' },
    { key: 'guidance', planets: ['jupiter', 'saturn'], icon: '◎' },
    { key: 'reliability', planets: ['saturn', 'mercury'], icon: '⟡' },
    { key: 'mutual_learning', planets: ['mercury', 'jupiter'], icon: '⇄' },
  ],
};

/** Romantic-only dimension keys — used in tests and UI guards. */
export const ROMANTIC_INTELLIGENCE_KEYS = new Set([
  'love',
  'chemistry',
  'parenting',
  'shared_home',
  'emotional_bond',
]);

/** Business/investor dimension keys — must not appear on romantic profiles. */
export const BUSINESS_INTELLIGENCE_KEYS = new Set([
  'ownership',
  'exit_strategy',
  'governance',
  'board_dynamics',
  'capital_growth',
  'exit_timing',
  'financial_trust',
]);
