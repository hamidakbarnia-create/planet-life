/**
 * Offer-negotiation EVALUATE presentation (car-offer-negotiation only).
 *
 * Specific Supports/Watch lines are derived only from canonical Decision
 * Dimensions already on the Package semantic shadow, and only when those
 * dimensions name a real evidence id that can be joined to a Package driver.
 *
 * This layer does not interpret planet names. Natal targets never create a
 * claim. Transit-body → dimension routing is the engine's job
 * (`BODY_DIMENSION_WEIGHTS` applies to `transit_body` only) and is consumed
 * here only after it has already been written onto scored dimensions.
 *
 * If that linkage is missing, the view falls back to restrained timing copy.
 * The numeric score is never used to invent a negotiation claim.
 */

import type { AppLang } from '@/lib/app-settings';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import type {
  CounterpartyRoleKey,
  NegotiationGoalKey,
  OfferStageKey,
} from './copy';
import { packageStrength } from './evidence';

export const OFFER_NEGOTIATION_DECISION_TYPE_ID = 'car-offer-negotiation';

/** Canonical Decision Dimension ids (dimensions.v1-shadow). */
export const CANONICAL_DIMENSION_IDS = [
  'opportunity',
  'momentum',
  'clarity',
  'stability',
  'cooperation',
  'pressure',
  'reversibility_safety',
] as const;

export type CanonicalDimensionId = (typeof CANONICAL_DIMENSION_IDS)[number];

/**
 * Negotiation wording keyed to an authorized dimension + polarity.
 * Opportunity is intentionally unmapped: it is the generic "opportunity
 * conditions" dimension the previous result already over-used.
 */
export type OfferNegotiationCategory =
  | 'clarity'
  | 'cooperation'
  | 'momentum'
  | 'pressure'
  | 'verification';

export type OfferNegotiationConditionQuality = 'clean' | 'mixed' | 'strained';

export type OfferNegotiationStrength =
  | 'strong'
  | 'favorable'
  | 'mixed'
  | 'unfavorable';

export type OfferNegotiationEvidenceTrace = {
  dimensionId: CanonicalDimensionId;
  evidenceId: string;
  driverId: string;
  factorKey?: string;
  polarity: 'supportive' | 'cautionary';
  contribution: number;
  category: OfferNegotiationCategory;
  semanticCode?: string;
};

export type OfferNegotiationContext = {
  negotiation_goal?: unknown;
  offer_stage?: unknown;
  counterparty_role?: unknown;
  [key: string]: unknown;
};

export type OfferNegotiationResultView = {
  headline: string;
  summary: string;
  supports: string[];
  watch: string[];
  /** Ordinary preparation — not an astrological conclusion. */
  nextStep: string;
  contextNote: string | null;
  strength: OfferNegotiationStrength;
  conditionQuality: OfferNegotiationConditionQuality;
  /** True only when at least one Supports/Watch line has a full evidence trace. */
  evidenceGrounded: boolean;
  /** True when scored dimensions / classification are absent or insufficient. */
  semanticInsufficient: boolean;
  evidence: OfferNegotiationEvidenceTrace[];
};

const MAX_ITEMS = 2;
const HIGH_THRESHOLD = 65;
const LOW_THRESHOLD = 45;
const INVERTED_DIMENSIONS = new Set<CanonicalDimensionId>(['pressure']);

const FORWARD_CLASSES = new Set(['high_leverage', 'action', 'build']);
const RESTRICTIVE_CLASSES = new Set(['defensive', 'recovery', 'review']);

type DimensionRole = 'support' | 'caution';

/**
 * Dimension + engine role → negotiation category.
 *
 * Only pairs the engine already treats as high/low scored dimensions.
 * No planet table. Opportunity is omitted on purpose.
 */
export function categoryForDimensionRole(
  dimensionId: string,
  role: DimensionRole
): OfferNegotiationCategory | null {
  if (dimensionId === 'clarity') return 'clarity';
  if (dimensionId === 'cooperation') return 'cooperation';
  if (dimensionId === 'momentum' && role === 'support') return 'momentum';
  if (dimensionId === 'pressure' && role === 'caution') return 'pressure';
  if (
    (dimensionId === 'stability' || dimensionId === 'reversibility_safety') &&
    role === 'caution'
  ) {
    return 'verification';
  }
  return null;
}

