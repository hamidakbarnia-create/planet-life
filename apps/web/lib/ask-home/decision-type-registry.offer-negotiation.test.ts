import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getDecisionType, listDecisionTypes } from './decision-type-registry';

const WEB_MIRROR = join(
  process.cwd(),
  'lib/ask-home/data/decision-types.v1.json'
);
const BACKEND_REGISTRY = join(
  process.cwd(),
  '../../packages/decision_engine/registry/decision_types.v1.json'
);

describe('registry mirror accepts the sixth canonical type', () => {
  it('exposes car-offer-negotiation with the pinned record contract', () => {
    const record = getDecisionType('car-offer-negotiation');
    expect(record).toBeDefined();
    expect(record).toMatchObject({
      decision_type_id: 'car-offer-negotiation',
      family_id: 'visibility',
      label: 'Negotiate a job offer',
      create_mode: 'none',
      available_entry_modes: ['structured'],
      allowed_modes: ['evaluate_date'],
      output_profile: 'decision_evaluation_package.v1',
      risk_context: {
        level: 'elevated',
        domains: ['employment'],
        outcome_prediction_prohibited: true,
        factual_deadline_priority: false,
      },
    });
  });

  it('allows EVALUATE only', () => {
    expect(getDecisionType('car-offer-negotiation')?.allowed_modes).toEqual([
      'evaluate_date',
    ]);
  });

  it('derives a registry of six unique types', () => {
    const records = listDecisionTypes();
    expect(records).toHaveLength(6);
    const ids = records.map((row) => row.decision_type_id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('car-offer-negotiation');
  });

  it('stays byte-identical to the backend registry', () => {
    expect(readFileSync(WEB_MIRROR, 'utf8')).toBe(
      readFileSync(BACKEND_REGISTRY, 'utf8')
    );
  });
});
