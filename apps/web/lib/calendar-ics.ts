import type { CalendarExportMode } from './calendar-preferences';
import { isDangerHour, isGoldenHour, scoreToBand } from './calendar-scores';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function dateToIcs(d: string) {
  return d.replace(/-/g, '');
}

function escapeIcs(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function uid(date: string, suffix: string) {
  return `${date}-${suffix}@planet-life`;
}

export function buildMonthIcs(
  scores: Record<string, number>,
  mode: CalendarExportMode,
  labels: { golden: string; danger: string; dayScore: string }
): string | null {
  if (mode === 'notifications') return null;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Planet Life//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const dates = Object.keys(scores).sort();

  for (const date of dates) {
    const score = scores[date];
    const band = scoreToBand(score);
    const includeAll = mode === 'all';
    const includeImportant =
      mode === 'important' && (score >= 85 || score <= 39);

    if (!includeAll && !includeImportant) continue;

    const isGolden = score >= 85;
    const isDanger = score <= 39;
    const summary = isGolden
      ? `${labels.golden} (${score}/100)`
      : isDanger
        ? `${labels.danger} (${score}/100)`
        : `${labels.dayScore}: ${score}/100`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid(date, 'day')}`);
    lines.push(`DTSTART;VALUE=DATE:${dateToIcs(date)}`);
    lines.push(
      `DTEND;VALUE=DATE:${dateToIcs(
        (() => {
          const d = new Date(date + 'T12:00:00');
          d.setDate(d.getDate() + 1);
          return d.toISOString().slice(0, 10);
        })()
      )}`
    );
    lines.push(`SUMMARY:${escapeIcs(summary)}`);
    lines.push(
      `DESCRIPTION:${escapeIcs(`Planet Life score ${score}/100. Band: ${band}.`)}`
    );
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function buildDayHourlyIcs(
  date: string,
  hourly: { hour: number; score: number }[],
  mode: CalendarExportMode,
  labels: { golden: string; danger: string }
): string | null {
  if (mode === 'notifications') return null;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Planet Life//Hourly//EN',
    'CALSCALE:GREGORIAN',
  ];

  for (const { hour, score } of hourly) {
    const includeAll = mode === 'all';
    const includeImportant =
      mode === 'important' && (isGoldenHour(score) || isDangerHour(score));
    if (!includeAll && !includeImportant) continue;

    const start = `${dateToIcs(date)}T${pad(hour)}0000`;
    const endHour = hour + 1;
    const end =
      endHour >= 24
        ? `${dateToIcs(
            new Date(new Date(date + 'T12:00:00').getTime() + 86400000)
              .toISOString()
              .slice(0, 10)
          )}T000000`
        : `${dateToIcs(date)}T${pad(endHour)}0000`;

    const summary = isGoldenHour(score)
      ? `${labels.golden} ${pad(hour)}:00 (${score})`
      : isDangerHour(score)
        ? `${labels.danger} ${pad(hour)}:00 (${score})`
        : `Planet Life ${pad(hour)}:00 — ${score}/100`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid(date, `h${hour}`)}`);
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
    lines.push(`SUMMARY:${escapeIcs(summary)}`);
    lines.push(`DESCRIPTION:${escapeIcs(`Hourly score ${score}/100`)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcs(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