type StrengthCopy = Record<OfferNegotiationStrength, string>;

type OfferNegotiationCopy = {
  headlineClean: StrengthCopy;
  headlineNeedsCare: StrengthCopy;
  timingClause: StrengthCopy;
  conditionClause: Record<OfferNegotiationConditionQuality, string>;
  support: Partial<Record<OfferNegotiationCategory, string>>;
  watch: Partial<Record<OfferNegotiationCategory, string>>;
  nextStep: string;
  restrainedSummary: string;
  goalScope: Record<NegotiationGoalKey, string>;
  stageScope: Record<OfferStageKey, string>;
  roleScope: Record<CounterpartyRoleKey, string>;
  contextSentence: (parts: string[]) => string;
};

const EN: OfferNegotiationCopy = {
  headlineClean: {
    strong: 'Strong timing for opening the negotiation',
    favorable: 'Workable timing for advancing the negotiation',
    mixed: 'Uneven timing for this conversation',
    unfavorable: 'Weak timing for opening the negotiation',
  },
  headlineNeedsCare: {
    strong: 'Strong timing — but handle the conversation deliberately',
    favorable: 'Workable timing — but the conditions need care',
    mixed: 'Uneven timing — proceed only with preparation',
    unfavorable: 'Weak timing — consider preparing rather than pressing',
  },
  timingClause: {
    strong: 'Timing potential for this date is high.',
    favorable: 'Timing potential for this date is reasonable.',
    mixed: 'Timing potential for this date is uneven.',
    unfavorable: 'Timing potential for this date is low.',
  },
  conditionClause: {
    clean: 'The supporting conditions point in one direction.',
    mixed:
      'The conditions are mixed, so the conversation should not be rushed.',
    strained:
      'The conditions work against an easy exchange, so prepare carefully.',
  },
  support: {
    clarity: 'State your priorities clearly and keep the request structured.',
    cooperation: 'Use a cooperative tone to keep room for discussion.',
    momentum: 'Conditions support opening or advancing the conversation.',
  },
  watch: {
    clarity: 'Confirm important wording before treating anything as agreed.',
    cooperation: 'A warm exchange is not the same as a settled term.',
    pressure: 'Avoid ultimatums or reacting immediately to resistance.',
    verification:
      'Slow down and verify details before treating anything as agreed.',
  },
  nextStep:
    'Ordinary preparation: write down your priorities and a fallback position before the conversation.',
  restrainedSummary:
    'The available evidence supports general timing guidance only, so no specific negotiation reading is offered for this date.',
  goalScope: {
    salary: 'discussing salary',
    benefits: 'discussing benefits',
    role_title: 'discussing the role or title',
    start_date: 'discussing the start date',
    working_arrangement: 'discussing the working arrangement',
    complete_package: 'discussing the complete package',
    other: 'discussing another part of the offer',
  },
  stageScope: {
    verbal_offer: 'at the verbal-offer stage',
    written_offer: 'at the written-offer stage',
    revised_offer: 'at the revised-offer stage',
  },
  roleScope: {
    recruiter: 'with a recruiter',
    hiring_manager: 'with the hiring manager',
    founder_executive: 'with a founder or executive',
    hr_representative: 'with an HR representative',
  },
  contextSentence: (parts) =>
    `Written for ${parts.join(', ')}. This context shapes the wording only and does not affect the timing score.`,
};

