/**
 * Centralized localization for Package driver factor_key values.
 * Templates + token tables only — never invents astrology beyond keyed evidence.
 */

import type { AppLang } from '@/lib/app-settings';
import { getAskProductCopy } from './copy';

export type LocalizedEvidenceFactor = {
  title: string;
  detail?: string;
};

type TokenTable = Record<string, string>;

const PLANETS: Record<AppLang, TokenTable> = {
  en: {
    sun: 'Sun',
    moon: 'Moon',
    mercury: 'Mercury',
    venus: 'Venus',
    mars: 'Mars',
    jupiter: 'Jupiter',
    saturn: 'Saturn',
    uranus: 'Uranus',
    neptune: 'Neptune',
    pluto: 'Pluto',
  },
  fa: {
    sun: 'خورشید',
    moon: 'ماه',
    mercury: 'عطارد',
    venus: 'زهره',
    mars: 'مریخ',
    jupiter: 'مشتری',
    saturn: 'زحل',
    uranus: 'اورانوس',
    neptune: 'نپتون',
    pluto: 'پلوتون',
  },
  ar: {
    sun: 'الشمس',
    moon: 'القمر',
    mercury: 'عطارد',
    venus: 'الزهرة',
    mars: 'المريخ',
    jupiter: 'المشتري',
    saturn: 'زحل',
    uranus: 'أورانوس',
    neptune: 'نبتون',
    pluto: 'بلوتو',
  },
  ru: {
    sun: 'Солнце',
    moon: 'Луна',
    mercury: 'Меркурий',
    venus: 'Венера',
    mars: 'Марс',
    jupiter: 'Юпитер',
    saturn: 'Сатурн',
    uranus: 'Уран',
    neptune: 'Нептун',
    pluto: 'Плутон',
  },
};

const ASPECTS: Record<AppLang, TokenTable> = {
  en: {
    conjunction: 'conjunction',
    opposition: 'opposition',
    trine: 'trine',
    square: 'square',
    sextile: 'sextile',
    quincunx: 'quincunx',
    semisextile: 'semisextile',
    semisquare: 'semisquare',
    sesquiquadrate: 'sesquiquadrate',
  },
  fa: {
    conjunction: 'مقارنه',
    opposition: 'مقابل',
    trine: 'تثلیث',
    square: 'تربیع',
    sextile: 'تسدیس',
    quincunx: 'کویینکانکس',
    semisextile: 'نیم‌تسدیس',
    semisquare: 'نیم‌تربیع',
    sesquiquadrate: 'سه‌نیم‌تربیع',
  },
  ar: {
    conjunction: 'اقتران',
    opposition: 'مقابلة',
    trine: 'تثليث',
    square: 'تربيع',
    sextile: 'تسديس',
    quincunx: 'كوينكنكس',
    semisextile: 'شبه تسديس',
    semisquare: 'شبه تربيع',
    sesquiquadrate: 'تربيع ونصف',
  },
  ru: {
    conjunction: 'соединение',
    opposition: 'оппозиция',
    trine: 'трин',
    square: 'квадрат',
    sextile: 'секстиль',
    quincunx: 'квиконс',
    semisextile: 'полусекстиль',
    semisquare: 'полуквадрат',
    sesquiquadrate: 'полутораквадрат',
  },
};

const ANGLES: Record<AppLang, TokenTable> = {
  en: { asc: 'ASC', dsc: 'DSC', mc: 'MC', ic: 'IC' },
  fa: { asc: 'طالع', dsc: 'غارب', mc: 'وسط‌السماء', ic: 'قاع‌السماء' },
  ar: { asc: 'الصاعد', dsc: 'الهابط', mc: 'وسط السماء', ic: 'قاع السماء' },
  ru: { asc: 'ASC', dsc: 'DSC', mc: 'MC', ic: 'IC' },
};

const LOCATION_MODES: Record<AppLang, TokenTable> = {
  en: {
    birthonly: 'birth location',
    currentliving: 'current living location',
    eventlocation: 'event location',
    targetsubject: 'target location',
    birthandtarget: 'birth and target location',
  },
  fa: {
    birthonly: 'محل تولد',
    currentliving: 'محل زندگی فعلی',
    eventlocation: 'محل رویداد',
    targetsubject: 'محل هدف',
    birthandtarget: 'محل تولد و هدف',
  },
  ar: {
    birthonly: 'مكان الولادة',
    currentliving: 'مكان المعيشة الحالي',
    eventlocation: 'مكان الحدث',
    targetsubject: 'المكان المستهدف',
    birthandtarget: 'مكان الولادة والهدف',
  },
  ru: {
    birthonly: 'место рождения',
    currentliving: 'текущее место жизни',
    eventlocation: 'место события',
    targetsubject: 'целевое место',
    birthandtarget: 'место рождения и цель',
  },
};

