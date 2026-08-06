import type { AppLang, CalendarSystem } from './app-settings';
import { formatHourLabel, type HourScore } from './calendar-scores';
import { parseIsoDate, sundayWeekDatesContaining } from './calendar-utils';
import { DATE_LOCALES, formatCompactCalendarDate } from './date-format';

type GpsTone = 'green' | 'yellow' | 'orange' | 'red' | 'empty';

interface GpsTextPack {
  title: string;
  subtitle: string;
  macro: string;
  meso: string;
  micro: string;
  noData: string;
  monthGreen: string;
  monthYellow: string;
  monthOrange: string;
  monthRed: string;
  goldenDays: string;
  cautionDays: string;
  week: string;
  weekGreen: string;
  weekYellow: string;
  weekOrange: string;
  weekRed: string;
  bestHour: string;
  riskHour: string;
  noHourly: string;
  monthOutlook: string;
  weeklyPath: string;
  selectedDayTiming: string;
  selectedDayScope: string;
}

const GPS_TEXT: Record<AppLang, GpsTextPack> = {
  en: {
    title: 'Decision Timing',
    subtitle: 'Your month, weeks, and selected day as a road map.',
    macro: 'Macro lane',
    meso: 'Weekly route',
    micro: 'Daily timeline',
    noData: 'Generate the month to read the route.',
    monthGreen: 'Open highway: this month has strong forward motion.',
    monthYellow: 'Supportive road: useful progress with normal care.',
    monthOrange: 'Foggy road: keep plans flexible and double-check details.',
    monthRed: 'Slow lane: reduce risk and use the month for repair.',
    goldenDays: 'high-readiness days',
    cautionDays: 'caution days',
    week: 'Week',
    weekGreen: 'advance',
    weekYellow: 'build',
    weekOrange: 'review',
    weekRed: 'pause',
    bestHour: 'Best hour',
    riskHour: 'Risk hour',
    noHourly: 'Select a day to load hourly guidance.',
    monthOutlook: 'Month Outlook',
    weeklyPath: 'Weekly Path',
    selectedDayTiming: 'Selected Day Timing',
    selectedDayScope: 'Selected day',
  },
  ru: {
    title: 'Тайминг решений',
    subtitle: 'Месяц, недели и выбранный день как карта маршрута.',
    macro: 'Макро-линия',
    meso: 'Маршрут недели',
    micro: 'Дневная линия',
    noData: 'Сгенерируйте месяц, чтобы увидеть маршрут.',
    monthGreen: 'Открытая трасса: месяц даёт сильное движение вперёд.',
    monthYellow: 'Поддерживающая дорога: прогресс с обычной осторожностью.',
    monthOrange: 'Туманная дорога: держите планы гибкими.',
    monthRed: 'Медленная линия: снижайте риск и чините систему.',
    goldenDays: 'дней высокой готовности',
    cautionDays: 'дней осторожности',
    week: 'Неделя',
    weekGreen: 'вперёд',
    weekYellow: 'строить',
    weekOrange: 'проверка',
    weekRed: 'пауза',
    bestHour: 'Лучший час',
    riskHour: 'Риск-час',
    noHourly: 'Выберите день, чтобы загрузить часы.',
    monthOutlook: 'Обзор месяца',
    weeklyPath: 'Путь недели',
    selectedDayTiming: 'Тайминг выбранного дня',
    selectedDayScope: 'Выбранный день',
  },
  fa: {
    title: 'زمان‌بندی تصمیم',
    subtitle: 'ماه، هفته‌ها و روز انتخاب‌شده به شکل نقشه راه.',
    macro: 'لاین کلان',
    meso: 'مسیر هفتگی',
    micro: 'خط زمان روزانه',
    noData: 'ماه را تولید کن تا مسیر خوانده شود.',
    monthGreen: 'بزرگراه باز: این ماه حرکت رو به جلو قوی دارد.',
    monthYellow: 'جاده مساعد: پیشرفت خوب با احتیاط معمول.',
    monthOrange: 'جاده مه‌آلود: برنامه‌ها را منعطف نگه دار.',
    monthRed: 'لاین کند: ریسک را کم کن و ماه را برای ترمیم بگذار.',
    goldenDays: 'روز آمادگی بالا',
    cautionDays: 'روز احتیاط',
    week: 'هفته',
    weekGreen: 'حرکت',
    weekYellow: 'ساختن',
    weekOrange: 'بازبینی',
    weekRed: 'توقف',
    bestHour: 'بهترین ساعت',
    riskHour: 'ساعت ریسک',
    noHourly: 'یک روز را انتخاب کن تا راهنمای ساعتی بیاید.',
    monthOutlook: 'چشم‌انداز ماه',
    weeklyPath: 'مسیر هفتگی',
    selectedDayTiming: 'زمان‌بندی روز انتخاب‌شده',
    selectedDayScope: 'روز انتخاب‌شده',
  },
  ar: {
    title: 'توقيت القرار',
    subtitle: 'الشهر والأسابيع واليوم المحدد كخريطة طريق.',
    macro: 'المسار الكلي',
    meso: 'مسار الأسبوع',
    micro: 'خط اليوم',
    noData: 'أنشئ الشهر لقراءة المسار.',
    monthGreen: 'طريق مفتوح: هذا الشهر يدعم الحركة القوية.',
    monthYellow: 'طريق داعم: تقدم جيد مع حذر عادي.',
    monthOrange: 'طريق ضبابي: اجعل الخطط مرنة.',
    monthRed: 'مسار بطيء: قلل المخاطر واستخدم الشهر للإصلاح.',
    goldenDays: 'أيام جاهزية عالية',
    cautionDays: 'أيام حذر',
    week: 'أسبوع',
    weekGreen: 'تقدم',
    weekYellow: 'بناء',
    weekOrange: 'مراجعة',
    weekRed: 'توقف',
    bestHour: 'أفضل ساعة',
    riskHour: 'ساعة الخطر',
    noHourly: 'اختر يوماً لتحميل الإرشاد الساعي.',
    monthOutlook: 'نظرة الشهر',
    weeklyPath: 'المسار الأسبوعي',
    selectedDayTiming: 'توقيت اليوم المحدد',
    selectedDayScope: 'اليوم المحدد',
  },
};

