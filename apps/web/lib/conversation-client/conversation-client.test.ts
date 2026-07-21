/**
 * Shared Conversation API client — ADR-0007 envelope contract.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CONVERSATION_EXECUTE_PATH,
  postConversationExecute,
} from '@/lib/conversation-client';

describe('conversation-client (ADR-0007)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('posts to the authorised execute path with messages and locale', async () => {
    const fetchMock = vi.fn(async () => ({
      status: 200,
      json: async () => ({
        type: 'decision',
        message: 'ok',
        sources: [],
        request_id: 'req-1',
        reasoning: 'r',
        uncertainty: 'u',
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await postConversationExecute(
      [{ role: 'user', content: 'Should I wait?' }],
      'en'
    );

    expect(CONVERSATION_EXECUTE_PATH).toBe('/api/v1/conversation/execute');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.body.request_id).toBe('req-1');
      expect(result.body.type).toBe('decision');
      expect(result.body.message).toBe('ok');
      expect(result.body.sources).toEqual([]);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain(CONVERSATION_EXECUTE_PATH);
    expect(init?.method).toBe('POST');
    const body = JSON.parse(String(init?.body));
    expect(body).toEqual({
      messages: [{ role: 'user', content: 'Should I wait?' }],
      locale: 'en',
    });
  });

  it('propagates abort signal and optional conversation_id', async () => {
    const fetchMock = vi.fn(async () => ({
      status: 200,
      json: async () => ({
        type: 'conversational',
        message: 'hi',
        sources: [],
        request_id: 'req-2',
        reasoning: null,
        uncertainty: null,
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    await postConversationExecute([{ role: 'user', content: 'Hello' }], 'ru', {
      signal: controller.signal,
      conversationId: 'c-1',
    });

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init?.signal).toBe(controller.signal);
    expect(JSON.parse(String(init?.body)).conversation_id).toBe('c-1');
  });

  it('maps network and contract failures without inventing envelopes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('network');
      })
    );
    expect(await postConversationExecute([{ role: 'user', content: 'x' }], 'en')).toEqual({
      ok: false,
      kind: 'network_error',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        status: 500,
        json: async () => ({ error: { code: 'X', message: 'y', requestId: 'z' } }),
      }))
    );
    expect(await postConversationExecute([{ role: 'user', content: 'x' }], 'en')).toEqual({
      ok: false,
      kind: 'contract_error',
    });
  });
});
