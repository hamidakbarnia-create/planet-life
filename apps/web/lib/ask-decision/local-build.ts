/** Local structured builders used for repair + no-model fallback. */

import type { AppLang } from '@/lib/app-settings';
import { formatLocalizedStyleList } from '@/lib/intelligence/intelligence-copy';
import { askCopy } from './ask-local-copy';
import {
  localizeFrameHorizon,
  localizeFrameIntent,
  localizeFrameList,
  localizeFramePhrase,
} from './frame-display';
import type {
  AnalysisSection,
  AskActionPlan,
  AskConfidence,
  AskDecisionScores,
  AskScenarios,
  DecisionFrame,
  IntentDetection,
  RecommendationStatus,
  RelatedModule,
  TimingIntelligence,
} from './types';
import { clampScore, wordLimit } from './util';
import { MODULE_ROUTES } from './util';

type Locale = AppLang | string;

export function buildLocalScores(
  frame: DecisionFrame,
  intent: IntentDetection,
  timingScore: number | null,
  usedProfile: boolean,
  locale: Locale = 'en'
): AskDecisionScores {
  const timing = clampScore(timingScore ?? 52);
  const riskBase =
    intent.highStakesFlag ? 62 : frame.urgency === 'immediate' ? 55 : 42;
  const opportunityBase =
    frame.options.length > 0 ? 58 : intent.decisionPresent ? 55 : 48;
  const readinessBase = usedProfile ? 58 : 45;
  const confidenceBase =
    (usedProfile ? 12 : 0) +
    (timingScore != null ? 10 : 0) +
    (frame.unknowns.length === 0 ? 12 : 0) +
    40;

  return {
    opportunity: {
      value: clampScore(opportunityBase),
      rationale: askCopy(locale, 'score.opportunity'),
    },
    risk: {
      value: clampScore(riskBase + (frame.reversibility.startsWith('Low') ? 10 : 0)),
      rationale: askCopy(locale, 'score.risk'),
    },
    timing: {
      value: timing,
      rationale:
        timingScore != null
          ? askCopy(locale, 'score.timing.available')
          : askCopy(locale, 'score.timing.provisional'),
    },
    readiness: {
      value: clampScore(readinessBase),
      rationale: usedProfile
        ? askCopy(locale, 'score.readiness.withProfile')
        : askCopy(locale, 'score.readiness.withoutProfile'),
    },
    confidence: {
      value: clampScore(confidenceBase - frame.assumptions.length * 4),
      rationale: askCopy(locale, 'score.confidence'),
    },
  };
}

export function recommendStatus(
  scores: AskDecisionScores,
  intent: IntentDetection
): RecommendationStatus {
  if (intent.highStakesFlag && scores.confidence.value < 55) {
    return 'gather-more-information';
  }
  if (scores.risk.value > scores.opportunity.value + 8) return 'wait';
  if (scores.opportunity.value >= 65 && scores.risk.value < 55) return 'proceed';
  if (scores.opportunity.value >= 55) return 'proceed-with-caution';
  if (scores.readiness.value < 45) return 'gather-more-information';
  return 'neutral';
}

