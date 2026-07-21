/** Assemble token-efficient Ask context from Intelligence Core selectors only. */

import type { BirthProfile } from '@/lib/birth-profile';
import {
  formatAskIntelligencePromptLine,
  getDecisionContext,
  getPathfinderRiskContext,
  getPersonalIntelligenceProfile,
  getTodayEnergyContext,
  serializeAskIntelligenceContext,
} from '@/lib/intelligence';
import { todayYMD } from '@/lib/calendar-utils';
import type { AskContextSnapshot, IntentDetection } from './types';

export function collectAskContext(
  profile: BirthProfile | null,
  options?: { locale?: string; intent?: IntentDetection | null }
): AskContextSnapshot {
  const locale = options?.locale ?? 'en';
  const core = getPersonalIntelligenceProfile();
  const payload = serializeAskIntelligenceContext(core);
  const decision = getDecisionContext(core);
  const energy = getTodayEnergyContext(core);
  const risk = options?.intent?.highStakesFlag
    ? getPathfinderRiskContext(core)
    : null;

  const intelligenceLine = formatAskIntelligencePromptLine(payload);
  const missingInputs: string[] = [];
  if (!core) missingInputs.push('personal_intelligence_profile');
  if (!profile) missingInputs.push('birth_profile_for_timing');
  if (payload?.missing_inputs?.length) {
    missingInputs.push(...payload.missing_inputs);
  }

  const energyNote = energy
    ? `Decision ${energy.rhythm.decisionEnergy} · Creative ${energy.rhythm.creativeEnergy} · Social ${energy.rhythm.socialEnergy}`
    : null;

  const riskLine = risk
    ? `risk=${risk.riskOrientation}; setup=${risk.decisionSetup.slice(0, 80)}`
    : null;

  return {
    currentDate: todayYMD(),
    locale,
    intelligenceLine: [intelligenceLine, riskLine].filter(Boolean).join(' | ') || null,
    decisionStyles: decision
      ? [decision.primaryStyle, ...decision.secondaryStyles]
      : [],
    energyNote,
    usedProfile: Boolean(core),
    timingAvailable: Boolean(profile),
    missingInputs: [...new Set(missingInputs)],
  };
}
