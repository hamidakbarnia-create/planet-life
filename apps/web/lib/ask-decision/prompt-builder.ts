/** Canonical Ask Decision Intelligence prompt builder (Conversation API content only). */

import type { ConversationMessage } from '@/lib/conversation-client';
import type {
  AskContextSnapshot,
  DecisionFrame,
  IntentDetection,
} from './types';
import { ASK_DECISION_SCHEMA_VERSION } from './types';
import { buildDecisionInstructions } from './prompt-context/decision-instructions';
import type { RiskDomain } from './intent-templates';

export type BuildAskDecisionPromptInput = {
  question: string;
  intent: IntentDetection;
  frame: DecisionFrame;
  context: AskContextSnapshot;
  clarificationAnswer?: string | null;
  /**
   * Optional compact SerializedDecisionPromptContext JSON (already validated).
   * When present, appends DECISION_CONTEXT_JSON + DECISION_INSTRUCTIONS
   * and omits the legacy USER QUESTION block (question lives in JSON only).
   */
  structuredPromptContextJson?: string | null;
  /** Risk domains from ReasoningPlan — only relevant domain rules are added. */
  structuredRiskDomains?: readonly RiskDomain[];
};

function buildResponseSchemaBlock(): string {
  return [
    '{',
    `  "schemaVersion": "${ASK_DECISION_SCHEMA_VERSION}",`,
    '  "executiveSummary": "string (~90 words max)",',
    '  "recommendation": "string",',
    '  "recommendationStatus": "proceed|proceed-with-caution|wait|gather-more-information|avoid-for-now|neutral",',
    '  "scores": {',
    '    "opportunity": {"value":0-100,"rationale":"..."},',
    '    "risk": {"value":0-100,"rationale":"..."},',
    '    "timing": {"value":0-100,"rationale":"..."},',
    '    "readiness": {"value":0-100,"rationale":"..."},',
    '    "confidence": {"value":0-100,"rationale":"..."}',
    '  },',
    '  "analysis": [{"id":"situation|factors|opportunities|risks|tradeoffs|personal-fit|what-could-change|why","title":"...","body":"..."}],',
    '  "scenarios": {',
    '    "bestCase": {"outcome":"...","likelihoodBand":"low|medium|high|uncertain","keyConditions":[],"earlySignals":[],"mitigation":"..."},',
    '    "mostLikely": {...},',
    '    "downsideCase": {...}',
    '  },',
    '  "actionPlan": {',
    '    "now": [{"action":"...","purpose":"...","priority":"critical|high|medium|low","completionSignal":"..."}],',
    '    "next7Days": [...],',
    '    "next30Days": [...]',
    '  },',
    '  "alternatives": [{"option":"...","bestFor":"...","advantages":[],"disadvantages":[],"risk":"...","timingFit":"...","recommendationFit":"..."}],',
    '  "assumptions": ["..."],',
    '  "confidence": {"level":"low|medium|high","score":0-100,"explanation":"...","missingInputs":[],"limitingFactors":[]},',
    '  "limitations": ["..."],',
    '  "relatedModules": [{"module":"pathfinder|calendar|today|people|julia|vault|profile","reason":"...","actionLabel":"..."}],',
    '  "followUpQuestions": ["...","...","..."],',
    '  "safetyNotice": "string|null"',
    '}',
  ].join('\n');
}

const QUESTION_REF = '(see DECISION_CONTEXT_JSON.question)';

/** Remove exact question string copies from frame fields in structured mode. */
function scrubExactQuestion(value: string, question: string): string {
  const q = question.trim();
  if (!q) return value;
  if (value.trim() === q) return QUESTION_REF;
  if (!value.includes(q)) return value;
  return value.split(q).join(QUESTION_REF);
}

/**
 * In structured mode the authoritative question is DECISION_CONTEXT_JSON.question.
 * Avoid repeating the exact question string in DECISION FRAME.
 */
function framePayloadForPrompt(
  frame: DecisionFrame,
  question: string,
  structured: boolean
): Record<string, unknown> {
  const scrub = (value: string) =>
    structured ? scrubExactQuestion(value, question) : value;

  return {
    decisionStatement: scrub(frame.decisionStatement),
    objective: scrub(frame.objective),
    mainConcern: scrub(frame.mainConcern),
    options: frame.options.map((o) => scrub(o)),
    urgency: frame.urgency,
    timeHorizon: frame.timeHorizon,
    reversibility: scrub(frame.reversibility),
    unknowns: frame.unknowns.map((u) => scrub(u)),
    assumptions: frame.assumptions.map((a) => scrub(a)),
  };
}

