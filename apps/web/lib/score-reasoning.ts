/**
 * Frontend-safe adapter for API score reasoning.
 * UI should consume ScoreReasoning — not raw API reasoning payloads.
 */

export type ReasonEvidence = Record<string, unknown>;

export type ReasonImportance = 'high' | 'medium' | 'low' | string;

export interface ScoreReason {
  category: string;
  planet?: string | null;
  importance: ReasonImportance;
  score: number;
  title: string;
  explanation: string;
  evidence: ReasonEvidence;
}

export interface ScoreReasoning {
  summary: string;
  confidence: number;
  reasons: ScoreReason[];
}

interface RawScoreReason {
  category?: unknown;
  planet?: unknown;
  importance?: unknown;
  score?: unknown;
  title?: unknown;
  explanation?: unknown;
  evidence?: unknown;
}

interface RawScoreReasoning {
  summary?: unknown;
  confidence?: unknown;
  reasons?: unknown;
}

function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

function warnDev(message: string): void {
  if (isDev()) {
    console.warn(`[ScoreReasoning] ${message}`);
  }
}

function readString(value: unknown, field: string): string | null {
  if (typeof value !== 'string' || value.trim() === '') {
    warnDev(`Invalid or missing string field: ${field}`);
    return null;
  }
  return value;
}

function readNumber(value: unknown, field: string): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    warnDev(`Invalid or missing numeric field: ${field}`);
    return null;
  }
  return value;
}

function readConfidence(value: unknown): number | null {
  const confidence = readNumber(value, 'confidence');
  if (confidence == null) return null;
  if (confidence < 0 || confidence > 1) {
    warnDev(`confidence out of range: ${confidence}`);
    return null;
  }
  return confidence;
}

function readEvidence(value: unknown): ReasonEvidence | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    warnDev('Invalid or missing evidence object');
    return null;
  }
  return value as ReasonEvidence;
}

function mapScoreReason(raw: unknown, index: number): ScoreReason | null {
  if (raw == null || typeof raw !== 'object') {
    warnDev(`reason[${index}] is not an object`);
    return null;
  }

  const src = raw as RawScoreReason;
  const category = readString(src.category, `reason[${index}].category`);
  const importance = readString(src.importance, `reason[${index}].importance`);
  const score = readNumber(src.score, `reason[${index}].score`);
  const title = readString(src.title, `reason[${index}].title`);
  const explanation = readString(src.explanation, `reason[${index}].explanation`);
  const evidence = readEvidence(src.evidence);

  if (
    category == null ||
    importance == null ||
    score == null ||
    title == null ||
    explanation == null ||
    evidence == null
  ) {
    return null;
  }

  if (src.planet != null && typeof src.planet !== 'string') {
    warnDev(`reason[${index}].planet must be a string when provided`);
    return null;
  }

  const planet = typeof src.planet === 'string' ? src.planet : null;

  return {
    category,
    planet,
    importance,
    score,
    title,
    explanation,
    evidence,
  };
}

/**
 * Map raw API reasoning to ScoreReasoning.
 * Returns null when missing or invalid — never throws in production UI path.
 */
export function mapScoreReasoning(raw: unknown): ScoreReasoning | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }

  const src = raw as RawScoreReasoning;
  const summary = readString(src.summary, 'summary');
  const confidence = readConfidence(src.confidence);

  if (!Array.isArray(src.reasons)) {
    warnDev('reasons must be an array');
    return null;
  }

  if (summary == null || confidence == null) {
    return null;
  }

  const reasons: ScoreReason[] = [];
  for (let i = 0; i < src.reasons.length; i += 1) {
    const reason = mapScoreReason(src.reasons[i], i);
    if (reason == null) {
      warnDev(`reason[${i}] failed validation`);
      return null;
    }
    reasons.push(reason);
  }

  return {
    summary,
    confidence,
    reasons,
  };
}

/** Extract reasoning from a full analyze API payload. */
export function extractAnalyzeReasoning(data: unknown): ScoreReasoning | null {
  if (data == null || typeof data !== 'object') return null;
  return mapScoreReasoning((data as { reasoning?: unknown }).reasoning);
}

/** Extract reasoning from a calendar batch-day entry payload. */
export function extractBatchDayReasoning(entry: unknown): ScoreReasoning | null {
  return extractAnalyzeReasoning(entry);
}

/** Calendar month fetch bundle — reasoning per day when available. */
export interface MonthReasoningResult {
  reasoning: Record<string, ScoreReasoning | null>;
}