const FA: OfferNegotiationCopy = {
  headlineClean: {
    strong: 'زمان مناسبی برای شروع مذاکره',
    favorable: 'زمان قابل‌قبولی برای پیش بردن مذاکره',
    mixed: 'زمان‌بندی این گفت‌وگو یکدست نیست',
    unfavorable: 'زمان مناسبی برای شروع مذاکره نیست',
  },
  headlineNeedsCare: {
    strong: 'زمان مناسبی است، اما گفت‌وگو را سنجیده پیش ببرید',
    favorable: 'زمان قابل‌قبولی است، اما شرایط دقت می‌خواهد',
    mixed: 'زمان‌بندی یکدست نیست؛ فقط با آمادگی پیش بروید',
    unfavorable: 'زمان مناسبی نیست؛ به‌جای فشار آوردن، آماده شوید',
  },
  timingClause: {
    strong: 'توان زمانی این تاریخ بالاست.',
    favorable: 'توان زمانی این تاریخ قابل‌قبول است.',
    mixed: 'توان زمانی این تاریخ یکدست نیست.',
    unfavorable: 'توان زمانی این تاریخ پایین است.',
  },
  conditionClause: {
    clean: 'نشانه‌های پشتیبان همگی یک جهت را نشان می‌دهند.',
    mixed: 'شرایط ترکیبی است، پس گفت‌وگو نباید با عجله پیش برود.',
    strained: 'شرایط به تبادل آسان کمک نمی‌کند؛ با آمادگی وارد شوید.',
  },
  support: {
    clarity: 'خواسته‌هایتان را شفاف و با ساختار مشخص بیان کنید.',
    cooperation: 'لحن همکارانه را حفظ کنید تا فضای گفت‌وگو باز بماند.',
    momentum: 'شرایط از آغاز یا پیش بردن گفت‌وگو پشتیبانی می‌کند.',
  },
  watch: {
    clarity: 'پیش از آنکه چیزی را توافق‌شده بدانید، متن دقیق را تأیید کنید.',
    cooperation: 'برخورد گرم به معنای نهایی‌شدن شرایط نیست.',
    pressure: 'از اولتیماتوم و واکنش فوری به مخالفت پرهیز کنید.',
    verification:
      'آهسته پیش بروید و جزئیات را پیش از توافق قطعی بررسی کنید.',
  },
  nextStep:
    'آمادگی معمولی: پیش از گفت‌وگو اولویت‌ها و حد پایین قابل‌قبولتان را بنویسید.',
  restrainedSummary:
    'شواهد موجود تنها راهنمایی کلی دربارهٔ زمان‌بندی را پشتیبانی می‌کند و برای این تاریخ تحلیل اختصاصی مذاکره ارائه نمی‌شود.',
  goalScope: {
    salary: 'گفت‌وگو دربارهٔ حقوق',
    benefits: 'گفت‌وگو دربارهٔ مزایا',
    role_title: 'گفت‌وگو دربارهٔ نقش یا عنوان شغلی',
    start_date: 'گفت‌وگو دربارهٔ تاریخ شروع کار',
    working_arrangement: 'گفت‌وگو دربارهٔ شرایط و نحوهٔ کار',
    complete_package: 'گفت‌وگو دربارهٔ کل بستهٔ پیشنهادی',
    other: 'گفت‌وگو دربارهٔ بخش دیگری از پیشنهاد',
  },
  stageScope: {
    verbal_offer: 'در مرحلهٔ پیشنهاد شفاهی',
    written_offer: 'در مرحلهٔ پیشنهاد کتبی',
    revised_offer: 'در مرحلهٔ پیشنهاد اصلاح‌شده',
  },
  roleScope: {
    recruiter: 'با کارشناس جذب',
    hiring_manager: 'با مدیر استخدام',
    founder_executive: 'با بنیان‌گذار یا مدیر ارشد',
    hr_representative: 'با نمایندهٔ منابع انسانی',
  },
  contextSentence: (parts) =>
    `این متن برای ${parts.join('، ')} نوشته شده است. این اطلاعات فقط بر نحوهٔ بیان اثر دارد و امتیاز زمان‌بندی را تغییر نمی‌دهد.`,
};