export function buildAskDecisionPrompt(
  input: BuildAskDecisionPromptInput
): ConversationMessage[] {
  const {
    question,
    intent,
    frame,
    context,
    clarificationAnswer,
    structuredPromptContextJson,
    structuredRiskDomains,
  } = input;

  const schema = buildResponseSchemaBlock();
  const structuredJson = structuredPromptContextJson?.trim() || null;
  const structured = Boolean(structuredJson);

  const questionBlock = structured
    ? // Structured mode: question authority is DECISION_CONTEXT_JSON.question only.
      clarificationAnswer
      ? [`CLARIFICATION ANSWER: ${clarificationAnswer}`, '']
      : []
    : // Legacy mode: preserve USER QUESTION block exactly.
      [
        'USER QUESTION:',
        question,
        clarificationAnswer
          ? `CLARIFICATION ANSWER: ${clarificationAnswer}`
          : null,
        '',
      ];

  const content = [
    'You are METIORO Decision Intelligence for Ask.',
    'Return ONE JSON object only (no markdown prose outside JSON).',
    'No motivational writing. No mystical language. No deterministic predictions. No certainty claims.',
    'No medical diagnosis. No legal conclusions. No investment instructions. No guaranteed outcomes.',
    'Be concise, practical, and decision-focused.',
    '',
    ...questionBlock,
    'INTENT:',
    JSON.stringify({
      primary: intent.primaryIntent,
      secondary: intent.secondaryIntent,
      highStakes: intent.highStakesFlag,
      timingRelevant: intent.timingRelevant,
      peopleRelevant: intent.peopleRelevant,
      financialImpactLikely: intent.financialImpactLikely,
    }),
    '',
    'DECISION FRAME:',
    JSON.stringify(framePayloadForPrompt(frame, question, structured)),
    '',
    'PERSONAL INTELLIGENCE CONTEXT (token-efficient, no raw birth data):',
    context.intelligenceLine || 'unavailable — proceed with general decision intelligence',
    context.energyNote ? `Energy: ${context.energyNote}` : null,
    `Locale: ${context.locale}`,
    `Current date: ${context.currentDate}`,
    context.missingInputs.length
      ? `Missing inputs: ${context.missingInputs.join(', ')}`
      : null,
    '',
    structuredJson
      ? [
          'DECISION_CONTEXT_JSON:',
          structuredJson,
          '',
          buildDecisionInstructions({
            riskDomains: structuredRiskDomains ?? [],
          }),
          '',
        ].join('\n')
      : null,
    'RESPONSE SCHEMA:',
    schema,
    '',
    'REQUIREMENTS:',
    '- Always include scores 0–100 with rationales.',
    '- Always include now / next7Days / next30Days actions (max 3 each), specific and concrete.',
    '- Always include 3 follow-up questions.',
    '- Max 3 relatedModules; only when relevant.',
    '- If high-stakes (health/legal/investment), set a concise safetyNotice.',
    '- Personal Fit must use intelligence context without exposing raw profile fields.',
    '- Do not invent options the user did not imply; alternatives may be empty.',
  ]
    .filter((line) => line != null)
    .join('\n');

  return [{ role: 'user', content }];
}

/** @deprecated use buildAskDecisionPrompt */
export function buildAskSynthesisMessages(
  decisionText: string,
  _category?: unknown,
  _answers?: unknown
): ConversationMessage[] {
  void _category;
  void _answers;
  return buildAskDecisionPrompt({
    question: decisionText,
    intent: {
      primaryIntent: 'general',
      secondaryIntent: null,
      confidence: 40,
      rationale: 'Legacy prompt path',
      detectedEntities: [],
      decisionPresent: true,
      timingRelevant: false,
      peopleRelevant: false,
      financialImpactLikely: false,
      highStakesFlag: false,
    },
    frame: {
      originalQuestion: decisionText,
      decisionStatement: decisionText,
      decisionType: 'general',
      objective: 'Resolve the decision',
      mainConcern: 'Unknown',
      options: [],
      urgency: 'moderate',
      timeHorizon: 'unknown',
      reversibility: 'Unknown',
      affectedAreas: ['general'],
      unknowns: [],
      assumptions: [],
      requiresClarification: false,
    },
    context: {
      currentDate: new Date().toISOString().slice(0, 10),
      locale: 'en',
      intelligenceLine: null,
      decisionStyles: [],
      energyNote: null,
      usedProfile: false,
      timingAvailable: false,
      missingInputs: [],
    },
  });
}
