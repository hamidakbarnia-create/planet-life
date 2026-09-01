import { describe, expect, it } from 'vitest';

import {
  buildDayIntelligenceView,
  legacySemanticDisagree,
} from './day-intelligence-view';
import { PREVIEW_MATRIX } from './preview-fixtures';
import type { SemanticExplanationInput } from './types';

const THREE_SUPPORTS = [
  'semantic.high_momentum',
  'semantic.high_opportunity',
  'semantic.high_stability',
] as const;
const THREE_CAUTIONS = [
  'semantic.low_clarity',
  'semantic.high_pressure',
  'semantic.low_cooperation',
] as const;

function withSignals(
  base: SemanticExplanationInput,
  extra: Partial<SemanticExplanationInput> = {}
): SemanticExplanationInput {
  return {
    ...base,
    support_codes: extra.support_codes ?? [...THREE_SUPPORTS],
    caution_codes: extra.caution_codes ?? [...THREE_CAUTIONS],
    ...extra,
  };
}

describe('legacySemanticDisagree', () => {
  it('treats proceed + selective as aligned', () => {
    expect(legacySemanticDisagree('proceed', 'selective')).toBe(false);
    expect(legacySemanticDisagree('proceed_with_conditions', 'selective')).toBe(
      false
    );
  });

  it('flags material stance/posture conflicts', () => {
    expect(legacySemanticDisagree('proceed', 'review')).toBe(true);
    expect(legacySemanticDisagree('proceed', 'insufficient')).toBe(true);
    expect(legacySemanticDisagree('wait', 'action')).toBe(true);
    expect(legacySemanticDisagree('insufficient_data', 'action')).toBe(true);
  });
});

