export type MoonPhaseKey =
  | 'new_moon'
  | 'waxing_crescent'
  | 'first_quarter'
  | 'waxing_gibbous'
  | 'full_moon'
  | 'waning_gibbous'
  | 'last_quarter'
  | 'waning_crescent';

export interface MoonPhaseInfo {
  key: MoonPhaseKey;
  fraction: number;
  illumination: number;
  waxing: boolean;
}

const SYNODIC_MONTH = 29.530588853;
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14);

export function getMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  const days = (date.getTime() - REFERENCE_NEW_MOON_MS) / 86_400_000;
  const phaseDays = ((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const fraction = phaseDays / SYNODIC_MONTH;
  const illumination = (1 - Math.cos(2 * Math.PI * fraction)) / 2;
  const waxing = fraction < 0.5;

  let key: MoonPhaseKey;
  if (fraction < 0.03 || fraction > 0.97) key = 'new_moon';
  else if (fraction < 0.22) key = 'waxing_crescent';
  else if (fraction < 0.28) key = 'first_quarter';
  else if (fraction < 0.47) key = 'waxing_gibbous';
  else if (fraction < 0.53) key = 'full_moon';
  else if (fraction < 0.72) key = 'waning_gibbous';
  else if (fraction < 0.78) key = 'last_quarter';
  else key = 'waning_crescent';

  return { key, fraction, illumination, waxing };
}

export const MOON_PHASE_NAMES: Record<string, Record<MoonPhaseKey, string>> = {
  en: {
    new_moon: 'New Moon',
    waxing_crescent: 'Waxing Crescent',
    first_quarter: 'First Quarter',
    waxing_gibbous: 'Waxing Gibbous',
    full_moon: 'Full Moon',
    waning_gibbous: 'Waning Gibbous',
    last_quarter: 'Last Quarter',
    waning_crescent: 'Waning Crescent',
  },
  ru: {
    new_moon: 'Новолуние',
    waxing_crescent: 'Растущий серп',
    first_quarter: 'Первая четверть',
    waxing_gibbous: 'Растущая луна',
    full_moon: 'Полнолуние',
    waning_gibbous: 'Убывающая луна',
    last_quarter: 'Последняя четверть',
    waning_crescent: 'Убывающий серп',
  },
  fa: {
    new_moon: 'ماه نو',
    waxing_crescent: 'هلال رو به رشد',
    first_quarter: 'نیم‌ماه اول',
    waxing_gibbous: 'ماه رو به کمال',
    full_moon: 'ماه کامل',
    waning_gibbous: 'ماه رو به کاهش',
    last_quarter: 'نیم‌ماه پایانی',
    waning_crescent: 'هلال رو به کاهش',
  },
  ar: {
    new_moon: 'محاق',
    waxing_crescent: 'هلال متزايد',
    first_quarter: 'تربيع أول',
    waxing_gibbous: 'أحدب متزايد',
    full_moon: 'بدر',
    waning_gibbous: 'أحدب متناقص',
    last_quarter: 'تربيع آخر',
    waning_crescent: 'هلال متناقص',
  },
};