function token(
  table: Record<AppLang, TokenTable>,
  lang: AppLang,
  key: string
): string | null {
  return table[lang]?.[key] ?? table.en[key] ?? null;
}

function houseOrdinal(lang: AppLang, n: number): string {
  if (lang === 'fa') return `خانه ${n}`;
  if (lang === 'ar') return `البيت ${n}`;
  if (lang === 'ru') return `${n}-й дом`;
  const en: Record<number, string> = {
    1: '1st',
    2: '2nd',
    3: '3rd',
    4: '4th',
    5: '5th',
    6: '6th',
    7: '7th',
    8: '8th',
    9: '9th',
    10: '10th',
    11: '11th',
    12: '12th',
  };
  return `${en[n] ?? String(n)} house`;
}

export type EvidenceFactorFallbackContext = {
  polarity: 'supportive' | 'cautionary' | 'neutral';
  label?: string;
  importance?: string;
  contribution?: number;
};

function localizeDigits(lang: AppLang, text: string): string {
  if (lang === 'fa') {
    return text.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]!);
  }
  if (lang === 'ar') {
    return text.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]!);
  }
  return text;
}

/** Deterministic contribution magnitude string from Package driver.contribution. */
export function formatEvidenceContribution(
  lang: AppLang,
  contribution: number
): string {
  const rounded = Math.round(contribution * 10) / 10;
  const abs = Math.abs(rounded);
  const body = Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
  const signed = rounded < 0 ? `-${body}` : rounded > 0 ? `+${body}` : body;
  if (lang === 'fa') {
    return localizeDigits('fa', signed).replace('-', '−').replace('.', '٫');
  }
  if (lang === 'ar') {
    return localizeDigits('ar', signed).replace('-', '−').replace('.', '٫');
  }
  if (lang === 'ru') {
    return signed.replace('-', '−').replace('.', ',');
  }
  return signed.replace('-', '−');
}

/**
 * Localized metadata for unknown factor_key rows.
 * Derived only from polarity / contribution / importance — never labels or ids.
 */
export function formatUnavailableFactorDetail(
  lang: AppLang,
  fallback: EvidenceFactorFallbackContext
): string | undefined {
  const copy = getAskProductCopy(lang);
  const polarityLabel =
    fallback.polarity === 'supportive'
      ? copy.evidenceSupportive
      : fallback.polarity === 'cautionary'
        ? copy.evidenceCaution
        : copy.evidenceNeutral;

  const parts: string[] = [polarityLabel];
  if (
    typeof fallback.contribution === 'number' &&
    Number.isFinite(fallback.contribution)
  ) {
    parts.push(formatEvidenceContribution(lang, fallback.contribution));
  }
  if (
    fallback.importance === 'low' ||
    fallback.importance === 'medium' ||
    fallback.importance === 'high' ||
    fallback.importance === 'critical'
  ) {
    parts.push(copy.importance[fallback.importance]);
  }

  // Polarity alone does not distinguish same-polarity rows.
  if (parts.length < 2) return undefined;
  return parts.join(' · ');
}

/**
 * Resolve a known factor_key against the bounded catalog.
 * Returns null for unknown / unsupported shapes (never invents).
 */
export function tryLocalizeFactorKey(
  lang: AppLang,
  factorKey: string | undefined | null
): LocalizedEvidenceFactor | null {
  const key = factorKey?.trim() ?? '';
  if (!key) return null;
  return localizeKnownFactorKey(lang, key);
}

/**
 * Localize a Package driver factor_key for consumer Result evidence.
 * Unknown keys: EN may use label; FA/AR/RU use honest unavailable title +
 * deterministic contribution/importance metadata detail.
 */
