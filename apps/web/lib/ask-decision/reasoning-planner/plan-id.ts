/**
 * Content-derived planId strategy (v1):
 * planId = `rp_v1_` + FNV-1a-32 hex of a canonical JSON payload covering:
 * primaryIntent, secondaryIntents, templateId, dimension list, missingContext,
 * clarificationRecommended, confidence (rounded), templateVersion.
 *
 * Identical inputs ⇒ identical planId. No wall-clock component.
 */

export function derivePlanId(payload: {
  primaryIntent: string;
  secondaryIntents: string[];
  templateId: string;
  dimensions: string[];
  missingContext: string[];
  clarificationRecommended: boolean;
  confidence: number;
  templateVersion: string;
}): string {
  const canonical = JSON.stringify({
    v: payload.templateVersion,
    i: payload.primaryIntent,
    s: payload.secondaryIntents,
    t: payload.templateId,
    d: payload.dimensions,
    m: payload.missingContext,
    c: payload.clarificationRecommended,
    f: payload.confidence,
  });
  return `rp_v1_${fnv1aHex(canonical)}`;
}

function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
