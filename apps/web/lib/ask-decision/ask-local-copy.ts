/**
 * Locale-aware prose for Ask local-build / fallback / parse.
 * Never silently falls back to English for fa/ar/ru.
 */

import type { AppLang } from '@/lib/app-settings';

export type AskCopyLocale = AppLang; // same 4 langs as ConversationLocale

const UNAVAILABLE: Record<AppLang, string> = {
  en: 'Translation unavailable.',
  fa: 'ترجمه در دسترس نیست.',
  ar: 'الترجمة غير متاحة.',
  ru: 'Перевод недоступен.',
};

type CopyTable = Record<string, string>;

const EN: CopyTable = {
  'frame.unknown.timeHorizon': 'Time horizon not stated',
  'frame.unknown.options': 'Explicit options not stated',
  'frame.unknown.decisionVerb': 'Decision verb unclear',
  'frame.unknown.mainConcern': 'Main concern not fully stated',
  'frame.assumption.timingFlexible': 'Treating timing as flexible unless clarified',
  'frame.assumption.proceedWaitGather': 'Framing as a proceed / wait / gather-information decision',
  'frame.assumption.decisionSupport': 'Interpreting the question as a decision-support request',
  'frame.objective.default': 'Identify the highest-leverage next move for the stated question',
  'frame.objective.resolve': 'Resolve whether to proceed: {detail}',
  'frame.concern.unstated': 'Primary concern not fully stated',
  'frame.concern.downside': 'Stated concern around downside or regret',
  'frame.concern.financial': 'Financial or resource exposure (inferred)',
  'frame.concern.people': 'People impact (inferred)',
  'frame.reversibility.unknown': 'Unknown — reversibility not stated',
  'frame.reversibility.low': 'Low — language suggests hard-to-reverse outcomes',
  'frame.reversibility.high': 'High — reversible or trial framing present',
  'frame.horizon.today': 'today',
  'frame.horizon.days': 'days',
  'frame.horizon.weeks': 'weeks',
  'frame.horizon.months': 'months',
  'frame.horizon.long-term': 'long-term',
  'frame.horizon.unknown': 'unknown',

  // Scores
  'score.opportunity':
    'Comparative opportunity pressure from framing and domain signals.',
  'score.risk': 'Risk reflects stakes language, reversibility, and domain.',
  'score.timing.available': 'Timing score from existing timing engine windows.',
  'score.timing.provisional': 'Timing provisional — live timing unavailable.',
  'score.readiness.withProfile':
    'Readiness considers personal decision context availability.',
  'score.readiness.withoutProfile':
    'Readiness limited without a personal intelligence profile.',
  'score.confidence':
    'Confidence tracks clarity, profile, timing, and assumption load.',

  // Analysis titles / bodies
  'analysis.situation.title': 'Situation',
  'analysis.situation.body':
    'You are deciding: {decision}. Intent: {intent}. Horizon: {horizon}.',
  'analysis.factors.title': 'Main Factors',
  'analysis.factors.body':
    'Objective: {objective}. Concern: {concern}. Reversibility: {reversibility}.',
  'analysis.opportunities.title': 'Opportunities',
  'analysis.opportunities.body.withOptions':
    'Named options: {options}. Prefer the option that stays reversible while learning.',
  'analysis.opportunities.body.noOptions':
    'Opportunity lies in clarifying one reversible next step that reduces the top unknown.',
  'analysis.risks.title': 'Risks',
  'analysis.risks.body':
    'Primary concern: {concern}. Unknowns: {unknowns}.',
  'analysis.risks.noneListed': 'none listed',
  'analysis.tradeoffs.title': 'Trade-offs',
  'analysis.tradeoffs.body':
    'Acting now trades speed for incomplete information ({horizon}). Waiting trades clarity for possible lost timing.',
  'analysis.personalFit.title': 'Personal Fit',
  'analysis.personalFit.body.withProfile':
    'Decision style signals ({styles}) suggest sequencing irreversible steps after a reversible pilot.',
  'analysis.personalFit.body.withoutProfile':
    'Personal intelligence profile unavailable — using general decision hygiene. Completing your profile improves personal fit.',
  'analysis.whatCouldChange.title': 'What Could Change the Recommendation',
  'analysis.whatCouldChange.body.default':
    'A stated deadline, downside limit, or explicit option set would materially change this briefing.',
  'analysis.why.title': 'Why This Recommendation',

  // Action plan — now
  'action.now.writeDecision':
    'Write the decision in one sentence: “{decision}”',
  'action.now.writeDecision.purpose': 'Make the decision explicit',
  'action.now.writeDecision.signal': 'One written decision sentence exists',
  'action.now.listFact':
    'List the single fact that would change your mind in either direction',
  'action.now.listFact.purpose': 'Surface the critical unknown',
  'action.now.listFact.signal': 'Decision-changing fact named',
  'action.now.identifyIrreversible':
    'Identify the irreversible part of this choice',
  'action.now.identifyIrreversible.purpose': 'Protect downside',
  'action.now.identifyIrreversible.signal':
    'Irreversible step named separately from pilots',

  // Action plan — week
  'action.week.scoreOptions':
    'Score options ({options}) on opportunity, risk, and timing',
  'action.week.compareOptions':
    'Compare two concrete options on opportunity, risk, and timing',
  'action.week.scoreOptions.purpose': 'Create a comparable choice set',
  'action.week.scoreOptions.signal': 'Option score table exists',
  'action.week.schedule':
    'Schedule the decisive conversation or review inside your best available window',
  'action.week.schedule.purpose': 'Align action with timing',
  'action.week.schedule.signal': 'Calendar event created',
  'action.week.addressConcern': 'Address concern: {concern}',
  'action.week.addressConcern.purpose': 'Reduce the stated risk',
  'action.week.addressConcern.signal': 'One mitigation step completed',

  // Action plan — month
  'action.month.checkpoint': 'Run a checkpoint against your success criteria',
  'action.month.checkpoint.purpose': 'Validate direction',
  'action.month.checkpoint.signal': 'Dated review note exists',
  'action.month.increaseCommitment':
    'Increase commitment only after the first reversible milestone succeeds',
  'action.month.increaseCommitment.purpose': 'Sequence irreversibility',
  'action.month.increaseCommitment.signal':
    'Milestone marked complete before escalation',
  'action.month.archive': 'Archive what changed vs. this recommendation',
  'action.month.archive.purpose': 'Improve future decisions',
  'action.month.archive.signal': 'Decision log updated',

  // Scenarios
  'scenario.best.outcome':
    'You advance with a reversible pilot and retain optionality.',
  'scenario.best.condition1': 'Critical unknown reduced',
  'scenario.best.condition2': 'Timing window used',
  'scenario.best.signal1': 'Clear next owner',
  'scenario.best.signal2': 'Written success criteria',
  'scenario.best.mitigation': 'Keep the first step reversible.',
  'scenario.likely.outcome':
    'Partial progress with trade-offs around {concern}.',
  'scenario.likely.condition1': 'Mixed information quality',
  'scenario.likely.signal1': 'Delayed replies',
  'scenario.likely.signal2': 'Scope creep',
  'scenario.likely.mitigation': 'Time-box information gathering.',
  'scenario.downside.outcome':
    'An irreversible move lands before key facts are known.',
  'scenario.downside.condition1': 'Urgency overrides checkpoints',
  'scenario.downside.signal1': 'Pressure to skip review',
  'scenario.downside.mitigation': 'Separate pilot from commitment in writing.',

  // Confidence
  'conf.aligned': 'Signals are aligned enough to act with checkpoints.',
  'conf.staged':
    'Proceed with staged moves; one more critical input would raise confidence.',
  'conf.directional':
    'Treat this as directional — gather the missing input before irreversible steps.',
  'conf.limit.comparative':
    'Comparative decision-support only — not a prediction.',
  'conf.limit.highStakes':
    'High-stakes domain — bounded educational guidance.',

  // Executive summary prefixes
  'exec.decision': 'Decision: {decision}.',
  'exec.recommendation': 'Recommendation: {status}.',
  'exec.caution': 'Caution: {concern}.',
  'exec.next': 'Next: {next}.',

  // Status labels (for exec summary)
  'status.proceed': 'proceed',
  'status.proceed-with-caution': 'proceed with caution',
  'status.wait': 'wait',
  'status.gather-more-information': 'gather more information',
  'status.avoid-for-now': 'avoid for now',
  'status.neutral': 'neutral',

  // Timing
  'timing.notApplicable': 'Timing advice not applicable for this question.',
  'timing.unavailable': 'Timing data unavailable — no fabricated windows.',
  'timing.today': 'Today',
  'timing.next7Days': 'Next 7 days',
  'timing.next30Days': 'Next 30 days',
  'timing.bestWindow': 'Best window',
  'timing.cautionWindow': 'Caution window',
  'timing.rationale':
    'Windows derived from existing timing engine day scores — comparative, not predictive.',

  // Safety
  'safety.health':
    'Educational decision support only — not a diagnosis or treatment plan. Consult a qualified professional for medical decisions.',
  'safety.legal':
    'Educational decision support only — not legal advice. Consult a qualified professional for legal conclusions.',
  'safety.investment':
    'Educational decision support only — not investment advice. No outcomes are guaranteed.',
  'safety.highStakes':
    'High-stakes topic — treat this as bounded decision support, not a guarantee.',

  // Fallback
  'fallback.recommendation':
    'Use a general decision framework: name the irreversible step, shrink to a reversible pilot, and gather the one fact that would change your mind.',
  'fallback.providerUnavailable':
    'Provider path unavailable ({reason}) — using structured local framework.',
  'fallback.reason.network': 'network',
  'fallback.reason.timeout': 'timeout',
  'fallback.reason.parse': 'parse',
  'fallback.reason.provider': 'provider',
  'fallback.reason.unknown': 'unknown',
  'fallback.lowConfidence':
    'Low confidence because the conversational briefing could not be completed. Retry when connectivity returns.',
  'fallback.limit.structured':
    'Structured fallback — not personalised model insight.',
  'fallback.limit.retry': 'Retry to regenerate a full briefing.',
  'fallback.followup.irreversible':
    'What is the irreversible part of this decision?',
  'fallback.followup.fact': 'What single fact would change your mind?',
  'fallback.followup.reversible':
    'What is the smallest reversible next step this week?',

  // Parse scaffolds
  'parse.holdIrreversible':
    'Hold the irreversible step until the top unknown is reduced.',
  'parse.gatherInput': 'Gather one critical input before committing.',
  'parse.advancePilot':
    'Advance with a reversible pilot and clear checkpoints.',
  'parse.nextStep': 'Define the next reversible step',
  'parse.defineNextStep': 'Define next step',
  'parse.advanceDecision': 'Advance the decision',
  'parse.stepCompleted': 'Step completed',
  'parse.relevantNext': 'Relevant next step',
  'parse.open': 'Open',
  'parse.option': 'Option',
  'parse.limit.comparative': 'Comparative decision-support only.',
  'parse.limit.noProfile': 'Personal intelligence profile unavailable.',
  'parse.limit.noTiming': 'Live timing unavailable.',
  'parse.alt.bestFor': 'When this path matches your non-negotiables',
  'parse.alt.advantage': 'Uses a stated option',
  'parse.alt.disadvantage': 'Still requires validation',
  'parse.alt.recommendationFit':
    'Compare against checkpoints before locking',
  'parse.followup.no':
    'What would make “{decision}” clearly a no?',
  'parse.followup.downside':
    'What is the maximum downside you will accept before walking away?',
  'parse.followup.stakeholder':
    'Which stakeholder most changes the outcome if they disagree?',
  'parse.followup.checkpoint':
    'If you advance this week, what reversible checkpoint proves the path is working?',

  // Run
  'run.untitled': 'Untitled decision',
  'run.continuedAssumptions': 'User continued with stated assumptions',

  // Clarification pending (run.ts)
  'run.clarification.recommendation':
    'One clarification will improve this briefing.',
  'run.clarification.executiveSummary':
    'This question needs one clarification before a responsible recommendation. Answer the prompt or continue with stated assumptions.',
  'run.clarification.frameSuffix': '{decision} — Clarification: {answer}',
  'analysis.personalFit.styles.available': 'available',
  'analysis.personalFit.styles.listSep': ', ',
  'analysis.personalFit.styles.listAnd': ' and ',

  // Safe language failure
  'safe.languageFailure':
    'We could not deliver this briefing in your selected language. Please retry.',
};

