/**
 * Typed Ask Resolution v1 — bind free-text Ask to shipped Decision Types
 * only when semantic evidence is strong. Fail closed otherwise.
 *
 * Not UI routing. Not coarse ask-decision/intent authority.
 */

import type { AppLang } from '@/lib/app-settings';

/** Shipped consumer Decision Types this resolver may bind. */
export type TypedResolvableDecisionTypeId =
  | 'car-interview'
  | 'mar-wedding-date'
  | 'bus-investor-meeting'
  | 'bus-product-launch';

export type TypedDecisionResolution =
  | {
      status: 'exact';
      decisionTypeId: TypedResolvableDecisionTypeId;
      domain?: string;
    }
  | {
      status: 'ambiguous';
      domain?: string;
      clarificationKind?: string;
    }
  | {
      status: 'unsupported';
      domain?: string;
    };

type CueBag = Record<AppLang, readonly string[]>;

type ExactFamily = {
  decisionTypeId: TypedResolvableDecisionTypeId;
  domain: string;
  positives: CueBag;
  negatives: CueBag;
};

/**
 * Closed lexicons seeded from guided/popular labels + a small synonym set.
 * Match against the union of all locales so text language need not match UI lang.
 */
const EXACT_FAMILIES: readonly ExactFamily[] = [
  {
    decisionTypeId: 'car-interview',
    domain: 'career',
    positives: {
      en: [
        'job interview',
        'employment interview',
        'interview for this role',
        'interview for the role',
        'interview for a role',
        'schedule my interview',
        'schedule an interview',
        'my interview',
        'for my interview',
      ],
      fa: [
        'مصاحبه کاری',
        'مصاحبه شغل',
        'زمان مصاحبه',
        'وقت مصاحبه',
        'برای مصاحبه',
        'روز مصاحبه',
        'تاریخ مصاحبه',
      ],
      ar: ['مقابلة عمل', 'مقابلة الوظيفة', 'موعد المقابلة', 'مقابلتي'],
      ru: [
        'собеседование',
        'собеседования',
        'собеседованию',
        'на собеседование',
      ],
    },
    negatives: {
      en: [
        'accept this job',
        'accept the job',
        'accept the offer',
        'negotiate this offer',
        'negotiate the offer',
        'negotiate salary',
        'podcast interview',
        'media interview',
        'press interview',
      ],
      fa: [
        'مصاحبه رسانه',
        'پادکست',
        'قبول این شغل',
        'قبول کردن کار',
        'مذاکره حقوق',
        'پیشنهاد شغلی',
      ],
      ar: ['مقابلة إعلامية', 'بودكاست', 'قبول هذه الوظيفة'],
      ru: [
        'интервью для сми',
        'подкаст',
        'принять эту работу',
        'принять предложение',
      ],
    },
  },
  {
    decisionTypeId: 'bus-investor-meeting',
    domain: 'business',
    positives: {
      en: [
        'meet an investor',
        'meet the investor',
        'investor meeting',
        'meeting with an investor',
        'meeting with investors',
        'vc pitch',
        'pitch to investors',
        'pitch for funding',
        'pitch for investment',
        'venture capital',
        'fundraising meeting',
        'raise funding',
      ],
      fa: [
        'جلسه با سرمایه‌گذار',
        'سرمایه‌گذار',
        'جذب سرمایه',
        'ارائه برای جذب سرمایه',
        'جلسه سرمایه‌گذاری',
      ],
      ar: [
        'لقاء مستثمر',
        'لقاء مع مستثمر',
        'عرض للتمويل',
        'اجتماع مستثمر',
        'مستثمر',
        'تمويل',
      ],
      ru: [
        'встреча с инвестором',
        'инвестором',
        'инвестору',
        'питч',
        'привлечени',
        'венчур',
      ],
    },
    negatives: {
      en: [
        'invest in this stock',
        'invest in stock',
        'stock investment',
        'crypto',
        'good investment',
        'invest in this',
        'portfolio',
      ],
      fa: [
        'سهام',
        'رمزارز',
        'کریپتو',
        'بیت‌کوین',
        'بیت کوین',
        'سرمایه‌گذاری در سهام',
      ],
      ar: ['أسهم', 'عملات رقمية', 'استثمار في الأسهم'],
      ru: ['акци', 'крипто', 'вложить в акции', 'инвестировать в акции'],
    },
  },
  {
    decisionTypeId: 'bus-product-launch',
    domain: 'business',
    positives: {
      en: [
        'launch my app',
        'launch our app',
        'launch the app',
        'launch my product',
        'launch our product',
        'launch the product',
        'launch a product',
        'launch my project',
        'launch our project',
        'launch a new project',
        'launch a new product',
        'product launch',
        'app launch',
        'release our product',
        'release my product',
        'release the product',
        'release our app',
        'go live with',
        'go-live',
      ],
      fa: [
        'لانچ پروژه',
        'لانچ محصول',
        'لانچ اپ',
        'راه‌اندازی محصول',
        'راه‌اندازی پروژه',
        'انتشار محصول',
        'عرضه محصول',
      ],
      ar: [
        'إطلاق مشروع',
        'إطلاق منتج',
        'إطلاق تطبيق',
        'إطلاق التطبيق',
        'طرح المنتج',
        'إصدار المنتج',
      ],
      ru: [
        'запуск нового проекта',
        'запуск нового продукта',
        'запустить продукт',
        'запустить приложение',
        'запуск продукта',
        'запуск приложения',
        'релиз продукта',
      ],
    },
    negatives: {
      en: [
        'start a business',
        'start my business',
        'start the business',
        'close a client deal',
        'close the deal',
        'pivot the company',
        'pivot my company',
      ],
      fa: ['شروع کسب‌وکار', 'شروع کسب و کار', 'بستن قرارداد مشتری'],
      ar: ['بدء عمل', 'بدء مشروع تجاري', 'إغلاق صفقة'],
      ru: ['начать бизнес', 'открыть бизнес', 'развернуть компанию'],
    },
  },
  {
    decisionTypeId: 'mar-wedding-date',
    domain: 'relationship',
    positives: {
      en: [
        'wedding date',
        'wedding ceremony',
        'date for our wedding',
        'day for our wedding',
        'best day for our wedding',
        'get married',
        'our wedding',
        'wedding day',
        'choose wedding',
      ],
      fa: ['تاریخ عروسی', 'عروسی', 'روز عروسی', 'مراسم عروسی'],
      ar: [
        'تاريخ الزفاف',
        'تاريخ للزفاف',
        'الزفاف',
        'للزفاف',
        'زفاف',
        'حفل الزفاف',
        'موعد الزفاف',
      ],
      ru: ['дату свадьбы', 'дата свадьбы', 'свадьбы', 'свадебной церемонии', 'свадьба'],
    },
    negatives: {
      en: [
        'marry this person',
        'should i marry',
        'relationship right for me',
        'is this relationship',
      ],
      fa: ['با این شخص ازدواج', 'آیا این رابطه'],
      ar: ['أتزوج هذا الشخص', 'هل هذه العلاقة'],
      ru: ['жениться на этом', 'выйти замуж за', 'эта отношения'],
    },
  },
];

