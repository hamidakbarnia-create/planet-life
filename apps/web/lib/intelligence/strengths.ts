/** Strengths section — max 6, each with decision application. */

import type { IntelligenceSeed, StrengthInsight } from './types';
import { confidenceFromGaps, makeEvidence } from './util';

export function buildStrengths(
  seed: IntelligenceSeed,
  derivedAt: string
): StrengthInsight[] {
  const conf = () =>
    confidenceFromGaps(
      seed.missing,
      68,
      'Strength signals are comparative timing-derived patterns.'
    );
  const ev = (id: string) =>
    makeEvidence(id, ['birth_date', 'birth_time'], derivedAt);

  const pool: Omit<StrengthInsight, 'confidence' | 'evidence'>[] = [
    {
      id: 'long-term-planning',
      label: 'Long-term planning',
      description: 'Frames choices around multi-step outcomes rather than single moves.',
      decisionApplication:
        'Use when ranking options by 90-day impact before committing capital or reputation.',
    },
    {
      id: seed.collaborativeBias ? 'communication' : 'leadership',
      label: seed.collaborativeBias ? 'Communication' : 'Leadership',
      description: seed.collaborativeBias
        ? 'Clarity improves when ideas are spoken and tested with others.'
        : 'Direction-setting is a natural mode under clear goals.',
      decisionApplication: seed.collaborativeBias
        ? 'Surface the decision criteria in a short brief before seeking input.'
        : 'State the decision owner and success signal before opening debate.',
    },
    {
      id: seed.analyticalBias ? 'pattern-recognition' : 'learning-speed',
      label: seed.analyticalBias ? 'Pattern recognition' : 'Learning speed',
      description: seed.analyticalBias
        ? 'Connects signals across contexts before acting.'
        : 'Absorbs new frameworks quickly when stakes are real.',
      decisionApplication: seed.analyticalBias
        ? 'Map two prior analogous decisions before choosing.'
        : 'Run a small real version of the option to learn faster than theorizing.',
    },
    {
      id: seed.creativeBias ? 'creativity' : 'negotiation',
      label: seed.creativeBias ? 'Creativity' : 'Negotiation',
      description: seed.creativeBias
        ? 'Fresh options surface when constraints are explicit.'
        : 'Trade-offs become clearer when interests are mapped.',
      decisionApplication: seed.creativeBias
        ? 'Force one non-obvious third option before binary choose/leave.'
        : 'List each party’s must-haves before bargaining on a decision.',
    },
    {
      id: seed.deepWorkBias ? 'execution-focus' : 'systems-thinking',
      label: seed.deepWorkBias ? 'Execution focus' : 'Systems thinking',
      description: seed.deepWorkBias
        ? 'Sustained focus windows convert plans into finished work.'
        : 'Sees how parts interact before optimizing one piece.',
      decisionApplication: seed.deepWorkBias
        ? 'Protect one uninterrupted block for the irreversible step.'
        : 'Sketch dependency risks before optimizing a single lever.',
    },
    {
      id: 'decision-sequencing',
      label: 'Decision sequencing',
      description: 'Performs best when irreversible steps follow reversible pilots.',
      decisionApplication:
        'Require a dated reversible pilot before any hard-to-reverse commitment.',
    },
  ];

  const start = seed.h % pool.length;
  const ordered = [...pool.slice(start), ...pool.slice(0, start)];
  return ordered.slice(0, 6).map((item) => ({
    ...item,
    confidence: conf(),
    evidence: ev(`strength.${item.id}`),
  }));
}