export function buildLocalAnalysis(
  frame: DecisionFrame,
  intent: IntentDetection,
  recommendation: string,
  usedProfile: boolean,
  decisionStyles: string[],
  locale: Locale = 'en'
): AnalysisSection[] {
  return [
    {
      id: 'situation',
      title: askCopy(locale, 'analysis.situation.title'),
      body: askCopy(locale, 'analysis.situation.body', {
        decision: frame.decisionStatement,
        intent: localizeFrameIntent(locale as AppLang, intent.primaryIntent),
        horizon: localizeFrameHorizon(locale as AppLang, frame.timeHorizon),
      }),
    },
    {
      id: 'factors',
      title: askCopy(locale, 'analysis.factors.title'),
      body: askCopy(locale, 'analysis.factors.body', {
        objective: localizeFramePhrase(locale as AppLang, frame.objective),
        concern: localizeFramePhrase(locale as AppLang, frame.mainConcern),
        reversibility: localizeFramePhrase(locale as AppLang, frame.reversibility),
      }),
    },
    {
      id: 'opportunities',
      title: askCopy(locale, 'analysis.opportunities.title'),
      body:
        frame.options.length > 0
          ? askCopy(locale, 'analysis.opportunities.body.withOptions', {
              options: frame.options.join('; '),
            })
          : askCopy(locale, 'analysis.opportunities.body.noOptions'),
    },
    {
      id: 'risks',
      title: askCopy(locale, 'analysis.risks.title'),
      body: askCopy(locale, 'analysis.risks.body', {
        concern: localizeFramePhrase(locale as AppLang, frame.mainConcern),
        unknowns:
          localizeFrameList(locale as AppLang, frame.unknowns) ||
          askCopy(locale, 'analysis.risks.noneListed'),
      }),
    },
    {
      id: 'tradeoffs',
      title: askCopy(locale, 'analysis.tradeoffs.title'),
      body: askCopy(locale, 'analysis.tradeoffs.body', {
        horizon: localizeFrameHorizon(locale as AppLang, frame.timeHorizon),
      }),
    },
    {
      id: 'personal-fit',
      title: askCopy(locale, 'analysis.personalFit.title'),
      body: usedProfile
        ? askCopy(locale, 'analysis.personalFit.body.withProfile', {
            styles: formatLocalizedStyleList(
              decisionStyles,
              locale as AppLang,
              (key) => askCopy(locale, key)
            ),
          })
        : askCopy(locale, 'analysis.personalFit.body.withoutProfile'),
    },
    {
      id: 'what-could-change',
      title: askCopy(locale, 'analysis.whatCouldChange.title'),
      body:
        (frame.unknowns[0]
          ? localizeFramePhrase(locale as AppLang, frame.unknowns[0])
          : null) ||
        askCopy(locale, 'analysis.whatCouldChange.body.default'),
    },
    {
      id: 'why',
      title: askCopy(locale, 'analysis.why.title'),
      body: recommendation,
    },
  ];
}

export function buildLocalActionPlan(
  frame: DecisionFrame,
  locale: Locale = 'en'
): AskActionPlan {
  const now: AskActionPlan['now'] = [
    {
      action: askCopy(locale, 'action.now.writeDecision', {
        decision: frame.decisionStatement.slice(0, 100),
      }),
      purpose: askCopy(locale, 'action.now.writeDecision.purpose'),
      priority: 'high',
      completionSignal: askCopy(locale, 'action.now.writeDecision.signal'),
    },
    {
      action: askCopy(locale, 'action.now.listFact'),
      purpose: askCopy(locale, 'action.now.listFact.purpose'),
      priority: 'critical',
      completionSignal: askCopy(locale, 'action.now.listFact.signal'),
    },
    {
      action: askCopy(locale, 'action.now.identifyIrreversible'),
      purpose: askCopy(locale, 'action.now.identifyIrreversible.purpose'),
      priority: 'high',
      completionSignal: askCopy(locale, 'action.now.identifyIrreversible.signal'),
    },
  ];

  const next7Days: AskActionPlan['next7Days'] = [
    {
      action:
        frame.options.length >= 2
          ? askCopy(locale, 'action.week.scoreOptions', {
              options: frame.options.slice(0, 2).join(' vs '),
            })
          : askCopy(locale, 'action.week.compareOptions'),
      purpose: askCopy(locale, 'action.week.scoreOptions.purpose'),
      priority: 'high',
      completionSignal: askCopy(locale, 'action.week.scoreOptions.signal'),
    },
    {
      action: askCopy(locale, 'action.week.schedule'),
      purpose: askCopy(locale, 'action.week.schedule.purpose'),
      priority: 'medium',
      completionSignal: askCopy(locale, 'action.week.schedule.signal'),
    },
    {
      action: askCopy(locale, 'action.week.addressConcern', {
        concern: localizeFramePhrase(locale as AppLang, frame.mainConcern).slice(
          0,
          80
        ),
      }),
      purpose: askCopy(locale, 'action.week.addressConcern.purpose'),
      priority: 'high',
      completionSignal: askCopy(locale, 'action.week.addressConcern.signal'),
    },
  ];

  const next30Days: AskActionPlan['next30Days'] = [
    {
      action: askCopy(locale, 'action.month.checkpoint'),
      purpose: askCopy(locale, 'action.month.checkpoint.purpose'),
      priority: 'medium',
      completionSignal: askCopy(locale, 'action.month.checkpoint.signal'),
    },
    {
      action: askCopy(locale, 'action.month.increaseCommitment'),
      purpose: askCopy(locale, 'action.month.increaseCommitment.purpose'),
      priority: 'high',
      completionSignal: askCopy(locale, 'action.month.increaseCommitment.signal'),
    },
    {
      action: askCopy(locale, 'action.month.archive'),
      purpose: askCopy(locale, 'action.month.archive.purpose'),
      priority: 'low',
      completionSignal: askCopy(locale, 'action.month.archive.signal'),
    },
  ];

  return {
    now: now.slice(0, 3),
    next7Days: next7Days.slice(0, 3),
    next30Days: next30Days.slice(0, 3),
  };
}

