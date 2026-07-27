export type FtueEventName =
  | 'ftue_welcome_view'
  | 'ftue_welcome_start'
  | 'ftue_goal_view'
  | 'ftue_goal_select'
  | 'ftue_goal_skip'
  | 'ftue_login_view'
  | 'ftue_auth_send_code'
  | 'ftue_auth_verify_attempt'
  | 'ftue_auth_complete'
  | 'ftue_auth_oauth_unavailable'
  | 'ftue_auth_rate_limited';

export type ProfileEventName =
  | 'profile.view'
  | 'profile.started'
  | 'profile.saved'
  | 'profile.validation_failed'
  | 'profile.completed';

export type PreparingEventName =
  | 'ftue.preparing.view'
  | 'ftue.preparing.started'
  | 'ftue.preparing.completed'
  | 'ftue.preparing.failed';

export type TodayEventName =
  | 'ftue.today.view'
  | 'ftue.today.started'
  | 'ftue.today.cta_clicked'
  | 'ftue.today.missing_profile';

export type AskEventName =
  | 'ftue.ask.view'
  | 'ftue.ask.started'
  | 'ftue.ask.question_selected'
  | 'ftue.ask.submitted'
  | 'ftue.ask.validation_failed';

export type ResultEventName =
  | 'ftue.result.view'
  | 'ftue.result.started'
  | 'ftue.result.completed'
  | 'ftue.result.missing_question'
  | 'ftue.result.missing_profile';

export type AnalyticsEventName =
  | FtueEventName
  | ProfileEventName
  | PreparingEventName
  | TodayEventName
  | AskEventName
  | ResultEventName;

const QUEUE_KEY = 'planet-life-ftue-events';
const MAX_QUEUE = 100;

export interface AnalyticsEvent {
  event: AnalyticsEventName;
  timestamp: string;
  properties: Record<string, unknown>;
}

/** @deprecated use AnalyticsEvent */
export type FtueAnalyticsEvent = AnalyticsEvent;

function enqueueAnalyticsEvent(
  event: AnalyticsEventName,
  properties: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined') return;

  const payload: AnalyticsEvent = {
    event,
    timestamp: new Date().toISOString(),
    properties: { mvp_mode: true, ...properties },
  };

  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const queue: AnalyticsEvent[] = raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
    queue.push(payload);
    while (queue.length > MAX_QUEUE) queue.shift();
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    /* non-blocking */
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[analytics]', payload);
  }
}

export function trackAnalyticsEvent(
  event: AnalyticsEventName,
  properties: Record<string, unknown> = {}
): void {
  enqueueAnalyticsEvent(event, properties);
}

export function trackFtueEvent(
  event: FtueEventName,
  properties: Record<string, unknown> = {}
): void {
  enqueueAnalyticsEvent(event, properties);
}

export function trackProfileEvent(
  event: ProfileEventName,
  properties: Record<string, unknown> = {}
): void {
  enqueueAnalyticsEvent(event, properties);
}

export function trackPreparingEvent(
  event: PreparingEventName,
  properties: Record<string, unknown> = {}
): void {
  enqueueAnalyticsEvent(event, properties);
}

export function trackTodayEvent(
  event: TodayEventName,
  properties: Record<string, unknown> = {}
): void {
  enqueueAnalyticsEvent(event, properties);
}

export function trackAskEvent(
  event: AskEventName,
  properties: Record<string, unknown> = {}
): void {
  enqueueAnalyticsEvent(event, properties);
}

export function trackResultEvent(
  event: ResultEventName,
  properties: Record<string, unknown> = {}
): void {
  enqueueAnalyticsEvent(event, properties);
}

export function readFtueEventQueue(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

export function clearFtueEventQueue(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(QUEUE_KEY);
}
