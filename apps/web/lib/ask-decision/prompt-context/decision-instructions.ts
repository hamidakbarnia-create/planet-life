/**
 * Compact DECISION_INSTRUCTIONS block for structured prompt context.
 * No chain-of-thought / hidden deliberation requests.
 */

import type { RiskDomain } from '../intent-templates';
import { buildRiskDomainInstructions } from './risk-instructions';

export function buildDecisionInstructions(args: {
  riskDomains: readonly RiskDomain[];
}): string {
  const lines = [
    'DECISION_INSTRUCTIONS:',
    '- Answer the user’s actual question.',
    '- Use only supplied user facts as personal facts.',
    '- Treat missing context as unknown.',
    '- Cover the ready and partial evaluation dimensions.',
    '- Do not fabricate blocked dimensions or invent missing user facts for them.',
    '- For partial dimensions, evaluate cautiously and state uncertainty where material.',
    '- For ready dimensions, evaluate normally.',
    '- Missing information may be acknowledged; do not turn every missing field into a clarification request.',
    '- State uncertainty where material.',
    '- Produce the existing response schema exactly.',
    '- Do not expose internal deliberation or hidden step-by-step evaluation.',
    '- Keep the user-facing rationale concise and result-oriented.',
  ];

  const riskLines = buildRiskDomainInstructions(args.riskDomains);
  if (riskLines.length > 0) {
    lines.push(...riskLines);
  }

  return lines.join('\n');
}
