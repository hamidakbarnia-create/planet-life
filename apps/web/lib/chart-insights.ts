/**
 * chart-insights.ts
 *
 * Produces two derived views of a natal chart that replace the raw
 * planet-by-planet table in the profile page:
 *
 *   1. ElementBalance   — % distribution of planets across Fire/Earth/Air/Water
 *   2. ChartStrengths   — short, human bullet points describing the dominant
 *                         placements, exalted/own-sign rulerships, and a few
 *                         high-impact aspect signatures.
 *
 * All copy is i18n-aware (en / ru / fa / ar). Strength generation is rule-based:
 * each rule produces a short tagline if its astrological pattern is present.
 * We sort by tier (rulership/exaltation > major aspects > house placements >
 * element dominance) and return the top N.
 */

import type { ChartPlanet } from '@/components/NatalChart';
import {
  ASPECT_ANGLES,
  DEFAULT_ORBS,
  angularSeparation,
  type NatalAspect,
} from '@/lib/natal-aspects';

export type ElementKey = 'fire' | 'earth' | 'air' | 'water';
export type ChartLang = 'en' | 'ru' | 'fa' | 'ar';

/** sign index (1..12) → element key */
const SIGN_TO_ELEMENT: Record<number, ElementKey> = {
  1: 'fire',
  2: 'earth',
  3: 'air',
  4: 'water',
  5: 'fire',
  6: 'earth',
  7: 'air',
  8: 'water',
  9: 'fire',
  10: 'earth',
  11: 'air',
  12: 'water',
};

const ELEMENT_COLORS: Record<ElementKey, string> = {
  fire: '#f97316',
  earth: '#84cc16',
  air: '#67e8f9',
  water: '#60a5fa',
};

export interface ElementBalance {
  counts: Record<ElementKey, number>;
  percent: Record<ElementKey, number>;
  dominant: ElementKey;
  color: Record<ElementKey, string>;
}

const PLANETS_FOR_ELEMENTS = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
] as const;

/**
 * Element balance is computed from the 10 classical bodies (excluding
 * the lunar nodes, which would skew the totals and have no element
 * association in mainstream interpretive practice).
 */
export function computeElementBalance(
  planets: Record<string, ChartPlanet>
): ElementBalance {
  const counts: Record<ElementKey, number> = {
    fire: 0,
    earth: 0,
    air: 0,
    water: 0,
  };

  let total = 0;
  for (const name of PLANETS_FOR_ELEMENTS) {
    const p = planets[name];
    if (!p) continue;
    const el = SIGN_TO_ELEMENT[p.sign];
    if (!el) continue;
    counts[el] += 1;
    total += 1;
  }

  const safeTotal = total === 0 ? 1 : total;
  const percent: Record<ElementKey, number> = {
    fire: Math.round((counts.fire / safeTotal) * 100),
    earth: Math.round((counts.earth / safeTotal) * 100),
    air: Math.round((counts.air / safeTotal) * 100),
    water: Math.round((counts.water / safeTotal) * 100),
  };

  let dominant: ElementKey = 'earth';
  let maxV = -1;
  (Object.keys(counts) as ElementKey[]).forEach((k) => {
    if (counts[k] > maxV) {
      maxV = counts[k];
      dominant = k;
    }
  });

  return {
    counts,
    percent,
    dominant,
    color: ELEMENT_COLORS,
  };
}

// ───────────────────────────────────────────────────────────────────────────
//   Strength rules — astrologically grounded, short, marketing-ready copy
// ───────────────────────────────────────────────────────────────────────────

type StrengthText = Record<ChartLang, string>;

interface StrengthRule {
  id: string;
  tier: 1 | 2 | 3 | 4; // 1 = strongest (rulership/exaltation), 4 = fallback element
  match: (ctx: StrengthContext) => boolean;
  text: StrengthText;
}

interface StrengthContext {
  planets: Record<string, ChartPlanet>;
  aspects: NatalAspect[];
  balance: ElementBalance;
}

/** Helper: is planet in a given sign index (1..12)? */
const inSign = (p: ChartPlanet | undefined, sign: number) =>
  !!p && p.sign === sign;
/** Helper: is planet in a given house (1..12)? */
const inHouse = (p: ChartPlanet | undefined, house: number) =>
  !!p && p.house === house;
/** Helper: any aspect of the given type between two planets, regardless of order? */
const hasAspect = (
  aspects: NatalAspect[],
  a: string,
  b: string,
  type: keyof typeof ASPECT_ANGLES
) =>
  aspects.some(
    (x) =>
      x.aspect === type &&
      ((x.planetA === a && x.planetB === b) ||
        (x.planetA === b && x.planetB === a))
  );

