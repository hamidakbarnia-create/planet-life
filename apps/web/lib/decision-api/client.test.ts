import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_BASE } from '../api-config';
import { DECISION_EXECUTE_PATH, postDecisionExecute } from './client';
import type { DecisionExecuteTransportRequest } from './types';

const transportRequest: DecisionExecuteTransportRequest = {
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
};

const successBody = {
  status: 'completed',
  result: {
    requestId: 'career-focus-week:career_focus',
    actionType: 'career_focus',
    guidedQuestionId: 'career-focus-week',
    categoryId: 'career-work',
    needsTime: false,
    summary: 'What should I focus on in my career this week?',
    source: 'decision_api_boundary',
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('postDecisionExecute', () => {
  it('posts JSON to the Decision execute endpoint without retries', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => successBody,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await postDecisionExecute(transportRequest);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE}${DECISION_EXECUTE_PATH}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transportRequest),
        signal: undefined,
      }
    );
    expect(result).toEqual({
      ok: true,
      httpStatus: 200,
      body: successBody,
    });
  });

  it('propagates an optional AbortSignal without applying timeout policy', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => successBody,
    });
    vi.stubGlobal('fetch', fetchMock);

    await postDecisionExecute(transportRequest, { signal: controller.signal });

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE}${DECISION_EXECUTE_PATH}`,
      expect.objectContaining({ signal: controller.signal })
    );
  });

  it('parses contract error envelopes', async () => {
    const errorBody = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'locale: Input should be en, ru, fa or ar',
        requestId: 'career-focus-week:career_focus',
      },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 400,
        json: async () => errorBody,
      })
    );

    const result = await postDecisionExecute(transportRequest);

    expect(result).toEqual({
      ok: false,
      kind: 'contract_error',
      httpStatus: 400,
      body: errorBody,
    });
  });

  it('treats non-contract JSON as malformed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 500,
        json: async () => ({ detail: 'server blew up' }),
      })
    );

    const result = await postDecisionExecute(transportRequest);

    expect(result).toEqual({
      ok: false,
      kind: 'malformed_response',
      httpStatus: 500,
    });
  });

  it('treats invalid JSON as malformed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      })
    );

    const result = await postDecisionExecute(transportRequest);

    expect(result).toEqual({
      ok: false,
      kind: 'malformed_response',
      httpStatus: 200,
    });
  });

  it('maps network failure without synthesizing a completed result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    );

    const result = await postDecisionExecute(transportRequest);

    expect(result).toEqual({ ok: false, kind: 'network_error' });
  });

  it('does not accept a 200 body missing required success fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({ status: 'completed', result: { summary: 'x' } }),
      })
    );

    const result = await postDecisionExecute(transportRequest);

    expect(result).toEqual({
      ok: false,
      kind: 'malformed_response',
      httpStatus: 200,
    });
  });
});
