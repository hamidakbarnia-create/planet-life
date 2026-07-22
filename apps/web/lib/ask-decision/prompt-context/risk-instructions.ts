/**
 * Compact risk-domain instructions — only for selected domains.
 */

import type { RiskDomain } from '../intent-templates';

const RULES: Partial<Record<RiskDomain, string[]>> = {
  health: [
    'No medical diagnosis.',
    'No treatment instructions.',
    'Recommend professional help where appropriate.',
  ],
  financial: [
    'Educational guidance only.',
    'No guaranteed returns.',
    'Disclose uncertainty and downside.',
  ],
  legal: [
    'General information only.',
    'No definitive legal conclusion.',
  ],
  safety: [
    'Follow existing safety behavior; do not escalate harm.',
  ],
};

export function buildRiskDomainInstructions(
  riskDomains: readonly RiskDomain[]
): string[] {
  const lines: string[] = [];
  const seen = new Set<RiskDomain>();
  for (const domain of riskDomains) {
    if (seen.has(domain)) continue;
    seen.add(domain);
    const rules = RULES[domain];
    if (!rules) continue;
    lines.push(`Risk domain (${domain}):`);
    for (const rule of rules) lines.push(`- ${rule}`);
  }
  return lines;
}
