import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearFtueComplete,
  ftueTodayPath,
  isFtueComplete,
  markFtueComplete,
} from './ftue-storage';

describe('ftue-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('starts incomplete', () => {
    expect(isFtueComplete()).toBe(false);
  });

  it('marks FTUE complete', () => {
    markFtueComplete();
    expect(isFtueComplete()).toBe(true);
    expect(localStorage.getItem('planet-life-ftue-complete')).toBe('1');
  });

  it('clears FTUE complete', () => {
    markFtueComplete();
    clearFtueComplete();
    expect(isFtueComplete()).toBe(false);
  });

  it('ftueTodayPath points at interim home route', () => {
    expect(ftueTodayPath()).toBe('/home');
  });
});
