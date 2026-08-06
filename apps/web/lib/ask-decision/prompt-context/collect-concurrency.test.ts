/**
 * Proves timing and conversation acquisition start before either completes.
 */

import { describe, expect, it, vi } from 'vitest';
import { collectPromptContextInputs } from './collect';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('collectPromptContextInputs concurrency', () => {
  it('starts timing and conversation collection before either settles', async () => {
    const events: string[] = [];

    const loadTiming = vi.fn(async () => {
      events.push('timing-start');
      await delay(40);
      events.push('timing-end');
      return {
        signals: {
          todayScore: null,
          weekScore: null,
          monthScore: null,
          avoidScore: null,
        },
        timing: {
          bestToday: null,
          bestThisWeek: null,
          bestThisMonth: null,
          avoidWindow: null,
        },
      };
    });

    const collectMessages = vi.fn(async () => {
      events.push('conversation-start');
      await delay(40);
      events.push('conversation-end');
      return [{ role: 'user' as const, content: 'prior note' }];
    });

    await collectPromptContextInputs({
      timing: {
        profile: null,
        timingRelevant: true,
        timingAvailable: true,
        locale: 'en',
        loadTiming: loadTiming as never,
      },
      conversation: {
        collectMessages,
      },
    });

    expect(events).toContain('timing-start');
    expect(events).toContain('conversation-start');
    expect(events).toContain('timing-end');
    expect(events).toContain('conversation-end');

    const tStart = events.indexOf('timing-start');
    const cStart = events.indexOf('conversation-start');
    const tEnd = events.indexOf('timing-end');
    const cEnd = events.indexOf('conversation-end');

    // Both starts happen before either end (overlap / concurrent start).
    expect(Math.max(tStart, cStart)).toBeLessThan(Math.min(tEnd, cEnd));
    expect(loadTiming).toHaveBeenCalledTimes(1);
    expect(collectMessages).toHaveBeenCalledTimes(1);
  });
});