/**
 * Tighter-orb aspect check (for "headline" strengths we only want the
 * truly tight conjunctions/trines, not loose ones).
 */
const hasTightAspect = (
  planets: Record<string, ChartPlanet>,
  a: string,
  b: string,
  type: keyof typeof ASPECT_ANGLES,
  maxOrb: number
) => {
  const pa = planets[a];
  const pb = planets[b];
  if (!pa || !pb) return false;
  const sep = angularSeparation(pa.longitude, pb.longitude);
  const target = ASPECT_ANGLES[type];
  const orb = Math.abs(sep - target);
  return orb <= Math.min(maxOrb, DEFAULT_ORBS[type]);
};

const RULES: StrengthRule[] = [
  // ── Tier 1: rulerships & exaltations (the strongest natural placements) ──
  {
    id: 'mars-aries',
    tier: 1,
    match: ({ planets }) => inSign(planets.mars, 1),
    text: {
      en: 'Pioneering iron will and decisive action',
      ru: 'Первопроходческая железная воля и решительность',
      fa: 'اراده پیشگام و قاطعیت در عمل',
      ar: 'إرادة رائدة من حديد وحسم في الفعل',
    },
  },
  {
    id: 'mars-scorpio',
    tier: 1,
    match: ({ planets }) => inSign(planets.mars, 8),
    text: {
      en: 'Steel will, deep focus, and strategic power',
      ru: 'Стальная воля, глубокая концентрация и стратегическая сила',
      fa: 'اراده پولادین، تمرکز عمیق و قدرت استراتژیک',
      ar: 'إرادة فولاذية وتركيز عميق وقوة استراتيجية',
    },
  },
  {
    id: 'sun-leo',
    tier: 1,
    match: ({ planets }) => inSign(planets.sun, 5),
    text: {
      en: 'Radiant presence and natural charisma',
      ru: 'Лучезарное присутствие и природная харизма',
      fa: 'حضور درخشان و کاریزمای ذاتی',
      ar: 'حضور مشرق وكاريزما فطرية',
    },
  },
  {
    id: 'venus-taurus',
    tier: 1,
    match: ({ planets }) => inSign(planets.venus, 2),
    text: {
      en: 'Magnetic sense of taste and grounded sensuality',
      ru: 'Магнетический вкус и заземлённая чувственность',
      fa: 'ذوق جذاب و حس‌گرایی ریشه‌دار',
      ar: 'ذوق جذّاب وحسّيّة راسخة',
    },
  },
  {
    id: 'venus-libra',
    tier: 1,
    match: ({ planets }) => inSign(planets.venus, 7),
    text: {
      en: 'Diplomatic charm and the art of agreements',
      ru: 'Дипломатичное обаяние и искусство соглашений',
      fa: 'دیپلماسی روابط و طراحی توافق‌ها',
      ar: 'سحر دبلوماسي وفنّ صياغة الاتفاقات',
    },
  },
  {
    id: 'mercury-gemini',
    tier: 1,
    match: ({ planets }) => inSign(planets.mercury, 3),
    text: {
      en: 'Quick, adaptive mind and sharp wit',
      ru: 'Быстрый, гибкий ум и острая речь',
      fa: 'ذهن سریع، تطبیق‌پذیر و کلام تیز',
      ar: 'ذهن سريع ومرن وحجّة حادّة',
    },
  },
  {
    id: 'mercury-virgo',
    tier: 1,
    match: ({ planets }) => inSign(planets.mercury, 6),
    text: {
      en: 'Precise analysis and master attention to detail',
      ru: 'Точный анализ и внимание к деталям на уровне мастера',
      fa: 'تحلیل دقیق و توجه استادانه به جزئیات',
      ar: 'تحليل دقيق واهتمام احترافي بالتفاصيل',
    },
  },
  {
    id: 'jupiter-sagittarius',
    tier: 1,
    match: ({ planets }) => inSign(planets.jupiter, 9),
    text: {
      en: 'Natural luck and a big-picture vision',
      ru: 'Природная удача и взгляд на большую картину',
      fa: 'خوش‌اقبالی طبیعی و دید کلان',
      ar: 'حظّ فطري ورؤية شاملة',
    },
  },
  {
    id: 'jupiter-pisces',
    tier: 1,
    match: ({ planets }) => inSign(planets.jupiter, 12),
    text: {
      en: 'Generous heart and spiritual openness',
      ru: 'Щедрое сердце и духовная открытость',
      fa: 'دل سخاوتمند و گشودگی معنوی',
      ar: 'قلب سخيّ وانفتاح روحي',
    },
  },
  {
    id: 'saturn-capricorn',
    tier: 1,
    match: ({ planets }) => inSign(planets.saturn, 10),
    text: {
      en: 'Long-horizon builder and durable leadership',
      ru: 'Строитель на длинной дистанции и долговечное лидерство',
      fa: 'ساختارسازی بزرگ و رهبری بلندمدت',
      ar: 'بناء بعيد المدى وقيادة دائمة',
    },
  },
  {
    id: 'saturn-aquarius',
    tier: 1,
    match: ({ planets }) => inSign(planets.saturn, 11),
    text: {
      en: 'Structured innovation and systems thinking',
      ru: 'Структурированная инновация и системное мышление',
      fa: 'نوآوری ساختارمند و تفکر سیستمی',
      ar: 'ابتكار منظّم وتفكير منظومي',
    },
  },
  // ── Exaltations ──
  {
    id: 'sun-aries-exalt',
    tier: 1,
    match: ({ planets }) => inSign(planets.sun, 1),
    text: {
      en: 'Founder energy and pioneering leadership',
      ru: 'Энергия основателя и первопроходческое лидерство',
      fa: 'انرژی موسس و رهبری پیشگام',
      ar: 'طاقة مؤسِّس وقيادة رائدة',
    },
  },
  {
    id: 'moon-taurus-exalt',
    tier: 1,
    match: ({ planets }) => inSign(planets.moon, 2),
    text: {
      en: 'Emotional steadiness and natural security',
      ru: 'Эмоциональная устойчивость и природная стабильность',
      fa: 'آرامش عاطفی و امنیت درونی',
      ar: 'ثبات عاطفي وأمان داخلي',
    },
  },
  {
    id: 'venus-pisces-exalt',
    tier: 1,
    match: ({ planets }) => inSign(planets.venus, 12),
    text: {
      en: 'Loving heart and artistic intuition',
      ru: 'Любящее сердце и художественная интуиция',
      fa: 'دل عاشق و شهود هنری',
      ar: 'قلب محبّ وحدس فنّي',
    },
  },
  {
    id: 'mars-capricorn-exalt',
    tier: 1,
    match: ({ planets }) => inSign(planets.mars, 10),
    text: {
      en: 'Strategic execution and iron discipline',
      ru: 'Стратегическое исполнение и железная дисциплина',
      fa: 'اجرای استراتژیک و انضباط آهنین',
      ar: 'تنفيذ استراتيجي وانضباط حديدي',
    },
  },
  {
    id: 'jupiter-cancer-exalt',
    tier: 1,
    match: ({ planets }) => inSign(planets.jupiter, 4),
    text: {
      en: 'Protective generosity and the gift of nurturing',
      ru: 'Покровительственная щедрость и дар заботы',
      fa: 'محافظت سخاوتمندانه و موهبت حمایت‌گری',
      ar: 'حماية سخيّة وموهبة الرعاية',
    },
  },
  {
    id: 'saturn-libra-exalt',
    tier: 1,
    match: ({ planets }) => inSign(planets.saturn, 7),
    text: {
      en: 'Sense of justice and balanced judgement',
      ru: 'Чувство справедливости и сбалансированное суждение',
      fa: 'عدالت‌خواهی و قضاوت متوازن',
      ar: 'حسّ بالعدالة وحكم متوازن',
    },
  },

  // ── Tier 2: high-signal aspects ──
  {
    id: 'sun-saturn-conj',
    tier: 2,
    match: ({ planets }) =>
      hasTightAspect(planets, 'sun', 'saturn', 'conjunction', 6),
    text: {
      en: 'Focus, responsibility, and durable leadership',
      ru: 'Сфокусированность, ответственность и долгосрочное лидерство',
      fa: 'تمرکز، مسئولیت‌پذیری و رهبری ساختارمند',
      ar: 'تركيز ومسؤولية وقيادة راسخة',
    },
  },
  {
    id: 'sun-jupiter-trine',
    tier: 2,
    match: ({ aspects }) => hasAspect(aspects, 'sun', 'jupiter', 'trine'),
    text: {
      en: 'Natural self-confidence and a nose for opportunity',
      ru: 'Природная уверенность и нюх на возможности',
      fa: 'اعتماد به نفس طبیعی و حس فرصت‌جویی',
      ar: 'ثقة فطرية بالنفس وحدس للفرص',
    },
  },
  {
    id: 'mars-pluto-trine',
    tier: 2,
    match: ({ aspects }) => hasAspect(aspects, 'mars', 'pluto', 'trine'),
    text: {
      en: 'Transformative power and strategic influence',
      ru: 'Трансформирующая сила и стратегическое влияние',
      fa: 'قدرت تحول و نفوذ استراتژیک',
      ar: 'قوة محوِّلة ونفوذ استراتيجي',
    },
  },
  {
    id: 'venus-jupiter-trine',
    tier: 2,
    match: ({ aspects }) => hasAspect(aspects, 'venus', 'jupiter', 'trine'),
    text: {
      en: 'Social magnetism and openness to abundance',
      ru: 'Социальный магнетизм и открытость изобилию',
      fa: 'جذابیت اجتماعی و گشودگی به فراوانی',
      ar: 'جاذبية اجتماعية وانفتاح على الوفرة',
    },
  },
  {
    id: 'mercury-mars-sextile',
    tier: 2,
    match: ({ aspects }) => hasAspect(aspects, 'mercury', 'mars', 'sextile'),
    text: {
      en: 'Strategic mind and persuasive voice',
      ru: 'Стратегический ум и убедительный голос',
      fa: 'ذهن استراتژیک و کلام متقاعدکننده',
      ar: 'عقل استراتيجي وصوت مقنع',
    },
  },
  {
    id: 'sun-jupiter-conj',
    tier: 2,
    match: ({ planets }) =>
      hasTightAspect(planets, 'sun', 'jupiter', 'conjunction', 6),
    text: {
      en: 'Blessed presence and innate good fortune',
      ru: 'Благословенное присутствие и врождённая удача',
      fa: 'حضور پربرکت و خوش‌اقبالی ذاتی',
      ar: 'حضور مبارَك وحظّ فطري',
    },
  },

  // ── Tier 3: house placements ──
  {
    id: 'jupiter-h7',
    tier: 3,
    match: ({ planets }) => inHouse(planets.jupiter, 7),
    text: {
      en: 'Attracts powerful partners and prosperous agreements',
      ru: 'Притягивает сильных партнёров и выгодные договоры',
      fa: 'جذب شرکای قدرتمند و قراردادهای پربرکت',
      ar: 'يجذب شركاء أقوياء واتفاقات مزدهرة',
    },
  },
  {
    id: 'jupiter-h10',
    tier: 3,
    match: ({ planets }) => inHouse(planets.jupiter, 10),
    text: {
      en: 'Career visibility and reputational growth',
      ru: 'Карьерная заметность и рост репутации',
      fa: 'دیده‌شدن حرفه‌ای و رشد اعتبار',
      ar: 'بروز مهني ونموّ في السمعة',
    },
  },
  {
    id: 'jupiter-h2',
    tier: 3,
    match: ({ planets }) => inHouse(planets.jupiter, 2),
    text: {
      en: 'Natural ability to build wealth and assets',
      ru: 'Природная способность создавать капитал и активы',
      fa: 'توانایی طبیعی برای ساختن ثروت و دارایی',
      ar: 'قدرة طبيعية على بناء الثروة والأصول',
    },
  },
  {
    id: 'pluto-h10',
    tier: 3,
    match: ({ planets }) => inHouse(planets.pluto, 10),
    text: {
      en: 'Deep influence on career and the power to transform fields',
      ru: 'Глубокое влияние на карьеру и сила преобразовать сферу',
      fa: 'نفوذ عمیق در حرفه و قدرت دگرگون‌کننده',
      ar: 'نفوذ عميق في المهنة وقدرة على التحويل',
    },
  },
  {
    id: 'sun-h10',
    tier: 3,
    match: ({ planets }) => inHouse(planets.sun, 10),
    text: {
      en: 'Innate drive for visibility and high standing',
      ru: 'Врождённое стремление к заметности и высокому статусу',
      fa: 'میل ذاتی به دیده‌شدن و جایگاه بالا',
      ar: 'دافع فطري للبروز والمكانة العالية',
    },
  },
  {
    id: 'mars-h1',
    tier: 3,
    match: ({ planets }) => inHouse(planets.mars, 1),
    text: {
      en: 'High-energy presence and natural leadership',
      ru: 'Высокоэнергетическое присутствие и природное лидерство',
      fa: 'حضور پرانرژی و رهبری طبیعی',
      ar: 'حضور مفعم بالطاقة وقيادة فطرية',
    },
  },
  {
    id: 'saturn-h6',
    tier: 3,
    match: ({ planets }) => inHouse(planets.saturn, 6),
    text: {
      en: 'Exceptional work discipline and craftsmanship',
      ru: 'Исключительная рабочая дисциплина и мастерство',
      fa: 'نظم کاری بی‌نظیر و استادکاری',
      ar: 'انضباط مهني استثنائي وإتقان',
    },
  },

  // ── Tier 4: element fallbacks (always something to say) ──
  {
    id: 'earth-dominant',
    tier: 4,
    match: ({ balance }) => balance.percent.earth >= 40,
    text: {
      en: 'Grounded realism and the power to execute',
      ru: 'Заземлённый реализм и сила доводить до конца',
      fa: 'واقع‌گرایی و قدرت اجرا',
      ar: 'واقعية راسخة وقدرة على التنفيذ',
    },
  },
  {
    id: 'water-dominant',
    tier: 4,
    match: ({ balance }) => balance.percent.water >= 40,
    text: {
      en: 'Deep intuition and emotional intelligence',
      ru: 'Глубокая интуиция и эмоциональный интеллект',
      fa: 'شهود عمیق و هوش هیجانی',
      ar: 'حدس عميق وذكاء عاطفي',
    },
  },
  {
    id: 'fire-dominant',
    tier: 4,
    match: ({ balance }) => balance.percent.fire >= 40,
    text: {
      en: 'Passion, courage, and pioneering energy',
      ru: 'Страсть, смелость и первопроходческая энергия',
      fa: 'اشتیاق، شجاعت و انرژی ابتکاری',
      ar: 'شغف وشجاعة وطاقة ريادية',
    },
  },
  {
    id: 'air-dominant',
    tier: 4,
    match: ({ balance }) => balance.percent.air >= 40,
    text: {
      en: 'Clear thinking and the power of connection',
      ru: 'Ясное мышление и сила связи',
      fa: 'تفکر شفاف و قدرت ارتباطی',
      ar: 'تفكير صافٍ وقدرة على التواصل',
    },
  },
];

