/**
 * Cross-module accessors — thin adapters over Intelligence Core selectors.
 * Preserves legacy return shapes for existing pages.
 */

import {
  getCalendarEnergyContext as getCoreCalendar,
  getDecisionContext,
  getJuliaProfileContext as getCoreJulia,
  getPathfinderRiskContext,
  getPeopleCommunicationContext,
  getTodayEnergyContext as getCoreToday,
  getVaultProfileMetadata,
  getWorldOpportunityContext as getCoreWorld,
  getPersonalIntelligenceProfile,
  toLegacyIntelligenceProfile,
} from '@/lib/intelligence';
import type {
  AskProfileContext,
  CalendarEnergyContext,
  PathfinderProfileContext,
  PeopleProfileContext,
  TodayEnergyContext,
  VaultProfileContext,
  WorldOpportunityContext,
  PersonalIntelligenceProfile,
  EnergyRhythm,
  CommunicationStyle,
  OpportunityZone,
} from './types';

function styleLabel(style: string): string {
  return style
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function getAskProfileContext(): AskProfileContext | null {
  const d = getDecisionContext();
  if (!d) return null;
  return {
    decisionStyles: [d.primaryStyle, ...d.secondaryStyles].map(styleLabel),
    why: d.explanation,
  };
}

export function getTodayEnergyContext(): TodayEnergyContext | null {
  const ctx = getCoreToday();
  if (!ctx) return null;
  const rhythm: EnergyRhythm = {
    morning: ctx.rhythm.morning,
    afternoon: ctx.rhythm.afternoon,
    evening: ctx.rhythm.evening,
    decision: ctx.rhythm.decisionEnergy,
    creative: ctx.rhythm.creativeEnergy,
    social: ctx.rhythm.socialEnergy,
    note: ctx.rhythm.explanation,
  };
  return { rhythm };
}

export function getPeopleProfileContext(): PeopleProfileContext | null {
  const ctx = getPeopleCommunicationContext();
  if (!ctx) return null;
  const communication: CommunicationStyle = {
    usual: ctx.communication.primaryStyle,
    environment: ctx.communication.preferredEnvironment,
    conflict: ctx.communication.conflictStyle,
    listening: ctx.communication.listeningStyle,
  };
  return {
    communication,
    leadership: ctx.leadershipPrimary,
  };
}

export function getPathfinderProfileContext(): PathfinderProfileContext | null {
  const ctx = getPathfinderRiskContext();
  if (!ctx) return null;
  return {
    decisionStyles: ctx.decisionStyles.map(styleLabel),
    riskTilt: ctx.riskOrientation,
    why: ctx.explanation,
  };
}

export function getJuliaProfileContext(): PersonalIntelligenceProfile | null {
  const core = getPersonalIntelligenceProfile();
  if (!core) return null;
  // Prefer full legacy shape for DailyBrief Julia card
  void getCoreJulia(core);
  return toLegacyIntelligenceProfile(core);
}

export function getVaultProfileContext(): VaultProfileContext | null {
  const meta = getVaultProfileMetadata();
  if (!meta) return null;
  return {
    version: meta.version,
    updatedAt: meta.updatedAt,
    summary: meta.summary,
  };
}

export function getCalendarEnergyContext(): CalendarEnergyContext | null {
  const ctx = getCoreCalendar();
  if (!ctx) return null;
  return getTodayEnergyContext();
}

export function getWorldOpportunityContext(): WorldOpportunityContext | null {
  const ctx = getCoreWorld();
  if (!ctx) return null;
  const zones: OpportunityZone[] = ctx.zones.map((z) => ({
    zone: z.zone.charAt(0).toUpperCase() + z.zone.slice(1),
    relative: z.score,
  }));
  return { zones };
}
