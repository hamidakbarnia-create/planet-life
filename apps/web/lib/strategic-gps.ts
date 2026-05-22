import type { AppLang } from './app-settings';
import { formatHourLabel, type HourScore } from './calendar-scores';

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
}

const GPS_TEXT: Record<AppLang, GpsTextPack> = {
  en: {
    title: 'Strategic GPS',
    subtitle: 'Your month, weeks, and selected day as a road map.',
    macro: 'Macro lane',
    meso: 'Weekly route',
    micro: 'Daily timeline',
    noData: 'Generate the month to read the route.',
    monthGreen: 'Open highway: this month has strong forward motion.',
    monthYellow: 'Supportive road: useful progress with normal care.',
    monthOrange: 'Foggy road: keep plans flexible and double-check details.',
    monthRed: 'Slow lane: reduce risk and use the month for repair.',
    goldenDays: 'golden days',
    cautionDays: 'caution days',
    week: 'Week',
    weekGreen: 'advance',
    weekYellow: 'build',
    weekOrange: 'review',
    weekRed: 'pause',
    bestHour: 'Best hour',
    riskHour: 'Risk hour',
    noHourly: 'Select a day to load hourly guidance.',
  },
  ru: {
    title: 'Стратегический GPS',
    subtitle: 'Месяц, недели и выбранный день как карта маршрута.',
    macro: 'Макро-линия',
    meso: 'Маршрут недели',
    micro: 'Дневная линия',
    noData: 'Сгенерируйте месяц, чтобы увидеть маршрут.',
    monthGreen: 'Открытая трасса: месяц даёт сильное движение вперёд.',
    monthYellow: 'Поддерживающая дорога: прогресс с обычной осторожностью.',
    monthOrange: 'Туманная дорога: держите планы гибкими.',
    monthRed: 'Медленная линия: снижайте риск и чините систему.',
    goldenDays: 'золотых дней',
    cautionDays: 'дней осторожности',
    week: 'Неделя',
    weekGreen: 'вперёд',
    weekYellow: 'строить',
    weekOrange: 'проверка',
    weekRed: 'пауза',
    bestHour: 'Лучший час',
    riskHour: 'Риск-час',
    noHourly: 'Выберите день, чтобы загрузить часы.',
  },
  fa: {
    title: 'GPS استراتژیک',
    subtitle: 'ماه، هفته‌ها و روز انتخاب‌شده به شکل نقشه راه.',
    macro: 'لاین کلان',
    meso: 'مسیر هفتگی',
    micro: 'خط زمان روزانه',
    noData: 'ماه را تولید کن تا مسیر خوانده شود.',
    monthGreen: 'بزرگراه باز: این ماه حرکت رو به جلو قوی دارد.',
    monthYellow: 'جاده مساعد: پیشرفت خوب با احتیاط معمول.',
    monthOrange: 'جاده مه‌آلود: برنامه‌ها را منعطف نگه دار.',
    monthRed: 'لاین کند: ریسک را کم کن و ماه را برای ترمیم بگذار.',
    goldenDays: 'روز طلایی',
    cautionDays: 'روز احتیاط',
    week: 'هفته',
    weekGreen: 'حرکت',
    weekYellow: 'ساختن',
    weekOrange: 'بازبینی',
    weekRed: 'توقف',
    bestHour: 'بهترین ساعت',
    riskHour: 'ساعت ریسک',
    noHourly: 'یک روز را انتخاب کن تا راهنمای ساعتی بیاید.',
  },
  ar: {
    title: 'GPS استراتيجي',
    subtitle: 'الشهر والأسابيع واليوم المحدد كخريطة طريق.',
    macro: 'المسار الكلي',
    meso: 'مسار الأسبوع',
    micro: 'خط اليوم',
    noData: 'أنشئ الشهر لقراءة المسار.',
    monthGreen: 'طريق مفتوح: هذا الشهر يدعم الحركة القوية.',
    monthYellow: 'طريق داعم: تقدم جيد مع حذر عادي.',
    monthOrange: 'طريق ضبابي: اجعل الخطط مرنة.',
    monthRed: 'مسار بطيء: قلل المخاطر واستخدم الشهر للإصلاح.',
    goldenDays: 'أيام ذهبية',
    cautionDays: 'أيام حذر',
    week: 'أسبوع',
    weekGreen: 'تقدم',
    weekYellow: 'بناء',
    weekOrange: 'مراجعة',
    weekRed: 'توقف',
    bestHour: 'أفضل ساعة',
    riskHour: 'ساعة الخطر',
    noHourly: 'اختر يوماً لتحميل الإرشاد الساعي.',
  },
};

export interface StrategicGpsWeek {
  label: string;
  score: number | null;
  tone: GpsTone;
  action: string;
}

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

export function buildStrategicGps(
  scores: Record<string, number>,
  hourly: HourScore[],
  lang: AppLang
): StrategicGps {
  const text = GPS_TEXT[lang] ?? GPS_TEXT.en;
  const values = Object.values(scores).filter((score) => typeof score === 'number');
  const monthScore = average(values);
  const monthTone = toneFromScore(monthScore);
  const goldenCount = values.filter((score) => score >= 85).length;
  const cautionCount = values.filter((score) => score < 40).length;

  const weekBuckets = new Map<number, number[]>();
  for (const [date, score] of Object.entries(scores)) {
    if (typeof score !== 'number') continue;
    const day = Number(date.slice(-2));
    if (!Number.isFinite(day)) continue;
    const week = Math.floor((day - 1) / 7) + 1;
    const bucket = weekBuckets.get(week) ?? [];
    bucket.push(score);
    weekBuckets.set(week, bucket);
  }

  const weeks = Array.from({ length: 5 }, (_, index) => {
    const score = average(weekBuckets.get(index + 1) ?? []);
    const tone = toneFromScore(score);
    return {
      label: `${text.week} ${index + 1}`,
      score,
      tone,
      action: weekAction(tone, text),
    };
  });

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

export const GPS_TONE_STYLES: Record<GpsTone, { color: string; bg: string; border: string }> = {
  green: { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.35)' },
  yellow: { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.35)' },
  orange: { color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.35)' },
  red: { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.35)' },
  empty: { color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' },
};
