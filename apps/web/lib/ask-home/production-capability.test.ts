import { describe, expect, it } from 'vitest';
import {
  canEvaluateInProduction,
  canExecuteInProduction,
  frameOperationToCaseMode,
  hasProductionRuntime,
  listProductionEvaluateDecisionTypeIds,
} from './production-capability';

describe('ASK Web UX capability hint (not backend authority)', () => {
  it('offers shipped evaluate runtimes in the current UX matrix', () => {
    expect(canEvaluateInProduction('car-interview')).toBe(true);
    expect(canEvaluateInProduction('bus-investor-meeting')).toBe(true);
    expect(canEvaluateInProduction('mar-wedding-date')).toBe(true);
    expect(canEvaluateInProduction('bus-product-launch')).toBe(true);
    expect(canExecuteInProduction('car-interview', 'evaluate')).toBe(true);
    expect(listProductionEvaluateDecisionTypeIds()).toEqual([
      'car-interview',
      'bus-investor-meeting',
      'mar-wedding-date',
      'bus-product-launch',
    ]);
  });

  it('hides unresolved / unknown types for evaluate', () => {
    expect(canEvaluateInProduction(undefined)).toBe(false);
    expect(canEvaluateInProduction('')).toBe(false);
    expect(canEvaluateInProduction('tim-compare-three')).toBe(false);
    expect(canEvaluateInProduction('not-a-type')).toBe(false);
  });

  it('COMPARE ships only for wedding; FIND stays unavailable', () => {
    expect(canExecuteInProduction('car-interview', 'compare')).toBe(false);
    expect(canExecuteInProduction('mar-wedding-date', 'compare')).toBe(true);
    expect(canExecuteInProduction('tim-compare-three', 'compare')).toBe(false);
    expect(canExecuteInProduction('car-interview', 'find')).toBe(false);
    expect(frameOperationToCaseMode('find')).toBeNull();
    expect(hasProductionRuntime('car-interview', 'compare_dates')).toBe(false);
    expect(hasProductionRuntime('mar-wedding-date', 'compare_dates')).toBe(true);
  });
});
