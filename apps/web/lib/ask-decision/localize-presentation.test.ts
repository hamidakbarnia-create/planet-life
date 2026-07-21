import { describe, expect, it } from 'vitest';
import { localizeAskDecisionPresentation } from '@/lib/ask-decision/localize-presentation';
import { englishProviderResult } from '@/lib/ask-decision/english-provider-result.fixture';
import type { AskDecisionResult } from '@/lib/ask-decision';
import {
  localizeAnalysisTitle,
  localizeRecommendationStatus,
  resolveAnalysisSectionId,
} from '@/lib/decision-ui-i18n';
import { checkResponseLanguage } from '@/lib/locale-language-guard';

function cloneWith(
  base: AskDecisionResult,
  patch: Partial<AskDecisionResult>
): AskDecisionResult {
  return {
    ...base,
    ...patch,
    analysis: patch.analysis ?? base.analysis.map((c) => ({ ...c })),
    scores: patch.scores ?? { ...base.scores },
    confidence: patch.confidence ?? { ...base.confidence },
    actionPlan: patch.actionPlan ?? {
      now: [...base.actionPlan.now],
      next7Days: [...base.actionPlan.next7Days],
      next30Days: [...base.actionPlan.next30Days],
    },
    scenarios: patch.scenarios ?? {
      bestCase: { ...base.scenarios.bestCase },
      mostLikely: { ...base.scenarios.mostLikely },
      downsideCase: { ...base.scenarios.downsideCase },
    },
  };
}

const PERSIAN_DETAIL =
  'برای لانچ در بازار تهران، ابتدا یک آزمایش محدود در منطقه ونک با بودجه پنجاه میلیون تومان اجرا کنید و معیار موفقیت را رسیدن به صد پیش‌ثبت‌نام بدانید.';

const ARABIC_DETAIL =
  'للإطلاق في سوق الرياض، نفّذ تجربة محدودة في حي العليا بميزانية مئة ألف ريال، واجعل معيار النجاح مئة تسجيل مسبق خلال أسبوعين.';

const RUSSIAN_DETAIL =
  'Для запуска в Москве сначала проведите ограниченный пилот в районе Арбат с бюджетом 500 тысяч рублей и критерием успеха в 100 предзаказов.';