export function buildLocalScenarios(
  frame: DecisionFrame,
  locale: Locale = 'en'
): AskScenarios {
  return {
    bestCase: {
      outcome: askCopy(locale, 'scenario.best.outcome'),
      likelihoodBand: 'medium',
      keyConditions: [
        askCopy(locale, 'scenario.best.condition1'),
        askCopy(locale, 'scenario.best.condition2'),
      ],
      earlySignals: [
        askCopy(locale, 'scenario.best.signal1'),
        askCopy(locale, 'scenario.best.signal2'),
      ],
      mitigation: askCopy(locale, 'scenario.best.mitigation'),
    },
    mostLikely: {
      outcome: askCopy(locale, 'scenario.likely.outcome', {
        concern: localizeFramePhrase(
          locale as AppLang,
          frame.mainConcern
        ).toLowerCase(),
      }),
      likelihoodBand: 'high',
      keyConditions: [askCopy(locale, 'scenario.likely.condition1')],
      earlySignals: [
        askCopy(locale, 'scenario.likely.signal1'),
        askCopy(locale, 'scenario.likely.signal2'),
      ],
      mitigation: askCopy(locale, 'scenario.likely.mitigation'),
    },
    downsideCase: {
      outcome: askCopy(locale, 'scenario.downside.outcome'),
      likelihoodBand: 'low',
      keyConditions: [askCopy(locale, 'scenario.downside.condition1')],
      earlySignals: [askCopy(locale, 'scenario.downside.signal1')],
      mitigation: askCopy(locale, 'scenario.downside.mitigation'),
    },
  };
}

