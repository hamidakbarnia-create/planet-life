import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearFtueEventQueue,
  readFtueEventQueue,
  trackFtueEvent,
} from './ftue-analytics';

describe('ftue-analytics', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('queues events in localStorage', () => {
    trackFtueEvent('ftue_login_view', { source: 'test' });
    const queue = readFtueEventQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]?.event).toBe('ftue_login_view');
    expect(queue[0]?.properties.source).toBe('test');
    expect(queue[0]?.properties.mvp_mode).toBe(true);
  });

  it('clears the queue', () => {
    trackFtueEvent('ftue_auth_complete');
    clearFtueEventQueue();
    expect(readFtueEventQueue()).toEqual([]);
  });
});