export interface StrategicGpsWeek {
  /** Localized weekday or compact date axis label. */
  label: string;
  /** Exact `scores[date]` from the canonical month score map (never avg/max). */
  score: number | null;
  tone: GpsTone;
  action: string;
  /** Date (YYYY-MM-DD) for this path point. */
  date: string | null;
  /** Single-date membership for highlight/sync (length 0–1). */
  dates: string[];
}

export type BuildStrategicGpsOptions = {
  /** Canonical selected Gregorian ISO date — Weekly Path is this date's Sunday-start week. */
  selectedDate?: string | null;
  /** Active display calendar for compact cross-month axis labels. */
  calendar?: CalendarSystem;
};

export interface StrategicGps {
  text: GpsTextPack;
  monthScore: number | null;
  monthTone: GpsTone;
  monthBody: string;
  goldenCount: number;
  cautionCount: number;
  weeks: StrategicGpsWeek[];
  bestHour: HourScore | null;
  riskHour: HourScore | null;
  bestHourLabel: string | null;
  riskHourLabel: string | null;
}

function toneFromScore(score: number | null): GpsTone {
  if (score == null || Number.isNaN(score)) return 'empty';
  if (score >= 85) return 'green';
  if (score >= 60) return 'yellow';
  if (score >= 40) return 'orange';
  return 'red';
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function monthBodyFor(tone: GpsTone, text: GpsTextPack): string {
  if (tone === 'green') return text.monthGreen;
  if (tone === 'yellow') return text.monthYellow;
  if (tone === 'orange') return text.monthOrange;
  if (tone === 'red') return text.monthRed;
  return text.noData;
}

function weekAction(tone: GpsTone, text: GpsTextPack): string {
  if (tone === 'green') return text.weekGreen;
  if (tone === 'yellow') return text.weekYellow;
  if (tone === 'orange') return text.weekOrange;
  if (tone === 'red') return text.weekRed;
  return text.noData;
}

function shortWeekdayLabel(isoDate: string, lang: AppLang): string {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return isoDate;
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  return new Intl.DateTimeFormat(DATE_LOCALES[lang] ?? DATE_LOCALES.en, {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(date);
}

/** Weekday when in the selected date's month; compact date when the week crosses months. */
export function weeklyPathAxisLabel(
  isoDate: string,
  selectedDate: string,
  lang: AppLang,
  calendar: CalendarSystem
): string {
  const point = parseIsoDate(isoDate);
  const selected = parseIsoDate(selectedDate);
  if (
    point &&
    selected &&
    (point.year !== selected.year || point.month !== selected.month)
  ) {
    return formatCompactCalendarDate(lang, isoDate, calendar);
  }
  return shortWeekdayLabel(isoDate, lang);
}

/**
 * Weekly Path = seven canonical day scores for the Sunday-start week containing
 * `selectedDate`. Each point is `scores[date]` exactly — no average, no max.
 */
export function buildWeeklyPathPoints(
  scores: Record<string, number>,
  selectedDate: string | null | undefined,
  lang: AppLang,
  calendar: CalendarSystem = 'gregorian',
  text?: GpsTextPack
): StrategicGpsWeek[] {
  const pack = text ?? GPS_TEXT[lang] ?? GPS_TEXT.en;
  if (!selectedDate) return [];
  return sundayWeekDatesContaining(selectedDate).map((date) => {
    const raw = scores[date];
    const score =
      typeof raw === 'number' && !Number.isNaN(raw) ? raw : null;
    const tone = toneFromScore(score);
    return {
      label: weeklyPathAxisLabel(date, selectedDate, lang, calendar),
      score,
      tone,
      action: weekAction(tone, pack),
      date,
      dates: [date],
    };
  });
}

export function buildStrategicGps(
  scores: Record<string, number>,
  hourly: HourScore[],
  lang: AppLang,
  options: BuildStrategicGpsOptions = {}
): StrategicGps {
  const text = GPS_TEXT[lang] ?? GPS_TEXT.en;
  const values = Object.values(scores).filter((score) => typeof score === 'number');
  const monthScore = average(values);
  const monthTone = toneFromScore(monthScore);
  const goldenCount = values.filter((score) => score >= 85).length;
  const cautionCount = values.filter((score) => score < 40).length;
  const calendar = options.calendar ?? 'gregorian';

  const weeks = buildWeeklyPathPoints(
    scores,
    options.selectedDate,
    lang,
    calendar,
    text
  );

  const bestHour = hourly.length
    ? hourly.reduce((best, hour) => (hour.score > best.score ? hour : best), hourly[0])
    : null;
  const riskHour = hourly.length
    ? hourly.reduce((worst, hour) => (hour.score < worst.score ? hour : worst), hourly[0])
    : null;

  return {
    text,
    monthScore,
    monthTone,
    monthBody: monthBodyFor(monthTone, text),
    goldenCount,
    cautionCount,
    weeks,
    bestHour,
    riskHour,
    bestHourLabel: bestHour ? formatHourLabel(bestHour.hour, lang) : null,
    riskHourLabel: riskHour ? formatHourLabel(riskHour.hour, lang) : null,
  };
}

/**
 * Tier 3 domain presentation map (DS-01 registry).
 * ADR-DS-001 Principle 3: raw literals — semantic token consumption deferred.
 * @see docs/design/system/design-token-registry.md
 */
export const GPS_TONE_STYLES: Record<GpsTone, { color: string; bg: string; border: string }> = {
  green: { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.35)' },
  yellow: { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.35)' },
  orange: { color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.35)' },
  red: { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.35)' },
  empty: { color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' },
};
