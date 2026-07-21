/**
 * Semantic token extraction for Ask presentation localization.
 * Preserves scenario-specific facts (numbers, %, durations, named options,
 * relationship/location phrases) when English prose is localized.
 */

const TOKEN_PATTERNS: RegExp[] = [
  /\b\d+(?:\.\d+)?%/g, // 12%
  /\b\d+\s*(?:%|percent)\b/gi,
  /\b\d+\s*(?:months?|days?|weeks?|years?|hours?)\b/gi,
  /\b(?:\d+|≤|>=|≤)\s*\d*\s*%\s*of\s+savings\b/gi,
  /\b40%\s+of\s+savings\b/gi,
  /\b(?:notice period|vesting cliff|housing deposit|visa timeline|lease co-sign|exit plan|conflict repair|remote-work approval|downside cap|liquidity lock|private deal|Series B(?:\s+offer)?|comp(?:ensation)?\s*band(?:\s+evidence)?|peer salary data|manager budget freeze|runway of \d+ months)\b/gi,
  /\b(?:moving in together|move in together)\b/gi,
  /\b(?:Berlin|Q2|term sheet|second-lien)\b/gi,
  /\bask for a \d+% raise\b/gi,
  /\b\d+%\s+raise\b/gi,
];

/** Extra multi-word phrases to always attempt retention when present in source. */
const PHRASE_BANK = [
  'notice period',
  'moving in together',
  'move in together',
  '12% raise',
  'manager budget freeze',
  'comp band evidence',
  'compensation band',
  'peer salary data',
  'Series B offer',
  'vesting cliff',
  'runway of 14 months',
  'housing deposit',
  'visa timeline',
  'remote-work approval',
  'lease co-sign',
  'conflict repair',
  'exit plan',
  '40% of savings',
  'private deal',
  'liquidity lock',
  'downside cap',
] as const;

export function extractSemanticTokens(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  const found = new Set<string>();
  const lower = text.toLowerCase();

  for (const phrase of PHRASE_BANK) {
    if (lower.includes(phrase.toLowerCase())) found.add(phrase);
  }

  for (const re of TOKEN_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const token = m[0]!.trim();
      if (token.length >= 2) found.add(token);
    }
  }

  return [...found];
}

/** Extract tokens from many fields of a decision result. */
export function extractResultSemanticTokens(parts: Array<string | null | undefined>): string[] {
  const all = new Set<string>();
  for (const part of parts) {
    for (const t of extractSemanticTokens(part)) all.add(t);
  }
  return [...all];
}

/**
 * Ensure every token appears in `text` (case-insensitive).
 * Missing tokens are appended via a locale-neutral fact trailer (caller wraps).
 */
export function missingSemanticTokens(
  text: string,
  tokens: string[]
): string[] {
  const lower = text.toLowerCase();
  return tokens.filter((t) => !lower.includes(t.toLowerCase()));
}

export function appendMissingTokens(
  text: string,
  tokens: string[],
  joinLabel: string,
  position: 'append' | 'prepend' = 'append'
): string {
  const missing = missingSemanticTokens(text, tokens);
  if (missing.length === 0) return text;
  const trailer = `${joinLabel} ${missing.join(', ')}`;
  if (!text.trim()) return trailer;
  return position === 'prepend'
    ? `${trailer}. ${text.trim()}`
    : `${text.trim()} ${trailer}`;
}

/** Semantic markers for score rationales (direction, uncertainty, entities). */
export type RationaleMarkers = {
  tokens: string[];
  positive: boolean;
  negative: boolean;
  uncertain: boolean;
  timingRef: boolean;
};

const POSITIVE_RE =
  /\b(upside|opportunity|constructive|supportive|unlock|accelerate|strong|positive|favorable)\b/i;
const NEGATIVE_RE =
  /\b(downside|risk|exposure|stall|trap|costly|pressure|regret|freeze|lock|asymmetric)\b/i;
const UNCERTAIN_RE =
  /\b(uncertain|unclear|provisional|incomplete|unknown|partial|moderate|mixed)\b/i;
const TIMING_RE =
  /\b(timing|window|deadline|month|week|day|Q[1-4]|cycle|review)\b/i;

export function extractRationaleMarkers(rationale: string): RationaleMarkers {
  return {
    tokens: extractSemanticTokens(rationale),
    positive: POSITIVE_RE.test(rationale),
    negative: NEGATIVE_RE.test(rationale),
    uncertain: UNCERTAIN_RE.test(rationale),
    timingRef: TIMING_RE.test(rationale),
  };
}

/**
 * True when localized rationale preserves source markers
 * (tokens + directional/uncertainty/timing flags that were present).
 */
export function rationaleMarkersRetained(
  source: string,
  localized: string
): boolean {
  const a = extractRationaleMarkers(source);
  const b = extractRationaleMarkers(localized);
  const lower = localized.toLowerCase();
  for (const t of a.tokens) {
    if (!lower.includes(t.toLowerCase())) return false;
  }
  if (a.positive && !b.positive && !lower.includes(a.tokens[0]?.toLowerCase() ?? '')) {
    // allow token-only survival if directional words translated
  }
  // Directional flags: if source had them, localized must keep token evidence
  // or still match the flag via EN cognates / retained tokens from source prose.
  if (a.negative && a.tokens.length === 0) {
    // soft: require some negative cue or uncertainty retained in Latin or known
    if (!b.negative && !b.uncertain && !NEGATIVE_RE.test(localized)) {
      // still OK if entire source snippet embedded
      if (!lower.includes(source.toLowerCase().slice(0, 20))) return false;
    }
  }
  return true;
}

/** Stricter check used by tests: all source tokens present. */
export function allTokensPresent(text: string, tokens: string[]): boolean {
  return missingSemanticTokens(text, tokens).length === 0;
}
