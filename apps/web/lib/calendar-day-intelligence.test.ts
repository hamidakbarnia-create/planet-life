import { describe, expect, it } from 'vitest';
import { extractBatchDayIntelligence } from './calendar-day-intelligence';

describe('extractBatchDayIntelligence', () => {
  it('maps a valid day_intelligence payload', () => {
    const parsed = extractBatchDayIntelligence({
      executive: { score: 82 },
      day_intelligence: {
        final_score: 82,
        day_class: 'mixed',
        conflict: true,
        rating: 'Highly Favorable',
        material_supportive_count: 1,
        material_caution_count: 1,
        basis: 'score_bands+evidence_conflict',
        evidence: [{ factor_key: 'aspect.jupiter.trine.sun' }],
      },
    });
    expect(parsed).toEqual({
      finalScore: 82,
      dayClass: 'mixed',
      conflict: true,
      rating: 'Highly Favorable',
      materialSupportiveCount: 1,
      materialCautionCount: 1,
      basis: 'score_bands+evidence_conflict',
      evidence: [{ factor_key: 'aspect.jupiter.trine.sun' }],
    });
  });

  it('returns null when day_intelligence is missing', () => {
    expect(extractBatchDayIntelligence({ executive: { score: 70 } })).toBeNull();
  });

  it('returns null for an unknown day_class', () => {
    expect(
      extractBatchDayIntelligence({
        day_intelligence: {
          final_score: 70,
          day_class: 'go_now',
          conflict: false,
          rating: 'Favorable',
        },
      })
    ).toBeNull();
  });
});
