import { describe, expect, it } from 'vitest';
import {
  canEvaluateInProduction,
  canExecuteInProduction,
  frameOperationToCaseMode,
  hasProductionRuntime,
  isShippedExecutableDecisionType,
  listProductionEvaluateDecisionTypeIds,
  listShippedExecutableDecisionTypeIds,
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
    expect(listShippedExecutableDecisionTypeIds().sort()).toEqual([
      'bus-investor-meeting',
      'bus-product-launch',
      'car-interview',
      'mar-wedding-date',
    ]);
    expect(isShippedExecutableDecisionType('car-interview')).toBe(true);
    expect(isShippedExecutableDecisionType('tim-compare-three')).toBe(false);
  });

  it('hides unresolved / unknown types for evaluate', () => {
    expect(canEvaluateInProduction(undefined)).toBe(false);
    expect(canEvaluateInProduction('')).toBe(false);
    expect(canEvaluateInProduction('tim-compare-three')).toBe(false);
    expect(canEvaluateInProduction('not-a-type')).toBe(false);
  });

  it('COMPARE ships for wedding and interview; FIND ships only for product launch', () => {
    expect(canExecuteInProduction('car-interview', 'compare')).toBe(true);
    expect(canExecuteInProduction('mar-wedding-date', 'compare')).toBe(true);
    expect(canExecuteInProduction('tim-compare-three', 'compare')).toBe(false);
    expect(canExecuteInProduction('car-interview', 'find')).toBe(false);
    expect(canExecuteInProduction('mar-wedding-date', 'find')).toBe(false);
    expect(canExecuteInProduction('bus-product-launch', 'find')).toBe(true);
    expect(frameOperationToCaseMode('find')).toBe('find_dates');
    expect(hasProductionRuntime('car-interview', 'compare_dates')).toBe(true);
    expect(hasProductionRuntime('mar-wedding-date', 'compare_dates')).toBe(true);
    expect(hasProductionRuntime('bus-product-launch', 'find_dates')).toBe(true);
    expect(hasProductionRuntime('mar-wedding-date', 'find_dates')).toBe(false);
  });
});
