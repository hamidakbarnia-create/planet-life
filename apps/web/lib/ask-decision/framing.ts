/** Decision framing V3 — convert questions into typed DecisionFrame. */

import type {
  AskIntent,
  DecisionFrame,
  IntentDetection,
  TimeHorizon,
  UrgencyLevel,
} from './types';

function detectTimeHorizon(text: string): TimeHorizon {
  if (/\b(today|tonight|asap|immediately|right now)\b/i.test(text)) return 'today';
  if (/\b(this week|next few days|by friday)\b/i.test(text)) return 'days';
  if (/\b(this month|next (few )?weeks)\b/i.test(text)) return 'weeks';
  if (/\b(this quarter|next (few )?months|90 days)\b/i.test(text)) return 'months';
  if (/\b(this year|long[- ]term|eventually)\b/i.test(text)) return 'long-term';
  return 'unknown';
}

function detectUrgency(text: string, horizon: TimeHorizon): UrgencyLevel {
  if (/\b(asap|urgent|immediately|right now|today)\b/i.test(text) || horizon === 'today') {
    return 'immediate';
  }
  if (horizon === 'days' || /\b(this week|soon)\b/i.test(text)) return 'high';
  if (horizon === 'weeks' || horizon === 'months') return 'moderate';
  if (horizon === 'unknown') return 'moderate';
  return 'low';
}

function inferOptions(text: string): string[] {
  const vs = text
    .split(/\s+vs\.?\s+|\s+versus\s+/i)
    .map((s) => s.trim().replace(/[?!.]+$/g, ''))
    .filter(Boolean);
  if (vs.length >= 2 && vs.length <= 3) {
    return vs.slice(0, 3).map((o) => o.slice(0, 80));
  }
  const orParts = text.split(/\s+or\s+/i).map((s) => s.trim()).filter(Boolean);
  if (
    orParts.length === 2 &&
    orParts.every((p) => p.split(/\s+/).length <= 5 && p.length <= 50)
  ) {
    return orParts.map((p) => p.replace(/[?!.]+$/g, '').slice(0, 80));
  }
  if (/\bstay\b/i.test(text) && /\b(leave|move|go)\b/i.test(text)) {
    return ['Stay', 'Leave / move'];
  }
  if (/\baccept\b/i.test(text) && /\b(wait|decline|reject)\b/i.test(text)) {
    return ['Accept', 'Wait / decline'];
  }
  // Do not invent options the user did not imply
  return [];
}

function subjectMissing(text: string): boolean {
  const vague =
    /^(should i accept it\??|is this the right time\??|what should i do\??|should i wait\??)$/i;
  if (vague.test(text.trim())) return true;
  if (
    /\b(accept it|do it|this|that)\b/i.test(text) &&
    !/\b(job|offer|launch|role|contract|move|partner|salary|business)\b/i.test(text)
  ) {
    return true;
  }
  return false;
}

export function frameDecision(
  question: string,
  intent: IntentDetection
): DecisionFrame {
  const text = question.trim() || 'Untitled decision';
  const timeHorizon = detectTimeHorizon(text);
  const urgency = detectUrgency(text, timeHorizon);
  const options = inferOptions(text);
  const unknowns: string[] = [];
  const assumptions: string[] = [];

  if (timeHorizon === 'unknown') {
    unknowns.push('Time horizon not stated');
    assumptions.push('Treating timing as flexible unless clarified');
  }
  if (options.length === 0) {
    unknowns.push('Explicit options not stated');
    assumptions.push('Framing as a proceed / wait / gather-information decision');
  }
  if (!intent.decisionPresent) {
    unknowns.push('Decision verb unclear');
    assumptions.push('Interpreting the question as a decision-support request');
  }

  const objective = /^how (can|do|should) i\b/i.test(text)
    ? `Improve outcomes related to: ${text.replace(/^how (can|do|should) i\s+/i, '').slice(0, 120)}`
    : /^should i\b/i.test(text)
      ? `Resolve whether to proceed: ${text.replace(/^should i\s+/i, '').slice(0, 120)}`
      : `Identify the highest-leverage next move for the stated question`;

  const mainConcern = /\b(afraid|worry|risk|downside|regret|fail)\b/i.test(text)
    ? 'Stated concern around downside or regret'
    : intent.financialImpactLikely
      ? 'Financial or resource exposure (inferred)'
      : intent.peopleRelevant
        ? 'People impact (inferred)'
        : 'Primary concern not fully stated';

  if (/Primary concern not fully stated|inferred/i.test(mainConcern)) {
    unknowns.push('Main concern not fully stated');
  }

  const requiresClarification =
    subjectMissing(text) ||
    (options.length === 0 &&
      /^(what should i do|help me decide|advise me)\b/i.test(text.trim()));

  const decisionStatement =
    text.length <= 160 ? text : `${text.slice(0, 157)}…`;

  const affectedAreas: string[] = [intent.primaryIntent];
  if (intent.secondaryIntent) affectedAreas.push(intent.secondaryIntent);
  if (intent.peopleRelevant && !affectedAreas.includes('relationship')) {
    affectedAreas.push('relationship');
  }

  return {
    originalQuestion: text,
    decisionStatement,
    decisionType: intent.primaryIntent,
    objective,
    mainConcern,
    options,
    urgency,
    timeHorizon,
    reversibility: /\b(permanent|irreversible)\b/i.test(text)
      ? 'Low — language suggests hard-to-reverse outcomes'
      : /\b(trial|pilot|temporary|reversible)\b/i.test(text)
        ? 'High — reversible or trial framing present'
        : 'Unknown — reversibility not stated',
    affectedAreas: [...new Set(affectedAreas)],
    unknowns,
    assumptions,
    requiresClarification,
  };
}

/** @deprecated */
export function urgencyFromFrame(frame: DecisionFrame): string {
  return frame.urgency;
}

export function intentLabel(intent: AskIntent): string {
  return intent.charAt(0).toUpperCase() + intent.slice(1);
}