const AR: OfferNegotiationCopy = {
  headlineClean: {
    strong: 'توقيت قوي لبدء التفاوض',
    favorable: 'توقيت مناسب لدفع التفاوض إلى الأمام',
    mixed: 'توقيت غير متجانس لهذه المحادثة',
    unfavorable: 'توقيت ضعيف لبدء التفاوض',
  },
  headlineNeedsCare: {
    strong: 'توقيت قوي، لكن أدِر المحادثة بتأنٍّ',
    favorable: 'توقيت مناسب، لكن الظروف تحتاج إلى عناية',
    mixed: 'توقيت غير متجانس؛ لا تتقدم إلا بعد الاستعداد',
    unfavorable: 'توقيت ضعيف؛ الأفضل الاستعداد بدل الضغط',
  },
  timingClause: {
    strong: 'إمكانية التوقيت في هذا التاريخ عالية.',
    favorable: 'إمكانية التوقيت في هذا التاريخ معقولة.',
    mixed: 'إمكانية التوقيت في هذا التاريخ غير متجانسة.',
    unfavorable: 'إمكانية التوقيت في هذا التاريخ منخفضة.',
  },
  conditionClause: {
    clean: 'المؤشرات الداعمة تشير جميعها إلى اتجاه واحد.',
    mixed: 'الظروف متباينة، لذا لا ينبغي استعجال المحادثة.',
    strained: 'الظروف لا تساعد على تبادل سهل، فاستعد جيدًا.',
  },
  support: {
    clarity: 'اعرض أولوياتك بوضوح واحفظ الطلب مرتبًا.',
    cooperation: 'حافظ على نبرة تعاونية لإبقاء المجال مفتوحًا للنقاش.',
    momentum: 'الظروف تدعم فتح المحادثة أو المضي بها.',
  },
  watch: {
    clarity: 'أكِّد الصياغة المهمة قبل اعتبار أي بند متفقًا عليه.',
    cooperation: 'اللقاء الودّي لا يعني أن الشروط قد استقرت.',
    pressure: 'تجنّب الإنذارات أو الرد الفوري على الرفض.',
    verification: 'تمهل وتحقق من التفاصيل قبل اعتبار أي شيء متفقًا عليه.',
  },
  nextStep:
    'تحضير عادي: اكتب أولوياتك وحدّك الأدنى المقبول قبل المحادثة.',
  restrainedSummary:
    'الأدلة المتاحة تدعم إرشادًا عامًا للتوقيت فقط، ولا تُقدَّم قراءة تفاوضية خاصة لهذا التاريخ.',
  goalScope: {
    salary: 'مناقشة الراتب',
    benefits: 'مناقشة المزايا',
    role_title: 'مناقشة الدور أو المسمى الوظيفي',
    start_date: 'مناقشة تاريخ المباشرة',
    working_arrangement: 'مناقشة ترتيبات العمل',
    complete_package: 'مناقشة العرض كاملًا',
    other: 'مناقشة جانب آخر من العرض',
  },
  stageScope: {
    verbal_offer: 'في مرحلة العرض الشفهي',
    written_offer: 'في مرحلة العرض المكتوب',
    revised_offer: 'في مرحلة العرض المعدَّل',
  },
  roleScope: {
    recruiter: 'مع أخصائي التوظيف',
    hiring_manager: 'مع مدير التوظيف',
    founder_executive: 'مع مؤسس أو مدير تنفيذي',
    hr_representative: 'مع ممثل الموارد البشرية',
  },
  contextSentence: (parts) =>
    `كُتب هذا النص من أجل ${parts.join('، ')}. هذه التفاصيل تؤثر في الصياغة فقط ولا تغيّر درجة التوقيت.`,
};

