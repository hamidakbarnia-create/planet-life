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
  /**
   * Shown only when classification is mixed and no caution trace joined.
   * Not a Watch bullet and not a fabricated category.
   */
  watchNotice: string | null;
  supportHeading: string;
  watchHeading: string;
  nextStepHeading: string;
  /** Practical preparation — not an astrological conclusion. */
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
  headlineStrained: StrengthCopy;
  headlineInsufficient: StrengthCopy;
  conditionClause: Record<OfferNegotiationConditionQuality, string>;
  support: Partial<Record<OfferNegotiationCategory, string>>;
  watch: Partial<Record<OfferNegotiationCategory, string>>;
  supportHeading: string;
  watchHeading: string;
  nextStepHeading: string;
  nextStep: string;
  restrainedSummary: string;
  mixedCautionInsufficient: string;
  backToAsk: string;
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
  headlineStrained: {
    strong: 'Strong timing — but the conditions call for caution',
    favorable: 'Workable timing — but the conditions are strained',
    mixed: 'Uneven timing under strained conditions',
    unfavorable: 'Weak timing under strained conditions',
  },
  headlineInsufficient: {
    strong: 'General timing for this date is strong',
    favorable: 'General timing for this date is workable',
    mixed: 'General timing for this date is uneven',
    unfavorable: 'General timing for this date is weak',
  },
  conditionClause: {
    clean: 'The supporting conditions point in one direction.',
    mixed:
      'The conditions are mixed, so the conversation should not be rushed.',
    strained:
      'The conditions work against an easy exchange, so prepare carefully.',
  },
  support: {
    clarity:
      'Communication conditions support presenting your priorities clearly.',
    cooperation: 'Cooperative conditions support a constructive exchange.',
    momentum: 'The timing supports opening or advancing the negotiation.',
  },
  watch: {
    clarity: 'Verify mutual understanding and avoid unclear wording.',
    cooperation: 'Keep a constructive tone throughout the conversation.',
    pressure: 'Do not rush a response or escalate the conversation.',
    verification: 'Check the practical details before relying on them.',
  },
  supportHeading: 'What supports this timing',
  watchHeading: 'What to watch',
  nextStepHeading: 'Practical next step',
  nextStep:
    'Practical preparation: write down your priorities and a fallback position before the conversation.',
  restrainedSummary:
    'The available evidence supports general timing guidance only, so no specific negotiation reading is offered for this date.',
  mixedCautionInsufficient:
    'Mixed conditions were detected, but there is not enough grounded evidence to explain the caution precisely.',
  backToAsk: 'Back to Ask',
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
    strong: 'زمان قدرتمندی برای آغاز مذاکره است',
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
  headlineStrained: {
    strong: 'زمان قدرتمندی است، اما شرایط احتیاط جدی می‌طلبد',
    favorable: 'زمان قابل‌قبولی است، اما شرایط تحت فشار است',
    mixed: 'زمان‌بندی یکدست نیست و شرایط تحت فشار است',
    unfavorable: 'زمان ضعیفی است و شرایط تحت فشار است',
  },
  headlineInsufficient: {
    strong: 'زمان‌بندی کلی این تاریخ قوی است',
    favorable: 'زمان‌بندی کلی این تاریخ قابل‌قبول است',
    mixed: 'زمان‌بندی کلی این تاریخ یکدست نیست',
    unfavorable: 'زمان‌بندی کلی این تاریخ ضعیف است',
  },
  conditionClause: {
    clean: 'نشانه‌های پشتیبان همگی یک جهت را نشان می‌دهند.',
    mixed: 'شرایط ترکیبی است، پس گفت‌وگو نباید با عجله پیش برود.',
    strained: 'شرایط به تبادل آسان کمک نمی‌کند؛ با آمادگی وارد شوید.',
  },
  support: {
    clarity: 'شرایط ارتباطی به بیان روشن اولویت‌ها کمک می‌کند.',
    cooperation: 'شرایط همکاری به گفت‌وگویی سازنده کمک می‌کند.',
    momentum: 'این زمان برای آغاز یا پیش‌برد مذاکره کمک‌کننده است.',
  },
  watch: {
    clarity: 'درک مشترک را بررسی کنید و از بیان مبهم بپرهیزید.',
    cooperation: 'لحن سازنده را در گفت‌وگو حفظ کنید.',
    pressure: 'پاسخ را شتاب‌زده ندهید و گفت‌وگو را تشدید نکنید.',
    verification: 'جزئیات عملی را پیش از تکیه بر آن‌ها بررسی کنید.',
  },
  supportHeading: 'چه چیزی به این زمان کمک می‌کند',
  watchHeading: 'به چه چیزی توجه کنید',
  nextStepHeading: 'گام عملی بعدی',
  nextStep:
    'آمادگی عملی: پیش از گفت‌وگو اولویت‌ها و حد پایین قابل‌قبولتان را بنویسید.',
  restrainedSummary:
    'شواهد موجود تنها راهنمایی کلی دربارهٔ زمان‌بندی را پشتیبانی می‌کند و برای این تاریخ تحلیل اختصاصی مذاکره ارائه نمی‌شود.',
  mixedCautionInsufficient:
    'شرایط ترکیبی تشخیص داده شده، اما شواهد کافی برای توضیح دقیق عامل احتیاط وجود ندارد.',
  backToAsk: 'بازگشت به طرح پرسش',
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
  headlineStrained: {
    strong: 'توقيت قوي، لكن الظروف تستدعي الحذر',
    favorable: 'توقيت مناسب، لكن الظروف متوترّة',
    mixed: 'توقيت غير متجانس في ظروف متوترّة',
    unfavorable: 'توقيت ضعيف في ظروف متوترّة',
  },
  headlineInsufficient: {
    strong: 'التوقيت العام لهذا التاريخ قوي',
    favorable: 'التوقيت العام لهذا التاريخ مناسب',
    mixed: 'التوقيت العام لهذا التاريخ غير متجانس',
    unfavorable: 'التوقيت العام لهذا التاريخ ضعيف',
  },
  conditionClause: {
    clean: 'المؤشرات الداعمة تشير جميعها إلى اتجاه واحد.',
    mixed: 'الظروف متباينة، لذا لا ينبغي استعجال المحادثة.',
    strained: 'الظروف لا تساعد على تبادل سهل، فاستعد جيدًا.',
  },
  support: {
    clarity: 'ظروف التواصل تساعد على عرض أولوياتك بوضوح.',
    cooperation: 'ظروف التعاون تساعد على تبادل بنّاء.',
    momentum: 'هذا التوقيت يساعد على بدء التفاوض أو المضي به.',
  },
  watch: {
    clarity: 'تأكد من الفهم المشترك وتجنّب الصياغة غير الواضحة.',
    cooperation: 'حافظ على نبرة بنّاءة طوال المحادثة.',
    pressure: 'لا تتسرع في الرد ولا تصعّد المحادثة.',
    verification: 'راجع التفاصيل العملية قبل الاعتماد عليها.',
  },
  supportHeading: 'ما الذي يدعم هذا التوقيت',
  watchHeading: 'ما الذي ينبغي الانتباه إليه',
  nextStepHeading: 'الخطوة العملية التالية',
  nextStep:
    'تجهيز عملي: اكتب أولوياتك وحدّك الأدنى المقبول قبل المحادثة.',
  restrainedSummary:
    'الأدلة المتاحة تدعم إرشادًا عامًا للتوقيت فقط، ولا تُقدَّم قراءة تفاوضية خاصة لهذا التاريخ.',
  mixedCautionInsufficient:
    'رُصدت ظروف مختلطة، لكن لا توجد أدلة كافية لتوضيح عامل الحذر بدقة.',
  backToAsk: 'العودة إلى طرح السؤال',
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
  headlineStrained: {
    strong: 'Время сильное, но условия требуют осторожности',
    favorable: 'Время подходящее, но условия напряжённые',
    mixed: 'Время неоднородное при напряжённых условиях',
    unfavorable: 'Время слабое при напряжённых условиях',
  },
  headlineInsufficient: {
    strong: 'Общий тайминг этой даты сильный',
    favorable: 'Общий тайминг этой даты приемлемый',
    mixed: 'Общий тайминг этой даты неоднородный',
    unfavorable: 'Общий тайминг этой даты слабый',
  },
  conditionClause: {
    clean: 'Поддерживающие признаки указывают в одну сторону.',
    mixed: 'Условия смешанные, поэтому разговор не стоит торопить.',
    strained:
      'Условия не способствуют лёгкому обмену — готовьтесь тщательно.',
  },
  support: {
    clarity: 'Условия общения помогают ясно изложить приоритеты.',
    cooperation: 'Условия сотрудничества помогают вести конструктивный обмен.',
    momentum: 'Это время помогает начать или продвинуть переговоры.',
  },
  watch: {
    clarity: 'Проверьте общее понимание и избегайте неясных формулировок.',
    cooperation: 'Сохраняйте конструктивный тон на протяжении разговора.',
    pressure: 'Не отвечайте поспешно и не обостряйте разговор.',
    verification: 'Проверьте практические детали, прежде чем на них опираться.',
  },
  supportHeading: 'Что поддерживает это время',
  watchHeading: 'На что обратить внимание',
  nextStepHeading: 'Практический следующий шаг',
  nextStep:
    'Практическая подготовка: до разговора запишите приоритеты и приемлемый нижний предел.',
  restrainedSummary:
    'Доступные данные подтверждают только общие рекомендации по времени, поэтому отдельный разбор переговоров для этой даты не приводится.',
  mixedCautionInsufficient:
    'Смешанные условия обнаружены, но недостаточно обоснованных данных, чтобы точно объяснить источник осторожности.',
  backToAsk: 'Назад к запросу',
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

  const headline = insufficient
    ? copy.headlineInsufficient[strength]
    : quality === 'clean'
      ? copy.headlineClean[strength]
      : quality === 'strained'
        ? copy.headlineStrained[strength]
        : copy.headlineNeedsCare[strength];

  // Headline already states timing strength. Summary must not restate it.
  const summary = insufficient
    ? copy.restrainedSummary
    : copy.conditionClause[quality];

  const watchNotice =
    quality === 'mixed' && !insufficient && grounded.watch.length === 0
      ? copy.mixedCautionInsufficient
      : null;

  return {
    headline,
    summary,
    supports: grounded.supports,
    watch: grounded.watch,
    watchNotice,
    supportHeading: copy.supportHeading,
    watchHeading: copy.watchHeading,
    nextStepHeading: copy.nextStepHeading,
    nextStep: copy.nextStep,
    contextNote: buildContextNote(copy, context),
    strength,
    conditionQuality: quality,
    evidenceGrounded,
    semanticInsufficient: insufficient,
    evidence: grounded.traces,
  };
}

export function offerNegotiationBackToAsk(lang: AppLang): string {
  return COPY[lang].backToAsk;
}