describe('buildDayIntelligenceView', () => {
  it('caps supports and cautions at two in explanation order', () => {
    const view = buildDayIntelligenceView({
      explanation: withSignals(PREVIEW_MATRIX.strongAction),
      locale: 'en',
      score: 80,
      posture: 'action',
    });
    expect(view?.supports).toEqual([
      'Momentum is stronger.',
      'Opportunity conditions are stronger.',
    ]);
    expect(view?.cautions).toEqual([
      'Information quality or decision clarity is weaker.',
      'Pressure is higher.',
    ]);
    expect(view?.supports).toHaveLength(2);
    expect(view?.cautions).toHaveLength(2);
  });

  it('drops interpretation when it repeats the headline', () => {
    const review = buildDayIntelligenceView({
      explanation: PREVIEW_MATRIX.review,
      locale: 'en',
      score: 70,
      posture: 'review',
    });
    expect(review?.headline).toBe(
      'Better suited to review and refinement than a major push.'
    );
    expect(review?.interpretation).toBeNull();

    const action = buildDayIntelligenceView({
      explanation: PREVIEW_MATRIX.strongAction,
      locale: 'en',
      score: 80,
      posture: 'action',
    });
    expect(action?.headline).toBe(
      'Strong timing with supportive execution conditions.'
    );
    expect(action?.interpretation).toBe('Conditions support moving forward.');
  });

  it('strips supports and cautions for insufficient', () => {
    const view = buildDayIntelligenceView({
      explanation: withSignals(PREVIEW_MATRIX.insufficient),
      locale: 'en',
      score: 70,
      posture: 'insufficient',
    });
    expect(view?.insufficient).toBe(true);
    expect(view?.headline).toBe(
      'Not enough evidence for a reliable decision posture.'
    );
    expect(view?.supports).toEqual([]);
    expect(view?.cautions).toEqual([]);
    expect(view?.timingStrengthValue).toBe('70 / 100');
  });

  it('presents mixed as conflict, not uniformly bad', () => {
    const view = buildDayIntelligenceView({
      explanation: PREVIEW_MATRIX.mixed,
      locale: 'en',
      score: 70,
      posture: 'mixed',
    });
    expect(view?.mixed).toBe(true);
    expect(view?.conditionsKind).toBe('mixed');
    expect(view?.conditionsLabel).toBe('Mixed');
    expect(view?.bridge).toMatch(/timing strength/i);
    expect(view?.headline).toBe(
      'Signals conflict. This day is not uniformly favorable or unfavorable.'
    );
    expect(view?.headline.toLowerCase()).not.toMatch(
      /bad day|danger|unfavorable day/
    );
  });

  it('formats score as strength, not probability', () => {
    const view = buildDayIntelligenceView({
      explanation: PREVIEW_MATRIX.strongSelective,
      locale: 'en',
      score: 81,
      posture: 'selective',
    });
    expect(view?.timingStrengthLabel).toBe('Timing strength');
    expect(view?.timingStrengthValue).toBe('81 / 100');
    expect(view?.timingStrengthValue).not.toContain('%');
    expect(view?.interpretation).toBeNull();

    const faView = buildDayIntelligenceView({
      explanation: PREVIEW_MATRIX.strongSelective,
      locale: 'fa',
      score: 81,
      posture: 'selective',
    });
    expect(faView?.headline).toBe(
      'فرصت قوی است، اما گزینشی عمل کنید.'
    );
    expect(faView?.interpretation).toBeNull();
  });

  it('uses Decision conditions when legacy stance disagrees', () => {
    const aligned = buildDayIntelligenceView({
      explanation: PREVIEW_MATRIX.strongSelective,
      locale: 'en',
      score: 81,
      stance: 'proceed',
      posture: 'selective',
    });
    expect(aligned?.titleKind).toBe('intelligence');
    expect(aligned?.title).toBe('Decision Intelligence — Beta');

    const disagree = buildDayIntelligenceView({
      explanation: PREVIEW_MATRIX.review,
      locale: 'en',
      score: 70,
      stance: 'proceed',
      posture: 'review',
    });
    expect(disagree?.titleKind).toBe('conditions');
    expect(disagree?.title).toBe('Decision conditions');
  });

  it('keeps elevated without safety and high_stakes with renderer safety', () => {
    const elevated = buildDayIntelligenceView({
      explanation: PREVIEW_MATRIX.elevatedInterview,
      locale: 'en',
      score: 80,
      posture: 'action',
    });
    expect(elevated?.safety).toEqual([]);

    const high = buildDayIntelligenceView({
      explanation: PREVIEW_MATRIX.highStakes,
      locale: 'en',
      score: 81,
      posture: 'selective',
    });
    expect(high?.safety).toEqual([
      'Use timing as a planning aid. Verify the decision against real-world evidence and professional requirements.',
      'Timing signals cannot determine the factual outcome.',
      'Do not delay a factual deadline because of timing signals.',
    ]);
  });

  it('returns null when the renderer cannot produce a headline', () => {
    expect(
      buildDayIntelligenceView({
        explanation: null,
        locale: 'en',
        score: 80,
      })
    ).toBeNull();
  });

  it('names a conflicted factor only when exactly one known dimension is present', () => {
    const named = buildDayIntelligenceView({
      explanation: {
        ...PREVIEW_MATRIX.mixed,
        caution_codes: ['semantic.same_dimension_conflict'],
      },
      locale: 'en',
      score: 66,
      posture: 'mixed',
      conflictedDimensionIds: ['stability'],
    });
    expect(named?.cautions).toEqual([
      'Stability both supports and cautions.',
    ]);

    const generic = buildDayIntelligenceView({
      explanation: {
        ...PREVIEW_MATRIX.mixed,
        caution_codes: ['semantic.same_dimension_conflict'],
      },
      locale: 'en',
      score: 66,
      posture: 'mixed',
      conflictedDimensionIds: ['stability', 'pressure'],
    });
    expect(generic?.cautions).toEqual([
      'Some influences create both opportunity and risk.',
    ]);

    const unknown = buildDayIntelligenceView({
      explanation: {
        ...PREVIEW_MATRIX.mixed,
        caution_codes: ['semantic.same_dimension_conflict'],
      },
      locale: 'en',
      score: 66,
      posture: 'mixed',
      conflictedDimensionIds: ['raw_factor_key'],
    });
    expect(unknown?.cautions.join(' ')).not.toContain('raw_factor_key');
    expect(unknown?.cautions).toEqual([
      'Some influences create both opportunity and risk.',
    ]);
  });
});