const RU: OfferNegotiationCopy = {
  headlineClean: {
    strong: 'Сильное время, чтобы начать переговоры',
    favorable: 'Подходящее время, чтобы продвинуть переговоры',
    mixed: 'Неоднородное время для этого разговора',
    unfavorable: 'Слабое время, чтобы начинать переговоры',
  },
  headlineNeedsCare: {
    strong: 'Время сильное, но разговор стоит вести обдуманно',
    favorable: 'Время подходящее, но условия требуют аккуратности',
    mixed: 'Время неоднородное — идти только с подготовкой',
    unfavorable: 'Время слабое — лучше готовиться, чем давить',
  },
  timingClause: {
    strong: 'Временной потенциал этой даты высокий.',
    favorable: 'Временной потенциал этой даты приемлемый.',
    mixed: 'Временной потенциал этой даты неоднородный.',
    unfavorable: 'Временной потенциал этой даты низкий.',
  },
  conditionClause: {
    clean: 'Поддерживающие признаки указывают в одну сторону.',
    mixed: 'Условия смешанные, поэтому разговор не стоит торопить.',
    strained:
      'Условия не способствуют лёгкому обмену — готовьтесь тщательно.',
  },
  support: {
    clarity: 'Изложите приоритеты чётко и держите просьбу структурированной.',
    cooperation:
      'Сохраняйте сотрудничающий тон, чтобы оставить место для обсуждения.',
    momentum: 'Условия поддерживают начало или продолжение разговора.',
  },
  watch: {
    clarity:
      'Уточните важные формулировки, прежде чем считать что-либо согласованным.',
    cooperation: 'Тёплый разговор ещё не значит, что условия согласованы.',
    pressure: 'Избегайте ультиматумов и мгновенной реакции на возражения.',
    verification:
      'Не торопитесь и проверьте детали, прежде чем считать что-либо согласованным.',
  },
  nextStep:
    'Обычная подготовка: до разговора запишите приоритеты и приемлемый нижний предел.',
  restrainedSummary:
    'Доступные данные подтверждают только общие рекомендации по времени, поэтому отдельный разбор переговоров для этой даты не приводится.',
  goalScope: {
    salary: 'обсуждения зарплаты',
    benefits: 'обсуждения льгот',
    role_title: 'обсуждения роли или должности',
    start_date: 'обсуждения даты выхода',
    working_arrangement: 'обсуждения формата работы',
    complete_package: 'обсуждения предложения целиком',
    other: 'обсуждения другой части предложения',
  },
  stageScope: {
    verbal_offer: 'на этапе устного предложения',
    written_offer: 'на этапе письменного предложения',
    revised_offer: 'на этапе пересмотренного предложения',
  },
  roleScope: {
    recruiter: 'с рекрутером',
    hiring_manager: 'с нанимающим руководителем',
    founder_executive: 'с основателем или руководителем',
    hr_representative: 'с представителем HR',
  },
  contextSentence: (parts) =>
    `Текст составлен для ${parts.join(', ')}. Этот контекст влияет только на формулировки и не меняет оценку времени.`,
};

