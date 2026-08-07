import { describe, expect, it } from 'vitest';
import { hasDecisionTypeRegistry, listDecisionTypes } from './decision-type-registry';
import {
  listAllDecisionTypesAsPopular,
  listPopularDecisions,
} from './popular-decisions';

describe('ask-home popular decisions provider', () => {
  it('reads the decision type registry', () => {
    expect(hasDecisionTypeRegistry()).toBe(true);
    const types = listDecisionTypes();
    expect(types.length).toBeGreaterThan(0);
    expect(types.some((row) => row.decision_type_id === 'car-interview')).toBe(
      true
    );
  });

  it('resolves popular cards without embedding labels in the UI layer', () => {
    const items = listPopularDecisions('en');
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items.every((item) => item.label.trim().length > 0)).toBe(true);
    expect(items.every((item) => item.source !== 'mock')).toBe(true);

    const wedding = items.find((item) => item.id === 'best-wedding-date');
    expect(wedding?.source).toBe('registry');
    expect(wedding?.decisionTypeId).toBe('mar-wedding-date');
  });

  it('prefers localized question-library labels for FA popular cards', () => {
    const fa = listPopularDecisions('fa');
    const interview = fa.find((item) => item.id === 'job-interview');
    expect(interview?.source).toBe('question-library');
    expect(interview?.label).not.toMatch(/Attend job interview|Job Interview/i);
    expect(interview?.label.trim().length).toBeGreaterThan(0);

    const en = listPopularDecisions('en');
    const enInterview = en.find((item) => item.id === 'job-interview');
    expect(enInterview?.label).not.toEqual(interview?.label);
  });

  it.each(['fa', 'ar', 'ru'] as const)(
    'localizes core popular set for %s without English wedding override',
    (lang) => {
      const items = listPopularDecisions(lang);
      const wedding = items.find((item) => item.id === 'best-wedding-date');
      expect(wedding?.decisionTypeId).toBe('mar-wedding-date');
      expect(wedding?.label).not.toBe('Choose wedding date');
      expect(wedding?.label).not.toMatch(/^[A-Za-z].*/);

      const interview = items.find((item) => item.id === 'job-interview');
      expect(interview?.label).not.toMatch(/Job interview/i);
    }
  );

  it('lists registry types for See All', () => {
    const all = listAllDecisionTypesAsPopular();
    expect(all.every((item) => item.source === 'registry')).toBe(true);
    expect(all.map((item) => item.decisionTypeId)).toEqual(
      listDecisionTypes().map((row) => row.decision_type_id)
    );
  });
});
