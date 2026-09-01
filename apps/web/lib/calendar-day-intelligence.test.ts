import { describe, expect, it } from 'vitest';

import {
  extractBatchDayIntelligence,
  shadowClassifierVersion,
  shadowDayClass,
  shadowSemanticStatus,
} from './calendar-day-intelligence';

const BATCH_DAY = {
  executive: { score: 72 },
  day_intelligence: {
    final_score: 72,
    action_type: 'business_launch',
    day_class: 'supportive',
    conflict: false,
    rating: 'Favorable',
    material_supportive_count: 2,
    material_caution_count: 0,
    basis: 'score_bands+evidence_conflict',
    evidence: [{ evidence_id: 'ev.aspect.jupiter.trine.sun', kind: 'aspect' }],
    dominant_aspects: [{ transit_planet: 'jupiter', aspect: 'trine' }],
    scoring_context: { location_mode: 'currentLiving' },
    dimensions: {
      mapping_version: 'dimensions.v1-shadow',
      semantic_status: 'experimental_shadow',
      opportunity: { value: 70, status: 'scored' },
    },
    dimension_classification: {
      day_class: 'action',
      semantic_status: 'experimental_shadow',
      classifier_version: 'dimension_class.v3-shadow',
      classification_coverage: 0.2571,
    },
  },
};

describe('extractBatchDayIntelligence', () => {
  it('preserves Phase 2A class plus v3 shadow metadata and dimensions', () => {
    const extracted = extractBatchDayIntelligence(BATCH_DAY);
    expect(extracted).not.toBeNull();
    expect(extracted?.dayClass).toBe('supportive');
    expect(extracted?.finalScore).toBe(72);
    expect(extracted?.dimensions?.mapping_version).toBe('dimensions.v1-shadow');
    expect(extracted?.dimensionClassification?.classifier_version).toBe(
      'dimension_class.v3-shadow'
    );
    expect(extracted?.dimensionClassification?.semantic_status).toBe(
      'experimental_shadow'
    );
    expect(extracted?.dimensionClassification?.day_class).toBe('action');
    expect(shadowClassifierVersion(extracted)).toBe('dimension_class.v3-shadow');
    expect(shadowSemanticStatus(extracted)).toBe('experimental_shadow');
    expect(shadowDayClass(extracted)).toBe('action');
    expect(extracted?.evidence[0]?.evidence_id).toBe(
      'ev.aspect.jupiter.trine.sun'
    );
  });

  it('returns null when day_intelligence is absent', () => {
    expect(extractBatchDayIntelligence({ executive: { score: 50 } })).toBeNull();
  });
});
