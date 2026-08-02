/**
 * Vault confidential-reading presentation only.
 * Transforms producer VaultReadingLayer into decision-language sections.
 * Does not change scoring, evidence, API contracts, or producer text at rest.
 */

import type { AppLang } from './app-settings';
import {
  checkResponseLanguage,
  isEnglishDominantProse,
} from './locale-language-guard';
import type { VaultReadingLayer } from './vault-reading';

export type VaultReadingSectionKey =
  | 'overallSituation'
  | 'mainOpportunity'
  | 'mainRisk'
  | 'recommendedActions'
  | 'thingsToAvoid'
  | 'practicalNextStep';

export type VaultReadingSection = {
  key: VaultReadingSectionKey;
  title: string;
  body: string;
};

export type VaultPresentedReading = {
  sections: VaultReadingSection[];
};

export type VaultReadingPresentationCopy = {
  overallSituation: string;
  mainOpportunity: string;
  mainRisk: string;
  recommendedActions: string;
  thingsToAvoid: string;
  practicalNextStep: string;
  fallbackSituation: string;
  fallbackOpportunity: string;
  fallbackRisk: string;
  fallbackActions: string;
  fallbackAvoid: string;
  fallbackNextStep: string;
};

export const VAULT_READING_PRESENTATION_COPY: Record<
  AppLang,
  VaultReadingPresentationCopy
> = {
  en: {
    overallSituation: 'Overall situation',
    mainOpportunity: 'Main opportunity',
    mainRisk: 'Main risk',
    recommendedActions: 'Recommended actions',
    thingsToAvoid: 'Things to avoid',
    practicalNextStep: 'Practical next step',
    fallbackSituation: 'Your timing context is ready — use the guidance below for this decision.',
    fallbackOpportunity: 'Lean into the clearest opening this reading highlights.',
    fallbackRisk: 'Watch for overreach, mixed signals, and forcing a weak window.',
    fallbackActions: 'Take one clear action that matches this window — then stop and reassess.',
    fallbackAvoid: 'Avoid chasing, over-explaining, or stacking too many moves at once.',
    fallbackNextStep: 'Choose one next move from the guidance above and act on it today.',
  },
  fa: {
    overallSituation: 'وضعیت کلی',
    mainOpportunity: 'فرصت اصلی',
    mainRisk: 'ریسک اصلی',
    recommendedActions: 'اقدام‌های پیشنهادی',
    thingsToAvoid: 'چیزهایی که باید پرهیز کنی',
    practicalNextStep: 'قدم عملی بعدی',
    fallbackSituation: 'زمینهٔ زمان‌بندی آماده است — از راهنمای زیر برای این تصمیم استفاده کن.',
    fallbackOpportunity: 'به واضح‌ترین گشایشی که این خوانش نشان می‌دهد نزدیک شو.',
    fallbackRisk: 'مراقب زیاده‌روی، سیگنال‌های درهم و اجبار روی پنجرهٔ ضعیف باش.',
    fallbackActions: 'یک اقدام روشن هم‌راستا با این پنجره بردار — بعد توقف کن و دوباره بسنج.',
    fallbackAvoid: 'از تعقیب، توضیح زیاد یا روی‌هم‌چیدن چند حرکت هم‌زمان پرهیز کن.',
    fallbackNextStep: 'از راهنمای بالا یک قدم بعدی انتخاب کن و امروز انجامش بده.',
  },
  ru: {
    overallSituation: 'Общая ситуация',
    mainOpportunity: 'Главная возможность',
    mainRisk: 'Главный риск',
    recommendedActions: 'Рекомендуемые действия',
    thingsToAvoid: 'Чего избегать',
    practicalNextStep: 'Практичный следующий шаг',
    fallbackSituation: 'Контекст тайминга готов — используйте подсказки ниже для этого решения.',
    fallbackOpportunity: 'Опирайтесь на самое ясное окно, которое выделяет этот разбор.',
    fallbackRisk: 'Следите за перегибом, смешанными сигналами и давлением в слабом окне.',
    fallbackActions: 'Сделайте одно ясное действие под это окно — затем остановитесь и переоцените.',
    fallbackAvoid: 'Избегайте погони, лишних объяснений и слишком многих шагов сразу.',
    fallbackNextStep: 'Выберите один следующий шаг из подсказок выше и сделайте его сегодня.',
  },
  ar: {
    overallSituation: 'الوضع العام',
    mainOpportunity: 'الفرصة الرئيسية',
    mainRisk: 'المخاطر الرئيسية',
    recommendedActions: 'الإجراءات الموصى بها',
    thingsToAvoid: 'ما يجب تجنّبه',
    practicalNextStep: 'الخطوة العملية التالية',
    fallbackSituation: 'سياق التوقيت جاهز — استخدمي الإرشاد أدناه لهذا القرار.',
    fallbackOpportunity: 'ميلِي إلى أوضح فرصة تُبرزها هذه القراءة.',
    fallbackRisk: 'احذري الإفراط والإشارات المختلطة وإجبار نافذة ضعيفة.',
    fallbackActions: 'اتّخذي إجراءً واحداً واضحاً يناسب هذه النافذة — ثم توقّفي وأعيدي التقييم.',
    fallbackAvoid: 'تجنّبي المطاردة وكثرة الشرح وتكديس عدة خطوات دفعة واحدة.',
    fallbackNextStep: 'اختاري خطوة تالية واحدة من الإرشاد أعلاه ونفّذيها اليوم.',
  },
};

