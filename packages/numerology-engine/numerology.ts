/** ISO date string in `YYYY-MM-DD` form. */
type IsoDateString = string;

const PYTHAGOREAN_LETTER_VALUES: Record<string, number> = {
  A: 1,
  J: 1,
  S: 1,
  B: 2,
  K: 2,
  T: 2,
  C: 3,
  L: 3,
  U: 3,
  D: 4,
  M: 4,
  V: 4,
  E: 5,
  N: 5,
  W: 5,
  F: 6,
  O: 6,
  X: 6,
  G: 7,
  P: 7,
  Y: 7,
  H: 8,
  Q: 8,
  Z: 8,
  I: 9,
  R: 9,
};

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Sums the decimal digits of a non-negative integer.
 */
function sumDigits(value: number): number {
  return String(Math.abs(Math.trunc(value)))
    .split("")
    .reduce((total, digit) => total + Number(digit), 0);
}

/**
 * Repeatedly sums digits until the value is a single digit from 1 to 9.
 */
function reduceToSingleDigit(value: number): number {
  let current = Math.abs(Math.trunc(value));

  while (current > 9) {
    current = sumDigits(current);
  }

  return current;
}

/**
 * Parses and validates an ISO date string (`YYYY-MM-DD`).
 */
function parseIsoDate(date: IsoDateString): {
  year: number;
  month: number;
  day: number;
} {
  const match = ISO_DATE_PATTERN.exec(date);

  if (!match) {
    throw new Error(`Invalid date format: expected YYYY-MM-DD, got "${date}"`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Invalid date components in "${date}"`);
  }

  return { year, month, day };
}

/**
 * Maps a single alphabetic character to its Pythagorean value (1–9).
 * Non-letters return 0 and are ignored by callers.
 */
function letterToPythagoreanValue(character: string): number {
  return PYTHAGOREAN_LETTER_VALUES[character.toUpperCase()] ?? 0;
}

/**
 * Calculates the Life Path number from a birth date.
 *
 * The year, month, and day are each reduced to a single digit (1–9), summed,
 * then reduced again to produce the final Life Path (1–9).
 *
 * @param birthDate - Birth date in `YYYY-MM-DD` format.
 * @returns Life Path number between 1 and 9.
 */
export function calculateLifePathNumber(birthDate: string): number {
  const { year, month, day } = parseIsoDate(birthDate);

  const reducedYear = reduceToSingleDigit(year);
  const reducedMonth = reduceToSingleDigit(month);
  const reducedDay = reduceToSingleDigit(day);

  return reduceToSingleDigit(reducedYear + reducedMonth + reducedDay);
}

/**
 * Calculates the Personal Day number for a target date relative to a birth date.
 *
 * 1. Personal Year: reduced birth month + reduced birth day + reduced target year.
 * 2. Personal Month: reduced (Personal Year + reduced target calendar month).
 * 3. Personal Day: reduced (Personal Month + reduced target calendar day).
 *
 * @param birthDate - Birth date in `YYYY-MM-DD` format.
 * @param targetDate - Date to evaluate in `YYYY-MM-DD` format.
 * @returns Personal Day number between 1 and 9.
 */
export function calculatePersonalDayNumber(
  birthDate: string,
  targetDate: string,
): number {
  const birth = parseIsoDate(birthDate);
  const target = parseIsoDate(targetDate);

  const personalYear = reduceToSingleDigit(
    reduceToSingleDigit(birth.month) +
      reduceToSingleDigit(birth.day) +
      reduceToSingleDigit(target.year),
  );

  const personalMonth = reduceToSingleDigit(
    personalYear + reduceToSingleDigit(target.month),
  );

  return reduceToSingleDigit(
    personalMonth + reduceToSingleDigit(target.day),
  );
}

/**
 * Calculates the Expression (Destiny) number from a full name.
 *
 * Each letter is converted via the Pythagorean chart (A/J/S = 1 through I/R = 9),
 * non-letters are ignored, the values are summed, then reduced to a single digit (1–9).
 *
 * @param fullName - Person's full name (any casing; spaces and punctuation ignored).
 * @returns Expression number between 1 and 9.
 */
export function calculateExpressionNumber(fullName: string): number {
  const total = [...fullName].reduce((sum, character) => {
    return sum + letterToPythagoreanValue(character);
  }, 0);

  if (total === 0) {
    throw new Error("Name must contain at least one alphabetic character");
  }

  return reduceToSingleDigit(total);
}
