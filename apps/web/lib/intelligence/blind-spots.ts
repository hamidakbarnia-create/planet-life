/** Blind spots — max 6, constructive, non-clinical. */

import type { BlindSpotInsight, IntelligenceSeed } from './types';
import { confidenceFromGaps, makeEvidence } from './util';

export function buildBlindSpots(
  seed: IntelligenceSeed,
  derivedAt: string
): BlindSpotInsight[] {
  const conf = () =>
    confidenceFromGaps(
      seed.missing,
      64,
      'Blind-spot labels are decision-risk patterns, not diagnoses.'
    );

  const pool: Omit<BlindSpotInsight, 'confidence' | 'evidence'>[] = [
    {
      id: seed.morningBias || seed.analyticalBias ? 'overthinks' : 'acts-too-quickly',
      label: seed.morningBias || seed.analyticalBias ? 'Overthinks' : 'Acts too quickly',
      description:
        seed.morningBias || seed.analyticalBias
          ? 'Extra analysis can delay reversible moves that would teach faster.'
          : 'Speed helps — pause once when the downside is hard to reverse.',
      trigger: 'High ambiguity with a soft deadline',
      practicalMitigation:
        'Set a time-boxed decision window and a reversible default action.',
    },
    {
      id: seed.collaborativeBias ? 'avoids-conflict' : 'goes-solo-early',
      label: seed.collaborativeBias ? 'Avoids conflict' : 'Goes solo too early',
      description: seed.collaborativeBias
        ? 'Harmony preference can postpone necessary hard conversations.'
        : 'Independent drive can skip a stakeholder who reduces risk.',
      trigger: 'Interpersonal disagreement around the decision',
      practicalMitigation:
        'Name one required conversation and schedule it before locking the move.',
    },
    {
      id: 'perfectionism',
      label: 'Perfectionism',
      description:
        'Quality standards rise under pressure; define “good enough” checkpoints.',
      trigger: 'Public or high-visibility outcomes',
      practicalMitigation: 'Write a minimum viable success bar before refining further.',
    },
    {
      id: seed.eveningBias ? 'risk-avoidance' : 'surge-decisions',
      label: seed.eveningBias ? 'Risk avoidance' : 'Emotional surge decisions',
      description: seed.eveningBias
        ? 'Caution protects you — also schedule one controlled experiment.'
        : 'Energy spikes can compress deliberation; sleep on irreversible calls.',
      trigger: seed.eveningBias ? 'Downside-heavy options' : 'Time pressure + strong emotion',
      practicalMitigation:
        'Separate reversible pilots from irreversible commitments on a written list.',
    },
    {
      id: 'context-switching',
      label: 'Context switching',
      description: 'Parallel threads dilute judgment; batch decisions by domain.',
      trigger: 'Multiple open decisions in one day',
      practicalMitigation: 'Batch by domain and close one decision before opening another.',
    },
    {
      id: 'deferred-follow-through',
      label: 'Deferred follow-through',
      description: 'Insight arrives early; close the loop with a dated next action.',
      trigger: 'Post-decision relief',
      practicalMitigation: 'Attach a calendar date and owner to the next concrete step.',
    },
  ];

  const start = (seed.h >> 3) % pool.length;
  return [...pool.slice(start), ...pool.slice(0, start)].slice(0, 6).map((item) => ({
    ...item,
    confidence: conf(),
    evidence: makeEvidence(`blind-spot.${item.id}`, ['birth_timing'], derivedAt),
  }));
}
