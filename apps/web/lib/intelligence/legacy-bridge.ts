/**
 * Bridge: map Intelligence Core → legacy intelligence-profile UI shape.
 * Keeps existing cards / consumers working during migration.
 */

import type { PersonalIntelligenceProfile as CoreProfile } from './types';
import type {
  PersonalIntelligenceProfile as LegacyProfile,
  LabeledInsight,
  OpportunityZone,
  EnergyRhythm,
} from '@/lib/intelligence-profile/types';

function styleLabel(style: string): string {
  return style
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function toLegacyIntelligenceProfile(
  core: CoreProfile
): LegacyProfile {
  const decisionStyle: LabeledInsight[] = [
    {
      label: styleLabel(core.decisionStyle.primaryStyle),
      why: core.decisionStyle.explanation,
    },
    ...core.decisionStyle.secondaryStyles.map((s) => ({
      label: styleLabel(s),
      why: core.decisionStyle.explanation,
    })),
  ].slice(0, 4);

  // Preserve Pathfinder string heuristics (fast / patient) via speed / risk.
  if (core.decisionStyle.decisionSpeed === 'fast') {
    decisionStyle.push({
      label: 'Fast',
      why: 'Decision speed leans fast when inputs are clear.',
    });
  }
  if (core.decisionStyle.riskOrientation === 'cautious') {
    decisionStyle.push({
      label: 'Patient',
      why: 'Risk orientation favors deliberate pacing.',
    });
  }
  decisionStyle.push({
    label: 'Risk Balanced',
    why: `Risk orientation: ${core.decisionStyle.riskOrientation}.`,
  });

  const strengths: LabeledInsight[] = core.strengths.map((s) => ({
    label: s.label,
    why: s.decisionApplication,
  }));

  const blindSpots: LabeledInsight[] = core.blindSpots.map((b) => ({
    label: b.label,
    why: `${b.description} Mitigation: ${b.practicalMitigation}`,
  }));

  const opportunityZones: OpportunityZone[] = core.opportunityZones.map((z) => ({
    zone: z.zone.charAt(0).toUpperCase() + z.zone.slice(1),
    relative: z.score,
  }));

  const energyRhythm: EnergyRhythm = {
    morning: core.energyRhythm.morning,
    afternoon: core.energyRhythm.afternoon,
    evening: core.energyRhythm.evening,
    decision: core.energyRhythm.decisionEnergy,
    creative: core.energyRhythm.creativeEnergy,
    social: core.energyRhythm.socialEnergy,
    note: core.energyRhythm.explanation,
  };

  return {
    meta: {
      version: core.profileVersion,
      generatedAt: core.generatedAt,
      updatedAt: core.updatedAt,
      sourceFingerprint: core.sourceProfileFingerprint,
    },
    decisionStyle: decisionStyle.slice(0, 5),
    strengths,
    blindSpots,
    opportunityZones,
    pressureResponse: {
      underStress: core.pressureResponse.likelyResponse,
      recovery: core.pressureResponse.recoveryPattern,
      approach: core.pressureResponse.recommendedProtocol,
    },
    communicationStyle: {
      usual: core.communicationStyle.primaryStyle,
      environment: core.communicationStyle.preferredEnvironment,
      conflict: core.communicationStyle.conflictStyle,
      listening: core.communicationStyle.listeningStyle,
    },
    leadershipStyle: {
      label: core.leadershipStyle.primaryStyle,
      why: core.leadershipStyle.recommendedDevelopment,
    },
    workStyle: [
      {
        label: core.workStyle.focusMode,
        why: core.workStyle.recommendedEnvironment,
      },
      {
        label: core.workStyle.collaborationPreference,
        why: core.workStyle.executionRhythm,
      },
      {
        label: core.workStyle.structurePreference,
        why: core.workStyle.changeTolerance,
      },
    ],
    learningStyle: [
      {
        label: core.learningStyle.primaryMethod,
        why: core.learningStyle.recommendedMethod,
      },
      ...core.learningStyle.secondaryMethods.map((m) => ({
        label: m,
        why: core.learningStyle.processingPreference,
      })),
    ],
    energyRhythm,
    decisionEnvironment: core.decisionEnvironment.preferredSettings.map((label) => ({
      label,
      why: core.decisionEnvironment.recommendedDecisionSetup,
    })),
    growthAreas: core.growthAreas.map((g) => g.specificPractice),
    summary: core.personalSummary,
  };
}