const COPY: Record<AppLang, OfferNegotiationCopy> = {
  en: EN,
  fa: FA,
  ar: AR,
  ru: RU,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function isCanonicalDimension(value: string): value is CanonicalDimensionId {
  return (CANONICAL_DIMENSION_IDS as readonly string[]).includes(value);
}

function assessmentOf(
  pkg: DecisionEvaluationPackage
): Record<string, unknown> | null {
  return asRecord(pkg.semantic_shadow?.assessments?.[0]);
}

function explanationOf(
  pkg: DecisionEvaluationPackage
): Record<string, unknown> | null {
  return asRecord(pkg.semantic_shadow?.explanation);
}

function dimensionBlob(
  assessment: Record<string, unknown> | null,
  key: string
): Record<string, unknown> | null {
  const dims = asRecord(assessment?.dimensions);
  return asRecord(dims?.[key]);
}

type AuthorizedRef = {
  role: DimensionRole;
  dimensionId: CanonicalDimensionId;
  evidenceIds: string[];
  semanticCode?: string;
};

/**
 * Prefer the engine's explanation.evidence_refs. If those are absent, rebuild
 * the same high/low dimension selection the engine uses (thresholds 65 / 45,
 * pressure inverted). Never invent a third rule.
 */
function authorizedDimensionRefs(
  pkg: DecisionEvaluationPackage
): AuthorizedRef[] {
  const explanation = explanationOf(pkg);
  const rawRefs = explanation?.evidence_refs;
  if (Array.isArray(rawRefs) && rawRefs.length > 0) {
    const parsed: AuthorizedRef[] = [];
    for (const item of rawRefs) {
      const blob = asRecord(item);
      if (!blob) continue;
      const role = blob.role;
      if (role !== 'support' && role !== 'caution') continue;
      const dimensionId =
        typeof blob.dimension_id === 'string' ? blob.dimension_id : '';
      if (!isCanonicalDimension(dimensionId)) continue;
      parsed.push({
        role,
        dimensionId,
        evidenceIds: asStringArray(blob.evidence_ids),
        semanticCode: typeof blob.code === 'string' ? blob.code : undefined,
      });
    }
    if (parsed.length > 0) return parsed;
  }
  return synthesizeRefsFromDimensions(assessmentOf(pkg));
}

function synthesizeRefsFromDimensions(
  assessment: Record<string, unknown> | null
): AuthorizedRef[] {
  if (!assessment) return [];
  const support: Array<AuthorizedRef & { rank: number }> = [];
  const caution: Array<AuthorizedRef & { rank: number }> = [];

  for (const key of CANONICAL_DIMENSION_IDS) {
    const blob = dimensionBlob(assessment, key);
    if (!blob || blob.status !== 'scored') continue;
    const value = Number(blob.value ?? 0);
    const strength = Number(blob.evidence_strength ?? 0);
    const dominant = asStringArray(blob.dominant_evidence_ids);
    const inverted = INVERTED_DIMENSIONS.has(key);
    const high = value >= HIGH_THRESHOLD;
    const low = value <= LOW_THRESHOLD;
    if (inverted) {
      if (high) {
        caution.push({
          role: 'caution',
          dimensionId: key,
          evidenceIds: dominant.length
            ? dominant
            : asStringArray(blob.caution_evidence_ids),
          semanticCode: 'semantic.high_pressure',
          rank: value + strength,
        });
      }
      continue;
    }
    if (high) {
      support.push({
        role: 'support',
        dimensionId: key,
        evidenceIds: dominant.length
          ? dominant
          : asStringArray(blob.supportive_evidence_ids),
        semanticCode: `semantic.high_${key}`,
        rank: value + strength,
      });
    } else if (low) {
      caution.push({
        role: 'caution',
        dimensionId: key,
        evidenceIds: dominant.length
          ? dominant
          : asStringArray(blob.caution_evidence_ids),
        semanticCode: `semantic.low_${key}`,
        rank: 100 - value + strength,
      });
    }
  }

  support.sort((a, b) => b.rank - a.rank || a.dimensionId.localeCompare(b.dimensionId));
  caution.sort((a, b) => b.rank - a.rank || a.dimensionId.localeCompare(b.dimensionId));
  return [...support.slice(0, 2), ...caution.slice(0, 2)].map((item) => ({
    role: item.role,
    dimensionId: item.dimensionId,
    evidenceIds: item.evidenceIds,
    semanticCode: item.semanticCode,
  }));
}

function evidenceBelongsToDimension(
  assessment: Record<string, unknown> | null,
  dimensionId: CanonicalDimensionId,
  role: DimensionRole,
  evidenceId: string
): boolean {
  const blob = dimensionBlob(assessment, dimensionId);
  if (!blob || blob.status !== 'scored') return false;
  const supportive = asStringArray(blob.supportive_evidence_ids);
  const caution = asStringArray(blob.caution_evidence_ids);
  const dominant = asStringArray(blob.dominant_evidence_ids);
  if (role === 'support') {
    return supportive.includes(evidenceId) || dominant.includes(evidenceId);
  }
  return caution.includes(evidenceId) || dominant.includes(evidenceId);
}

function driverForEvidenceId(
  pkg: DecisionEvaluationPackage,
  evidenceId: string
): {
  id: string;
  factorKey?: string;
  polarity: 'supportive' | 'cautionary';
  contribution: number;
} | null {
  for (const driver of pkg.drivers.items) {
    const factorKey = driver.factor_key;
    const matchesKey = factorKey ? `ev.${factorKey}` === evidenceId : false;
    const matchesId = driver.id === evidenceId;
    if (!matchesKey && !matchesId) continue;
    const polarity =
      driver.polarity === 'supportive' || driver.polarity === 'cautionary'
        ? driver.polarity
        : typeof driver.contribution === 'number'
          ? driver.contribution < 0
            ? 'cautionary'
            : driver.contribution > 0
              ? 'supportive'
              : null
          : null;
    if (!polarity) continue;
    if (typeof driver.contribution !== 'number') continue;
    return {
      id: driver.id,
      factorKey,
      polarity,
      contribution: driver.contribution,
    };
  }
  return null;
}

/**
 * Condition quality authority (canonical Package fields only).
 *
 * insufficient → quality `mixed`, `semanticInsufficient=true`:
 *   no assessment, no scored dimensions, `scored_dimension_count === 0`,
 *   or `day_class === 'insufficient'`. No Supports/Watch claims.
 *
 * mixed:
 *   `dimension_classification.same_dimension_conflict`,
 *   non-empty `conflicted_dimension_ids`,
 *   `caution_codes` contains `semantic.same_dimension_conflict`,
 *   `headline_code === 'semantic.mixed_conflict'`,
 *   or both support and caution explanation codes are present.
 *   A high numeric score does not override this.
 *
 * strained:
 *   non-empty `veto_dimension_ids`,
 *   `caution_codes` contains `semantic.veto_present`,
 *   `day_class` in defensive | recovery | review,
 *   or caution codes exist with no support codes.
 *
 * clean:
 *   `day_class` in high_leverage | action | build, no veto,
 *   and no caution explanation codes.
 *
 * Fallback when none of the above match: `mixed`.
 * Driver polarity alone never sets quality.
 */
function conditionRead(
  pkg: DecisionEvaluationPackage
): {
  quality: OfferNegotiationConditionQuality;
  insufficient: boolean;
} {
  const assessment = assessmentOf(pkg);
  const explanation = explanationOf(pkg);
  const classification = asRecord(assessment?.dimension_classification);
  const cautionCodes = asStringArray(explanation?.caution_codes);
  const supportCodes = asStringArray(explanation?.support_codes);
  const scoredCount = Number(classification?.scored_dimension_count ?? 0);
  const dayClass =
    typeof classification?.day_class === 'string'
      ? classification.day_class
      : '';

  const hasDimensions = CANONICAL_DIMENSION_IDS.some((key) => {
    const blob = dimensionBlob(assessment, key);
    return blob?.status === 'scored';
  });

  const insufficient =
    !assessment ||
    !hasDimensions ||
    scoredCount === 0 ||
    dayClass === 'insufficient';

  const conflictedIds = asStringArray(classification?.conflicted_dimension_ids);
  const sameConflict =
    classification?.same_dimension_conflict === true ||
    conflictedIds.length > 0 ||
    cautionCodes.includes('semantic.same_dimension_conflict') ||
    explanation?.headline_code === 'semantic.mixed_conflict';

  const veto =
    asStringArray(classification?.veto_dimension_ids).length > 0 ||
    cautionCodes.includes('semantic.veto_present');

  if (insufficient) {
    return { quality: 'mixed', insufficient: true };
  }
  if (sameConflict) {
    return { quality: 'mixed', insufficient: false };
  }
  if (veto || RESTRICTIVE_CLASSES.has(dayClass)) {
    return { quality: 'strained', insufficient: false };
  }
  if (FORWARD_CLASSES.has(dayClass) && supportCodes.length > 0 && cautionCodes.length === 0) {
    return { quality: 'clean', insufficient: false };
  }
  if (FORWARD_CLASSES.has(dayClass) && cautionCodes.length === 0 && !veto) {
    return { quality: 'clean', insufficient: false };
  }
  if (supportCodes.length > 0 && cautionCodes.length > 0) {
    return { quality: 'mixed', insufficient: false };
  }
  if (cautionCodes.length > 0 && supportCodes.length === 0) {
    return { quality: 'strained', insufficient: false };
  }
  return { quality: 'mixed', insufficient: false };
}

function narrowStrength(
  band: ReturnType<typeof packageStrength>
): OfferNegotiationStrength | null {
  if (
    band === 'strong' ||
    band === 'favorable' ||
    band === 'mixed' ||
    band === 'unfavorable'
  ) {
    return band;
  }
  return null;
}

function scopePhrase(
  phrases: Record<string, string>,
  value: unknown
): string | null {
  if (typeof value !== 'string') return null;
  const key = value.trim();
  if (!key) return null;
  return Object.prototype.hasOwnProperty.call(phrases, key)
    ? phrases[key]
    : null;
}

function buildContextNote(
  copy: OfferNegotiationCopy,
  context: OfferNegotiationContext | undefined
): string | null {
  if (!context) return null;
  const parts = [
    scopePhrase(copy.goalScope, context.negotiation_goal),
    scopePhrase(copy.stageScope, context.offer_stage),
    scopePhrase(copy.roleScope, context.counterparty_role),
  ].filter((part): part is string => part !== null);
  if (parts.length === 0) return null;
  return copy.contextSentence(parts);
}

function groundedLines(
  pkg: DecisionEvaluationPackage,
  copy: OfferNegotiationCopy
): { supports: string[]; watch: string[]; traces: OfferNegotiationEvidenceTrace[] } {
  const assessment = assessmentOf(pkg);
  const traces: OfferNegotiationEvidenceTrace[] = [];
  const supports: string[] = [];
  const watch: string[] = [];
  const seenSupport = new Set<OfferNegotiationCategory>();
  const seenWatch = new Set<OfferNegotiationCategory>();

  for (const ref of authorizedDimensionRefs(pkg)) {
    const category = categoryForDimensionRole(ref.dimensionId, ref.role);
    if (!category) continue;
    const line =
      ref.role === 'support' ? copy.support[category] : copy.watch[category];
    if (!line) continue;
    const bucket = ref.role === 'support' ? supports : watch;
    const seen = ref.role === 'support' ? seenSupport : seenWatch;
    if (bucket.length >= MAX_ITEMS || seen.has(category)) continue;

    let linked: OfferNegotiationEvidenceTrace | null = null;
    for (const evidenceId of ref.evidenceIds) {
      if (
        !evidenceBelongsToDimension(
          assessment,
          ref.dimensionId,
          ref.role,
          evidenceId
        )
      ) {
        continue;
      }
      const driver = driverForEvidenceId(pkg, evidenceId);
      if (!driver) continue;
      const expectedPolarity =
        ref.role === 'support' ? 'supportive' : 'cautionary';
      if (driver.polarity !== expectedPolarity) continue;
      linked = {
        dimensionId: ref.dimensionId,
        evidenceId,
        driverId: driver.id,
        factorKey: driver.factorKey,
        polarity: driver.polarity,
        contribution: driver.contribution,
        category,
        semanticCode: ref.semanticCode,
      };
      break;
    }
    if (!linked) continue;
    seen.add(category);
    bucket.push(line);
    traces.push(linked);
  }

  return { supports, watch, traces };
}

export function buildOfferNegotiationResultView(
  pkg: DecisionEvaluationPackage,
  lang: AppLang,
  context?: OfferNegotiationContext
): OfferNegotiationResultView | null {
  if (pkg.decision_type_id !== OFFER_NEGOTIATION_DECISION_TYPE_ID) return null;
  if (pkg.mode !== 'evaluate_date') return null;
  if (pkg.recommendation.stance === 'insufficient_data') return null;
  if (!pkg.timing.material) return null;

  const strength = narrowStrength(packageStrength(pkg));
  if (!strength) return null;

  const copy = COPY[lang];
  const { quality, insufficient } = conditionRead(pkg);
  const grounded = insufficient
    ? { supports: [], watch: [], traces: [] }
    : groundedLines(pkg, copy);
  const evidenceGrounded = grounded.traces.length > 0;

  const headline =
    quality === 'clean' && !insufficient
      ? copy.headlineClean[strength]
      : copy.headlineNeedsCare[strength];

  const summary =
    evidenceGrounded && !insufficient
      ? `${copy.timingClause[strength]} ${copy.conditionClause[quality]}`
      : `${copy.timingClause[strength]} ${copy.restrainedSummary}`;

  return {
    headline,
    summary,
    supports: grounded.supports,
    watch: grounded.watch,
    nextStep: copy.nextStep,
    contextNote: buildContextNote(copy, context),
    strength,
    conditionQuality: quality,
    evidenceGrounded,
    semanticInsufficient: insufficient,
    evidence: grounded.traces,
  };
}
