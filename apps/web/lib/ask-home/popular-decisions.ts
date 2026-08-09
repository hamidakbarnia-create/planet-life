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
import { isShippedExecutableDecisionType } from './production-capability';
import type {
  PopularCapability,
  PopularDecision,
  PopularDecisionRef,
} from './types';

/**
 * Curated presentation order for Ask Home Popular Decisions.
 * Labels are never stored here — resolved from registry or question-library.
 *
 * Capability honesty:
 * - Bind `decisionTypeId` only when a shipped runtime exists (or will exist).
 * - Unbound guided-only slots remain browseable as `unavailable`.
 */
const POPULAR_DECISION_REFS: readonly PopularDecisionRef[] = [
  {
    id: 'job-interview',
    decisionTypeId: 'car-interview',
    guidedQuestionId: 'job-interview',
  },
  { id: 'best-wedding-date', decisionTypeId: 'mar-wedding-date' },
  {
    id: 'launch-business',
    decisionTypeId: 'bus-product-launch',
    guidedQuestionId: 'launch-project',
  },
  {
    id: 'meet-investor',
    decisionTypeId: 'bus-investor-meeting',
    guidedQuestionId: 'meet-investor',
  },
  // Browseable but not Case-executable yet — shown as unavailable.
  { id: 'accept-job-offer', guidedQuestionId: 'negotiate-offer' },
  { id: 'career-change', guidedQuestionId: 'change-career-path' },
  { id: 'promotion', guidedQuestionId: 'ask-promotion' },
  { id: 'salary-negotiation', guidedQuestionId: 'ask-raise' },
  { id: 'invest-money', guidedQuestionId: 'buy-sell-asset' },
  { id: 'partnership', guidedQuestionId: 'close-deal' },
  { id: 'move-abroad', guidedQuestionId: 'relocate-city' },
  { id: 'buy-house', guidedQuestionId: 'buy-sell-property' },
];

function capabilityForDecisionType(
  decisionTypeId: string | undefined
): PopularCapability {
  return isShippedExecutableDecisionType(decisionTypeId)
    ? 'available'
    : 'unavailable';
}

/** Typed mock catalog used only when the registry document is unavailable. */
const MOCK_POPULAR_DECISIONS: readonly PopularDecision[] = [
  {
    id: 'job-interview',
    label: 'Job Interview',
    decisionTypeId: 'car-interview',
    source: 'mock',
    capability: 'available',
  },
  {
    id: 'best-wedding-date',
    label: 'Best Wedding Date',
    decisionTypeId: 'mar-wedding-date',
    source: 'mock',
    capability: 'available',
  },
  {
    id: 'launch-business',
    label: 'Launch Business',
    decisionTypeId: 'bus-product-launch',
    source: 'mock',
    capability: 'available',
  },
  {
    id: 'meet-investor',
    label: 'Meet an investor',
    decisionTypeId: 'bus-investor-meeting',
    source: 'mock',
    capability: 'available',
  },
  {
    id: 'accept-job-offer',
    label: 'Accept Job Offer',
    source: 'mock',
    capability: 'unavailable',
  },
  {
    id: 'career-change',
    label: 'Career Change',
    source: 'mock',
    capability: 'unavailable',
  },
  {
    id: 'promotion',
    label: 'Promotion',
    source: 'mock',
    capability: 'unavailable',
  },
  {
    id: 'salary-negotiation',
    label: 'Salary Negotiation',
    source: 'mock',
    capability: 'unavailable',
  },
  {
    id: 'invest-money',
    label: 'Invest Money',
    source: 'mock',
    capability: 'unavailable',
  },
  {
    id: 'partnership',
    label: 'Partnership',
    source: 'mock',
    capability: 'unavailable',
  },
  {
    id: 'move-abroad',
    label: 'Move Abroad',
    source: 'mock',
    capability: 'unavailable',
  },
  {
    id: 'buy-house',
    label: 'Buy House',
    source: 'mock',
    capability: 'unavailable',
  },
];

/**
 * Consumer labels for popular slots that bind a registry type but have no
 * guided-question locale text. Routing IDs stay on the registry record.
 */
const POPULAR_LABEL_LOCALES: Partial<
  Record<string, Record<AppLang, string>>
> = {
  'best-wedding-date': {
    en: 'Choose wedding date',
    fa: 'انتخاب تاریخ عروسی',
    ar: 'اختيار تاريخ الزفاف',
    ru: 'Выбрать дату свадьбы',
  },
};

function resolveFromRegistry(
  ref: PopularDecisionRef,
  lang: AppLang = 'en'
): PopularDecision | null {
  if (!ref.decisionTypeId) return null;
  const record = getDecisionType(ref.decisionTypeId);
  if (!record) return null;
  const localized = POPULAR_LABEL_LOCALES[ref.id]?.[lang];
  return {
    id: ref.id,
    label: localized ?? record.label,
    decisionTypeId: record.decision_type_id,
    guidedQuestionId: ref.guidedQuestionId,
    familyId: record.family_id,
    source: 'registry',
    capability: capabilityForDecisionType(record.decision_type_id),
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
    capability: capabilityForDecisionType(ref.decisionTypeId),
  };
}

/**
 * Single abstraction for Popular Decisions.
 * Prefers localized question-library labels for consumer display.
 * Registry ids remain for routing; registry English labels are not shown
 * when a guided question provides locale text.
 */
export function listPopularDecisions(lang: AppLang = 'en'): PopularDecision[] {
  if (!hasDecisionTypeRegistry()) {
    return [...MOCK_POPULAR_DECISIONS];
  }

  const resolved: PopularDecision[] = [];
  for (const ref of POPULAR_DECISION_REFS) {
    const fromLibrary = resolveFromQuestionLibrary(ref, lang);
    if (fromLibrary) {
      // Keep registry type id when bound (routing), localized label from library.
      const fromRegistry = resolveFromRegistry(ref, lang);
      const decisionTypeId =
        fromLibrary.decisionTypeId ?? fromRegistry?.decisionTypeId;
      resolved.push({
        ...fromLibrary,
        decisionTypeId,
        familyId: fromRegistry?.familyId ?? fromLibrary.familyId,
        capability: capabilityForDecisionType(decisionTypeId),
      });
      continue;
    }
    const fromRegistry = resolveFromRegistry(ref, lang);
    if (fromRegistry) resolved.push(fromRegistry);
  }
  return resolved;
}

/** Full registry listing for “See All Decisions” with honesty classification. */
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
    capability: capabilityForDecisionType(row.decision_type_id),
  }));
}

/** Exported for tests — curated Popular refs with honesty classification. */
export function classifyPopularDecisionRefs(): ReadonlyArray<{
  id: string;
  decisionTypeId?: string;
  capability: PopularCapability;
}> {
  return POPULAR_DECISION_REFS.map((ref) => ({
    id: ref.id,
    decisionTypeId: ref.decisionTypeId,
    capability: capabilityForDecisionType(ref.decisionTypeId),
  }));
}