const PLANET_EN =
  'sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|lilith';
const PLANET_LOCAL =
  'مریخ|ونوس|زهره|عطارد|مشتری|زحل|اورانوس|نپتون|پلوتو|خورشید|قمر|ماه|المريخ|الزهرة|عطارد|المشتري|زحل|أورانوس|نبتون|بلوتو|الشمس|القمر|марс|венера|меркурий|юпитер|сатурн|уран|нептун|плутон|солнце|луна|лилит';

const ASPECT_EN =
  'conjunction|conjunct|square|opposition|opposite|trine|sextile|aspect|configuration';
const ASPECT_LOCAL =
  'مقارنه|تسدیس|تربیع|تثلیث|مقابله|اتصال|квадрат|тригон|секстиль|оппозиция|соединение';

const ENGINE_EN =
  'inferred|natal|transit|transiting|retrograde|dignity|rulership|peregrine|exaltation|exalted|detriment|orb|synastry|zodiac|ascendant|midheaven';
const ENGINE_LOCAL =
  'استنباط|مُستنتج|زادروز|مولدي|ترانزیت|رجوعی|شرف|هبوط|سقوط|натальн|транзит|ретроград|асцендент';

const SIGN_EN =
  'aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces';

/** Visible banned vocabulary for confidential reading presentation. */
export const VAULT_READING_BANNED_PATTERN = new RegExp(
  [
    `\\b(?:${PLANET_EN})\\b`,
    `\\b(?:${ASPECT_EN})\\b`,
    `\\b(?:${ENGINE_EN})\\b`,
    `\\b(?:${SIGN_EN})\\b`,
    `(?:${PLANET_LOCAL})`,
    `(?:${ASPECT_LOCAL})`,
    `(?:${ENGINE_LOCAL})`,
    '\\bhouse\\s*\\d',
    '\\b\\d+(?:st|nd|rd|th)\\s+house\\b',
    '\\bchart\\b',
    '\\bsky\\b',
    '\\bdignity\\b',
    '\\bproducer\\b',
    '\\bevidence[_-]?id\\b',
    '\\baction\\s*=',
    '\\bhorizon\\s*=',
    '\\bengine\\s*=',
    '\\bnatal_',
    '\\btransit_',
    '\\bwindows\\s*=',
    '\\bconfidence\\s*=',
    '\\bscore\\s*=',
  ].join('|'),
  'i'
);

const ENGINE_LEAD_PREFIX =
  /^(?:(?:natal|transit)\s+)?(?:sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|lilith)(?:\s+(?:conjunct|conjunction|square|opposition|opposite|trine|sextile)\s+(?:(?:natal|transit)\s+)?(?:sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|lilith))?\s*:\s*/i;

const HOUSE_LEAD_PREFIX =
  /^(?:sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|lilith)\s+in\s+the\s+\d+(?:st|nd|rd|th)?\s+house\s*:\s*/i;

