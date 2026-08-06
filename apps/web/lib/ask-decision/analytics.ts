/** Safe Ask DI analytics — no question text, no profile payload. */

import { trackAnalyticsEvent } from '@/lib/ftue-analytics';

export type AskDecisionEventName =
  | 'ask_submitted'
  | 'ask_clarification_shown'
  | 'ask_result_rendered'
  | 'ask_result_failed'
  | 'ask_followup_selected'
  | 'ask_module_opened'
  | 'ask_retry'
  | 'ask_saved';

const ALLOWED = new Set<AskDecisionEventName>([
  'ask_submitted',
  'ask_clarification_shown',
  'ask_result_rendered',
  'ask_result_failed',
  'ask_followup_selected',
  'ask_module_opened',
  'ask_retry',
  'ask_saved',
]);

const FORBIDDEN_KEYS = new Set([
  'question',
  'text',
  'response',
  'message',
  'prompt',
  'birth',
  'profile',
  'payload',
]);

function isForbiddenKey(key: string): boolean {
  // Exact case-insensitive match only — substring matching would falsely
  // strip safe flags such as `used_profile`.
  return FORBIDDEN_KEYS.has(key.toLowerCase());
}

function isSafePrimitive(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'boolean' || typeof value === 'number') return true;
  if (typeof value === 'string') return value.length <= 80;
  return false;
}

/**
 * Track Ask DI events. Strips forbidden property keys.
 * Uses existing analytics queue via a compatible event name when possible.
 */
export function trackAskDecisionEvent(
  event: AskDecisionEventName,
  properties: Record<string, unknown> = {}
): void {
  if (!ALLOWED.has(event)) return;
  const safe: Record<string, unknown> = { ask_di: true, event_name: event };
  for (const [k, v] of Object.entries(sanitizeAskAnalyticsProperties(properties))) {
    safe[k] = v;
  }
  // Map onto existing FTUE analytics channel without inventing a vendor.
  // Store under result/ask funnel using a safe property bag.
  try {
    trackAnalyticsEvent(
      event === 'ask_submitted' ? 'ftue.ask.submitted' : 'ftue.result.view',
      safe
    );
  } catch {
    // Analytics must never break Ask.
  }
}

/** Ensures question/prompt/profile payload fields are never accepted. */
export function sanitizeAskAnalyticsProperties(
  properties: Record<string, unknown>
): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(properties)) {
    if (isForbiddenKey(k)) continue;
    // Drop nested objects/arrays — may carry question/profile-like payloads.
    if (!isSafePrimitive(v)) continue;
    safe[k] = v;
  }
  return safe;
}