const FA: CopyTable = {
  'frame.unknown.timeHorizon': 'افق زمانی بیان نشده است',
  'frame.unknown.options': 'گزینه‌های صریح بیان نشده‌اند',
  'frame.unknown.decisionVerb': 'فعل تصمیم مبهم است',
  'frame.unknown.mainConcern': 'نگرانی اصلی به‌طور کامل بیان نشده است',
  'frame.assumption.timingFlexible': 'زمان‌بندی انعطاف‌پذیر فرض می‌شود مگر خلاف آن روشن شود',
  'frame.assumption.proceedWaitGather': 'به‌عنوان تصمیم پیش‌روی / صبر / جمع‌آوری اطلاعات چارچوب‌بندی می‌شود',
  'frame.assumption.decisionSupport': 'پرسش به‌عنوان درخواست پشتیبانی تصمیم تفسیر می‌شود',
  'frame.objective.default': 'شناسایی پراهرم‌ترین گام بعدی برای پرسش بیان‌شده',
  'frame.objective.resolve': 'تصمیم‌گیری دربارهٔ پیش‌روی: {detail}',
  'frame.concern.unstated': 'نگرانی اصلی به‌طور کامل بیان نشده است',
  'frame.concern.downside': 'نگرانی بیان‌شده دربارهٔ ریسک یا پشیمانی',
  'frame.concern.financial': 'در معرض منابع یا مال (استنباط‌شده)',
  'frame.concern.people': 'تأثیر بر افراد (استنباط‌شده)',
  'frame.reversibility.unknown': 'نامشخص — برگشت‌پذیری بیان نشده است',
  'frame.reversibility.low': 'کم — زبان به نتایج سخت‌برگشت‌پذیر اشاره دارد',
  'frame.reversibility.high': 'بالا — چارچوب آزمایشی یا برگشت‌پذیر حاضر است',
  'frame.horizon.today': 'امروز',
  'frame.horizon.days': 'روزها',
  'frame.horizon.weeks': 'هفته‌ها',
  'frame.horizon.months': 'ماه‌ها',
  'frame.horizon.long-term': 'بلندمدت',
  'frame.horizon.unknown': 'نامشخص',

  'score.opportunity':
    'فشار فرصت نسبی بر اساس چارچوب‌بندی و سیگنال‌های حوزه.',
  'score.risk': 'ریسک بازتاب زبان ریسک، برگشت‌پذیری و حوزه است.',
  'score.timing.available': 'امتیاز زمان‌بندی از پنجره‌های موتور زمان‌بندی موجود.',
  'score.timing.provisional':
    'زمان‌بندی موقت — زمان‌بندی زنده در دسترس نیست.',
  'score.readiness.withProfile':
    'آمادگی با در نظر گرفتن دسترس‌پذیری بافت تصمیم شخصی.',
  'score.readiness.withoutProfile':
    'آمادگی بدون پروفایل هوش شخصی محدود است.',
  'score.confidence':
    'اطمینان وضوح، پروفایل، زمان‌بندی و بار فرضیات را دنبال می‌کند.',

  'analysis.situation.title': 'وضعیت',
  'analysis.situation.body':
    'شما تصمیم می‌گیرید: {decision}. نیت: {intent}. افق: {horizon}.',
  'analysis.factors.title': 'عوامل اصلی',
  'analysis.factors.body':
    'هدف: {objective}. نگرانی: {concern}. برگشت‌پذیری: {reversibility}.',
  'analysis.opportunities.title': 'فرصت‌ها',
  'analysis.opportunities.body.withOptions':
    'گزینه‌های نام‌برده: {options}. گزینه‌ای را ترجیح دهید که هنگام یادگیری برگشت‌پذیر بماند.',
  'analysis.opportunities.body.noOptions':
    'فرصت در روشن کردن یک گام برگشت‌پذیر بعدی است که ناشناختهٔ اصلی را کاهش دهد.',
  'analysis.risks.title': 'ریسک‌ها',
  'analysis.risks.body':
    'نگرانی اصلی: {concern}. ناشناخته‌ها: {unknowns}.',
  'analysis.risks.noneListed': 'موردی فهرست نشده',
  'analysis.tradeoffs.title': 'بده‌بستان‌ها',
  'analysis.tradeoffs.body':
    'اقدام اکنون سرعت را با اطلاعات ناقص ({horizon}) مبادله می‌کند. انتظار وضوح را با احتمال از دست دادن زمان مبادله می‌کند.',
  'analysis.personalFit.title': 'تناسب شخصی',
  'analysis.personalFit.body.withProfile':
    'سبک تصمیم‌گیری {styles} پیشنهاد می‌کند گام‌های برگشت‌ناپذیر را پس از یک آزمایش برگشت‌پذیر دنبال کنید.',
  'analysis.personalFit.body.withoutProfile':
    'پروفایل هوش شخصی در دسترس نیست — از بهداشت عمومی تصمیم استفاده می‌شود. تکمیل پروفایل تناسب شخصی را بهبود می‌دهد.',
  'analysis.whatCouldChange.title': 'چه چیزی می‌تواند توصیه را تغییر دهد',
  'analysis.whatCouldChange.body.default':
    'یک مهلت بیان‌شده، حد زیان، یا مجموعهٔ صریح گزینه‌ها این خلاصه را به‌طور معنادار تغییر می‌دهد.',
  'analysis.why.title': 'چرا این توصیه',

  'action.now.writeDecision':
    'تصمیم را در یک جمله بنویسید: «{decision}»',
  'action.now.writeDecision.purpose': 'تصمیم را صریح کنید',
  'action.now.writeDecision.signal': 'یک جملهٔ نوشته‌شدهٔ تصمیم وجود دارد',
  'action.now.listFact':
    'تنها حقیقتی را فهرست کنید که نظر شما را در هر دو جهت عوض می‌کند',
  'action.now.listFact.purpose': 'ناشناختهٔ حیاتی را آشکار کنید',
  'action.now.listFact.signal': 'حقیقت تغییردهندهٔ تصمیم نام برده شد',
  'action.now.identifyIrreversible':
    'بخش برگشت‌ناپذیر این انتخاب را مشخص کنید',
  'action.now.identifyIrreversible.purpose': 'از زیان محافظت کنید',
  'action.now.identifyIrreversible.signal':
    'گام برگشت‌ناپذیر جدا از آزمایش‌ها نام برده شد',

  'action.week.scoreOptions':
    'گزینه‌ها ({options}) را روی فرصت، ریسک و زمان‌بندی امتیاز دهید',
  'action.week.compareOptions':
    'دو گزینهٔ مشخص را روی فرصت، ریسک و زمان‌بندی مقایسه کنید',
  'action.week.scoreOptions.purpose': 'مجموعهٔ انتخاب قابل‌مقایسه بسازید',
  'action.week.scoreOptions.signal': 'جدول امتیاز گزینه‌ها وجود دارد',
  'action.week.schedule':
    'گفتگو یا بازبینی قطعی را در بهترین پنجرهٔ موجود زمان‌بندی کنید',
  'action.week.schedule.purpose': 'اقدام را با زمان‌بندی هم‌راستا کنید',
  'action.week.schedule.signal': 'رویداد تقویم ایجاد شد',
  'action.week.addressConcern': 'نگرانی را رسیدگی کنید: {concern}',
  'action.week.addressConcern.purpose': 'ریسک بیان‌شده را کاهش دهید',
  'action.week.addressConcern.signal': 'یک گام کاهش ریسک انجام شد',

  'action.month.checkpoint':
    'یک نقطهٔ کنترل در برابر معیارهای موفقیت اجرا کنید',
  'action.month.checkpoint.purpose': 'جهت را اعتبارسنجی کنید',
  'action.month.checkpoint.signal': 'یادداشت بازبینی تاریخ‌دار وجود دارد',
  'action.month.increaseCommitment':
    'تعهد را فقط پس از موفقیت اولین نقطهٔ عطف برگشت‌پذیر افزایش دهید',
  'action.month.increaseCommitment.purpose': 'برگشت‌ناپذیری را دنباله کنید',
  'action.month.increaseCommitment.signal':
    'نقطهٔ عطف قبل از تشدید کامل علامت‌گذاری شد',
  'action.month.archive':
    'آنچه نسبت به این توصیه تغییر کرد را بایگانی کنید',
  'action.month.archive.purpose': 'تصمیم‌های آینده را بهبود دهید',
  'action.month.archive.signal': 'گزارش تصمیم به‌روز شد',

  'scenario.best.outcome':
    'با یک آزمایش برگشت‌پذیر پیش می‌روید و اختیار عمل را حفظ می‌کنید.',
  'scenario.best.condition1': 'ناشناختهٔ حیاتی کاهش یافته',
  'scenario.best.condition2': 'پنجرهٔ زمان‌بندی استفاده شده',
  'scenario.best.signal1': 'مالک بعدی روشن',
  'scenario.best.signal2': 'معیارهای موفقیت نوشته‌شده',
  'scenario.best.mitigation': 'اولین گام را برگشت‌پذیر نگه دارید.',
  'scenario.likely.outcome':
    'پیشرفت جزئی با بده‌بستان‌هایی حول {concern}.',
  'scenario.likely.condition1': 'کیفیت اطلاعات مختلط',
  'scenario.likely.signal1': 'پاسخ‌های تأخیری',
  'scenario.likely.signal2': 'خزش دامنه',
  'scenario.likely.mitigation': 'جمع‌آوری اطلاعات را زمان‌محدود کنید.',
  'scenario.downside.outcome':
    'یک حرکت برگشت‌ناپذیر قبل از دانستن حقایق کلیدی رخ می‌دهد.',
  'scenario.downside.condition1': 'فوریت نقاط کنترل را دور می‌زند',
  'scenario.downside.signal1': 'فشار برای رد شدن از بازبینی',
  'scenario.downside.mitigation':
    'آزمایش را از تعهد به‌صورت کتبی جدا کنید.',

  'conf.aligned':
    'سیگنال‌ها به‌اندازهٔ کافی هم‌راستا هستند تا با نقاط کنترل اقدام کنید.',
  'conf.staged':
    'با حرکت‌های مرحله‌ای پیش بروید؛ یک ورودی حیاتی دیگر اطمینان را بالا می‌برد.',
  'conf.directional':
    'این را جهت‌نما بدانید — قبل از گام‌های برگشت‌ناپذیر ورودی گمشده را جمع کنید.',
  'conf.limit.comparative':
    'فقط پشتیبانی نسبی تصمیم — نه پیش‌بینی.',
  'conf.limit.highStakes':
    'حوزهٔ پرریسک — راهنمایی آموزشی محدود.',

  'exec.decision': 'تصمیم: {decision}.',
  'exec.recommendation': 'توصیه: {status}.',
  'exec.caution': 'احتیاط: {concern}.',
  'exec.next': 'بعدی: {next}.',

  'status.proceed': 'پیش بروید',
  'status.proceed-with-caution': 'با احتیاط پیش بروید',
  'status.wait': 'منتظر بمانید',
  'status.gather-more-information': 'اطلاعات بیشتری جمع کنید',
  'status.avoid-for-now': 'فعلاً اجتناب کنید',
  'status.neutral': 'خنثی',

  'timing.notApplicable':
    'مشاورهٔ زمان‌بندی برای این پرسش کاربرد ندارد.',
  'timing.unavailable':
    'دادهٔ زمان‌بندی در دسترس نیست — پنجره‌ای ساخته نمی‌شود.',
  'timing.today': 'امروز',
  'timing.next7Days': '۷ روز آینده',
  'timing.next30Days': '۳۰ روز آینده',
  'timing.bestWindow': 'بهترین پنجره',
  'timing.cautionWindow': 'پنجرهٔ احتیاط',
  'timing.rationale':
    'پنجره‌ها از امتیازهای روزانهٔ موتور زمان‌بندی موجود گرفته شده‌اند — نسبی، نه پیش‌بینانه.',

  'safety.health':
    'فقط پشتیبانی آموزشی تصمیم — نه تشخیص یا برنامهٔ درمان. برای تصمیم‌های پزشکی با متخصص واجد شرایط مشورت کنید.',
  'safety.legal':
    'فقط پشتیبانی آموزشی تصمیم — نه مشاورهٔ حقوقی. برای نتیجه‌گیری حقوقی با متخصص واجد شرایط مشورت کنید.',
  'safety.investment':
    'فقط پشتیبانی آموزشی تصمیم — نه مشاورهٔ سرمایه‌گذاری. هیچ نتیجه‌ای تضمین نمی‌شود.',
  'safety.highStakes':
    'موضوع پرریسک — این را پشتیبانی محدود تصمیم بدانید، نه تضمین.',

  'fallback.recommendation':
    'از چارچوب تصمیم عمومی استفاده کنید: گام برگشت‌ناپذیر را نام ببرید، به یک آزمایش برگشت‌پذیر کوچک کنید، و همان حقیقتی را که نظر شما را عوض می‌کند جمع کنید.',
  'fallback.providerUnavailable':
    'مسیر ارائه‌دهنده در دسترس نیست ({reason}) — از چارچوب محلی ساخت‌یافته استفاده می‌شود.',
  'fallback.reason.network': 'شبکه',
  'fallback.reason.timeout': 'زمان‌تمام',
  'fallback.reason.parse': 'تجزیه',
  'fallback.reason.provider': 'ارائه‌دهنده',
  'fallback.reason.unknown': 'نامشخص',
  'fallback.lowConfidence':
    'اطمینان پایین چون خلاصهٔ گفتگویی کامل نشد. با بازگشت اتصال دوباره تلاش کنید.',
  'fallback.limit.structured':
    'بازگشت ساخت‌یافته — نه بینش شخصی‌سازی‌شدهٔ مدل.',
  'fallback.limit.retry': 'برای تولید مجدد خلاصهٔ کامل دوباره تلاش کنید.',
  'fallback.followup.irreversible':
    'کدام بخش این تصمیم برگشت‌ناپذیر است؟',
  'fallback.followup.fact': 'کدام حقیقت واحد نظر شما را عوض می‌کند؟',
  'fallback.followup.reversible':
    'کوچک‌ترین گام برگشت‌پذیر این هفته چیست؟',

  'parse.holdIrreversible':
    'گام برگشت‌ناپذیر را تا کاهش ناشناختهٔ اصلی نگه دارید.',
  'parse.gatherInput': 'قبل از تعهد، یک ورودی حیاتی جمع کنید.',
  'parse.advancePilot':
    'با یک آزمایش برگشت‌پذیر و نقاط کنترل روشن پیش بروید.',
  'parse.nextStep': 'گام برگشت‌پذیر بعدی را تعریف کنید',
  'parse.defineNextStep': 'گام بعدی را تعریف کنید',
  'parse.advanceDecision': 'تصمیم را پیش ببرید',
  'parse.stepCompleted': 'گام تکمیل شد',
  'parse.relevantNext': 'گام بعدی مرتبط',
  'parse.open': 'باز کردن',
  'parse.option': 'گزینه',
  'parse.limit.comparative': 'فقط پشتیبانی نسبی تصمیم.',
  'parse.limit.noProfile': 'پروفایل هوش شخصی در دسترس نیست.',
  'parse.limit.noTiming': 'زمان‌بندی زنده در دسترس نیست.',
  'parse.alt.bestFor': 'وقتی این مسیر با خط قرمزهای شما هم‌خوان است',
  'parse.alt.advantage': 'از یک گزینهٔ بیان‌شده استفاده می‌کند',
  'parse.alt.disadvantage': 'هنوز نیاز به اعتبارسنجی دارد',
  'parse.alt.recommendationFit':
    'قبل از قفل کردن در برابر نقاط کنترل مقایسه کنید',
  'parse.followup.no':
    'چه چیزی «{decision}» را به‌روشنی رد می‌کند؟',
  'parse.followup.downside':
    'حداکثر زیانی که قبل از کناره‌گیری می‌پذیرید چیست؟',
  'parse.followup.stakeholder':
    'کدام ذی‌نفع با مخالفت بیشترین تغییر را در نتیجه ایجاد می‌کند؟',
  'parse.followup.checkpoint':
    'اگر این هفته پیش بروید، کدام نقطهٔ کنترل برگشت‌پذیر نشان می‌دهد مسیر کار می‌کند؟',

  'run.untitled': 'تصمیم بدون عنوان',
  'run.continuedAssumptions': 'کاربر با فرضیات بیان‌شده ادامه داد',
  'run.clarification.recommendation':
    'یک توضیح تکمیلی کیفیت این خلاصه را بهتر می‌کند.',
  'run.clarification.executiveSummary':
    'این پرسش قبل از یک توصیه مسئولانه به یک توضیح نیاز دارد. به پرسش پاسخ دهید یا با فرضیات بیان‌شده ادامه دهید.',
  'run.clarification.frameSuffix': '{decision} — توضیح: {answer}',
  'analysis.personalFit.styles.available': 'در دسترس',
  'analysis.personalFit.styles.listSep': '، ',
  'analysis.personalFit.styles.listAnd': ' و ',

  'safe.languageFailure':
    'نتوانستیم این خلاصه را به زبان انتخابی شما ارائه دهیم. لطفاً دوباره تلاش کنید.',
};