export function buildLocalModules(
  intent: IntentDetection,
  usedProfile: boolean,
  locale: 'en' | 'ru' | 'fa' | 'ar' = 'en'
): RelatedModule[] {
  const labels: Record<
    'en' | 'ru' | 'fa' | 'ar',
    Record<string, { reason: string; actionLabel: string }>
  > = {
    en: {
      pathfinder: {
        reason:
          'Run a deeper multi-step workflow for irreversible or multi-option decisions.',
        actionLabel: 'Open Pathfinder',
      },
      calendar: {
        reason: 'Inspect day-level timing across the month.',
        actionLabel: 'View Calendar',
      },
      today: {
        reason: "Align the next action with today's energy windows.",
        actionLabel: 'See Today',
      },
      people: {
        reason: 'Communication context matters for this decision.',
        actionLabel: 'Compare People',
      },
      profile: {
        reason: 'Complete your profile to improve personalisation.',
        actionLabel: 'Complete Profile',
      },
    },
    fa: {
      pathfinder: {
        reason:
          'برای تصمیم‌های برگشت‌ناپذیر یا چندگزینه‌ای، گردش‌کار عمیق‌تری اجرا کنید.',
        actionLabel: 'باز کردن مسیریاب',
      },
      calendar: {
        reason: 'زمان‌بندی روزبه‌روز ماه را بررسی کنید.',
        actionLabel: 'مشاهده تقویم',
      },
      today: {
        reason: 'اقدام بعدی را با پنجره‌های انرژی امروز هم‌راستا کنید.',
        actionLabel: 'دیدن امروز',
      },
      people: {
        reason: 'بافت ارتباطی برای این تصمیم مهم است.',
        actionLabel: 'مقایسه افراد',
      },
      profile: {
        reason: 'پروفایل را کامل کنید تا شخصی‌سازی بهتر شود.',
        actionLabel: 'تکمیل پروفایل',
      },
    },
    ru: {
      pathfinder: {
        reason:
          'Запустите более глубокий многошаговый процесс для необратимых или многовариантных решений.',
        actionLabel: 'Открыть Pathfinder',
      },
      calendar: {
        reason: 'Проверьте дневной тайминг на протяжении месяца.',
        actionLabel: 'Календарь',
      },
      today: {
        reason: 'Согласуйте следующий шаг с энергетическими окнами сегодня.',
        actionLabel: 'Сегодня',
      },
      people: {
        reason: 'Контекст общения важен для этого решения.',
        actionLabel: 'Сравнить людей',
      },
      profile: {
        reason: 'Заполните профиль для лучшей персонализации.',
        actionLabel: 'Заполнить профиль',
      },
    },
    ar: {
      pathfinder: {
        reason:
          'شغّل سير عمل أعمق متعدد الخطوات للقرارات غير القابلة للرجوع أو متعددة الخيارات.',
        actionLabel: 'فتح المستكشف',
      },
      calendar: {
        reason: 'افحص التوقيت اليومي عبر الشهر.',
        actionLabel: 'عرض التقويم',
      },
      today: {
        reason: 'واءم الخطوة التالية مع نوافذ طاقة اليوم.',
        actionLabel: 'عرض اليوم',
      },
      people: {
        reason: 'سياق التواصل مهم لهذا القرار.',
        actionLabel: 'مقارنة الأشخاص',
      },
      profile: {
        reason: 'أكمل ملفك لتحسين التخصيص.',
        actionLabel: 'أكمل الملف',
      },
    },
  };
  const L = labels[locale] ?? labels.en;
  const modules: RelatedModule[] = [];
  if (intent.highStakesFlag || intent.decisionPresent) {
    modules.push({
      module: 'pathfinder',
      reason: L.pathfinder.reason,
      actionLabel: L.pathfinder.actionLabel,
      route: MODULE_ROUTES.pathfinder,
    });
  }
  if (intent.timingRelevant) {
    modules.push({
      module: 'calendar',
      reason: L.calendar.reason,
      actionLabel: L.calendar.actionLabel,
      route: MODULE_ROUTES.calendar,
    });
  }
  modules.push({
    module: 'today',
    reason: L.today.reason,
    actionLabel: L.today.actionLabel,
    route: MODULE_ROUTES.today,
  });
  if (intent.peopleRelevant) {
    modules.push({
      module: 'people',
      reason: L.people.reason,
      actionLabel: L.people.actionLabel,
      route: MODULE_ROUTES.people,
    });
  }
  if (!usedProfile) {
    modules.push({
      module: 'profile',
      reason: L.profile.reason,
      actionLabel: L.profile.actionLabel,
      route: MODULE_ROUTES.profile,
    });
  }
  return modules.slice(0, 3);
}

export function buildLocalConfidence(
  scores: AskDecisionScores,
  frame: DecisionFrame,
  usedProfile: boolean,
  usedTiming: boolean,
  highStakes: boolean,
  locale: Locale = 'en'
): AskConfidence {
  let score = scores.confidence.value;
  if (highStakes) score = Math.min(score, 58);
  const level = score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low';
  const missingInputs = [
    ...frame.unknowns,
    ...(!usedProfile ? ['personal_intelligence_profile'] : []),
    ...(!usedTiming ? ['timing_engine'] : []),
  ];
  return {
    level,
    score: clampScore(score),
    explanation:
      level === 'high'
        ? askCopy(locale, 'conf.aligned')
        : level === 'medium'
          ? askCopy(locale, 'conf.staged')
          : askCopy(locale, 'conf.directional'),
    missingInputs,
    limitingFactors: [
      askCopy(locale, 'conf.limit.comparative'),
      ...(highStakes ? [askCopy(locale, 'conf.limit.highStakes')] : []),
      ...frame.assumptions.slice(0, 2),
    ],
  };
}

