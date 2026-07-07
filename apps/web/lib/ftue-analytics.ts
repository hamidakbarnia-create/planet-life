export type FtueEventName =
  | 'ftue_welcome_view'
  | 'ftue_welcome_start'
  | 'ftue_login_view'
  | 'ftue_auth_send_code'
  | 'ftue_auth_verify_attempt'
  | 'ftue_auth_complete'
  | 'ftue_auth_oauth_unavailable'
  | 'ftue_auth_rate_limited';

const QUEUE_KEY = 'planet-life-ftue-events';
const MAX_QUEUE = 100;

export interface FtueAnalyticsEvent {
  event: FtueEventName;
  timestamp: string;
  properties: Record<string, unknown>;
}

export function trackFtueEvent(
  event: FtueEventName,
  properties: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined') return;

  const payload: FtueAnalyticsEvent = {
    event,
    timestamp: new Date().toISOString(),
    properties: { mvp_mode: true, ...properties },
  };

  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const queue: FtueAnalyticsEvent[] = raw ? (JSON.parse(raw) as FtueAnalyticsEvent[]) : [];
    queue.push(payload);
    while (queue.length > MAX_QUEUE) queue.shift();
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    /* non-blocking */
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[ftue-analytics]', payload);
  }
}

export function readFtueEventQueue(): FtueAnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as FtueAnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

export function clearFtueEventQueue(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(QUEUE_KEY);
}