describe('localizeAskDecisionPresentation — safety', () => {
  it('resolves provider English titles to canonical ids', () => {
    expect(
      resolveAnalysisSectionId('custom-market', 'Market Premise and Readiness')
    ).toBe('situation');
    expect(localizeAnalysisTitle('custom-market', 'Main Factors', 'fa')).toBe(
      'عوامل اصلی'
    );
    expect(
      localizeRecommendationStatus('Gather more information', 'fa')
    ).toMatch(/اطلاعات/);
  });

  it('1. preserves valid Persian provider prose unchanged', () => {
    const input = cloneWith(englishProviderResult, {
      recommendation: PERSIAN_DETAIL,
      executiveSummary:
        'توصیه این است که با یک آزمایش برگشت‌پذیر در تهران پیش بروید و نقاط کنترل روشن داشته باشید.',
      analysis: [
        {
          id: 'factors',
          title: 'Main Factors',
          body: 'بازار ونک و بودجه پنجاه میلیون تومان مهم‌ترین عوامل این تصمیم هستند.',
        },
        {
          id: 'risks',
          title: 'Risks',
          body: 'ریسک اصلی کمبود پیش‌ثبت‌نام در دو هفته اول است.',
        },
      ],
      actionPlan: {
        now: [
          {
            action: 'معیار صد پیش‌ثبت‌نام را مکتوب کنید',
            purpose: 'وضوح',
            priority: 'high',
            completionSignal: 'نوشته شد',
          },
        ],
        next7Days: [],
        next30Days: [],
      },
      scenarios: {
        bestCase: {
          outcome: 'آزمایش ونک موفق می‌شود',
          likelihoodBand: 'medium',
          keyConditions: [],
          earlySignals: [],
          mitigation: 'پایلوت',
        },
        mostLikely: {
          outcome: 'پیشرفت جزئی',
          likelihoodBand: 'high',
          keyConditions: [],
          earlySignals: [],
          mitigation: 'نقطه کنترل',
        },
        downsideCase: {
          outcome: 'عجله زیان‌بار',
          likelihoodBand: 'low',
          keyConditions: [],
          earlySignals: [],
          mitigation: 'توقف',
        },
      },
      confidence: {
        level: 'medium',
        score: 65,
        explanation: 'با داده محلی تهران اطمینان متوسط است.',
        missingInputs: [],
        limitingFactors: [],
      },
      scores: {
        opportunity: { value: 55, rationale: 'فرصت نسبی از چارچوب‌بندی.' },
        risk: { value: 48, rationale: 'ریسک قابل مدیریت است.' },
        timing: { value: 50, rationale: 'زمان‌بندی موقتی است.' },
        readiness: { value: 45, rationale: 'آمادگی محدود است.' },
        confidence: { value: 65, rationale: 'اطمینان متوسط است.' },
      },
    });
    const out = localizeAskDecisionPresentation(input, 'fa');
    expect(out.recommendation).toBe(PERSIAN_DETAIL);
    expect(out.analysis.find((c) => c.id === 'factors')?.body).toContain(
      'ونک'
    );
    expect(out.analysis.find((c) => c.id === 'factors')?.title).toBe(
      'عوامل اصلی'
    );
    expect(out.meta?.sources ?? []).not.toContain('locale-presentation');
  });

  it('2. preserves valid Arabic provider prose unchanged', () => {
    const input = cloneWith(englishProviderResult, {
      recommendation: ARABIC_DETAIL,
      executiveSummary:
        'التوصية هي المضي بتجربة قابلة للرجوع في الرياض مع نقاط تحقق واضحة.',
      analysis: [
        {
          id: 'factors',
          title: 'Main Factors',
          body: 'حي العليا وميزانية مئة ألف ريال هما العاملان الرئيسيان.',
        },
      ],
      actionPlan: {
        now: [
          {
            action: 'اكتب معيار المئة تسجيل مسبقاً',
            purpose: 'وضوح',
            priority: 'high',
            completionSignal: 'مكتوب',
          },
        ],
        next7Days: [],
        next30Days: [],
      },
      scenarios: {
        bestCase: {
          outcome: 'تنجح تجربة العليا',
          likelihoodBand: 'medium',
          keyConditions: [],
          earlySignals: [],
          mitigation: 'تجربة',
        },
        mostLikely: {
          outcome: 'تقدم جزئي',
          likelihoodBand: 'high',
          keyConditions: [],
          earlySignals: [],
          mitigation: 'نقطة',
        },
        downsideCase: {
          outcome: 'استعجال ضار',
          likelihoodBand: 'low',
          keyConditions: [],
          earlySignals: [],
          mitigation: 'توقف',
        },
      },
      confidence: {
        level: 'medium',
        score: 65,
        explanation: 'الثقة متوسطة مع بيانات الرياض المحلية.',
        missingInputs: [],
        limitingFactors: [],
      },
      scores: {
        opportunity: { value: 55, rationale: 'ضغط الفرصة النسبي من التأطير.' },
        risk: { value: 48, rationale: 'المخاطر قابلة للإدارة.' },
        timing: { value: 50, rationale: 'التوقيت مؤقت.' },
        readiness: { value: 45, rationale: 'الجاهزية محدودة.' },
        confidence: { value: 65, rationale: 'الثقة متوسطة.' },
      },
    });
    const out = localizeAskDecisionPresentation(input, 'ar');
    expect(out.recommendation).toBe(ARABIC_DETAIL);
    expect(out.analysis[0]?.body).toContain('العليا');
    expect(out.analysis[0]?.title).toBe('العوامل الرئيسية');
  });

  it('3. preserves valid Russian provider prose unchanged', () => {
    const input = cloneWith(englishProviderResult, {
      recommendation: RUSSIAN_DETAIL,
      executiveSummary:
        'Рекомендация — двигаться обратимым пилотом в Москве с ясными контрольными точками.',
      analysis: [
        {
          id: 'factors',
          title: 'Main Factors',
          body: 'Район Арбат и бюджет 500 тысяч рублей — ключевые факторы.',
        },
      ],
      actionPlan: {
        now: [
          {
            action: 'Запишите критерий 100 предзаказов',
            purpose: 'Ясность',
            priority: 'high',
            completionSignal: 'Записано',
          },
        ],
        next7Days: [],
        next30Days: [],
      },
      scenarios: {
        bestCase: {
          outcome: 'Пилот на Арбате успешен',
          likelihoodBand: 'medium',
          keyConditions: [],
          earlySignals: [],
          mitigation: 'Пилот',
        },
        mostLikely: {
          outcome: 'Частичный прогресс',
          likelihoodBand: 'high',
          keyConditions: [],
          earlySignals: [],
          mitigation: 'Точка',
        },
        downsideCase: {
          outcome: 'Вредная спешка',
          likelihoodBand: 'low',
          keyConditions: [],
          earlySignals: [],
          mitigation: 'Стоп',
        },
      },
      confidence: {
        level: 'medium',
        score: 65,
        explanation: 'Уверенность средняя с локальными данными Москвы.',
        missingInputs: [],
        limitingFactors: [],
      },
      scores: {
        opportunity: {
          value: 55,
          rationale: 'Сравнительное давление возможности.',
        },
        risk: { value: 48, rationale: 'Риск управляем.' },
        timing: { value: 50, rationale: 'Тайминг предварительный.' },
        readiness: { value: 45, rationale: 'Готовность ограничена.' },
        confidence: { value: 65, rationale: 'Уверенность средняя.' },
      },
    });
    const out = localizeAskDecisionPresentation(input, 'ru');
    expect(out.recommendation).toBe(RUSSIAN_DETAIL);
    expect(out.analysis[0]?.body).toContain('Арбат');
    expect(out.analysis[0]?.title).toBe('Главные факторы');
  });

  it('4. localizes English title without replacing valid localized body', () => {
    const body =
      'بازار ونک و بودجه پنجاه میلیون تومان مهم‌ترین عوامل این تصمیم هستند و باید قبل از تعهد روشن شوند.';
    const input = cloneWith(englishProviderResult, {
      recommendation: PERSIAN_DETAIL,
      executiveSummary:
        'توصیه این است که با یک آزمایش برگشت‌پذیر در تهران پیش بروید و نقاط کنترل روشن داشته باشید تا ریسک کاهش یابد.',
      analysis: [
        { id: 'factors', title: 'Main Factors', body },
        {
          id: 'risks',
          title: 'Risks',
          body: 'ریسک اصلی کمبود پیش‌ثبت‌نام در دو هفته اول لانچ است و باید پایش شود.',
        },
      ],
      actionPlan: {
        now: [
          {
            action: 'معیار صد پیش‌ثبت‌نام را مکتوب کنید و با تیم هم‌تراز شوید',
            purpose: 'وضوح تصمیم',
            priority: 'high',
            completionSignal: 'نوشته شد',
          },
        ],
        next7Days: [],
        next30Days: [],
      },
      scenarios: {
        bestCase: {
          outcome: 'آزمایش ونک با پیش‌ثبت‌نام کافی موفق می‌شود',
          likelihoodBand: 'medium',
          keyConditions: [],
          earlySignals: [],
          mitigation: 'پایلوت محدود',
        },
        mostLikely: {
          outcome: 'پیشرفت جزئی با نیاز به داده بیشتر',
          likelihoodBand: 'high',
          keyConditions: [],
          earlySignals: [],
          mitigation: 'نقطه کنترل هفتگی',
        },
        downsideCase: {
          outcome: 'عجله بدون معیار موفقیت زیان‌بار است',
          likelihoodBand: 'low',
          keyConditions: [],
          earlySignals: [],
          mitigation: 'توقف تعهد',
        },
      },
      confidence: {
        level: 'medium',
        score: 65,
        explanation: 'با داده محلی تهران اطمینان متوسط است و قابل بهبود.',
        missingInputs: [],
        limitingFactors: [],
      },
      scores: {
        opportunity: {
          value: 55,
          rationale: 'فرصت نسبی از چارچوب‌بندی و سیگنال‌های حوزه.',
        },
        risk: { value: 48, rationale: 'ریسک منعکس‌کننده زبان سهام و برگشت‌پذیری است.' },
        timing: { value: 50, rationale: 'زمان‌بندی موقتی است چون داده زنده نیست.' },
        readiness: { value: 45, rationale: 'آمادگی بدون پروفایل کامل محدود است.' },
        confidence: { value: 65, rationale: 'اطمینان وضوح و فرضیات را دنبال می‌کند.' },
      },
    });
    const out = localizeAskDecisionPresentation(input, 'fa');
    expect(out.analysis.find((c) => c.id === 'factors')?.title).toBe(
      'عوامل اصلی'
    );
    expect(out.analysis.find((c) => c.id === 'factors')?.body).toBe(body);
    expect(out.recommendation).toBe(PERSIAN_DETAIL);
  });

  it('5. rebuilds a known English scaffold body', () => {
    const input = cloneWith(englishProviderResult, {
      recommendation: PERSIAN_DETAIL,
      executiveSummary:
        'توصیه این است که با یک آزمایش برگشت‌پذیر پیش بروید و نقاط کنترل روشن داشته باشید تا ریسک کاهش یابد.',
      analysis: [
        {
          id: 'factors',
          title: 'Main Factors',
          body: 'Objective: Identify the highest-leverage next move. Concern: Primary concern not fully stated. Reversibility: Unknown — reversibility not stated.',
        },
      ],
      actionPlan: {
        now: [
          {
            action: 'معیار موفقیت را مکتوب کنید و با تیم هم‌تراز شوید کامل',
            purpose: 'وضوح',
            priority: 'high',
            completionSignal: 'ok',
          },
        ],
        next7Days: [],
        next30Days: [],
      },
      scenarios: {
        bestCase: {
          outcome: 'آزمایش برگشت‌پذیر موفق می‌شود و انعطاف حفظ می‌گردد',
          likelihoodBand: 'medium',
          keyConditions: [],
          earlySignals: [],
          mitigation: 'پایلوت',
        },
        mostLikely: {
          outcome: 'پیشرفت جزئی با نیاز به داده بیشتر در افق ماهانه',
          likelihoodBand: 'high',
          keyConditions: [],
          earlySignals: [],
          mitigation: 'نقطه',
        },
        downsideCase: {
          outcome: 'حرکت برگشت‌ناپذیر قبل از دانستن حقایق رخ می‌دهد',
          likelihoodBand: 'low',
          keyConditions: [],
          earlySignals: [],
          mitigation: 'توقف',
        },
      },
      confidence: {
        level: 'medium',
        score: 65,
        explanation: 'با داده موجود اطمینان متوسط است و قابل بهبود با ورودی حیاتی.',
        missingInputs: [],
        limitingFactors: [],
      },
      scores: {
        opportunity: { value: 55, rationale: 'فرصت نسبی از چارچوب‌بندی حوزه است.' },
        risk: { value: 48, rationale: 'ریسک منعکس‌کننده زبان سهام است.' },
        timing: { value: 50, rationale: 'زمان‌بندی موقتی بدون داده زنده است.' },
        readiness: { value: 45, rationale: 'آمادگی بدون پروفایل محدود است.' },
        confidence: { value: 65, rationale: 'اطمینان وضوح را دنبال می‌کند.' },
      },
    });
    const out = localizeAskDecisionPresentation(input, 'fa');
    const factors = out.analysis.find((c) => c.id === 'factors')!;
    expect(factors.title).toBe('عوامل اصلی');
    expect(factors.body).not.toContain('Objective:');
    expect(factors.body).not.toContain('Reversibility:');
    expect(out.recommendation).toBe(PERSIAN_DETAIL);
  });

  it('6. personalized localized detail survives the gate', () => {
    const input = cloneWith(englishProviderResult, {
      recommendation: PERSIAN_DETAIL,
      executiveSummary:
        'خلاصه: لانچ تدریجی در ونک با بودجه مشخص و معیار صد پیش‌ثبت‌نام پیشنهاد می‌شود تا ریسک کاهش یابد.',
      analysis: englishProviderResult.analysis.map((c) =>
        c.id === 'factors'
          ? {
              ...c,
              title: 'Main Factors',
              body: 'جزئیات شخصی: بودجه پنجاه میلیون تومان و منطقه ونک باید قبل از تعهد قفل شوند.',
            }
          : {
              ...c,
              title: c.title,
              body:
                c.id === 'risks'
                  ? 'ریسک کمبود پیش‌ثبت‌نام در دو هفته اول باید پایش هفتگی شود تا تصمیم اصلاح گردد.'
                  : 'فرصت در روشن کردن یک گام برگشت‌پذیر بعدی با معیار محلی تهران است که ناشناخته را کم کند.',
            }
      ),
      actionPlan: {
        now: [
          {
            action: 'بودجه پنجاه میلیون تومان را در سند تصمیم قفل کنید',
            purpose: 'کنترل هزینه',
            priority: 'high',
            completionSignal: 'قفل شد',
          },
        ],
        next7Days: [],
        next30Days: [],
      },
      scenarios: {
        bestCase: {
          outcome: 'ونک به صد پیش‌ثبت‌نام می‌رسد',
          likelihoodBand: 'medium',
          keyConditions: [],
          earlySignals: [],
          mitigation: 'پایلوت',
        },
        mostLikely: {
          outcome: 'پنجاه تا هشتاد پیش‌ثبت‌نام',
          likelihoodBand: 'high',
          keyConditions: [],
          earlySignals: [],
          mitigation: 'تمدید',
        },
        downsideCase: {
          outcome: 'کمتر از بیست پیش‌ثبت‌نام',
          likelihoodBand: 'low',
          keyConditions: [],
          earlySignals: [],
          mitigation: 'توقف',
        },
      },
      confidence: {
        level: 'medium',
        score: 65,
        explanation: 'جزئیات ونک و بودجه محلی اطمینان را متوسط نگه می‌دارد.',
        missingInputs: [],
        limitingFactors: [],
      },
      scores: {
        opportunity: { value: 55, rationale: 'فرصت نسبی از سیگنال بازار تهران.' },
        risk: { value: 48, rationale: 'ریسک بودجه و پیش‌ثبت‌نام قابل مدیریت است.' },
        timing: { value: 50, rationale: 'زمان‌بندی ماهانه موقتی است.' },
        readiness: { value: 45, rationale: 'آمادگی تیم محدود اما کافی است.' },
        confidence: { value: 65, rationale: 'اطمینان با داده ونک متوسط است.' },
      },
    });
    const out = localizeAskDecisionPresentation(input, 'fa');
    expect(out.recommendation).toContain('ونک');
    expect(out.recommendation).toContain('پنجاه میلیون');
    expect(out.analysis.find((c) => c.id === 'factors')?.body).toContain(
      'ونک'
    );
  });

  it('7. English-dominant content falls back safely', () => {
    const out = localizeAskDecisionPresentation(englishProviderResult, 'fa');
    expect(out.recommendation).not.toMatch(/Gather more information about market/i);
    expect(out.analysis.every((c) => !/Objective:|Main Factors/.test(c.body + c.title))).toBe(
      true
    );
    expect(out.scores.opportunity.value).toBe(55);
    expect(out.recommendationStatus).toBe('gather-more-information');
  });

  it('8. FA rejects Arabic-dominant and AR rejects Persian-dominant', () => {
    const arabic =
      'اجمع مزيداً من المعلومات حول ظروف السوق والاستعداد الداخلي لتحديد توقيت الإطلاق. هذه الخطوة تقلل من المخاطر الرئيسية قبل الالتزام الكامل.';
    const persian =
      'اطلاعات بیشتری درباره شرایط بازار و آمادگی داخلی جمع کنید تا زمان لانچ روشن شود. این گام ریسک اصلی را قبل از تعهد کامل کم می‌کند.';
    expect(checkResponseLanguage(arabic, 'fa').ok).toBe(false);
    expect(checkResponseLanguage(arabic, 'fa').dominant).toBe('ar');
    expect(checkResponseLanguage(persian, 'ar').ok).toBe(false);
    expect(checkResponseLanguage(persian, 'ar').dominant).toBe('fa');
  });
});