const AR: CopyTable = {
  'frame.unknown.timeHorizon': 'الأفق الزمني غير مذكور',
  'frame.unknown.options': 'الخيارات الصريحة غير مذكورة',
  'frame.unknown.decisionVerb': 'فعل القرار غير واضح',
  'frame.unknown.mainConcern': 'القلق الرئيسي غير مذكور بالكامل',
  'frame.assumption.timingFlexible': 'نتعامل مع التوقيت بمرونة ما لم يُوضَّح خلاف ذلك',
  'frame.assumption.proceedWaitGather': 'نؤطّر القرار كالمضي / الانتظار / جمع المعلومات',
  'frame.assumption.decisionSupport': 'نفسّر السؤال كطلب دعم قرار',
  'frame.objective.default': 'تحديد الخطوة التالية الأكثر تأثيراً للسؤال المذكور',
  'frame.objective.resolve': 'حسم المضي قدماً: {detail}',
  'frame.concern.unstated': 'القلق الرئيسي غير مذكور بالكامل',
  'frame.concern.downside': 'قلق مذكور حول الجانب السلبي أو الندم',
  'frame.concern.financial': 'تعرّض مالي أو للموارد (مستنتج)',
  'frame.concern.people': 'تأثير على الأشخاص (مستنتج)',
  'frame.reversibility.unknown': 'غير معروف — قابلية الرجوع غير مذكورة',
  'frame.reversibility.low': 'منخفضة — اللغة تشير إلى نتائج يصعب الرجوع عنها',
  'frame.reversibility.high': 'مرتفعة — تأطير تجريبي أو قابل للرجوع موجود',
  'frame.horizon.today': 'اليوم',
  'frame.horizon.days': 'أيام',
  'frame.horizon.weeks': 'أسابيع',
  'frame.horizon.months': 'أشهر',
  'frame.horizon.long-term': 'طويل الأمد',
  'frame.horizon.unknown': 'غير معروف',

  'score.opportunity':
    'ضغط الفرصة النسبي من التأطير وإشارات المجال.',
  'score.risk': 'المخاطر تعكس لغة المخاطر وقابلية الرجوع والمجال.',
  'score.timing.available':
    'درجة التوقيت من نوافذ محرك التوقيت الحالي.',
  'score.timing.provisional':
    'توقيت مؤقت — التوقيت الحي غير متاح.',
  'score.readiness.withProfile':
    'الجاهزية تراعي توافر سياق القرار الشخصي.',
  'score.readiness.withoutProfile':
    'الجاهزية محدودة بدون ملف ذكاء شخصي.',
  'score.confidence':
    'الثقة تتبع الوضوح والملف والتوقيت وحمل الافتراضات.',

  'analysis.situation.title': 'الوضع',
  'analysis.situation.body':
    'أنت تقرر: {decision}. النية: {intent}. الأفق: {horizon}.',
  'analysis.factors.title': 'العوامل الرئيسية',
  'analysis.factors.body':
    'الهدف: {objective}. القلق: {concern}. قابلية الرجوع: {reversibility}.',
  'analysis.opportunities.title': 'الفرص',
  'analysis.opportunities.body.withOptions':
    'خيارات مسمّاة: {options}. فضّل الخيار الذي يبقى قابلاً للرجوع أثناء التعلّم.',
  'analysis.opportunities.body.noOptions':
    'الفرصة في توضيح خطوة تالية قابلة للرجوع تقلّل المجهول الأهم.',
  'analysis.risks.title': 'المخاطر',
  'analysis.risks.body':
    'القلق الأساسي: {concern}. المجهولات: {unknowns}.',
  'analysis.risks.noneListed': 'لا شيء مدرج',
  'analysis.tradeoffs.title': 'المقايضات',
  'analysis.tradeoffs.body':
    'التصرّف الآن يقايض السرعة بمعلومات ناقصة ({horizon}). الانتظار يقايض الوضوح باحتمال فقدان التوقيت.',
  'analysis.personalFit.title': 'الملاءمة الشخصية',
  'analysis.personalFit.body.withProfile':
    'أسلوب القرار {styles} يقترح ترتيب الخطوات غير القابلة للرجوع بعد تجربة قابلة للرجوع.',
  'analysis.personalFit.body.withoutProfile':
    'ملف الذكاء الشخصي غير متاح — نستخدم نظافة قرار عامة. إكمال ملفك يحسّن الملاءمة الشخصية.',
  'analysis.whatCouldChange.title': 'ما الذي قد يغيّر التوصية',
  'analysis.whatCouldChange.body.default':
    'موعد معلن أو حد خسارة أو مجموعة خيارات صريحة سيغيّر هذا الملخص جوهرياً.',
  'analysis.why.title': 'لماذا هذه التوصية',

  'action.now.writeDecision':
    'اكتب القرار في جملة واحدة: «{decision}»',
  'action.now.writeDecision.purpose': 'اجعل القرار صريحاً',
  'action.now.writeDecision.signal': 'توجد جملة قرار مكتوبة واحدة',
  'action.now.listFact':
    'اذكر الحقيقة الواحدة التي تغيّر رأيك في أي اتجاه',
  'action.now.listFact.purpose': 'أظهر المجهول الحرج',
  'action.now.listFact.signal': 'سُمّيت الحقيقة التي تغيّر القرار',
  'action.now.identifyIrreversible':
    'حدّد الجزء غير القابل للرجوع من هذا الاختيار',
  'action.now.identifyIrreversible.purpose': 'احمِ الجانب السلبي',
  'action.now.identifyIrreversible.signal':
    'سُمّيت الخطوة غير القابلة للرجوع منفصلة عن التجارب',

  'action.week.scoreOptions':
    'قيّم الخيارات ({options}) على الفرصة والمخاطر والتوقيت',
  'action.week.compareOptions':
    'قارن خيارين ملموسين على الفرصة والمخاطر والتوقيت',
  'action.week.scoreOptions.purpose': 'أنشئ مجموعة اختيار قابلة للمقارنة',
  'action.week.scoreOptions.signal': 'يوجد جدول درجات للخيارات',
  'action.week.schedule':
    'جدول المحادثة أو المراجعة الحاسمة داخل أفضل نافذة متاحة',
  'action.week.schedule.purpose': 'واءم الإجراء مع التوقيت',
  'action.week.schedule.signal': 'أُنشئ حدث في التقويم',
  'action.week.addressConcern': 'عالج القلق: {concern}',
  'action.week.addressConcern.purpose': 'قلّل المخاطر المذكورة',
  'action.week.addressConcern.signal': 'أُكملت خطوة تخفيف واحدة',

  'action.month.checkpoint':
    'نفّذ نقطة تحقق مقابل معايير نجاحك',
  'action.month.checkpoint.purpose': 'تحقق من الاتجاه',
  'action.month.checkpoint.signal': 'توجد ملاحظة مراجعة مؤرخة',
  'action.month.increaseCommitment':
    'زِد الالتزام فقط بعد نجاح أول معلم قابل للرجوع',
  'action.month.increaseCommitment.purpose': 'سلسل عدم قابلية الرجوع',
  'action.month.increaseCommitment.signal':
    'عُلّم المعلم مكتملاً قبل التصعيد',
  'action.month.archive':
    'أرشف ما تغيّر مقابل هذه التوصية',
  'action.month.archive.purpose': 'حسّن القرارات المستقبلية',
  'action.month.archive.signal': 'حُدّث سجل القرار',

  'scenario.best.outcome':
    'تتقدّم بتجربة قابلة للرجوع وتحتفظ بالمرونة.',
  'scenario.best.condition1': 'انخفاض المجهول الحرج',
  'scenario.best.condition2': 'استخدام نافذة التوقيت',
  'scenario.best.signal1': 'مالك تالٍ واضح',
  'scenario.best.signal2': 'معايير نجاح مكتوبة',
  'scenario.best.mitigation': 'أبقِ الخطوة الأولى قابلة للرجوع.',
  'scenario.likely.outcome':
    'تقدّم جزئي مع مقايضات حول {concern}.',
  'scenario.likely.condition1': 'جودة معلومات مختلطة',
  'scenario.likely.signal1': 'ردود متأخرة',
  'scenario.likely.signal2': 'زحف النطاق',
  'scenario.likely.mitigation': 'حدّد وقتاً لجمع المعلومات.',
  'scenario.downside.outcome':
    'حركة غير قابلة للرجوع تحدث قبل معرفة الحقائق الرئيسية.',
  'scenario.downside.condition1': 'الاستعجال يتجاوز نقاط التحقق',
  'scenario.downside.signal1': 'ضغط لتجاوز المراجعة',
  'scenario.downside.mitigation':
    'افصل التجربة عن الالتزام كتابةً.',

  'conf.aligned':
    'الإشارات متوافقة بما يكفي للعمل مع نقاط تحقق.',
  'conf.staged':
    'تقدّم بخطوات مرحلية؛ إدخال حرج إضافي يرفع الثقة.',
  'conf.directional':
    'اعتبر هذا توجيهياً — اجمع الإدخال الناقص قبل خطوات غير قابلة للرجوع.',
  'conf.limit.comparative':
    'دعم قرار نسبي فقط — وليس تنبؤاً.',
  'conf.limit.highStakes':
    'مجال عالي المخاطر — إرشاد تعليمي محدود.',

  'exec.decision': 'القرار: {decision}.',
  'exec.recommendation': 'التوصية: {status}.',
  'exec.caution': 'تحذير: {concern}.',
  'exec.next': 'التالي: {next}.',

  'status.proceed': 'تابع',
  'status.proceed-with-caution': 'تابع بحذر',
  'status.wait': 'انتظر',
  'status.gather-more-information': 'اجمع مزيداً من المعلومات',
  'status.avoid-for-now': 'تجنّب حالياً',
  'status.neutral': 'محايد',

  'timing.notApplicable':
    'نصيحة التوقيت غير منطبقة على هذا السؤال.',
  'timing.unavailable':
    'بيانات التوقيت غير متاحة — لا نوافذ مُختلَقة.',
  'timing.today': 'اليوم',
  'timing.next7Days': 'الـ ٧ أيام القادمة',
  'timing.next30Days': 'الـ ٣٠ يوماً القادمة',
  'timing.bestWindow': 'أفضل نافذة',
  'timing.cautionWindow': 'نافذة الحذر',
  'timing.rationale':
    'النوافذ مستمدة من درجات أيام محرك التوقيت الحالي — نسبية وليست تنبؤية.',

  'safety.health':
    'دعم قرار تعليمي فقط — وليس تشخيصاً أو خطة علاج. استشر متخصصاً مؤهلاً للقرارات الطبية.',
  'safety.legal':
    'دعم قرار تعليمي فقط — وليس استشارة قانونية. استشر متخصصاً مؤهلاً للاستنتاجات القانونية.',
  'safety.investment':
    'دعم قرار تعليمي فقط — وليس استشارة استثمارية. لا تُضمن أي نتائج.',
  'safety.highStakes':
    'موضوع عالي المخاطر — اعتبر هذا دعم قرار محدوداً وليس ضماناً.',

  'fallback.recommendation':
    'استخدم إطار قرار عام: سمِّ الخطوة غير القابلة للرجوع، واختصر إلى تجربة قابلة للرجوع، واجمع الحقيقة التي تغيّر رأيك.',
  'fallback.providerUnavailable':
    'مسار المزوّد غير متاح ({reason}) — يُستخدم إطار محلي منظم.',
  'fallback.reason.network': 'شبكة',
  'fallback.reason.timeout': 'انتهاء المهلة',
  'fallback.reason.parse': 'تحليل',
  'fallback.reason.provider': 'مزوّد',
  'fallback.reason.unknown': 'غير معروف',
  'fallback.lowConfidence':
    'ثقة منخفضة لأن الملخص الحواري لم يكتمل. أعد المحاولة عند عودة الاتصال.',
  'fallback.limit.structured':
    'بديل منظم — وليس رؤية نموذج مخصّصة.',
  'fallback.limit.retry': 'أعد المحاولة لتوليد ملخص كامل.',
  'fallback.followup.irreversible':
    'ما الجزء غير القابل للرجوع في هذا القرار؟',
  'fallback.followup.fact': 'أي حقيقة واحدة تغيّر رأيك؟',
  'fallback.followup.reversible':
    'ما أصغر خطوة قابلة للرجوع هذا الأسبوع؟',

  'parse.holdIrreversible':
    'أوقف الخطوة غير القابلة للرجوع حتى ينخفض المجهول الأهم.',
  'parse.gatherInput': 'اجمع إدخالاً حرجاً واحداً قبل الالتزام.',
  'parse.advancePilot':
    'تقدّم بتجربة قابلة للرجوع ونقاط تحقق واضحة.',
  'parse.nextStep': 'عرّف الخطوة التالية القابلة للرجوع',
  'parse.defineNextStep': 'عرّف الخطوة التالية',
  'parse.advanceDecision': 'قدّم القرار',
  'parse.stepCompleted': 'اكتملت الخطوة',
  'parse.relevantNext': 'خطوة تالية ذات صلة',
  'parse.open': 'افتح',
  'parse.option': 'خيار',
  'parse.limit.comparative': 'دعم قرار نسبي فقط.',
  'parse.limit.noProfile': 'ملف الذكاء الشخصي غير متاح.',
  'parse.limit.noTiming': 'التوقيت الحي غير متاح.',
  'parse.alt.bestFor': 'عندما يتوافق هذا المسار مع خطوطك الحمراء',
  'parse.alt.advantage': 'يستخدم خياراً مذكوراً',
  'parse.alt.disadvantage': 'ما زال يحتاج تحققاً',
  'parse.alt.recommendationFit':
    'قارن مقابل نقاط التحقق قبل الإغلاق',
  'parse.followup.no':
    'ما الذي يجعل «{decision}» رفضاً واضحاً؟',
  'parse.followup.downside':
    'ما أقصى خسارة تقبلها قبل الانسحاب؟',
  'parse.followup.stakeholder':
    'أي صاحب مصلحة يغيّر النتيجة أكثر إذا اختلف؟',
  'parse.followup.checkpoint':
    'إذا تقدّمت هذا الأسبوع، أي نقطة تحقق قابلة للرجوع تثبت أن المسار يعمل؟',

  'run.untitled': 'قرار بلا عنوان',
  'run.continuedAssumptions': 'تابع المستخدم مع الافتراضات المذكورة',
  'run.clarification.recommendation':
    'توضيح واحد سيحسّن هذا الملخص.',
  'run.clarification.executiveSummary':
    'يحتاج هذا السؤال إلى توضيح واحد قبل توصية مسؤولة. أجب عن الموجه أو تابع مع الافتراضات المذكورة.',
  'run.clarification.frameSuffix': '{decision} — توضيح: {answer}',
  'analysis.personalFit.styles.available': 'متاح',
  'analysis.personalFit.styles.listSep': '، ',
  'analysis.personalFit.styles.listAnd': ' و ',

  'safe.languageFailure':
    'تعذّر تقديم هذا الملخص بلغتك المحددة. يرجى إعادة المحاولة.',
};

