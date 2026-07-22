import { describe, expect, it } from 'vitest';
import { DECISION_INTENTS_V1 } from '../input-analysis';
import {
  DECISION_DIMENSIONS,
  DIMENSION_READINESS_RULES,
  INTENT_TEMPLATE_REGISTRY,
  INTENT_TEMPLATE_VERSION,
  getIntentTemplate,
  SECONDARY_SUPPLEMENTAL_DIMENSIONS,
  CAREER_TEMPLATE,
  BUSINESS_TEMPLATE,
  RELATIONSHIP_TEMPLATE,
  HEALTH_TEMPLATE,
} from './index';

describe('IntentTemplate registry v1', () => {
  it('every DecisionIntent has exactly one matching template', () => {
    expect(Object.keys(INTENT_TEMPLATE_REGISTRY)).toHaveLength(
      DECISION_INTENTS_V1.length
    );
    for (const intent of DECISION_INTENTS_V1) {
      const template = INTENT_TEMPLATE_REGISTRY[intent];
      expect(template).toBeDefined();
      expect(template.intent).toBe(intent);
      expect(template.templateId).toBe(`intent.${intent}.v1`);
      expect(template.version).toBe(INTENT_TEMPLATE_VERSION);
      expect(getIntentTemplate(intent)).toBe(template);
    }
  });

  it('does not silently reuse other for known intents', () => {
    for (const intent of DECISION_INTENTS_V1) {
      if (intent === 'other') continue;
      expect(getIntentTemplate(intent).templateId).not.toBe('intent.other.v1');
    }
  });

  it('primary dimension order for key intents', () => {
    expect(CAREER_TEMPLATE.dimensions.slice(0, 6)).toEqual([
      'goal',
      'current_state',
      'options',
      'constraints',
      'career_growth',
      'financial_impact',
    ]);
    expect(BUSINESS_TEMPLATE.dimensions.slice(0, 5)).toEqual([
      'goal',
      'current_state',
      'options',
      'business_viability',
      'financial_impact',
    ]);
    expect(RELATIONSHIP_TEMPLATE.dimensions.slice(0, 5)).toEqual([
      'goal',
      'current_state',
      'options',
      'relationship_impact',
      'family_impact',
    ]);
    expect(HEALTH_TEMPLATE.dimensions.join(',')).not.toMatch(
      /diagnos|treatment|prescri/i
    );
  });

  it('every dimension has an explicit readiness rule', () => {
    for (const dim of DECISION_DIMENSIONS) {
      expect(DIMENSION_READINESS_RULES[dim]).toBeDefined();
      expect(
        DIMENSION_READINESS_RULES[dim].mode === 'context_required' ||
          DIMENSION_READINESS_RULES[dim].mode === 'procedural'
      ).toBe(true);
    }
  });

  it('supplemental dimensions are declared only via secondary map', () => {
    for (const intent of DECISION_INTENTS_V1) {
      for (const dim of SECONDARY_SUPPLEMENTAL_DIMENSIONS[intent]) {
        expect(DECISION_DIMENSIONS).toContain(dim);
      }
    }
    expect(SECONDARY_SUPPLEMENTAL_DIMENSIONS.other).toEqual([]);
  });

  it('riskDomains and actionHorizons stay controlled per template', () => {
    for (const intent of DECISION_INTENTS_V1) {
      const t = getIntentTemplate(intent);
      expect(t.riskDomains.length).toBeGreaterThan(0);
      expect(t.actionHorizons.length).toBeGreaterThan(0);
    }
  });
});
