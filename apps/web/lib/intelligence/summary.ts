/** Personal summary — max 120 words, professional, non-mystical. */

import type {
  DecisionStyleInsight,
  LeadershipStyleInsight,
  StrengthInsight,
  WorkStyleInsight,
} from './types';
import { wordLimit } from './util';

export function buildPersonalSummary(input: {
  decisionStyle: DecisionStyleInsight;
  strengths: StrengthInsight[];
  leadership: LeadershipStyleInsight;
  work: WorkStyleInsight;
}): string {
  const styles = [
    input.decisionStyle.primaryStyle,
    ...input.decisionStyle.secondaryStyles.slice(0, 2),
  ].join(', ');
  const strengthLabels = input.strengths
    .slice(0, 3)
    .map((s) => s.label.toLowerCase())
    .join(', ');

  const summary =
    `You decide in a ${styles} mode, with notable strengths in ${strengthLabels}. ` +
    `Leadership tends toward ${input.leadership.primaryStyle.toLowerCase()}, ` +
    `and work rhythm favors ${input.work.focusMode.toLowerCase()}. ` +
    `Use reversible pilots before irreversible commitments, and schedule high-stakes calls ` +
    `inside stronger energy bands. These are comparative decision-support signals, not predictions.`;

  return wordLimit(summary, 120);
}
