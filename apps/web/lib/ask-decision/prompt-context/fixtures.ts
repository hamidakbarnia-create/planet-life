/**
 * Prompt-context fixtures — five decision scenarios + builder helpers.
 */

import {
  buildInputAnalysis,
  type InputAnalysis,
} from '../input-analysis';
import {
  buildUnifiedDecisionContext,
  type ContextFact,
  type UnifiedDecisionContext,
} from '../context-builder';
import { buildReasoningPlan, type ReasoningPlan } from '../reasoning-planner';
import type { TimingIntelligence } from '../types';
import { TIMING_AVAILABLE } from '../context-builder/fixtures';

export const FIXED_NOW = '2026-07-21T12:00:00.000Z';

export const SCENARIO_QUESTIONS = {
  raiseRequest:
    'Should I ask for a 15% raise after 18 months in my job at Acme?',
  jobChange:
    'Should I accept the Senior Engineer offer at NovaCorp or stay in my current role?',
  relocation:
    'Should I relocate to Berlin for work in September or stay in London?',
  relationship:
    'Should I move in with my partner after dating for 2 years, or wait?',
  financialRisk:
    'Should I invest 40% of my savings in an index fund this quarter or keep cash?',
} as const;

export type ScenarioKey = keyof typeof SCENARIO_QUESTIONS;

const SCENARIO_FACTS: Record<ScenarioKey, ContextFact[]> = {
  raiseRequest: [
    {
      key: 'financial_impact.percent',
      value: '15%',
      source: 'current_question',
      confidence: 0.9,
    },
    {
      key: 'current_option',
      value: 'ask for raise at Acme',
      source: 'current_question',
      confidence: 0.85,
    },
    {
      key: 'duration.months',
      value: 18,
      source: 'current_question',
      confidence: 0.9,
    },
    {
      key: 'entity.employer',
      value: 'Acme',
      source: 'current_question',
      confidence: 0.9,
    },
  ],
  jobChange: [
    {
      key: 'current_option',
      value: 'Senior Engineer at NovaCorp',
      source: 'current_question',
      confidence: 0.9,
    },
    {
      key: 'alternative_option',
      value: 'stay in current role',
      source: 'current_question',
      confidence: 0.85,
    },
    {
      key: 'entity.employer',
      value: 'NovaCorp',
      source: 'current_question',
      confidence: 0.9,
    },
  ],
  relocation: [
    {
      key: 'location.target',
      value: 'Berlin',
      source: 'current_question',
      confidence: 0.95,
    },
    {
      key: 'location.current',
      value: 'London',
      source: 'current_question',
      confidence: 0.95,
    },
    {
      key: 'timing.window',
      value: 'September',
      source: 'current_question',
      confidence: 0.8,
    },
    {
      key: 'current_option',
      value: 'relocate to Berlin for work',
      source: 'current_question',
      confidence: 0.9,
    },
  ],
  relationship: [
    {
      key: 'relationship_status',
      value: 'dating partner 2 years',
      source: 'current_question',
      confidence: 0.9,
    },
    {
      key: 'duration.years',
      value: 2,
      source: 'current_question',
      confidence: 0.9,
    },
    {
      key: 'current_option',
      value: 'move in together',
      source: 'current_question',
      confidence: 0.85,
    },
    {
      key: 'alternative_option',
      value: 'wait',
      source: 'current_question',
      confidence: 0.85,
    },
  ],
  financialRisk: [
    {
      key: 'financial_impact.percent',
      value: '40%',
      source: 'current_question',
      confidence: 0.95,
    },
    {
      key: 'current_option',
      value: 'invest in index fund',
      source: 'current_question',
      confidence: 0.9,
    },
    {
      key: 'alternative_option',
      value: 'keep cash',
      source: 'current_question',
      confidence: 0.9,
    },
    {
      key: 'timing.window',
      value: 'this quarter',
      source: 'current_question',
      confidence: 0.8,
    },
  ],
};

const SCENARIO_CONSTRAINTS: Partial<Record<ScenarioKey, ContextFact[]>> = {
  financialRisk: [
    {
      key: 'known_constraints.liquidity',
      value: 'need emergency cash buffer',
      source: 'conversation',
      confidence: 0.7,
    },
  ],
  relocation: [
    {
      key: 'known_constraints.housing',
      value: 'lease ends in August',
      source: 'conversation',
      confidence: 0.75,
    },
  ],
};

export function analysisForScenario(key: ScenarioKey): InputAnalysis {
  return buildInputAnalysis(SCENARIO_QUESTIONS[key]);
}

export function buildScenarioPair(
  key: ScenarioKey,
  opts?: {
    timing?: TimingIntelligence | null;
    locale?: 'en' | 'ru' | 'fa' | 'ar';
    conversation?: { role: 'user' | 'assistant'; content: string }[];
  }
): { context: UnifiedDecisionContext; plan: ReasoningPlan; question: string } {
  const question = SCENARIO_QUESTIONS[key];
  const analysis = analysisForScenario(key);
  const base = buildUnifiedDecisionContext({
    question,
    locale: opts?.locale ?? 'en',
    analysis,
    profile: null,
    timing: opts?.timing ?? TIMING_AVAILABLE,
    conversationMessages: opts?.conversation ?? [
      { role: 'user', content: 'I already compared the main options.' },
      { role: 'assistant', content: 'What matters most right now?' },
      {
        role: 'user',
        content: SCENARIO_CONSTRAINTS[key]?.[0]?.value
          ? String(SCENARIO_CONSTRAINTS[key]![0].value)
          : 'I need a clear recommendation.',
      },
    ],
    now: () => FIXED_NOW,
  });

  const context: UnifiedDecisionContext = {
    ...base,
    knownFacts: [...SCENARIO_FACTS[key], ...base.knownFacts],
    constraints: [
      ...(SCENARIO_CONSTRAINTS[key] ?? []),
      ...base.constraints,
    ],
  };

  const plan = buildReasoningPlan({ analysis, context });
  return { context, plan, question };
}

/** Oversized fact set for limit tests. */
export function manyFacts(count: number, source: ContextFact['source'] = 'conversation'): ContextFact[] {
  return Array.from({ length: count }, (_, i) => ({
    key: `fact.${String(i).padStart(3, '0')}`,
    value: `value-${i}`,
    source,
    confidence: 0.5,
  }));
}

export function manyMessages(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
    content: `message-${i}`,
  }));
}