const RU: CopyTable = {
  'frame.unknown.timeHorizon': 'Временной горизонт не указан',
  'frame.unknown.options': 'Явные варианты не указаны',
  'frame.unknown.decisionVerb': 'Глагол решения неясен',
  'frame.unknown.mainConcern': 'Основная озабоченность указана не полностью',
  'frame.assumption.timingFlexible': 'Считаем тайминг гибким, пока не уточнено иное',
  'frame.assumption.proceedWaitGather': 'Формулируем как решение продолжить / ждать / собрать информацию',
  'frame.assumption.decisionSupport': 'Интерпретируем вопрос как запрос поддержки решения',
  'frame.objective.default': 'Определить наиболее эффективный следующий шаг по вопросу',
  'frame.objective.resolve': 'Решить, двигаться ли дальше: {detail}',
  'frame.concern.unstated': 'Основная озабоченность указана не полностью',
  'frame.concern.downside': 'Заявленная озабоченность по поводу риска или сожаления',
  'frame.concern.financial': 'Финансовое или ресурсное воздействие (выведено)',
  'frame.concern.people': 'Влияние на людей (выведено)',
  'frame.reversibility.unknown': 'Неизвестно — обратимость не указана',
  'frame.reversibility.low': 'Низкая — формулировки намекают на труднообратимые исходы',
  'frame.reversibility.high': 'Высокая — есть обратимое или пробное формулирование',
  'frame.horizon.today': 'сегодня',
  'frame.horizon.days': 'дни',
  'frame.horizon.weeks': 'недели',
  'frame.horizon.months': 'месяцы',
  'frame.horizon.long-term': 'долгосрочно',
  'frame.horizon.unknown': 'неизвестно',

  'score.opportunity':
    'Сравнительное давление возможности из фрейминга и сигналов домена.',
  'score.risk': 'Риск отражает язык ставок, обратимость и домен.',
  'score.timing.available':
    'Оценка тайминга из окон существующего движка тайминга.',
  'score.timing.provisional':
    'Тайминг предварительный — живой тайминг недоступен.',
  'score.readiness.withProfile':
    'Готовность учитывает доступность личного контекста решения.',
  'score.readiness.withoutProfile':
    'Готовность ограничена без личного профиля интеллекта.',
  'score.confidence':
    'Уверенность отслеживает ясность, профиль, тайминг и нагрузку допущений.',

  'analysis.situation.title': 'Ситуация',
  'analysis.situation.body':
    'Вы решаете: {decision}. Намерение: {intent}. Горизонт: {horizon}.',
  'analysis.factors.title': 'Главные факторы',
  'analysis.factors.body':
    'Цель: {objective}. Опасение: {concern}. Обратимость: {reversibility}.',
  'analysis.opportunities.title': 'Возможности',
  'analysis.opportunities.body.withOptions':
    'Названные варианты: {options}. Предпочитайте вариант, который остаётся обратимым при обучении.',
  'analysis.opportunities.body.noOptions':
    'Возможность — уточнить один обратимый следующий шаг, снижающий главную неизвестность.',
  'analysis.risks.title': 'Риски',
  'analysis.risks.body':
    'Главное опасение: {concern}. Неизвестности: {unknowns}.',
  'analysis.risks.noneListed': 'не указаны',
  'analysis.tradeoffs.title': 'Компромиссы',
  'analysis.tradeoffs.body':
    'Действие сейчас меняет скорость на неполную информацию ({horizon}). Ожидание меняет ясность на возможную потерю тайминга.',
  'analysis.personalFit.title': 'Личное соответствие',
  'analysis.personalFit.body.withProfile':
    'Стиль решений ({styles}) предлагает ставить необратимые шаги после обратимого пилота.',
  'analysis.personalFit.body.withoutProfile':
    'Личный профиль интеллекта недоступен — используется общая гигиена решений. Заполнение профиля улучшает личное соответствие.',
  'analysis.whatCouldChange.title': 'Что может изменить рекомендацию',
  'analysis.whatCouldChange.body.default':
    'Указанный дедлайн, лимит убытка или явный набор вариантов существенно изменит этот брифинг.',
  'analysis.why.title': 'Почему эта рекомендация',

  'action.now.writeDecision':
    'Запишите решение одним предложением: «{decision}»',
  'action.now.writeDecision.purpose': 'Сделать решение явным',
  'action.now.writeDecision.signal': 'Существует одно записанное предложение решения',
  'action.now.listFact':
    'Перечислите единственный факт, который изменит ваше мнение в любую сторону',
  'action.now.listFact.purpose': 'Выявить критическую неизвестность',
  'action.now.listFact.signal': 'Назван факт, меняющий решение',
  'action.now.identifyIrreversible':
    'Определите необратимую часть этого выбора',
  'action.now.identifyIrreversible.purpose': 'Защитить downside',
  'action.now.identifyIrreversible.signal':
    'Необратимый шаг назван отдельно от пилотов',

  'action.week.scoreOptions':
    'Оцените варианты ({options}) по возможности, риску и таймингу',
  'action.week.compareOptions':
    'Сравните два конкретных варианта по возможности, риску и таймингу',
  'action.week.scoreOptions.purpose': 'Создать сопоставимый набор выбора',
  'action.week.scoreOptions.signal': 'Существует таблица оценок вариантов',
  'action.week.schedule':
    'Запланируйте решающий разговор или обзор в лучшем доступном окне',
  'action.week.schedule.purpose': 'Согласовать действие с таймингом',
  'action.week.schedule.signal': 'Создано событие в календаре',
  'action.week.addressConcern': 'Проработайте опасение: {concern}',
  'action.week.addressConcern.purpose': 'Снизить заявленный риск',
  'action.week.addressConcern.signal': 'Выполнен один шаг смягчения',

  'action.month.checkpoint':
    'Проведите контрольную точку по критериям успеха',
  'action.month.checkpoint.purpose': 'Проверить направление',
  'action.month.checkpoint.signal': 'Существует датированная заметка обзора',
  'action.month.increaseCommitment':
    'Увеличивайте обязательства только после успеха первого обратимого этапа',
  'action.month.increaseCommitment.purpose': 'Последовательно вводить необратимость',
  'action.month.increaseCommitment.signal':
    'Этап отмечен выполненным до эскалации',
  'action.month.archive':
    'Заархивируйте, что изменилось относительно этой рекомендации',
  'action.month.archive.purpose': 'Улучшить будущие решения',
  'action.month.archive.signal': 'Журнал решений обновлён',

  'scenario.best.outcome':
    'Вы продвигаетесь с обратимым пилотом и сохраняете опциональность.',
  'scenario.best.condition1': 'Критическая неизвестность снижена',
  'scenario.best.condition2': 'Использовано окно тайминга',
  'scenario.best.signal1': 'Ясный следующий владелец',
  'scenario.best.signal2': 'Записанные критерии успеха',
  'scenario.best.mitigation': 'Держите первый шаг обратимым.',
  'scenario.likely.outcome':
    'Частичный прогресс с компромиссами вокруг {concern}.',
  'scenario.likely.condition1': 'Смешанное качество информации',
  'scenario.likely.signal1': 'Отложенные ответы',
  'scenario.likely.signal2': 'Разрастание объёма',
  'scenario.likely.mitigation': 'Ограничьте по времени сбор информации.',
  'scenario.downside.outcome':
    'Необратимый шаг происходит до того, как известны ключевые факты.',
  'scenario.downside.condition1': 'Срочность обходит контрольные точки',
  'scenario.downside.signal1': 'Давление пропустить обзор',
  'scenario.downside.mitigation':
    'Отделите пилот от обязательств письменно.',

  'conf.aligned':
    'Сигналы достаточно согласованы, чтобы действовать с контрольными точками.',
  'conf.staged':
    'Двигайтесь поэтапно; ещё один критический ввод повысит уверенность.',
  'conf.directional':
    'Считайте это ориентиром — соберите недостающий ввод до необратимых шагов.',
  'conf.limit.comparative':
    'Только сравнительная поддержка решений — не прогноз.',
  'conf.limit.highStakes':
    'Высокорисковый домен — ограниченное образовательное руководство.',

  'exec.decision': 'Решение: {decision}.',
  'exec.recommendation': 'Рекомендация: {status}.',
  'exec.caution': 'Осторожно: {concern}.',
  'exec.next': 'Далее: {next}.',

  'status.proceed': 'продолжать',
  'status.proceed-with-caution': 'продолжать с осторожностью',
  'status.wait': 'ждать',
  'status.gather-more-information': 'собрать больше информации',
  'status.avoid-for-now': 'пока избегать',
  'status.neutral': 'нейтрально',

  'timing.notApplicable':
    'Совет по таймингу неприменим к этому вопросу.',
  'timing.unavailable':
    'Данные тайминга недоступны — окна не выдумываются.',
  'timing.today': 'Сегодня',
  'timing.next7Days': 'Следующие 7 дней',
  'timing.next30Days': 'Следующие 30 дней',
  'timing.bestWindow': 'Лучшее окно',
  'timing.cautionWindow': 'Окно осторожности',
  'timing.rationale':
    'Окна получены из дневных оценок существующего движка тайминга — сравнительные, не прогнозные.',

  'safety.health':
    'Только образовательная поддержка решений — не диагноз и не план лечения. Для медицинских решений обратитесь к квалифицированному специалисту.',
  'safety.legal':
    'Только образовательная поддержка решений — не юридическая консультация. Для правовых выводов обратитесь к квалифицированному специалисту.',
  'safety.investment':
    'Только образовательная поддержка решений — не инвестиционный совет. Результаты не гарантируются.',
  'safety.highStakes':
    'Высокорисковая тема — считайте это ограниченной поддержкой решений, а не гарантией.',

  'fallback.recommendation':
    'Используйте общий каркас решения: назовите необратимый шаг, сузьте до обратимого пилота и соберите один факт, который изменит ваше мнение.',
  'fallback.providerUnavailable':
    'Путь провайдера недоступен ({reason}) — используется структурированный локальный каркас.',
  'fallback.reason.network': 'сеть',
  'fallback.reason.timeout': 'таймаут',
  'fallback.reason.parse': 'разбор',
  'fallback.reason.provider': 'провайдер',
  'fallback.reason.unknown': 'неизвестно',
  'fallback.lowConfidence':
    'Низкая уверенность, потому что разговорный брифинг не удалось завершить. Повторите при восстановлении связи.',
  'fallback.limit.structured':
    'Структурированный запасной вариант — не персонализированный вывод модели.',
  'fallback.limit.retry': 'Повторите, чтобы заново сформировать полный брифинг.',
  'fallback.followup.irreversible':
    'Какая часть этого решения необратима?',
  'fallback.followup.fact': 'Какой один факт изменит ваше мнение?',
  'fallback.followup.reversible':
    'Какой самый маленький обратимый шаг на этой неделе?',

  'parse.holdIrreversible':
    'Удержите необратимый шаг, пока не снизится главная неизвестность.',
  'parse.gatherInput':
    'Соберите один критический ввод перед обязательством.',
  'parse.advancePilot':
    'Продвигайтесь с обратимым пилотом и ясными контрольными точками.',
  'parse.nextStep': 'Определите следующий обратимый шаг',
  'parse.defineNextStep': 'Определите следующий шаг',
  'parse.advanceDecision': 'Продвинуть решение',
  'parse.stepCompleted': 'Шаг выполнен',
  'parse.relevantNext': 'Релевантный следующий шаг',
  'parse.open': 'Открыть',
  'parse.option': 'Вариант',
  'parse.limit.comparative': 'Только сравнительная поддержка решений.',
  'parse.limit.noProfile': 'Личный профиль интеллекта недоступен.',
  'parse.limit.noTiming': 'Живой тайминг недоступен.',
  'parse.alt.bestFor': 'Когда этот путь соответствует вашим нерушимым условиям',
  'parse.alt.advantage': 'Использует заявленный вариант',
  'parse.alt.disadvantage': 'Всё ещё требует проверки',
  'parse.alt.recommendationFit':
    'Сравните с контрольными точками перед фиксацией',
  'parse.followup.no':
    'Что сделало бы «{decision}» явным отказом?',
  'parse.followup.downside':
    'Какой максимальный убыток вы примете до отказа?',
  'parse.followup.stakeholder':
    'Какой стейкхолдер сильнее всего меняет исход при несогласии?',
  'parse.followup.checkpoint':
    'Если вы продвинетесь на этой неделе, какая обратимая контрольная точка докажет, что путь работает?',

  'run.untitled': 'Решение без названия',
  'run.continuedAssumptions': 'Пользователь продолжил с указанными допущениями',
  'run.clarification.recommendation':
    'Одно уточнение улучшит этот брифинг.',
  'run.clarification.executiveSummary':
    'Этому вопросу нужно одно уточнение перед ответственной рекомендацией. Ответьте на подсказку или продолжите с указанными допущениями.',
  'run.clarification.frameSuffix': '{decision} — Уточнение: {answer}',
  'analysis.personalFit.styles.available': 'доступно',
  'analysis.personalFit.styles.listSep': ', ',
  'analysis.personalFit.styles.listAnd': ' и ',

  'safe.languageFailure':
    'Не удалось предоставить этот брифинг на выбранном языке. Пожалуйста, повторите попытку.',
};

const TABLES: Record<AppLang, CopyTable> = {
  en: EN,
  fa: FA,
  ar: AR,
  ru: RU,
};

function normalizeLang(locale: AppLang | string): AppLang {
  if (locale === 'fa' || locale === 'ar' || locale === 'ru' || locale === 'en') {
    return locale;
  }
  return 'en';
}

function interpolate(template: string, vars?: Record<string, string>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? vars[name]! : `{${name}}`
  );
}

/**
 * Locale-aware Ask copy lookup.
 * Never silently falls back to English for fa/ar/ru — returns unavailable message.
 */
export function askCopy(
  locale: AppLang | string,
  key: string,
  vars?: Record<string, string>
): string {
  const lang = normalizeLang(locale);
  const table = TABLES[lang];
  const template = table[key];
  if (template == null) {
    // Never use English strings for non-English locales.
    return interpolate(UNAVAILABLE[lang], vars);
  }
  return interpolate(template, vars);
}
