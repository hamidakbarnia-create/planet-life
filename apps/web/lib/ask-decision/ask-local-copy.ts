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
  'frame.unknown.timeHorizon': 'هنوز زمان دقیق مشخص نیست',
  'frame.unknown.options': 'گزینه‌های روشن هنوز معلوم نیست',
  'frame.unknown.decisionVerb': 'هنوز معلوم نیست دقیقاً چه کاری می‌خواهید بکنید',
  'frame.unknown.mainConcern': 'هنوز نگفته‌اید بزرگ‌ترین نگرانی‌تان چیست',
  'frame.assumption.timingFlexible': 'فرض می‌کنیم زمان‌بندی‌تان انعطاف دارد، مگر خلافش را بگویید',
  'frame.assumption.proceedWaitGather': 'این را به‌صورت «انجام بدم / صبر کنم / اول اطلاعات جمع کنم» می‌بینیم',
  'frame.assumption.decisionSupport': 'پرسش را درخواست کمک برای تصمیم‌گیری می‌دانیم',
  'frame.objective.default': 'پیدا کردن بهترین گام بعدی برای این سؤال',
  'frame.objective.resolve': 'تصمیم دربارهٔ پیش رفتن با: {detail}',
  'frame.concern.unstated': 'هنوز نگفته‌اید از چه می‌ترسید',
  'frame.concern.downside': 'نگرانی از ضرر یا پشیمانی',
  'frame.concern.financial': 'ریسک پول یا منابع',
  'frame.concern.people': 'اثر روی افراد مهم',
  'frame.reversibility.unknown': 'هنوز معلوم نیست چقدر قابل‌برگشت است',
  'frame.reversibility.low': 'کم — برگشت از این تصمیم سخت به نظر می‌رسد',
  'frame.reversibility.high': 'زیاد — می‌شود اول آزمایش کرد و بعد جدی شد',
  'frame.horizon.today': 'امروز',
  'frame.horizon.days': 'روزهای نزدیک',
  'frame.horizon.weeks': 'هفته‌های آینده',
  'frame.horizon.months': 'ماه‌های آینده',
  'frame.horizon.long-term': 'بلندمدت',
  'frame.horizon.unknown': 'هنوز مشخص نیست',

  'score.opportunity':
    'چقدر این موقعیت ارزش دنبال کردن دارد، نسبت به شرایط فعلی.',
  'score.risk': 'چقدر احتمال ضرر، فشار یا پشیمانی در این انتخاب هست.',
  'score.timing.available': 'امتیاز زمان‌بندی بر اساس پنجره‌های در دسترس.',
  'score.timing.provisional':
    'زمان‌بندی تقریبی است — دادهٔ زندهٔ زمان‌بندی نداریم.',
  'score.readiness.withProfile':
    'آمادگی شما با توجه به پروفایل تصمیم‌گیری‌تان.',
  'score.readiness.withoutProfile':
    'بدون پروفایل کامل، آمادگی تقریبی برآورد شده.',
  'score.confidence':
    'چقدر به این خلاصه مطمئنیم — بر اساس وضوح سؤال، پروفایل و زمان‌بندی.',

  'analysis.situation.title': 'وضعیت',
  'analysis.situation.body':
    'موضوع تصمیم‌تان این است: {decision}. تمرکز روی {intent} است و افق زمانی‌اش {horizon}.',
  'analysis.factors.title': 'عوامل اصلی',
  'analysis.factors.body':
    'هدفتان: {objective}. دغدغه‌تان: {concern}. میزان برگشت‌پذیری: {reversibility}.',
  'analysis.opportunities.title': 'فرصت‌ها',
  'analysis.opportunities.body.withOptions':
    'گزینه‌هایی که مطرح شده: {options}. گزینه‌ای را انتخاب کنید که موقع یادگیری هنوز قابل‌برگشت بماند.',
  'analysis.opportunities.body.noOptions':
    'بهترین فرصت همین حالا یک گام کوچک و قابل‌برگشت است که مهم‌ترین ابهام را کم کند.',
  'analysis.risks.title': 'ریسک‌ها',
  'analysis.risks.body':
    'اصلی‌ترین ریسک: {concern}. چیزهایی که هنوز روشن نیست: {unknowns}.',
  'analysis.risks.noneListed': 'مورد خاصی ثبت نشده',
  'analysis.tradeoffs.title': 'بده‌بستان‌ها',
  'analysis.tradeoffs.body':
    'اگر الان اقدام کنید سریع‌تر جلو می‌روید، اما با اطلاعات ناقص ({horizon}). اگر صبر کنید دید بهتری می‌گیرید، ولی ممکن است زمان از دست برود.',
  'analysis.personalFit.title': 'تناسب شخصی',
  'analysis.personalFit.body.withProfile':
    'با سبک {styles}، بهتر است اول یک آزمون کوچک و قابل‌برگشت انجام دهید؛ بعد سراغ تعهدهای جدی بروید.',
  'analysis.personalFit.body.withoutProfile':
    'پروفایل شخصی هنوز کامل نیست — راهنمایی عمومی می‌دهیم. با تکمیل پروفایل، این بخش دقیق‌تر می‌شود.',
  'analysis.whatCouldChange.title': 'چه چیزی توصیه را عوض می‌کند',
  'analysis.whatCouldChange.body.default':
    'اگر مهلت، سقف ضرر، یا گزینه‌های مشخص را بگویید، این راهنمایی خیلی دقیق‌تر می‌شود.',
  'analysis.why.title': 'چرا این توصیه',

  'action.now.writeDecision':
    'در یک جمله بنویسید دقیقاً چه تصمیمی می‌گیرید: «{decision}»',
  'action.now.writeDecision.purpose': 'تصمیم را شفاف کنید',
  'action.now.writeDecision.signal': 'یک جملهٔ روشن از تصمیم نوشته شده',
  'action.now.listFact':
    'یک چیزی را بنویسید که اگر معلوم شود، نظرتان عوض می‌شود',
  'action.now.listFact.purpose': 'مهم‌ترین ابهام را پیدا کنید',
  'action.now.listFact.signal': 'همان حقیقتِ تغییردهندهٔ تصمیم مشخص شد',
  'action.now.identifyIrreversible':
    'مشخص کنید کدام بخش این کار دیگر قابل‌برگشت نیست',
  'action.now.identifyIrreversible.purpose': 'از ضرر بزرگ محافظت کنید',
  'action.now.identifyIrreversible.signal':
    'گام برگشت‌ناپذیر از آزمون‌های کوچک جدا نوشته شد',

  'action.week.scoreOptions':
    'گزینه‌ها ({options}) را از نظر فرصت، ریسک و زمان‌بندی با هم مقایسه کنید',
  'action.week.compareOptions':
    'دو گزینهٔ مشخص را از نظر فرصت، ریسک و زمان‌بندی کنار هم بگذارید',
  'action.week.scoreOptions.purpose': 'انتخاب‌ها را قابل‌مقایسه کنید',
  'action.week.scoreOptions.signal': 'جدول مقایسهٔ گزینه‌ها آماده است',
  'action.week.schedule':
    'گفتگو یا بازبینی مهم را در بهترین زمانی که دارید بگذارید',
  'action.week.schedule.purpose': 'اقدام را با زمان مناسب هم‌راستا کنید',
  'action.week.schedule.signal': 'زمان در تقویم ثبت شد',
  'action.week.addressConcern': 'این نگرانی را جدی بگیرید: {concern}',
  'action.week.addressConcern.purpose': 'ریسک اصلی را کم کنید',
  'action.week.addressConcern.signal': 'یک قدم عملی برای کاهش ریسک برداشته شد',

  'action.month.checkpoint':
    'یک نقطهٔ کنترل بگذارید و ببینید به معیار موفقیت‌تان رسیده‌اید یا نه',
  'action.month.checkpoint.purpose': 'مسیر را چک کنید',
  'action.month.checkpoint.signal': 'یادداشت بازبینی با تاریخ دارید',
  'action.month.increaseCommitment':
    'فقط بعد از موفقیت اولین آزمون کوچک، تعهد را بزرگ‌تر کنید',
  'action.month.increaseCommitment.purpose': 'تعهد جدی را مرحله‌به‌مرحله جلو ببرید',
  'action.month.increaseCommitment.signal':
    'اولین نقطهٔ عطف قبل از تعهد کامل تیک خورده',
  'action.month.archive':
    'بنویسید نسبت به این توصیه چه چیزی عوض شد',
  'action.month.archive.purpose': 'تصمیم‌های بعدی‌تان را بهتر کنید',
  'action.month.archive.signal': 'گزارش تصمیم به‌روز شد',

  'scenario.best.outcome':
    'با یک آزمون کوچک جلو می‌روید و دستتان برای تغییر مسیر باز می‌ماند.',
  'scenario.best.condition1': 'ابهام اصلی کمتر شده',
  'scenario.best.condition2': 'از پنجرهٔ زمانی خوب استفاده شده',
  'scenario.best.signal1': 'مسئول قدم بعدی مشخص است',
  'scenario.best.signal2': 'معیار موفقیت نوشته شده',
  'scenario.best.mitigation': 'اولین قدم را قابل‌برگشت نگه دارید.',
  'scenario.likely.outcome':
    'کمی جلو می‌روید، ولی هنوز حول «{concern}» سبک‌سنگین می‌کنید.',
  'scenario.likely.condition1': 'اطلاعات مخلوط و ناقص',
  'scenario.likely.signal1': 'جواب‌ها دیر می‌رسد',
  'scenario.likely.signal2': 'دامنهٔ کار بزرگ می‌شود',
  'scenario.likely.mitigation': 'برای جمع‌آوری اطلاعات مهلت بگذارید.',
  'scenario.downside.outcome':
    'قبل از دانستن نکات مهم، تعهد جدی می‌دهید و برگشت سخت می‌شود.',
  'scenario.downside.condition1': 'عجله نقاط کنترل را رد می‌کند',
  'scenario.downside.signal1': 'فشار برای رد شدن از بازبینی',
  'scenario.downside.mitigation':
    'آزمون کوچک را از تعهد جدی جدا و مکتوب کنید.',

  'conf.aligned':
    'سیگنال‌ها به‌اندازهٔ کافی هم‌راستا هستند؛ با نقطهٔ کنترل جلو بروید.',
  'conf.staged':
    'قدم‌به‌قدم پیش بروید؛ یک اطلاعات مهم دیگر اطمینان را بالاتر می‌برد.',
  'conf.directional':
    'این را جهت کلی بدانید — قبل از تعهد جدی، همان اطلاعات کم‌بوده را جمع کنید.',
  'conf.limit.comparative':
    'این راهنمایی مقایسه‌ای است، نه پیش‌بینی قطعی.',
  'conf.limit.highStakes':
    'موضوع حساس است — راهنمایی محدود و آموزشی است.',

  'exec.decision': 'تصمیم: {decision}.',
  'exec.recommendation': 'توصیه: {status}.',
  'exec.caution': 'احتیاط: {concern}.',
  'exec.next': 'قدم بعدی: {next}.',

  'status.proceed': 'پیش بروید',
  'status.proceed-with-caution': 'با احتیاط پیش بروید',
  'status.wait': 'کمی صبر کنید',
  'status.gather-more-information': 'اول اطلاعات بیشتری جمع کنید',
  'status.avoid-for-now': 'فعلاً کنار بگذارید',
  'status.neutral': 'خنثی',

  'timing.notApplicable':
    'برای این پرسش، زمان‌بندی خاصی لازم نیست.',
  'timing.unavailable':
    'دادهٔ زمان‌بندی نداریم — پنجرهٔ زمانی ساخته نمی‌شود.',
  'timing.today': 'امروز',
  'timing.next7Days': '۷ روز آینده',
  'timing.next30Days': '۳۰ روز آینده',
  'timing.bestWindow': 'بهترین پنجره',
  'timing.cautionWindow': 'پنجرهٔ احتیاط',
  'timing.rationale':
    'این پنجره‌ها نسبی‌اند و از امتیازهای روزانه گرفته شده‌اند — پیش‌بینی قطعی نیستند.',

  'safety.health':
    'فقط راهنمایی تصمیم است — تشخیص یا درمان پزشکی نیست. برای موضوع پزشکی با متخصص مشورت کنید.',
  'safety.legal':
    'فقط راهنمایی تصمیم است — مشاورهٔ حقوقی نیست. برای نتیجهٔ حقوقی با متخصص مشورت کنید.',
  'safety.investment':
    'فقط راهنمایی تصمیم است — مشاورهٔ سرمایه‌گذاری نیست. هیچ نتیجه‌ای تضمین نمی‌شود.',
  'safety.highStakes':
    'موضوع پرریسک است — این را کمک محدود برای فکر کردن بدانید، نه تضمین.',

  'fallback.recommendation':
    'اول بنویسید چه چیزی برگشت‌ناپذیر است، بعد یک آزمون کوچک طراحی کنید، و همان یک حقیقتی را پیدا کنید که نظرتان را عوض می‌کند.',
  'fallback.providerUnavailable':
    'پاسخ کامل مدل در دسترس نیست ({reason}) — از چارچوب محلی و شفاف استفاده می‌کنیم.',
  'fallback.reason.network': 'شبکه',
  'fallback.reason.timeout': 'اتمام زمان',
  'fallback.reason.parse': 'خواندن پاسخ',
  'fallback.reason.provider': 'سرویس',
  'fallback.reason.unknown': 'نامشخص',
  'fallback.lowConfidence':
    'اطمینان پایین است چون خلاصهٔ گفتگو کامل نشد. وقتی اتصال برگشت، دوباره تلاش کنید.',
  'fallback.limit.structured':
    'این نسخهٔ ساخت‌یافته است — نه بینش کامل شخصی‌سازی‌شده.',
  'fallback.limit.retry': 'برای گرفتن خلاصهٔ کامل‌تر دوباره تلاش کنید.',
  'fallback.followup.irreversible':
    'کدام بخش این تصمیم دیگر قابل‌برگشت نیست؟',
  'fallback.followup.fact': 'کدام یک حقیقت نظرتان را عوض می‌کند؟',
  'fallback.followup.reversible':
    'کوچک‌ترین گام قابل‌برگشت این هفته چیست؟',

  'parse.holdIrreversible':
    'تا وقتی ابهام اصلی کم نشده، سراغ تعهد جدی نروید.',
  'parse.gatherInput':
    'قبل از تصمیم نهایی، یک اطلاعات کلیدی کم دارید — همان را جمع کنید.',
  'parse.advancePilot':
    'با یک آزمون کوچک شروع کنید و از اول معیار موفقیت را روشن کنید.',
  'parse.nextStep': 'قدم قابل‌برگشت بعدی را تعریف کنید',
  'parse.defineNextStep': 'قدم بعدی را روشن کنید',
  'parse.advanceDecision': 'تصمیم را جلو ببرید',
  'parse.stepCompleted': 'قدم انجام شد',
  'parse.relevantNext': 'قدم بعدی مرتبط',
  'parse.open': 'باز کردن',
  'parse.option': 'گزینه',
  'parse.limit.comparative': 'فقط پشتیبانی نسبی تصمیم.',
  'parse.limit.noProfile': 'پروفایل هوش شخصی در دسترس نیست.',
  'parse.limit.noTiming': 'زمان‌بندی زنده در دسترس نیست.',
  'parse.alt.bestFor': 'وقتی این مسیر با خط قرمزهای شما جور است',
  'parse.alt.advantage': 'از یک گزینهٔ واقعی شما استفاده می‌کند',
  'parse.alt.disadvantage': 'هنوز باید چک شود',
  'parse.alt.recommendationFit':
    'قبل از قفل کردن، با نقطهٔ کنترل مقایسه کنید',
  'parse.followup.no':
    'چه چیزی «{decision}» را برایتان رد قطعی می‌کند؟',
  'parse.followup.downside':
    'حداکثر ضرری که قبل از کنار کشیدن می‌پذیرید چیست؟',
  'parse.followup.stakeholder':
    'مخالفت کدام نفر بیشترین اثر را روی نتیجه می‌گذارد؟',
  'parse.followup.checkpoint':
    'اگر این هفته جلو بروید، کدام علامت کوچک نشان می‌دهد مسیر درست است؟',

  'run.untitled': 'تصمیم بدون عنوان',
  'run.continuedAssumptions': 'کاربر با فرض‌های گفته‌شده ادامه داد',
  'run.clarification.recommendation':
    'یک توضیح کوتاه، کیفیت این راهنمایی را بهتر می‌کند.',
  'run.clarification.executiveSummary':
    'قبل از یک توصیهٔ جدی، یک نکته کم است. به پرسش پاسخ دهید یا با فرض‌های گفته‌شده ادامه دهید.',
  'run.clarification.frameSuffix': '{decision} — توضیح: {answer}',
  'analysis.personalFit.styles.available': 'در دسترس',
  'analysis.personalFit.styles.listSep': '، ',
  'analysis.personalFit.styles.listAnd': ' و ',

  'safe.languageFailure':
    'نتوانستیم این خلاصه را به زبان انتخابی شما بدهیم. لطفاً دوباره تلاش کنید.',
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
    'قرارك يدور حول: {decision}. التركيز على {intent} والأفق الزمني {horizon}.',
  'analysis.factors.title': 'العوامل الرئيسية',
  'analysis.factors.body':
    'هدفك: {objective}. قلقك: {concern}. قابلية الرجوع: {reversibility}.',
  'analysis.opportunities.title': 'الفرص',
  'analysis.opportunities.body.withOptions':
    'الخيارات المذكورة: {options}. اختر ما يبقى قابلاً للرجوع أثناء التعلّم.',
  'analysis.opportunities.body.noOptions':
    'أفضل فرصة الآن خطوة صغيرة قابلة للرجوع تقلّل أهم غموض.',
  'analysis.risks.title': 'المخاطر',
  'analysis.risks.body':
    'أهم مخاطرة: {concern}. ما لم يتضح بعد: {unknowns}.',
  'analysis.risks.noneListed': 'لا شيء مدرج',
  'analysis.tradeoffs.title': 'المقايضات',
  'analysis.tradeoffs.body':
    'التصرّف الآن يسرّع التقدم لكن بمعلومات ناقصة ({horizon}). الانتظار يعطي وضوحاً أكثر وقد يكلّفك التوقيت.',
  'analysis.personalFit.title': 'الملاءمة الشخصية',
  'analysis.personalFit.body.withProfile':
    'بأسلوب {styles}، الأفضل أن تبدأ بتجربة صغيرة قابلة للرجوع قبل أي التزام كبير.',
  'analysis.personalFit.body.withoutProfile':
    'الملف الشخصي غير مكتمل — نقدّم إرشاداً عاماً. إكمال الملف يجعل هذا أدق.',
  'analysis.whatCouldChange.title': 'ما الذي قد يغيّر التوصية',
  'analysis.whatCouldChange.body.default':
    'إذا ذكرت موعداً نهائياً أو حدّ خسارة أو خيارات واضحة، تصبح هذه النصيحة أدق بكثير.',
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
    'اكتب أولاً ما لا يمكن الرجوع عنه، ثم صمّم تجربة صغيرة، وابحث عن الحقيقة الواحدة التي تغيّر رأيك.',
  'fallback.providerUnavailable':
    'الملخص الكامل غير متاح ({reason}) — نستخدم إطاراً محلياً واضحاً.',
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
  'parse.gatherInput':
    'قبل القرار النهائي ينقصك معلومة أساسية واحدة — اجمعها أولاً.',
  'parse.advancePilot':
    'ابدأ بتجربة صغيرة وحدد معيار النجاح من البداية.',
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
    'Вы решаете: {decision}. Фокус — {intent}, горизонт — {horizon}.',
  'analysis.factors.title': 'Главные факторы',
  'analysis.factors.body':
    'Цель: {objective}. Опасение: {concern}. Обратимость: {reversibility}.',
  'analysis.opportunities.title': 'Возможности',
  'analysis.opportunities.body.withOptions':
    'Варианты: {options}. Выбирайте тот, что остаётся обратимым, пока вы учитесь.',
  'analysis.opportunities.body.noOptions':
    'Лучшая возможность сейчас — маленький обратимый шаг, который снижает главную неизвестность.',
  'analysis.risks.title': 'Риски',
  'analysis.risks.body':
    'Главный риск: {concern}. Что ещё неясно: {unknowns}.',
  'analysis.risks.noneListed': 'не указаны',
  'analysis.tradeoffs.title': 'Компромиссы',
  'analysis.tradeoffs.body':
    'Действовать сейчас — быстрее, но с неполной информацией ({horizon}). Ждать — яснее, но можно упустить момент.',
  'analysis.personalFit.title': 'Личное соответствие',
  'analysis.personalFit.body.withProfile':
    'При стиле {styles} лучше сначала сделать маленький обратимый пилот, а уже потом брать жёсткие обязательства.',
  'analysis.personalFit.body.withoutProfile':
    'Личный профиль ещё неполный — даём общие ориентиры. Заполнение профиля сделает этот блок точнее.',
  'analysis.whatCouldChange.title': 'Что может изменить рекомендацию',
  'analysis.whatCouldChange.body.default':
    'Если назвать дедлайн, лимит потерь или явные варианты, эта рекомендация станет заметно точнее.',
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
    'Сначала назовите необратимое, затем сделайте маленький пилот и найдите один факт, который изменит ваше мнение.',
  'fallback.providerUnavailable':
    'Полный ответ модели недоступен ({reason}) — используем прозрачный локальный каркас.',
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
    'Перед финальным решением не хватает одного ключевого факта — соберите его.',
  'parse.advancePilot':
    'Начните с маленького пилота и сразу зафиксируйте критерий успеха.',
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