export function buildExecutiveSummary(
  frame: DecisionFrame,
  status: RecommendationStatus,
  recommendation: string,
  nextAction: string,
  locale: Locale = 'en'
): string {
  const statusLabel = askCopy(locale, `status.${status}`);
  const text = [
    askCopy(locale, 'exec.decision', {
      decision: frame.decisionStatement.slice(0, 80),
    }),
    askCopy(locale, 'exec.recommendation', { status: statusLabel }),
    recommendation.slice(0, 120),
    askCopy(locale, 'exec.caution', {
      concern: localizeFramePhrase(locale as AppLang, frame.mainConcern).slice(
        0,
        60
      ),
    }),
    askCopy(locale, 'exec.next', { next: nextAction.slice(0, 80) }),
  ].join(' ');
  return wordLimit(text, 90);
}

export function buildTimingIntelligence(
  timing: {
    bestToday: { label: string; dateRange: string; score: number; note: string };
    bestThisWeek: { label: string; dateRange: string; score: number; note: string };
    bestThisMonth: { label: string; dateRange: string; score: number; note: string };
    avoidWindow: { label: string; dateRange: string; score: number; note: string };
  } | null,
  applicable: boolean,
  available: boolean,
  locale: Locale = 'en'
): TimingIntelligence {
  if (!applicable) {
    return {
      applicable: false,
      available: false,
      today: null,
      next7Days: null,
      next30Days: null,
      bestWindow: null,
      cautionWindow: null,
      timingRationale: askCopy(locale, 'timing.notApplicable'),
      timingConfidence: 'low',
    };
  }
  if (!timing || !available) {
    return {
      applicable: true,
      available: false,
      today: null,
      next7Days: null,
      next30Days: null,
      bestWindow: null,
      cautionWindow: null,
      timingRationale: askCopy(locale, 'timing.unavailable'),
      timingConfidence: 'low',
    };
  }
  return {
    applicable: true,
    available: true,
    today: {
      label: askCopy(locale, 'timing.today'),
      dateRange: timing.bestToday.dateRange,
      score: timing.bestToday.score,
      note: timing.bestToday.note,
    },
    next7Days: {
      label: askCopy(locale, 'timing.next7Days'),
      dateRange: timing.bestThisWeek.dateRange,
      score: timing.bestThisWeek.score,
      note: timing.bestThisWeek.note,
    },
    next30Days: {
      label: askCopy(locale, 'timing.next30Days'),
      dateRange: timing.bestThisMonth.dateRange,
      score: timing.bestThisMonth.score,
      note: timing.bestThisMonth.note,
    },
    bestWindow: {
      label: askCopy(locale, 'timing.bestWindow'),
      dateRange: timing.bestThisWeek.dateRange,
      score: timing.bestThisWeek.score,
      note: timing.bestThisWeek.note,
    },
    cautionWindow: {
      label: askCopy(locale, 'timing.cautionWindow'),
      dateRange: timing.avoidWindow.dateRange,
      score: timing.avoidWindow.score,
      note: timing.avoidWindow.note,
    },
    timingRationale: askCopy(locale, 'timing.rationale'),
    timingConfidence: 'medium',
  };
}

export function safetyNoticeFor(
  intent: IntentDetection,
  locale: Locale = 'en'
): string | null {
  if (!intent.highStakesFlag) return null;
  if (intent.primaryIntent === 'health' || intent.secondaryIntent === 'health') {
    return askCopy(locale, 'safety.health');
  }
  if (intent.primaryIntent === 'legal' || intent.secondaryIntent === 'legal') {
    return askCopy(locale, 'safety.legal');
  }
  if (
    intent.primaryIntent === 'investment' ||
    intent.secondaryIntent === 'investment' ||
    intent.financialImpactLikely
  ) {
    return askCopy(locale, 'safety.investment');
  }
  return askCopy(locale, 'safety.highStakes');
}