const DIGNITY_LEAD_PREFIX =
  /^(?:sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|lilith)\s+is\s+(?:in\s+)?(?:full command|exalted|in detriment|in fall|in exaltation|in rulership)[^.—–-]*[—.–-]\s*/i;

const MOON_SIGNAL_PREFIX =
  /^(?:today'?s\s+color\s+signal\s+follows\s+)?moon\s+in\s+[a-z]+\s*[:.]?\s*/i;

const STYLE_FROM_PREFIX =
  /^style\s+from\s+venus\s+in\s+[a-z]+\s*\([^)]*\)\s*;?\s*/i;

const COLOR_FROM_PREFIX =
  /^today'?s\s+color\s+from\s+moon\s+in\s+[a-z]+\s*/i;

const LABELED_FIELD_RE =
  /(?:^|[.!?]\s+|[\n\r]\s*)(?:Action|Avoid|Opportunity|Risk|Commercial risk|Watch the risk|Next|Verify|Reason|Confidence|What this changes today|اقدام|پرهیز|فرصت|ریسک|بعدی|Действие|Избегать|Возможность|Риск|Далее|الإجراء|تجنبي|الفرصة|المخاطر)\s*:\s*/gi;

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function stripEngineLead(sentence: string): string {
  let out = sentence.trim();
  let prev = '';
  while (out !== prev) {
    prev = out;
    out = out
      .replace(ENGINE_LEAD_PREFIX, '')
      .replace(HOUSE_LEAD_PREFIX, '')
      .replace(DIGNITY_LEAD_PREFIX, '')
      .replace(MOON_SIGNAL_PREFIX, '')
      .replace(STYLE_FROM_PREFIX, '')
      .replace(COLOR_FROM_PREFIX, '')
      .replace(
        /^your desire signature sits in\s+[a-z]+,\s*house\s*\d+\.\s*/i,
        ''
      )
      .replace(/^confidence:\s*[^.]+(?:\.\s*|$)/i, '')
      .replace(/^اطمینان:\s*[^.]+(?:\.\s*|$)/i, '')
      .replace(/^уверенность:\s*[^.]+(?:\.\s*|$)/i, '')
      .replace(/^الثقة:\s*[^.]+(?:\.\s*|$)/i, '');
  }
  return out.trim();
}

/** True when text still contains banned engine/astrology vocabulary. */
export function vaultReadingTextHasBannedTerms(text: string): boolean {
  return VAULT_READING_BANNED_PATTERN.test(text);
}

/** True when producer prose is acceptable for the active UI language. */
export function vaultReadingProseMatchesUiLang(
  text: string,
  lang: AppLang
): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (lang === 'en') return true;
  if (isEnglishDominantProse(trimmed)) return false;
  return checkResponseLanguage(trimmed, lang).ok;
}

/**
 * Keep only plain decision language. Drops contaminated sentences after
 * stripping common engine lead-ins (planet/aspect prefixes, etc.).
 */
export function sanitizeVaultReadingProse(
  text: string | null | undefined,
  lang: AppLang = 'en'
): string {
  if (!text?.trim()) return '';
  const cleaned = splitSentences(text)
    .map(stripEngineLead)
    .map(collapseWhitespace)
    .filter((sentence) => sentence.length > 0)
    .filter((sentence) => !vaultReadingTextHasBannedTerms(sentence))
    .filter((sentence) => vaultReadingProseMatchesUiLang(sentence, lang));
  return collapseWhitespace(cleaned.join(' '));
}

function extractLabeled(
  source: string,
  labels: string[]
): string | null {
  for (const label of labels) {
    const re = new RegExp(
      `${label}\\s*:\\s*([^\\n.]+(?:\\.[^A-ZА-ЯЁا-ی][^\\n.]*)?)`,
      'i'
    );
    const match = source.match(re);
    if (match?.[1]) {
      const value = collapseWhitespace(match[1].replace(/\s+/g, ' '));
      if (value) return value.replace(/\.$/, '');
    }
  }
  return null;
}