/** Ambiguous domain cues — understood, but no safe subtype binding. */
const AMBIGUOUS_RULES: readonly {
  domain: string;
  clarificationKind: string;
  cues: CueBag;
}[] = [
  {
    domain: 'business',
    clarificationKind: 'business_subtype',
    cues: {
      en: [
        'business deal',
        'business negotiation',
        'business decision',
        'important business',
        'close an important',
        'big business decision',
        'client deal',
      ],
      fa: ['معامله تجاری', 'تصمیم تجاری', 'مذاکره تجاری', 'بستن معامله'],
      ar: ['صفقة تجارية', 'قرار تجاري', 'تفاوض تجاري'],
      ru: ['деловое решение', 'бизнес-решение', 'деловая сделка', 'бизнес сделк'],
    },
  },
  {
    domain: 'meeting',
    clarificationKind: 'meeting_subtype',
    cues: {
      en: [
        'important meeting',
        'big meeting',
        'meeting next week',
        'meeting tomorrow',
      ],
      fa: ['جلسه مهم', 'قرار ملاقات مهم', 'میтинг مهم'],
      ar: ['اجتماع مهم', 'لقاء مهم'],
      ru: ['важная встреча', 'важное совещание'],
    },
  },
];

const UNSUPPORTED_DOMAIN_CUES: readonly {
  domain: string;
  cues: CueBag;
}[] = [
  {
    domain: 'relocation',
    cues: {
      en: ['relocate', 'move to', 'moving to', 'emigrate', 'immigrate'],
      fa: ['مهاجرت', 'اسباب‌کشی', 'نقل مکان'],
      ar: ['الانتقال', 'الهجرة', 'الانتقال إلى'],
      ru: ['переехать', 'релокац', 'иммиграц', 'эмиграц'],
    },
  },
  {
    domain: 'education',
    cues: {
      en: ['university', 'degree', 'course', 'school', 'study', 'education'],
      fa: ['دانشگاه', 'مدرک', 'تحصیل', 'دوره آموزشی'],
      ar: ['جامعة', 'دراسة', 'تعليم', 'شهادة'],
      ru: ['университет', 'учеба', 'образование', 'курс'],
    },
  },
  {
    domain: 'legal',
    cues: {
      en: ['lawsuit', 'lawyer', 'legal', 'court', 'compliance', 'nda'],
      fa: ['وکیل', 'دادگاه', 'قانونی', 'شکایت'],
      ar: ['محام', 'قضية', 'قانوني', 'محكمة'],
      ru: ['юрист', 'суд', 'иск', 'юридическ'],
    },
  },
  {
    domain: 'personal_investment',
    cues: {
      en: [
        'invest in this stock',
        'invest in stock',
        'stock investment',
        'crypto',
        'good investment',
        'invest in this',
      ],
      fa: [
        'سهام',
        'رمزارز',
        'کریپتو',
        'بیت‌کوین',
        'بیت کوین',
        'سرمایه‌گذاری در سهام',
      ],
      ar: ['أسهم', 'عملات رقمية', 'استثمار في الأسهم'],
      ru: ['акци', 'крипто', 'вложить в акции', 'инвестировать в акции'],
    },
  },
  {
    domain: 'commercial_agreement',
    cues: {
      en: [
        'commercial agreement',
        'partnership agreement',
        'sign a contract',
        'sign the contract',
        'business partnership',
      ],
      fa: ['قرارداد تجاری', 'شراکت تجاری', 'امضای قرارداد'],
      ar: ['اتفاقية تجارية', 'شراكة تجارية', 'توقيع عقد'],
      ru: ['коммерческое соглашени', 'деловое партнёрств', 'подписать договор'],
    },
  },
  {
    domain: 'relationship',
    cues: {
      en: [
        'relationship right',
        'this relationship',
        'dating',
        'strengthen a relationship',
      ],
      fa: ['این رابطه', 'رابطه عاطفی', 'قرار عاشقانه'],
      ar: ['هذه العلاقة', 'علاقة عاطفية'],
      ru: ['эти отношения', 'отношения со мной', 'свидани'],
    },
  },
];

