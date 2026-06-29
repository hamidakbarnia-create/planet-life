import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  extractAnalyzeReasoning,
  extractBatchDayReasoning,
  mapScoreReasoning,
  type ScoreReasoning,
} from './score-reasoning';

const VALID_REASONING: ScoreReasoning = {
  summary: 'Business Launch scores 63/100 (Favorable).',
  confidence: 0.82,
  reasons: [
    {
      category: 'aspect',
      planet: 'Jupiter',
      importance: 'high',
      score: 5.5,
      title: 'Transit Jupiter trine natal Sun',
      explanation: 'Supportive transit aspect.',
      evidence: {
        transit_planet: 'jupiter',
        natal_planet: 'sun',
        aspect: 'trine',
        orb: 1.2,
      },
    },
  ],
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('mapScoreReasoning', () => {
  it('maps valid reasoning correctly', () => {
    const result = mapScoreReasoning(VALID_REASONING);
    expect(result).toEqual(VALID_REASONING);
    expect(result?.reasons[0].evidence.aspect).toBe('trine');
  });

  it('returns null when reasoning is missing', () => {
    expect(mapScoreReasoning(undefined)).toBeNull();
    expect(mapScoreReasoning(null)).toBeNull();
    expect(extractAnalyzeReasoning({})).toBeNull();
  });

  it('returns null when confidence is invalid', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(
      mapScoreReasoning({
        ...VALID_REASONING,
        confidence: 1.5,
      })
    ).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('returns null when a reason is missing evidence', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const invalid = {
      ...VALID_REASONING,
      reasons: [
        {
          ...VALID_REASONING.reasons[0],
          evidence: null,
        },
      ],
    };
    expect(mapScoreReasoning(invalid)).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('does not throw for malformed raw input', () => {
    expect(mapScoreReasoning([])).toBeNull();
    expect(mapScoreReasoning({ summary: 123 })).toBeNull();
  });
});

describe('extractAnalyzeReasoning', () => {
  it('extracts reasoning from analyze payload', () => {
    const data = {
      executive: { score: 63 },
      reasoning: VALID_REASONING,
    };
    const reasoning = extractAnalyzeReasoning(data);
    expect(reasoning?.summary).toBe(VALID_REASONING.summary);
    expect(reasoning?.confidence).toBe(0.82);
  });
});

describe('extractBatchDayReasoning', () => {
  it('extracts reasoning from batch day entry', () => {
    const entry = {
      executive: { score: 70 },
      strategic: { score: 70 },
      reasoning: VALID_REASONING,
    };
    const reasoning = extractBatchDayReasoning(entry);
    expect(reasoning?.reasons).toHaveLength(1);
    expect(reasoning?.reasons[0].category).toBe('aspect');
  });
});
