import { formatDateYMD } from './calendar-scores';

export function calendarCells(year: number, month: number) {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const total = new Date(year, month, 0).getDate();
  const cells: Array<{ day: number | null; date: string | null }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, date: null });
  for (let d = 1; d <= total; d++) {
    cells.push({ day: d, date: formatDateYMD(year, month, d) });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, date: null });
  return cells;
}

export function todayYMD(): string {
  const d = new Date();
  return formatDateYMD(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