/** Normalize for closed-lexicon matching (FA/AR-safe; no transliteration). */
export function normalizeTypedAskText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[\u200c\u200d\u200e\u200f\ufeff]/g, '')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function allCues(bag: CueBag): string[] {
  return [...bag.en, ...bag.fa, ...bag.ar, ...bag.ru];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Substring match; short Latin tokens require whitespace boundaries (not \\b). */
function includesCue(normalized: string, cue: string): boolean {
  const needle = normalizeTypedAskText(cue);
  if (!needle) return false;
  if (/^[a-z0-9]+$/i.test(needle) && needle.length <= 3) {
    return new RegExp(
      `(?:^|\\s)${escapeRegExp(needle)}(?:\\s|$)`,
      'i'
    ).test(normalized);
  }
  return normalized.includes(needle);
}

function anyCueMatches(normalized: string, bag: CueBag): boolean {
  return allCues(bag).some((cue) => includesCue(normalized, cue));
}

function familyMatches(normalized: string, family: ExactFamily): boolean {
  if (anyCueMatches(normalized, family.negatives)) return false;
  return anyCueMatches(normalized, family.positives);
}

/**
 * Resolve typed free-text to exact / ambiguous / unsupported.
 * `lang` reserved for future locale-biased ranking; matching uses all cue locales.
 */
export function resolveTypedDecisionType(
  text: string,
  lang: AppLang = 'en'
): TypedDecisionResolution {
  // Locale is part of the public contract for callers; matching uses the
  // closed multilingual cue union so text language need not equal UI lang.
  void lang;
  const normalized = normalizeTypedAskText(text);
  if (!normalized) {
    return { status: 'unsupported' };
  }

  const hits = EXACT_FAMILIES.filter((family) =>
    familyMatches(normalized, family)
  );

  if (hits.length > 1) {
    return {
      status: 'ambiguous',
      domain: 'collision',
      clarificationKind: 'decision_type_collision',
    };
  }

  if (hits.length === 1) {
    const hit = hits[0]!;
    return {
      status: 'exact',
      decisionTypeId: hit.decisionTypeId,
      domain: hit.domain,
    };
  }

  for (const rule of AMBIGUOUS_RULES) {
    if (anyCueMatches(normalized, rule.cues)) {
      return {
        status: 'ambiguous',
        domain: rule.domain,
        clarificationKind: rule.clarificationKind,
      };
    }
  }

  for (const rule of UNSUPPORTED_DOMAIN_CUES) {
    if (anyCueMatches(normalized, rule.cues)) {
      return { status: 'unsupported', domain: rule.domain };
    }
  }

  return { status: 'unsupported' };
}
