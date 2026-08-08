import { describe, expect, it } from 'vitest';
import {
  canEvaluateInProduction,
  canExecuteInProduction,
  frameOperationToCaseMode,
  hasProductionRuntime,
  listProductionEvaluateDecisionTypeIds,
} from './production-capability';

describe('ASK Web UX capability hint (not backend authority)', () => {
  it('offers only car-interview + evaluate in the current shipped UX matrix', () => {
    expect(canEvaluateInProduction('car-interview')).toBe(true);
    expect(canExecuteInProduction('car-interview', 'evaluate')).toBe(true);
    expect(listProductionEvaluateDecisionTypeIds()).toEqual(['car-interview']);
  });

  it('hides unresolved / unknown / registry-only types for evaluate', () => {
    expect(canEvaluateInProduction(undefined)).toBe(false);
    expect(canEvaluateInProduction('')).toBe(false);
    expect(canEvaluateInProduction('mar-wedding-date')).toBe(false);
    expect(canEvaluateInProduction('not-a-type')).toBe(false);
  });

  it('COMPARE and FIND stay unavailable in UX', () => {
    expect(canExecuteInProduction('car-interview', 'compare')).toBe(false);
    expect(canExecuteInProduction('car-interview', 'find')).toBe(false);
    expect(frameOperationToCaseMode('find')).toBeNull();
    expect(hasProductionRuntime('car-interview', 'compare_dates')).toBe(false);
  });

  it('documents drift: UX false-negative is lag only (web hides, backend may later support)', () => {
    // mar-wedding-date is in registry with evaluate_date but not in shipped UX mirror.
    // If backend later supports it, web may stay hidden until the hint is updated —
    // that is temporary product lag, not a correctness/security failure.
    expect(canEvaluateInProduction('mar-wedding-date')).toBe(false);
  });
});
