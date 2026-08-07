import type { AppLang } from '@/lib/app-settings';
import {
  findGuidedQuestion,
  resolveGuidedQuestionText,
} from '@/lib/question-library';
import {
  getDecisionType,
  hasDecisionTypeRegistry,
  listDecisionTypes,
} from './decision-type-registry';
import type { PopularDecision, PopularDecisionRef } from './types';

/**
 * Curated presentation order for Ask Home Popular Decisions.
 * Labels are never stored here — resolved from registry or question-library.
 */
const POPULAR_DECISION_REFS: readonly PopularDecisionRef[] = [
  { id: 'accept-job-offer', guidedQuestionId: 'negotiate-offer' },
  { id: 'best-wedding-date', decisionTypeId: 'mar-wedding-date' },
  {
    id: 'job-interview',
    decisionTypeId: 'car-interview',
    guidedQuestionId: 'job-interview',
  },
  { id: 'career-change', guidedQuestionId: 'change-career-path' },
  { id: 'promotion', guidedQuestionId: 'ask-promotion' },
  { id: 'salary-negotiation', guidedQuestionId: 'ask-raise' },
  { id: 'launch-business', guidedQuestionId: 'launch-project' },
  { id: 'invest-money', guidedQuestionId: 'buy-sell-asset' },
  { id: 'partnership', guidedQuestionId: 'close-deal' },
  { id: 'move-abroad', guidedQuestionId: 'relocate-city' },
  { id: 'buy-house', guidedQuestionId: 'buy-sell-property' },
];

/** Typed mock catalog used only when the registry document is unavailable. */
const MOCK_POPULAR_DECISIONS: readonly PopularDecision[] = [
  { id: 'accept-job-offer', label: 'Accept Job Offer', source: 'mock' },
  { id: 'best-wedding-date', label: 'Best Wedding Date', source: 'mock' },
  { id: 'job-interview', label: 'Job Interview', source: 'mock' },
  { id: 'career-change', label: 'Career Change', source: 'mock' },
  { id: 'promotion', label: 'Promotion', source: 'mock' },
  { id: 'salary-negotiation', label: 'Salary Negotiation', source: 'mock' },
  { id: 'launch-business', label: 'Launch Business', source: 'mock' },
  { id: 'invest-money', label: 'Invest Money', source: 'mock' },
  { id: 'partnership', label: 'Partnership', source: 'mock' },
  { id: 'move-abroad', label: 'Move Abroad', source: 'mock' },
  { id: 'buy-house', label: 'Buy House', source: 'mock' },
];

function resolveFromRegistry(
  ref: PopularDecisionRef
): PopularDecision | null {
  if (!ref.decisionTypeId) return null;
  const record = getDecisionType(ref.decisionTypeId);
  if (!record) return null;
  return {
    id: ref.id,
    label: record.label,
    decisionTypeId: record.decision_type_id,
    guidedQuestionId: ref.guidedQuestionId,
    familyId: record.family_id,
    source: 'registry',
  };
}

function resolveFromQuestionLibrary(
  ref: PopularDecisionRef,
  lang: AppLang
): PopularDecision | null {
  if (!ref.guidedQuestionId) return null;
  const guided = findGuidedQuestion(ref.guidedQuestionId);
  if (!guided) return null;
  return {
    id: ref.id,
    label: resolveGuidedQuestionText(guided, lang),
    decisionTypeId: ref.decisionTypeId,
    guidedQuestionId: guided.id,
    source: 'question-library',
  };
}

/**
 * Single abstraction for Popular Decisions.
 * Prefers registry labels when a decision_type_id is bound and present;
 * otherwise resolves from the question library. Falls back to typed mocks
 * only when the registry document itself is unavailable.
 */
export function listPopularDecisions(lang: AppLang = 'en'): PopularDecision[] {
  if (!hasDecisionTypeRegistry()) {
    return [...MOCK_POPULAR_DECISIONS];
  }

  const resolved: PopularDecision[] = [];
  for (const ref of POPULAR_DECISION_REFS) {
    const fromRegistry = resolveFromRegistry(ref);
    if (fromRegistry) {
      resolved.push(fromRegistry);
      continue;
    }
    const fromLibrary = resolveFromQuestionLibrary(ref, lang);
    if (fromLibrary) resolved.push(fromLibrary);
  }
  return resolved;
}

/** Full registry listing for “See All Decisions”. */
export function listAllDecisionTypesAsPopular(): PopularDecision[] {
  if (!hasDecisionTypeRegistry()) {
    return [...MOCK_POPULAR_DECISIONS];
  }
  return listDecisionTypes().map((row) => ({
    id: row.decision_type_id,
    label: row.label,
    decisionTypeId: row.decision_type_id,
    familyId: row.family_id,
    source: 'registry' as const,
  }));
}
