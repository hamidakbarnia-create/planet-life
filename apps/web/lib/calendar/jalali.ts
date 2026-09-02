/**
 * Deterministic Jalali (Solar Hijri / Shamsi) ↔ Gregorian civil conversion.
 *
 * ASK input normalization only. Canonical storage/execution stays Gregorian
 * ISO `YYYY-MM-DD`. Calendar arithmetic lives here; linguistic recognition of
 * Jalali dates lives in `lib/decision-frame/resolve.ts`.
 *
 * Pure integer arithmetic (Birashk break-year table). No dependency, no Intl,
 * no `Date` string parsing, no locale or timezone input.
 */

/**
 * Jalali years ASK will accept as strong evidence, inclusive.
 *
 * Mirrors the existing Gregorian parser horizon, which only accepts `20\d{2}`
 * (2000–2099): Gregorian 2000-01-01 falls in 1378 and 2099-12-31 in 1478. The
 * range is intentionally disjoint from 20xx so a 4-digit year identifies its
 * own calendar and `2026/09/16` can never be read as Jalali.
 */
export const JALALI_YEAR_MIN = 1378;
export const JALALI_YEAR_MAX = 1478;

export type JalaliYmd = { year: number; month: number; day: number };
export type GregorianYmd = { year: number; month: number; day: number };

/** Birashk break years — bounds of the arithmetic's validity. */
const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
  2192, 2262, 2324, 2394, 2456, 3178,
] as const;

const JALALI_ARITHMETIC_MIN = BREAKS[0];
const JALALI_ARITHMETIC_MAX = BREAKS[BREAKS.length - 1] as number;

function div(a: number, b: number): number {
  return Math.trunc(a / b);
}

function mod(a: number, b: number): number {
  return a - Math.trunc(a / b) * b;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function isConvertibleJalaliYear(year: number): boolean {
  return (
    Number.isInteger(year) &&
    year >= JALALI_ARITHMETIC_MIN &&
    year < JALALI_ARITHMETIC_MAX
  );
}

/**
 * Leap/offset data for a Jalali year: `leap` is the year's position in the
 * 4-year leap cycle (0 = leap year), `march` the Gregorian March day holding
 * 1 Farvardin.
 */
function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp: number = BREAKS[0];
  let jump = 0;

  for (let i = 1; i < bl; i += 1) {
    const jm = BREAKS[i] as number;
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

/** Gregorian civil date → Julian Day Number. */
function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

/** Julian Day Number → Gregorian civil date. */
function d2g(jdn: number): GregorianYmd {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const day = div(mod(i, 153), 5) + 1;
  const month = mod(div(i, 153), 12) + 1;
  const year = div(j, 1461) - 100100 + div(8 - month, 6);
  return { year, month, day };
}

/** Jalali civil date → Julian Day Number. */
function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

/** Julian Day Number → Jalali civil date. */
function d2j(jdn: number): JalaliYmd {
  const gy = d2g(jdn).year;
  let jy = gy - 621;
  const r = jalCal(jy);
  let k = jdn - g2d(gy, 3, r.march);

  if (k >= 0) {
    if (k <= 185) {
      return { year: jy, month: 1 + div(k, 31), day: mod(k, 31) + 1 };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }

  return { year: jy, month: 7 + div(k, 30), day: mod(k, 30) + 1 };
}

/** True when Esfand has 30 days in this Jalali year. */
export function isJalaliLeapYear(year: number): boolean {
  if (!isConvertibleJalaliYear(year)) return false;
  return jalCal(year).leap === 0;
}

/** Days in a Jalali month, or 0 when the month is out of 1–12. */
export function jalaliMonthLength(year: number, month: number): number {
  if (!Number.isInteger(month) || month < 1 || month > 12) return 0;
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isJalaliLeapYear(year) ? 30 : 29;
}

/** True when the year is inside the ASK-supported Jalali horizon. */
export function isJalaliYearInProductRange(year: number): boolean {
  return (
    Number.isInteger(year) && year >= JALALI_YEAR_MIN && year <= JALALI_YEAR_MAX
  );
}

/** Civil validity of a Jalali Y/M/D, including Esfand leap length. */
export function isValidJalaliDate(
  year: number,
  month: number,
  day: number
): boolean {
  if (!isConvertibleJalaliYear(year)) return false;
  if (!Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= jalaliMonthLength(year, month);
}

/** Gregorian civil date → Jalali civil date. */
export function gregorianToJalali(
  year: number,
  month: number,
  day: number
): JalaliYmd {
  return d2j(g2d(year, month, day));
}

/**
 * Valid Jalali civil date → Gregorian ISO `YYYY-MM-DD`.
 * Returns null for invalid input — never normalizes into a nearby date.
 */
export function jalaliToGregorianIso(
  year: number,
  month: number,
  day: number
): string | null {
  if (!isValidJalaliDate(year, month, day)) return null;
  const g = d2g(j2d(year, month, day));
  return `${g.year}-${pad2(g.month)}-${pad2(g.day)}`;
}

/** Jalali year containing a Gregorian ISO date, or null when not ISO. */
export function jalaliYearContainingIso(isoDate: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return null;
  const gy = Number(m[1]);
  const gm = Number(m[2]);
  const gd = Number(m[3]);
  if (gm < 1 || gm > 12 || gd < 1 || gd > 31) return null;
  return gregorianToJalali(gy, gm, gd).year;
}