function stripLabeledClauses(source: string): string {
  // Remove known labeled tails so situation body stays narrative.
  return collapseWhitespace(
    source
      .replace(
        /(?:Action|Avoid|Opportunity|Risk|Commercial risk|Watch the risk|Next|Verify|Reason|Confidence|What this changes today|اقدام|پرهیز|فرصت|ریسک|Действие|Избегать|Возможность|Риск|Далее|الإجراء|تجنبي)\s*:[^.]*\.?/gi,
        ' '
      )
      .replace(LABELED_FIELD_RE, ' ')
  );
}

function pickClean(
  candidates: Array<string | null | undefined>,
  fallback: string,
  lang: AppLang
): string {
  for (const candidate of candidates) {
    const value = sanitizeVaultReadingProse(candidate ?? '', lang);
    if (value) return value;
  }
  return fallback;
}

/**
 * Presentation-only transform: structured decision sections, no engine vocabulary.
 */
export function presentVaultReading(
  reading: VaultReadingLayer,
  lang: AppLang
): VaultPresentedReading {
  const copy =
    VAULT_READING_PRESENTATION_COPY[lang] ?? VAULT_READING_PRESENTATION_COPY.en;
  const narrativeSource = [reading.strategic, reading.executive]
    .filter(Boolean)
    .join('\n');

  const actionRaw =
    reading.action?.trim() ||
    extractLabeled(narrativeSource, [
      'Action',
      'اقدام',
      'Действие',
      'الإجراء',
      'Next',
      'بعدی',
      'Далее',
    ]);
  const avoidRaw =
    reading.avoid?.trim() ||
    extractLabeled(narrativeSource, [
      'Avoid',
      'پرهیز',
      'Избегать',
      'تجنبي',
    ]);
  const opportunityRaw =
    extractLabeled(narrativeSource, [
      'Opportunity',
      'فرصت',
      'Возможность',
      'الفرصة',
    ]) ||
    extractLabeled(narrativeSource, [
      'What this changes today',
      'تأثیر امروز',
      'Что меняется сегодня',
      'ما يتغيّر اليوم',
    ]);
  const riskRaw = extractLabeled(narrativeSource, [
    'Risk',
    'Commercial risk',
    'Watch the risk',
    'ریسک',
    'Риск',
    'المخاطر',
  ]);

  const situationBody = sanitizeVaultReadingProse(
    stripLabeledClauses(narrativeSource),
    lang
  );
  const headline = sanitizeVaultReadingProse(reading.headline, lang);
  const cleanAvoid = sanitizeVaultReadingProse(avoidRaw, lang);
  const riskFromAvoid =
    cleanAvoid &&
    (lang === 'fa'
      ? `اگر نادیده بگیری: ${cleanAvoid}`
      : lang === 'ru'
        ? `Если игнорировать: ${cleanAvoid}`
        : lang === 'ar'
          ? `إذا تم التجاهل: ${cleanAvoid}`
          : `If ignored: ${cleanAvoid}`);

  const overallSituation = pickClean(
    [[headline, situationBody].filter(Boolean).join(' '), situationBody, headline],
    copy.fallbackSituation,
    lang
  );
  const mainOpportunity = pickClean(
    [opportunityRaw],
    copy.fallbackOpportunity,
    lang
  );
  const mainRisk = pickClean([riskRaw, riskFromAvoid], copy.fallbackRisk, lang);
  const recommendedActions = pickClean(
    [actionRaw],
    copy.fallbackActions,
    lang
  );
  const thingsToAvoid = pickClean([cleanAvoid], copy.fallbackAvoid, lang);
  const practicalNextStep = pickClean(
    [actionRaw, recommendedActions],
    copy.fallbackNextStep,
    lang
  );

  const order: Array<[VaultReadingSectionKey, string, string]> = [
    ['overallSituation', copy.overallSituation, overallSituation],
    ['mainOpportunity', copy.mainOpportunity, mainOpportunity],
    ['mainRisk', copy.mainRisk, mainRisk],
    ['recommendedActions', copy.recommendedActions, recommendedActions],
    ['thingsToAvoid', copy.thingsToAvoid, thingsToAvoid],
    ['practicalNextStep', copy.practicalNextStep, practicalNextStep],
  ];

  return {
    sections: order.map(([key, title, body]) => ({ key, title, body })),
  };
}
