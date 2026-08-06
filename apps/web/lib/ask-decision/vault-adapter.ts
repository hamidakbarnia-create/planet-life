/** Vault save adapter — typed payload without prompt/profile/birth data. */

import type { AskDecisionResult } from './types';
import { trackAskDecisionEvent } from './analytics';

export type AskVaultSavePayload = {
  question: string;
  decisionSummary: string;
  recommendation: string;
  recommendationStatus: string;
  scores: {
    opportunity: number;
    risk: number;
    timing: number;
    readiness: number;
    confidence: number;
  };
  actionPlan: {
    now: string[];
    next7Days: string[];
    next30Days: string[];
  };
  generatedAt: string;
  schemaVersion: string;
};

const VAULT_KEY = 'planet-life-ask-decision-saves';

const MAX_QUESTION_CHARS = 500;
const MAX_SUMMARY_CHARS = 800;
const MAX_RECOMMENDATION_CHARS = 500;

export function toAskVaultSavePayload(
  question: string,
  result: AskDecisionResult
): AskVaultSavePayload {
  return {
    question: question.slice(0, MAX_QUESTION_CHARS),
    decisionSummary: result.executiveSummary.slice(0, MAX_SUMMARY_CHARS),
    recommendation: result.recommendation.slice(0, MAX_RECOMMENDATION_CHARS),
    recommendationStatus: result.recommendationStatus,
    scores: {
      opportunity: result.scores.opportunity.value,
      risk: result.scores.risk.value,
      timing: result.scores.timing.value,
      readiness: result.scores.readiness.value,
      confidence: result.scores.confidence.value,
    },
    actionPlan: {
      now: result.actionPlan.now.map((a) => a.action),
      next7Days: result.actionPlan.next7Days.map((a) => a.action),
      next30Days: result.actionPlan.next30Days.map((a) => a.action),
    },
    generatedAt: result.generatedAt,
    schemaVersion: result.schemaVersion,
  };
}

/**
 * Persist a safe Ask briefing snapshot in localStorage only.
 *
 * - Key: `planet-life-ask-decision-saves`
 * - Max 40 records
 * - Stores the user question (truncated) and structured summary fields
 * - Does not persist raw birth data or provider prompt text
 * - Not integrated with the canonical backend Vault
 */
export function saveAskDecisionToVault(
  question: string,
  result: AskDecisionResult
): AskVaultSavePayload | null {
  if (typeof window === 'undefined') return null;
  const payload = toAskVaultSavePayload(question, result);
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    const list: AskVaultSavePayload[] = raw
      ? (JSON.parse(raw) as AskVaultSavePayload[])
      : [];
    const next = [payload, ...(Array.isArray(list) ? list : [])].slice(0, 40);
    localStorage.setItem(VAULT_KEY, JSON.stringify(next));
    trackAskDecisionEvent('ask_saved', {
      status: result.recommendationStatus,
      schema: result.schemaVersion,
    });
    return payload;
  } catch {
    return null;
  }
}
