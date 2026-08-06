import { describe, expect, it } from 'vitest';
import type { ExecutableDecisionRequest } from '../decision-execution';
import type { ProfileRecord } from '../profile/profile-types';
import { buildDecisionExecuteRequest, buildRequestId } from './build-request';

const readyRequest: ExecutableDecisionRequest = {
  displayText: 'What should I focus on in my career this week?',
  question: { source: 'guided' },
  execution: {
    actionType: 'career_focus',
    guidedQuestionId: 'career-focus-week',
    categoryId: 'career-work',
    needsTime: false,
  },
};

const completeProfile: ProfileRecord = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  birth_place: {
    name: 'New York, United States',
    short: 'New York',
    lat: 40.7128,
    lon: -74.006,
    country: 'US',
  },
  action_type: 'business_launch',
};

describe('buildRequestId', () => {
  it('uses the ADR source convention', () => {
    expect(buildRequestId('career-focus-week', 'career_focus')).toBe(
      'career-focus-week:career_focus'
    );
  });
});

describe('buildDecisionExecuteRequest', () => {
  it('maps Guided Ready inputs to the exact transport request', () => {
    const result = buildDecisionExecuteRequest({
      request: readyRequest,
      profile: completeProfile,
      locale: 'en',
    });

    expect(result).toEqual({
      ok: true,
      request: {
        request_id: 'career-focus-week:career_focus',
        display_text: 'What should I focus on in my career this week?',
        action_type: 'career_focus',
        guided_question_id: 'career-focus-week',
        category_id: 'career-work',
        needs_time: false,
        locale: 'en',
        profile: {
          birth_date: '1990-06-15',
          birth_time: '14:30',
          location: 'New York',
          latitude: 40.7128,
          longitude: -74.006,
          action_type: 'business_launch',
        },
      },
    });
  });

  it('is deterministic for identical inputs', () => {
    const first = buildDecisionExecuteRequest({
      request: readyRequest,
      profile: completeProfile,
      locale: 'fa',
    });
    const second = buildDecisionExecuteRequest({
      request: readyRequest,
      profile: completeProfile,
      locale: 'fa',
    });
    expect(first).toEqual(second);
  });

  it('includes only transport fields', () => {
    const result = buildDecisionExecuteRequest({
      request: readyRequest,
      profile: completeProfile,
      locale: 'en',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(Object.keys(result.request).sort()).toEqual([
      'action_type',
      'category_id',
      'display_text',
      'guided_question_id',
      'locale',
      'needs_time',
      'profile',
      'request_id',
    ]);
    expect(Object.keys(result.request.profile).sort()).toEqual([
      'action_type',
      'birth_date',
      'birth_time',
      'latitude',
      'location',
      'longitude',
    ]);
    expect(result.request).not.toHaveProperty('target_date');
    expect(result.request).not.toHaveProperty('ScoringContext');
    expect(result.request).not.toHaveProperty('module_origin');
    expect(result.request.profile).not.toHaveProperty('country');
    expect(result.request.profile).not.toHaveProperty('name');
  });

  it('uses birth_place.name when short is empty', () => {
    const result = buildDecisionExecuteRequest({
      request: readyRequest,
      profile: {
        ...completeProfile,
        birth_place: {
          name: 'Tehran',
          short: '  ',
          lat: 35.6892,
          lon: 51.389,
        },
      },
      locale: 'en',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.request.profile.location).toBe('Tehran');
  });

  it('rejects incomplete profile fields', () => {
    expect(
      buildDecisionExecuteRequest({
        request: readyRequest,
        profile: { ...completeProfile, birth_date: '' },
        locale: 'en',
      })
    ).toEqual({ ok: false, reason: 'incomplete_profile' });

    expect(
      buildDecisionExecuteRequest({
        request: readyRequest,
        profile: { ...completeProfile, action_type: '   ' },
        locale: 'en',
      })
    ).toEqual({ ok: false, reason: 'incomplete_profile' });
  });

  it('rejects missing location strings', () => {
    expect(
      buildDecisionExecuteRequest({
        request: readyRequest,
        profile: {
          ...completeProfile,
          birth_place: { name: '', short: '', lat: 1, lon: 2 },
        },
        locale: 'en',
      })
    ).toEqual({ ok: false, reason: 'missing_location' });
  });

  it('rejects non-finite coordinates', () => {
    expect(
      buildDecisionExecuteRequest({
        request: readyRequest,
        profile: {
          ...completeProfile,
          birth_place: {
            name: 'New York',
            short: 'New York',
            lat: Number.NaN,
            lon: -74.006,
          },
        },
        locale: 'en',
      })
    ).toEqual({ ok: false, reason: 'invalid_coordinates' });
  });

  it('preserves needs_time true without inventing a date', () => {
    const result = buildDecisionExecuteRequest({
      request: {
        ...readyRequest,
        execution: {
          ...readyRequest.execution,
          guidedQuestionId: 'job-interview',
          actionType: 'job_interview',
          needsTime: true,
        },
      },
      profile: completeProfile,
      locale: 'ru',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.request.needs_time).toBe(true);
    expect(result.request.request_id).toBe('job-interview:job_interview');
    expect(result.request).not.toHaveProperty('target_date');
    expect(result.request).not.toHaveProperty('target_time');
  });
});