export function localizeEvidenceFactor(
  lang: AppLang,
  factorKey: string | undefined | null,
  fallback: EvidenceFactorFallbackContext
): LocalizedEvidenceFactor {
  const fromCatalog = tryLocalizeFactorKey(lang, factorKey);
  if (fromCatalog) return fromCatalog;

  const detail = formatUnavailableFactorDetail(lang, fallback);

  if (lang === 'en') {
    const label = fallback.label?.trim();
    if (label) return { title: label };
    return {
      title: getAskProductCopy(lang).evidenceDetailUnavailable,
      detail,
    };
  }

  return {
    title: getAskProductCopy(lang).evidenceDetailUnavailable,
    detail,
  };
}

function localizeKnownFactorKey(
  lang: AppLang,
  key: string
): LocalizedEvidenceFactor | null {
  const parts = key.split('.').filter(Boolean);
  if (parts.length < 2) return null;

  if (parts[0] === 'aspect' && parts.length === 4) {
    const [, transit, aspect, natal] = parts;
    const t = token(PLANETS, lang, transit!);
    const a = token(ASPECTS, lang, aspect!);
    const n = token(PLANETS, lang, natal!);
    if (!t || !a || !n) return null;
    if (lang === 'fa') return { title: `${a} ${t} با ${n}` };
    if (lang === 'ar') return { title: `${a} بين ${t} و${n}` };
    if (lang === 'ru') {
      const aspectLabel = a.charAt(0).toUpperCase() + a.slice(1);
      return { title: `${aspectLabel} ${t} и ${n}` };
    }
    return { title: `Transit ${t} ${a} natal ${n}` };
  }

  if (parts[0] === 'house' && parts.length >= 4) {
    const [, scope, planet, houseRaw, flag] = parts;
    const p = token(PLANETS, lang, planet!);
    const houseN = Number(houseRaw);
    if (!p || !Number.isInteger(houseN) || houseN < 1 || houseN > 12) return null;
    const houseLabel = houseOrdinal(lang, houseN);
    const retro = flag === 'retrograde';
    if (scope === 'natal') {
      if (lang === 'fa') return { title: `${p} زایشی در ${houseLabel}` };
      if (lang === 'ar') return { title: `${p} الولادي في ${houseLabel}` };
      if (lang === 'ru') return { title: `Натальный ${p} в ${houseLabel}` };
      return { title: `Natal ${p} in ${houseLabel}` };
    }
    if (scope === 'transit') {
      if (retro) {
        if (lang === 'fa') return { title: `${p} رجعی در ${houseLabel}` };
        if (lang === 'ar') return { title: `${p} رجعي في ${houseLabel}` };
        if (lang === 'ru') return { title: `Ретроградный ${p} в ${houseLabel}` };
        return { title: `Retrograde ${p} in ${houseLabel}` };
      }
      if (lang === 'fa') return { title: `${p} عبوری در ${houseLabel}` };
      if (lang === 'ar') return { title: `${p} الانتقالي في ${houseLabel}` };
      if (lang === 'ru') return { title: `Транзитный ${p} в ${houseLabel}` };
      return { title: `Transit ${p} in ${houseLabel}` };
    }
    return null;
  }

  if (parts[0] === 'angular' && parts.length === 3) {
    const [, planet, angle] = parts;
    const p = token(PLANETS, lang, planet!);
    const a = token(ANGLES, lang, angle!);
    if (!p || !a) return null;
    if (lang === 'fa') return { title: `${p} نزدیک ${a}` };
    if (lang === 'ar') return { title: `${p} قرب ${a}` };
    if (lang === 'ru') return { title: `${p} рядом с ${a}` };
    return { title: `${p} near ${a}` };
  }

  if (parts[0] === 'retrograde' && parts.length === 2) {
    const p = token(PLANETS, lang, parts[1]!);
    if (!p) return null;
    if (lang === 'fa') return { title: `${p} رجعی` };
    if (lang === 'ar') return { title: `${p} رجعي` };
    if (lang === 'ru') return { title: `Ретроградный ${p}` };
    return { title: `${p} retrograde` };
  }

  if (parts[0] === 'electional' && parts[1] === 'location_mode' && parts.length === 3) {
    const mode = token(LOCATION_MODES, lang, parts[2]!);
    if (!mode) return null;
    if (lang === 'fa') return { title: `زمان‌بندی برای ${mode}` };
    if (lang === 'ar') return { title: `التوقيت لـ ${mode}` };
    if (lang === 'ru') return { title: `Тайминг для: ${mode}` };
    return { title: `Timed for ${mode}` };
  }

  return null;
}
