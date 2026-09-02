import { describe, expect, it } from 'vitest';
import { resolveDecisionRequest } from '@/lib/decision-request';
import { resolveAskQuestion } from '@/lib/resolve-ask-question';
import { hasDecisionTypeRegistry, listDecisionTypes } from './decision-type-registry';
import {
  classifyPopularDecisionRefs,
  listAllDecisionTypesAsPopular,
  listPopularDecisions,
} from './popular-decisions';
import { isShippedExecutableDecisionType } from './production-capability';

describe('ask-home popular decisions provider', () => {
  it('reads the decision type registry', () => {
    expect(hasDecisionTypeRegistry()).toBe(true);
    const types = listDecisionTypes();
    expect(types.length).toBeGreaterThan(0);
    expect(types.some((row) => row.decision_type_id === 'car-interview')).toBe(
      true
    );
  });

  it('classifies every Popular ref as available or unavailable', () => {
    const classified = classifyPopularDecisionRefs();
    expect(classified.length).toBeGreaterThanOrEqual(4);
    for (const row of classified) {
      expect(['available', 'unavailable']).toContain(row.capability);
      if (row.capability === 'available') {
        expect(row.decisionTypeId).toBeTruthy();
        expect(isShippedExecutableDecisionType(row.decisionTypeId)).toBe(true);
      } else {
        expect(isShippedExecutableDecisionType(row.decisionTypeId)).toBe(false);
      }
    }
  });

  it('binds runnable Popular cards to shipped Decision Types only', () => {
    const items = listPopularDecisions('en');
    const available = items.filter((item) => item.capability === 'available');
    expect(available.map((item) => item.decisionTypeId).sort()).toEqual([
      'bus-investor-meeting',
      'bus-product-launch',
      'car-interview',
      'mar-wedding-date',
    ]);
    expect(
      available.every((item) => isShippedExecutableDecisionType(item.decisionTypeId))
    ).toBe(true);
  });

  it('keeps unsupported Popular cards browseable without Decision Type binding', () => {
    const items = listPopularDecisions('en');
    const unavailable = items.filter((item) => item.capability === 'unavailable');
    expect(unavailable.length).toBeGreaterThan(0);
    expect(
      unavailable.every(
        (item) =>
          !item.decisionTypeId ||
          !isShippedExecutableDecisionType(item.decisionTypeId)
      )
    ).toBe(true);
    expect(unavailable.some((item) => item.id === 'career-change')).toBe(true);
    expect(unavailable.some((item) => item.id === 'accept-job-offer')).toBe(true);
  });

  it('resolves popular cards without embedding labels in the UI layer', () => {
    const items = listPopularDecisions('en');
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items.every((item) => item.label.trim().length > 0)).toBe(true);
    expect(items.every((item) => item.source !== 'mock')).toBe(true);

    const wedding = items.find((item) => item.id === 'best-wedding-date');
    expect(wedding?.source).toBe('registry');
    expect(wedding?.decisionTypeId).toBe('mar-wedding-date');
    expect(wedding?.capability).toBe('available');

    const launch = items.find((item) => item.id === 'launch-business');
    expect(launch?.decisionTypeId).toBe('bus-product-launch');
    expect(launch?.guidedQuestionId).toBe('launch-project');
    expect(launch?.capability).toBe('available');
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

  it('keeps Popular explicit DT equal to Guided resolved DT for shipped pairs', () => {
    const available = listPopularDecisions('en').filter(
      (item) => item.capability === 'available' && item.guidedQuestionId
    );
    expect(available.map((item) => item.id).sort()).toEqual([
      'job-interview',
      'launch-business',
      'meet-investor',
    ]);

    for (const item of available) {
      const guided = resolveDecisionRequest(
        resolveAskQuestion(
          {
            submitted_at: Date.now(),
            source: 'suggestion',
            suggestion_id: item.guidedQuestionId,
          },
          'en'
        )
      );
      expect(guided.execution.decisionTypeId).toBe(item.decisionTypeId);
    }
  });

  it('does not require Guided DT bind for unavailable Popular cards', () => {
    const unavailable = listPopularDecisions('en').filter(
      (item) => item.capability === 'unavailable' && item.guidedQuestionId
    );
    expect(unavailable.length).toBeGreaterThan(0);
    for (const item of unavailable) {
      const guided = resolveDecisionRequest(
        resolveAskQuestion(
          {
            submitted_at: Date.now(),
            source: 'suggestion',
            suggestion_id: item.guidedQuestionId,
          },
          'en'
        )
      );
      expect(guided.execution.decisionTypeId).toBeUndefined();
    }
  });

  it('lists registry types for See All with honesty classification', () => {
    const all = listAllDecisionTypesAsPopular();
    expect(all.every((item) => item.source === 'registry')).toBe(true);
    expect(all.map((item) => item.decisionTypeId)).toEqual(
      listDecisionTypes().map((row) => row.decision_type_id)
    );
    const compareOnly = all.find((item) => item.id === 'tim-compare-three');
    expect(compareOnly?.capability).toBe('unavailable');
    expect(
      all.filter((item) => item.capability === 'available').map((i) => i.id).sort()
    ).toEqual([
      'bus-investor-meeting',
      'bus-product-launch',
      'car-interview',
      'mar-wedding-date',
    ]);
  });
});