/**
 * Final safety net so that every chart has at least one bullet — this is
 * keyed off the most populated element, regardless of whether it cleared
 * the 40% threshold. Order in this map mirrors the tier-4 rules above so
 * the wording is consistent.
 */
const DOMINANT_FALLBACK: Record<ElementKey, StrengthText> = {
  earth: {
    en: 'Grounded approach and a builder’s patience',
    ru: 'Заземлённый подход и терпение строителя',
    fa: 'رویکرد ریشه‌دار و صبر سازنده',
    ar: 'منهج راسخ وصبر باني',
  },
  water: {
    en: 'Intuitive depth and emotional sensitivity',
    ru: 'Интуитивная глубина и эмоциональная чуткость',
    fa: 'عمق شهودی و حساسیت عاطفی',
    ar: 'عمق حدسي وحسّاسية عاطفية',
  },
  fire: {
    en: 'Lively drive and creative spark',
    ru: 'Живой драйв и творческая искра',
    fa: 'محرک پویا و جرقه‌ی خلاقیت',
    ar: 'دافع حيّ وشرارة إبداع',
  },
  air: {
    en: 'Curious mind and gift for ideas',
    ru: 'Любопытный ум и дар идей',
    fa: 'ذهن کنجکاو و موهبت ایده‌پردازی',
    ar: 'عقل فضولي وموهبة الأفكار',
  },
};

/**
 * Run every rule against the chart context, sort by tier (then by id for
 * determinism so the same chart always renders the same bullets in the
 * same order), and return at most `limit` lines. Always guarantees at
 * least one fallback line based on the dominant element so the UI is
 * never empty.
 */
export function computeChartStrengths(
  planets: Record<string, ChartPlanet>,
  aspects: NatalAspect[],
  lang: ChartLang,
  limit = 4
): string[] {
  const balance = computeElementBalance(planets);
  const ctx: StrengthContext = { planets, aspects, balance };

  const matched = RULES.filter((r) => r.match(ctx)).sort(
    (a, b) => a.tier - b.tier || a.id.localeCompare(b.id)
  );

  const seenTexts = new Set<string>();
  const picked: string[] = [];
  for (const r of matched) {
    const line = r.text[lang] ?? r.text.en;
    if (seenTexts.has(line)) continue;
    seenTexts.add(line);
    picked.push(line);
    if (picked.length >= limit) break;
  }

  if (picked.length === 0) {
    const line =
      DOMINANT_FALLBACK[balance.dominant][lang] ??
      DOMINANT_FALLBACK[balance.dominant].en;
    picked.push(line);
  }

  return picked;
}
