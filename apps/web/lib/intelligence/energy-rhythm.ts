/** Energy rhythm — reuses birth timing anchors; optional live timing boost. */

import type {
  EnergyRhythmInsight,
  IntelligenceSeed,
  TimingContextInput,
} from './types';
import { clampScore, confidenceFromGaps } from './util';

export function buildEnergyRhythm(
  seed: IntelligenceSeed,
  timing?: TimingContextInput | null
): EnergyRhythmInsight {
  const morning = clampScore(seed.morningBias ? 78 : seed.eveningBias ? 48 : 62);
  const afternoon = clampScore(seed.deepWorkBias ? 76 : 58);
  const evening = clampScore(seed.eveningBias ? 74 : seed.morningBias ? 44 : 56);
  let decisionEnergy = clampScore(
    (morning + afternoon) / 2 + (seed.analyticalBias ? 6 : 0)
  );
  let creativeEnergy = clampScore(
    seed.creativeBias ? Math.max(afternoon, evening) + 4 : afternoon - 4
  );
  const socialEnergy = clampScore(seed.collaborativeBias ? 72 : 50);

  // Soft blend with live timing when available — no fake hour precision.
  if (timing?.todayScore != null) {
    const tilt = (timing.todayScore - 50) * 0.15;
    decisionEnergy = clampScore(decisionEnergy + tilt);
    creativeEnergy = clampScore(creativeEnergy + tilt * 0.5);
  }

  const recoveryWindow = seed.morningBias
    ? 'Late afternoon reset before evening commitments'
    : seed.eveningBias
      ? 'Late morning buffer after early obligations'
      : 'Mid-afternoon pause between decision blocks';

  const missing = [...seed.missing];
  if (seed.hour == null) missing.push('birth_time');

  return {
    morning,
    afternoon,
    evening,
    decisionEnergy,
    creativeEnergy,
    socialEnergy,
    recoveryWindow,
    explanation:
      'Relative energy bands from birth timing anchors' +
      (timing?.todayScore != null
        ? ', softly adjusted by today’s timing score.'
        : '. Live hourly precision requires the timing engine separately.'),
    confidence: confidenceFromGaps(
      missing,
      timing?.todayScore != null ? 72 : 60,
      'Energy bands are relative, not hour-level forecasts.',
      ['Do not treat bands as guaranteed peak performance times.']
    ),
  };
}
