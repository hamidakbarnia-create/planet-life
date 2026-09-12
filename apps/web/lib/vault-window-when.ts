/**
 * Style Timing window relation — presentation only.
 * Never invents a date, timezone, or confident past/future label.
 */

export type WindowRelation = 'past' | 'current' | 'upcoming' | 'unknown';

export type WindowWhenInput = {
  date?: string | null;
  start?: string | null;
  end?: string | null;
  timezone?: string | null;
  now?: Date;
};

export type WindowWhenResult = {
  relation: WindowRelation;
  date: string | null;
  start: string | null;
  end: string | null;
  timezone: string | null;
  facts: string;
};

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;
const WINDOW_RE =
  /(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})(?:\s*·\s*\d+\s*\/\s*100)?(?:\s*·\s*([A-Za-z]+(?:[/_+-][A-Za-z0-9]+)+))?/;

export function isValidIanaTimeZone(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value.trim() }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function parseDateParts(value: string): { y: number; m: number; d: number } | null {
  const match = DATE_RE.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const utc = Date.UTC(y, m - 1, d);
  const check = new Date(utc);
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== m - 1 ||
    check.getUTCDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

function parseTimeParts(value: string): { h: number; min: number } | null {
  const match = TIME_RE.exec(value);
  if (!match) return null;
  const h = Number(match[1]);
  const min = Number(match[2]);
  if (h > 23 || min > 59) return null;
  return { h, min };
}

function addDays(parts: { y: number; m: number; d: number }, days: number) {
  const utc = new Date(Date.UTC(parts.y, parts.m - 1, parts.d + days));
  return { y: utc.getUTCFullYear(), m: utc.getUTCMonth() + 1, d: utc.getUTCDate() };
}

function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const map = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  );
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return asUtc - instant.getTime();
}

function civilEquals(
  instant: Date,
  timeZone: string,
  y: number,
  m: number,
  d: number,
  h: number,
  min: number,
): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const map = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  );
  return (
    Number(map.year) === y &&
    Number(map.month) === m &&
    Number(map.day) === d &&
    Number(map.hour) === h &&
    Number(map.minute) === min
  );
}

/** Unique instant for a civil time in an IANA zone, or null if missing/ambiguous (DST). */
export function zonedCivilInstant(
  date: string,
  time: string,
  timeZone: string,
): Date | null {
  if (!isValidIanaTimeZone(timeZone)) return null;
  const day = parseDateParts(date);
  const clock = parseTimeParts(time);
  if (!day || !clock) return null;
  const desired = Date.UTC(day.y, day.m - 1, day.d, clock.h, clock.min, 0);
  let instant = desired;
  for (let i = 0; i < 4; i += 1) {
    const offset = timeZoneOffsetMs(new Date(instant), timeZone);
    instant = desired - offset;
  }
  // Probe 15-minute steps so half-hour (and other non-hour) DST offsets are seen.
  // Ambiguous or nonexistent civil times must stay unknown.
  const probeMinutes = [
    0, 15, 30, 45, 60, 75, 90, 105, 120, 180, 240, 300, 360, 480, 600, 720, 840,
  ];
  const offsets = new Set<number>();
  for (const minutes of probeMinutes) {
    offsets.add(timeZoneOffsetMs(new Date(instant + minutes * 60000), timeZone));
    if (minutes !== 0) {
      offsets.add(timeZoneOffsetMs(new Date(instant - minutes * 60000), timeZone));
    }
  }
  const matches = new Set<number>();
  for (const offset of offsets) {
    const candidate = desired - offset;
    if (civilEquals(new Date(candidate), timeZone, day.y, day.m, day.d, clock.h, clock.min)) {
      matches.add(candidate);
    }
  }
  if (matches.size !== 1) return null;
  return new Date([...matches][0]!);
}

function factsLine(input: {
  date: string | null;
  start: string | null;
  end: string | null;
  timezone: string | null;
}): string {
  const clock =
    input.start && input.end ? `${input.start}–${input.end}` : input.start || input.end || '';
  return [input.date, clock, input.timezone].filter(Boolean).join(' ');
}

export type WindowBoundary = { start: number; end: number };

type ResolvedWindow = {
  date: string;
  start: string;
  end: string;
  timezone: string;
  facts: string;
  startMs: number;
  endMs: number;
};

function resolveWindowInstants(input: WindowWhenInput): ResolvedWindow | null {
  const date = input.date?.trim() || null;
  const start = input.start?.trim() || null;
  const end = input.end?.trim() || null;
  const timezone = input.timezone?.trim() || null;
  if (!date || !start || !end || !timezone) return null;
  if (!parseDateParts(date) || !parseTimeParts(start) || !parseTimeParts(end)) return null;
  if (!isValidIanaTimeZone(timezone)) return null;
  if (start === end) return null;
  const startInstant = zonedCivilInstant(date, start, timezone);
  const crossesMidnight = end < start;
  const endDate = crossesMidnight
    ? (() => {
        const parts = parseDateParts(date);
        if (!parts) return null;
        const next = addDays(parts, 1);
        return `${String(next.y).padStart(4, '0')}-${String(next.m).padStart(2, '0')}-${String(next.d).padStart(2, '0')}`;
      })()
    : date;
  if (!endDate) return null;
  const endInstant = zonedCivilInstant(endDate, end, timezone);
  if (!startInstant || !endInstant) return null;
  if (endInstant.getTime() <= startInstant.getTime()) return null;
  return {
    date,
    start,
    end,
    timezone,
    facts: factsLine({ date, start, end, timezone }),
    startMs: startInstant.getTime(),
    endMs: endInstant.getTime(),
  };
}

/** Unique start/end instants, or null when the civil window is unknown. */
export function windowBoundaryTimes(input: Omit<WindowWhenInput, 'now'>): WindowBoundary | null {
  const resolved = resolveWindowInstants(input);
  if (!resolved) return null;
  return { start: resolved.startMs, end: resolved.endMs };
}

/** Next start or exact end after now, if any. */
export function nextRelationChangeAt(nowMs: number, boundaries: WindowBoundary[]): number | null {
  let next: number | null = null;
  for (const boundary of boundaries) {
    for (const instant of [boundary.start, boundary.end]) {
      if (instant > nowMs && (next === null || instant < next)) next = instant;
    }
  }
  return next;
}

export function describeWindowWhen(input: WindowWhenInput): WindowWhenResult {
  const date = input.date?.trim() || null;
  const start = input.start?.trim() || null;
  const end = input.end?.trim() || null;
  const timezone = input.timezone?.trim() || null;
  const facts = factsLine({ date, start, end, timezone });
  const unknown: WindowWhenResult = {
    relation: 'unknown',
    date,
    start,
    end,
    timezone,
    facts,
  };
  const resolved = resolveWindowInstants(input);
  if (!resolved) return unknown;

  const now = input.now ?? new Date();
  const t = now.getTime();
  const relation: WindowRelation =
    t < resolved.startMs ? 'upcoming' : t >= resolved.endMs ? 'past' : 'current';
  return {
    relation,
    date: resolved.date,
    start: resolved.start,
    end: resolved.end,
    timezone: resolved.timezone,
    facts: resolved.facts,
  };
}

export function parseTimedWindowValue(value: string): {
  start: string | null;
  end: string | null;
  timezone: string | null;
} {
  const match = WINDOW_RE.exec(value);
  if (!match) return { start: null, end: null, timezone: null };
  return { start: match[1], end: match[2], timezone: match[3] ?? null };
}

export function splitNoteGroups(value: string): string[] {
  return value
    .split(/\s*·\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}
