/**
 * Consumer-facing ASK product copy (EN/FA/AR/RU).
 * Internal Frame/Package/engine terms must never appear here as user chrome.
 */

import type { AppLang } from '@/lib/app-settings';
import type { ConfidenceBand, StrengthBand } from '@/lib/decision-frame/types';

export type AskProductCopy = {
  dir: 'ltr' | 'rtl';
  clarificationEyebrow: string;
  clarificationTitle: string;
  yourDecision: string;
  examinePrompt: string;
  examineEvaluate: string;
  examineCompare: string;
  examineFind: string;
  /** Detector suggestion — never auto-submitted. */
  examineRecommended: string;
  /** Product Launch Compare is registered-off in this release. */
  compareUnavailableForLaunch: string;
  comingSoon: string;
  datePrompt: string;
  dateHint: string;
  dateContinue: string;
  dateMissing: string;
  compareDatesPrompt: string;
  compareDatesHint: string;
  compareOptionLabel: string;
  compareOptionDate: string;
  compareAddOption: string;
  compareRemoveOption: string;
  compareNeedTwo: string;
  compareTooMany: string;
  compareDuplicateDates: string;
  findRangePrompt: string;
  findRangeHint: string;
  findRangeStart: string;
  findRangeEnd: string;
  findRangeMissing: string;
  findRangeInvalid: string;
  findRangeTooShort: string;
  findRangeTooLong: string;
  persistAndEvaluate: string;
  persistAndCompare: string;
  persistAndFind: string;
  evaluating: string;
  comparing: string;
  finding: string;
  unsupportedTitle: string;
  unsupportedBody: string;
  unsupportedBack: string;
  unsupportedTypeTitle: string;
  unsupportedTypeBody: string;
  unsupportedTypeEdit: string;
  unsupportedTypeBack: string;
  compareResultTitle: string;
  compareWinnerLabel: string;
  compareTiedLabel: string;
  compareRelativeWhy: string;
  /** Structured COMPARE why from rank/score/band — not engine prose. */
  compareWhyWinner: (
    winnerLabel: string,
    score: number,
    strengthLabel: string
  ) => string;
  compareWhyTied: (optionLabels: string) => string;
  blockedEyebrow: string;
  blockedTitle: string;
  blockedBody: string;
  blockedRequired: string;
  blockedNatalItem: string;
  blockedNoVerdict: string;
  blockedAddEvidence: string;
  resultRecommendation: string;
  resultWhy: string;
  resultScope: string;
  resultConfidence: string;
  resultScoreOf: (score: number) => string;
  /** Explicit timing-score chrome — not probability. */
  timingScoreLabel: string;
  timingScoreOf: (score: number) => string;
  scoreHonestyNote: string;
  evidenceSupportSection: string;
  evidenceCautionSection: string;
  evidenceContextSection: string;
  importance: Record<'low' | 'medium' | 'high' | 'critical', string>;
  limitsLabel: string;
  nextStepsLabel: string;
  stance: {
    proceed: string;
    proceed_with_conditions: string;
    wait: string;
    prefer_alternate: string;
    no_unique_winner: string;
  };
  findResultTitle: string;
  findHeadlineDominant: string;
  findHeadlineComparable: string;
  findHeadlineNone: string;
  findHonestyDominant: string;
  findHonestyComparable: string;
  findHonestyNone: string;
  findWindowsLabel: string;
  findWindowsEmpty: string;
  findRangeLabel: string;
  findPeakLabel: string;
  /** car-interview FIND presentation (type-specific; generic FIND keys stay for Product Launch). */
  findInterviewResultTitle: string;
  findInterviewHeadlineDominant: string;
  findInterviewHeadlineComparable: string;
  findInterviewHeadlineNone: string;
  findInterviewHonestyDominant: string;
  findInterviewHonestyComparable: string;
  findInterviewHonestyNone: string;
  findInterviewWindowsLabel: string;
  findInterviewWindowsEmpty: string;
  compareRankOf: (rank: number) => string;
  compareOptionsLabel: string;
  blockedTitleCompare: string;
  blockedBodyCompare: string;
  blockedTitleFind: string;
  blockedBodyFind: string;
  agencyLine: string;
  errorGeneric: string;
  loadFrameError: string;
  strength: Record<Exclude<StrengthBand, 'unknown'>, string>;
  confidence: Record<Exclude<ConfidenceBand, 'unknown'>, string>;
  /** Restrained strength→label only — never invents domain claims. */
  meaningByStrength: Record<Exclude<StrengthBand, 'unknown'>, string>;
  /** Generic timing scope when decision type has no domain-specific Package limit. */
  scopeTimingGeneric: string;
  /** car-interview only — mirrors Runtime-1 negotiation-timing contract. */
  scopeInterviewTiming: string;
  evidenceSupportive: string;
  evidenceCaution: string;
  evidenceNeutral: string;
  topicCarInterview: string;
  topicInvestorMeeting: string;
  topicWeddingDate: string;
  topicProductLaunch: string;
  topicGeneric: string;
  intakeEyebrow: string;
  intakeEyebrowProductLaunch: string;
  intakeTitle: string;
  intakeBody: string;
  intakeTitleInvestorMeeting: string;
  intakeBodyInvestorMeeting: string;
  intakeTitleWeddingDate: string;
  intakeBodyWeddingDate: string;
  intakeTitleProductLaunch: string;
  intakeBodyProductLaunch: string;
  /** FIND intake body — range scan, not single-date evaluate. */
  intakeBodyProductLaunchFind: string;
  intakeOptional: string;
  intakeSelect: string;
  intakeSave: string;
  intakeComplete: string;
  /** FIND CTA — must not say “evaluation” / single date. */
  intakeCompleteFind: string;
  intakeRequiredFilled: string;
  intakeRequiredRemaining: (fields: string) => string;
  /** Shown under a prefilled date understood from Ask/Frame. */
  intakeKnownFromAsk: string;
  /** Honest fallback when factor_key has no localized catalog entry. */
  evidenceDetailUnavailable: string;
  intakeFieldTargetDate: string;
  intakeFieldRole: string;
  intakeFieldCompany: string;
  intakeFieldInterviewType: string;
  intakeFieldMeetingDate: string;
  intakeFieldMeetingGoal: string;
  intakeFieldInvestorName: string;
  intakeFieldMeetingType: string;
  intakeFieldWeddingDate: string;
  intakeFieldCeremonyType: string;
  intakeFieldPartnerName: string;
  intakeFieldVenue: string;
  intakeFieldLaunchDate: string;
  intakeFieldLaunchObject: string;
  intakeFieldLaunchChannel: string;
  intakeFieldBrandOrCompany: string;
  intakeUnsupportedType: string;
  intakeLoadError: string;
  intakeSaveError: string;
  intakeCompleteError: string;
  backToAsk: string;
  /** Evaluate disabled when Decision Type has no production runtime. */
  evaluateUnavailableForType: string;
  capabilityTitle: string;
  capabilityBody: string;
  capabilitySecondary: string;
  capabilityBack: string;
  capabilityEdit: string;
  apiErrors: {
    UNSUPPORTED_DECISION_TYPE: string;
    OPERATION_NOT_IMPLEMENTED: string;
    FRAMING_REQUIRED: string;
    FRAMING_UNRESOLVED: string;
    INTAKE_INCOMPLETE: string;
    VERSION_CONFLICT: string;
    PROVIDER_FAILURE: string;
    CASE_NOT_FOUND: string;
    UNKNOWN_DECISION_TYPE: string;
    ENTRY_MODE_UNAVAILABLE: string;
    VALIDATION_ERROR: string;
    ILLEGAL_TRANSITION: string;
  };
};

const EN: AskProductCopy = {
  dir: 'ltr',
  clarificationEyebrow: 'Clarify your decision',
  clarificationTitle: 'A few details before we evaluate',
  yourDecision: 'Your decision',
  examinePrompt: 'What would you like to examine?',
  examineEvaluate: 'Evaluate one date',
  examineCompare: 'Compare specific dates',
  examineFind: 'Find stronger timing windows',
  examineRecommended: 'Recommended',
  compareUnavailableForLaunch:
    'Comparing specific dates for a launch is not available in this version.',
  comingSoon: 'Coming soon',
  datePrompt: 'Which date should we evaluate?',
  dateHint: 'Enter an explicit calendar date. METIORO never assumes today.',
  dateContinue: 'Continue',
  dateMissing: 'Please enter a date.',
  compareDatesPrompt: 'Which dates should we compare?',
  compareDatesHint:
    'Add 2 to 5 labeled candidate dates. METIORO never assumes today.',
  compareOptionLabel: 'Label',
  compareOptionDate: 'Date',
  compareAddOption: 'Add another date',
  compareRemoveOption: 'Remove',
  compareNeedTwo: 'Enter at least two different dates.',
  compareTooMany: 'Enter at most five candidate dates.',
  compareDuplicateDates: 'Each candidate needs a unique date.',
  findRangePrompt: 'What date range should we scan?',
  findRangeHint:
    'Enter an inclusive start and end of 7 to 90 days. METIORO never assumes today or invents a single best date.',
  findRangeStart: 'Start',
  findRangeEnd: 'End',
  findRangeMissing: 'Please enter both start and end dates.',
  findRangeInvalid: 'End date must be after the start date.',
  findRangeTooShort: 'Choose a range of at least 7 inclusive days.',
  findRangeTooLong: 'Choose a range of at most 90 inclusive days.',
  persistAndEvaluate: 'Evaluate this date',
  persistAndCompare: 'Compare these dates',
  persistAndFind: 'Find stronger timing windows',
  evaluating: 'Evaluating timing…',
  comparing: 'Comparing dates…',
  finding: 'Scanning timing windows…',
  unsupportedTitle: 'This analysis is not available yet',
  unsupportedBody:
    'Finding timing windows is not available for this decision yet. You can evaluate one date or compare a few candidates when offered.',
  unsupportedBack: 'Choose a different option',
  unsupportedTypeTitle:
    'This decision type is not yet supported for timing analysis',
  unsupportedTypeBody:
    'Your decision was not saved, and METIORO cannot produce a reliable evaluation for this topic.',
  unsupportedTypeEdit: 'Edit decision',
  unsupportedTypeBack: 'Back to Ask',
  compareResultTitle: 'Date comparison',
  compareWinnerLabel: 'Preferred date',
  compareTiedLabel: 'No unique winner',
  compareRelativeWhy: 'Why this ranking',
  compareWhyWinner: (winnerLabel, score, strengthLabel) =>
    `${winnerLabel} ranks first with timing score ${Math.round(score)} / 100 (${strengthLabel}).`,
  compareWhyTied: (optionLabels) =>
    `These dates are comparable on timing (${optionLabels}) — no unique preferred date is claimed.`,
  blockedEyebrow: 'More information needed',
  blockedTitle: 'More information is needed before METIORO can evaluate this date.',
  blockedBody: 'Birth evidence is required for timing evaluation.',
  blockedRequired: 'Required to continue',
  blockedNatalItem: 'Add birth date, birth time, and birth place',
  blockedNoVerdict:
    'No timing recommendation was produced. This is not a Favorable, Mixed, or Unfavorable verdict.',
  blockedAddEvidence: 'Add birth evidence and re-evaluate',
  resultRecommendation: 'Recommendation',
  resultWhy: 'Why',
  resultScope: 'Important limit',
  resultConfidence: 'Confidence',
  resultScoreOf: (score) => `${Math.round(score)} / 100`,
  timingScoreLabel: 'Timing score',
  timingScoreOf: (score) => `Timing score: ${Math.round(score)} / 100`,
  scoreHonestyNote:
    'This timing score reflects relative timing conditions — not probability, certainty, or a guaranteed outcome.',
  evidenceSupportSection: 'Supporting evidence',
  evidenceCautionSection: 'Watch-outs',
  evidenceContextSection: 'Additional context',
  importance: {
    low: 'lower weight',
    medium: 'moderate weight',
    high: 'higher weight',
    critical: 'critical weight',
  },
  limitsLabel: 'Limits',
  nextStepsLabel: 'Suggested next steps',
  stance: {
    proceed: 'Timing conditions support moving forward on this date.',
    proceed_with_conditions:
      'Timing conditions are workable if preparation and constraints are handled.',
    wait: 'Timing conditions suggest waiting if the date can still change.',
    prefer_alternate: 'Timing conditions favor considering another date.',
    no_unique_winner: 'No uniquely preferred date emerges from this comparison.',
  },
  findResultTitle: 'Timing windows',
  findHeadlineDominant: 'Stronger timing window',
  findHeadlineComparable: 'Comparable windows',
  findHeadlineNone: 'No strong window in range',
  findHonestyDominant:
    'One stronger timing window stands out inside the scanned range.',
  findHonestyComparable:
    'These are comparable windows — no clearly dominant window is claimed.',
  findHonestyNone:
    'No sufficiently strong timing window was found in the scanned range.',
  findWindowsLabel: 'Windows that deserve attention',
  findWindowsEmpty: 'No strong window in range',
  findRangeLabel: 'Scanned range',
  findPeakLabel: 'Peak',
  findInterviewResultTitle: 'Interview timing windows',
  findInterviewHeadlineDominant: 'Strongest interview window',
  findInterviewHeadlineComparable: 'Comparable interview windows',
  findInterviewHeadlineNone: 'No strong interview window in range',
  findInterviewHonestyDominant:
    'These windows show relatively stronger communication and visibility timing within the supplied interview-date range.',
  findInterviewHonestyComparable:
    'These interview windows are comparable on communication and visibility timing — no clearly dominant window is claimed.',
  findInterviewHonestyNone:
    'No sufficiently strong interview communication/visibility window was found in the scanned range.',
  findInterviewWindowsLabel: 'Interview windows that deserve attention',
  findInterviewWindowsEmpty: 'No strong interview window in range',
  compareRankOf: (rank) => `Rank ${rank}`,
  compareOptionsLabel: 'Compared dates',
  blockedTitleCompare:
    'More information is needed before METIORO can compare these dates.',
  blockedBodyCompare: 'Birth evidence is required for timing comparison.',
  blockedTitleFind:
    'More information is needed before METIORO can scan for timing windows.',
  blockedBodyFind: 'Birth evidence is required for a timing-window scan.',
  agencyLine: 'METIORO never decides. The human always decides.',
  errorGeneric: 'Something went wrong. Please try again.',
  loadFrameError: 'Unable to load this decision. Return to Ask and try again.',
  strength: {
    strong: 'Highly favorable',
    favorable: 'Favorable',
    mixed: 'Mixed',
    unfavorable: 'Unfavorable',
  },
  confidence: {
    high: 'High',
    'medium-high': 'Medium-high',
    medium: 'Medium',
    low: 'Low',
  },
  meaningByStrength: {
    strong: 'Timing signal is strongly supportive.',
    favorable: 'Timing signal is supportive.',
    mixed: 'Timing signal is mixed.',
    unfavorable: 'Timing signal is challenging.',
  },
  scopeTimingGeneric:
    'This analysis covers timing for the requested date only. It does not assess outcomes beyond that timing question.',
  scopeInterviewTiming:
    'This analysis covers interview negotiation and communication timing for the requested date. It does not assess employer fit, role fit, salary, or interview outcome.',
  evidenceSupportive: 'Supportive timing signal',
  evidenceCaution: 'Cautionary timing signal',
  evidenceNeutral: 'Timing signal',
  topicCarInterview: 'Attend job interview',
  topicInvestorMeeting: 'Meet an investor',
  topicWeddingDate: 'Choose wedding date',
  topicProductLaunch: 'Launch a project or product',
  topicGeneric: 'Your decision',
  intakeEyebrow: 'Interview timing',
  intakeEyebrowProductLaunch: 'Launch timing',
  intakeTitle: 'Attend job interview',
  intakeBody:
    'Share the interview details. We’ll evaluate the timing for the date you provide.',
  intakeTitleInvestorMeeting: 'Meet an investor',
  intakeBodyInvestorMeeting:
    'Share the meeting details. We’ll evaluate the timing for the date you provide.',
  intakeTitleWeddingDate: 'Choose wedding date',
  intakeBodyWeddingDate:
    'Share the ceremony details. We’ll evaluate the timing for the date you provide.',
  intakeTitleProductLaunch: 'Launch a project or product',
  intakeBodyProductLaunch:
    'Share what you are launching. We’ll evaluate launch-day timing for the date you provide — not market fit, revenue, or business success.',
  intakeBodyProductLaunchFind:
    'Share what you are launching. We’ll scan the selected range for stronger timing windows within this range — not market fit, revenue, or business success.',
  intakeOptional: 'optional',
  intakeSelect: 'Select…',
  intakeSave: 'Save answers',
  intakeComplete: 'Continue to evaluation',
  intakeCompleteFind: 'Continue to find timing windows',
  intakeRequiredFilled: 'Required details are ready.',
  intakeRequiredRemaining: (fields) => `Still needed: ${fields}`,
  intakeKnownFromAsk: 'Understood from your question',
  evidenceDetailUnavailable:
    'Evidence detail is not available in this language yet.',
  intakeFieldTargetDate: 'Interview date',
  intakeFieldRole: 'Role',
  intakeFieldCompany: 'Company',
  intakeFieldInterviewType: 'Interview type',
  intakeFieldMeetingDate: 'Meeting date',
  intakeFieldMeetingGoal: 'Meeting goal',
  intakeFieldInvestorName: 'Investor name',
  intakeFieldMeetingType: 'Meeting type',
  intakeFieldWeddingDate: 'Wedding date',
  intakeFieldCeremonyType: 'Ceremony type',
  intakeFieldPartnerName: 'Partner name',
  intakeFieldVenue: 'Venue',
  intakeFieldLaunchDate: 'Launch date',
  intakeFieldLaunchObject: 'What launches',
  intakeFieldLaunchChannel: 'Launch channel',
  intakeFieldBrandOrCompany: 'Brand or company',
  intakeUnsupportedType: 'This decision type is not available for intake yet.',
  intakeLoadError: 'Unable to load this decision.',
  intakeSaveError: 'Could not save answers.',
  intakeCompleteError: 'Unable to continue.',
  backToAsk: 'Back to Ask',
  evaluateUnavailableForType:
    'Not available for this decision type yet',
  capabilityTitle: 'Timing analysis is not available for this decision yet',
  capabilityBody:
    'This kind of decision is not enabled for timing evaluation in this release.',
  capabilitySecondary:
    'Your decision is kept, but METIORO cannot produce a reliable evaluation for it yet.',
  capabilityBack: 'Back',
  capabilityEdit: 'Edit decision',
  apiErrors: {
    UNSUPPORTED_DECISION_TYPE:
      'Timing analysis is not available for this decision yet.',
    OPERATION_NOT_IMPLEMENTED:
      'That analysis option is not available in this release.',
    FRAMING_REQUIRED: 'A few more details are needed before evaluation.',
    FRAMING_UNRESOLVED: 'Please clarify what you want to examine first.',
    INTAKE_INCOMPLETE: 'Please complete the required details to continue.',
    VERSION_CONFLICT: 'This decision was updated elsewhere. Please reload.',
    PROVIDER_FAILURE: 'Timing analysis is temporarily unavailable. Try again.',
    CASE_NOT_FOUND: 'This decision could not be found.',
    UNKNOWN_DECISION_TYPE:
      'Timing analysis is not available for this decision yet.',
    ENTRY_MODE_UNAVAILABLE: 'This way of starting the decision is unavailable.',
    VALIDATION_ERROR: 'Some details could not be accepted. Please check and try again.',
    ILLEGAL_TRANSITION: 'This step is not available right now.',
  },
};

const FA: AskProductCopy = {
  dir: 'rtl',
  clarificationEyebrow: 'شفاف‌سازی تصمیم',
  clarificationTitle: 'چند جزئیات قبل از ارزیابی',
  yourDecision: 'تصمیم شما',
  examinePrompt: 'چه چیزی را می‌خواهید بررسی کنیم؟',
  examineEvaluate: 'ارزیابی یک تاریخ',
  examineCompare: 'مقایسه چند تاریخ مشخص',
  examineFind: 'یافتن پنجره‌های زمانی قوی‌تر',
  examineRecommended: 'پیشنهادی',
  compareUnavailableForLaunch:
    'مقایسه تاریخ‌های مشخص برای لانچ در این نسخه فعال نیست.',
  comingSoon: 'به‌زودی',
  datePrompt: 'کدام تاریخ را ارزیابی کنیم؟',
  dateHint: 'یک تاریخ مشخص وارد کنید. METIORO هرگز «امروز» را فرض نمی‌کند.',
  dateContinue: 'ادامه',
  dateMissing: 'لطفاً یک تاریخ وارد کنید.',
  compareDatesPrompt: 'کدام تاریخ‌ها را مقایسه کنیم؟',
  compareDatesHint:
    '۲ تا ۵ تاریخ با برچسب اضافه کنید. METIORO هرگز «امروز» را فرض نمی‌کند.',
  compareOptionLabel: 'برچسب',
  compareOptionDate: 'تاریخ',
  compareAddOption: 'افزودن تاریخ دیگر',
  compareRemoveOption: 'حذف',
  compareNeedTwo: 'حداقل دو تاریخ متفاوت وارد کنید.',
  compareTooMany: 'حداکثر پنج تاریخ نامزد وارد کنید.',
  compareDuplicateDates: 'هر گزینه باید تاریخ یکتا داشته باشد.',
  findRangePrompt: 'کدام بازهٔ زمانی را جستجو کنیم؟',
  findRangeHint:
    'شروع و پایانِ ۷ تا ۹۰ روزه را وارد کنید. METIORO هرگز «امروز» یا یک تاریخ برتر ساختگی فرض نمی‌کند.',
  findRangeStart: 'شروع',
  findRangeEnd: 'پایان',
  findRangeMissing: 'لطفاً هر دو تاریخ شروع و پایان را وارد کنید.',
  findRangeInvalid: 'تاریخ پایان باید بعد از تاریخ شروع باشد.',
  findRangeTooShort: 'بازه باید حداقل ۷ روز شامل ابتدا و انتها باشد.',
  findRangeTooLong: 'بازه باید حداکثر ۹۰ روز شامل ابتدا و انتها باشد.',
  persistAndEvaluate: 'ارزیابی این تاریخ',
  persistAndCompare: 'مقایسه این تاریخ‌ها',
  persistAndFind: 'یافتن پنجره‌های زمان‌بندی قوی‌تر',
  evaluating: 'در حال ارزیابی زمان‌بندی…',
  comparing: 'در حال مقایسه تاریخ‌ها…',
  finding: 'در حال اسکن پنجره‌های زمان‌بندی…',
  unsupportedTitle: 'این تحلیل هنوز در دسترس نیست',
  unsupportedBody:
    'یافتن پنجره‌های زمان‌بندی برای این تصمیم هنوز فعال نیست. می‌توانید یک تاریخ را ارزیابی کنید یا چند گزینه را مقایسه کنید وقتی پیشنهاد می‌شود.',
  unsupportedBack: 'انتخاب گزینه دیگر',
  unsupportedTypeTitle:
    'این نوع تصمیم هنوز برای تحلیل زمان‌بندی پشتیبانی نمی‌شود',
  unsupportedTypeBody:
    'تصمیم شما ذخیره نشده و METIORO برای این موضوع ارزیابی قابل‌اتکا تولید نمی‌کند.',
  unsupportedTypeEdit: 'ویرایش تصمیم',
  unsupportedTypeBack: 'بازگشت به طرح پرسش',
  compareResultTitle: 'مقایسه تاریخ',
  compareWinnerLabel: 'تاریخ ترجیحی',
  compareTiedLabel: 'برنده یکتا نیست',
  compareRelativeWhy: 'دلیل این رتبه‌بندی',
  compareWhyWinner: (winnerLabel, score, strengthLabel) =>
    `${winnerLabel} با امتیاز زمان‌بندی ${Math.round(score)} / ۱۰۰ (${strengthLabel}) در رتبهٔ اول است.`,
  compareWhyTied: (optionLabels) =>
    `این تاریخ‌ها از نظر زمان‌بندی قابل‌مقایسه‌اند (${optionLabels}) — تاریخ ترجیحی یکتا ادعا نمی‌شود.`,
  blockedEyebrow: 'اطلاعات بیشتری لازم است',
  blockedTitle: 'قبل از ارزیابی این تاریخ، اطلاعات بیشتری لازم است.',
  blockedBody: 'برای ارزیابی زمان‌بندی، شواهد تولد لازم است.',
  blockedRequired: 'برای ادامه لازم است',
  blockedNatalItem: 'تاریخ، ساعت و محل تولد را اضافه کنید',
  blockedNoVerdict:
    'هیچ توصیهٔ زمان‌بندی‌ای تولید نشد. این یک نتیجهٔ مساعد / مختلط / نامساعد نیست.',
  blockedAddEvidence: 'افزودن شواهد تولد و ارزیابی دوباره',
  resultRecommendation: 'توصیه',
  resultWhy: 'چرا؟',
  resultScope: 'محدودیت مهم',
  resultConfidence: 'اعتماد تحلیل',
  resultScoreOf: (score) => `${String(Math.round(score)).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])} / ۱۰۰`,
  timingScoreLabel: 'امتیاز زمان‌بندی',
  timingScoreOf: (score) =>
    `امتیاز زمان‌بندی: ${String(Math.round(score)).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])} / ۱۰۰`,
  scoreHonestyNote:
    'این امتیاز کیفیت نسبی شرایط زمان‌بندی را نشان می‌دهد — نه احتمال، قطعیت یا نتیجهٔ تضمینی.',
  evidenceSupportSection: 'شواهد حمایت‌کننده',
  evidenceCautionSection: 'نکات احتیاطی',
  evidenceContextSection: 'زمینهٔ تکمیلی',
  importance: {
    low: 'وزن کمتر',
    medium: 'وزن متوسط',
    high: 'وزن بیشتر',
    critical: 'وزن حیاتی',
  },
  limitsLabel: 'محدودیت‌ها',
  nextStepsLabel: 'گام‌های پیشنهادی بعدی',
  stance: {
    proceed: 'شرایط زمان‌بندی از پیش رفتن در این تاریخ پشتیبانی می‌کند.',
    proceed_with_conditions:
      'شرایط زمان‌بندی قابل‌قبول است اگر آمادگی و محدودیت‌ها مدیریت شوند.',
    wait: 'اگر تاریخ هنوز قابل تغییر است، شرایط زمان‌بندی انتظار را پیشنهاد می‌کند.',
    prefer_alternate: 'شرایط زمان‌بندی بررسی تاریخ دیگری را ترجیح می‌دهد.',
    no_unique_winner: 'از این مقایسه تاریخ منحصربه‌فردی به‌عنوان ترجیح بیرون نمی‌آید.',
  },
  findResultTitle: 'پنجره‌های زمان‌بندی',
  findHeadlineDominant: 'پنجرهٔ زمان‌بندی قوی‌تر',
  findHeadlineComparable: 'پنجره‌های قابل‌مقایسه',
  findHeadlineNone: 'پنجرهٔ قوی در این بازه یافت نشد',
  findHonestyDominant:
    'یک پنجرهٔ زمان‌بندی قوی‌تر در بازهٔ اسکن‌شده برجسته است.',
  findHonestyComparable:
    'این‌ها پنجره‌های قابل‌مقایسه‌اند — پنجرهٔ مسلط ادعا نمی‌شود.',
  findHonestyNone:
    'در بازهٔ اسکن‌شده پنجرهٔ زمان‌بندی به‌قدر کافی قوی یافت نشد.',
  findInterviewResultTitle: 'پنجره‌های زمان‌بندی مصاحبه',
  findInterviewHeadlineDominant: 'قوی‌ترین پنجرهٔ مصاحبه',
  findInterviewHeadlineComparable: 'پنجره‌های مصاحبهٔ قابل‌مقایسه',
  findInterviewHeadlineNone: 'پنجرهٔ مصاحبهٔ قوی در این بازه یافت نشد',
  findInterviewHonestyDominant:
    'این پنجره‌ها زمان‌بندی نسبتاً قوی‌تر ارتباط و دیده‌شدن را در بازهٔ مصاحبهٔ داده‌شده نشان می‌دهند.',
  findInterviewHonestyComparable:
    'این پنجره‌های مصاحبه از نظر زمان‌بندی ارتباط و دیده‌شدن قابل‌مقایسه‌اند — پنجرهٔ مسلط ادعا نمی‌شود.',
  findInterviewHonestyNone:
    'در بازهٔ اسکن‌شده پنجرهٔ ارتباط/دیده‌شدن مصاحبه به‌قدر کافی قوی یافت نشد.',
  findInterviewWindowsLabel: 'پنجره‌های مصاحبهٔ شایان توجه',
  findInterviewWindowsEmpty: 'پنجرهٔ مصاحبهٔ قوی در این بازه یافت نشد',
  findWindowsLabel: 'پنجره‌هایی که ارزش توجه دارند',
  findWindowsEmpty: 'پنجرهٔ قوی در این بازه نیست',
  findRangeLabel: 'بازهٔ اسکن‌شده',
  findPeakLabel: 'اوج',
  compareRankOf: (rank) =>
    `رتبه ${String(rank).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])}`,
  compareOptionsLabel: 'تاریخ‌های مقایسه‌شده',
  blockedTitleCompare:
    'قبل از مقایسهٔ این تاریخ‌ها، اطلاعات بیشتری لازم است.',
  blockedBodyCompare: 'برای مقایسهٔ زمان‌بندی، شواهد تولد لازم است.',
  blockedTitleFind:
    'قبل از اسکن پنجره‌های زمان‌بندی، اطلاعات بیشتری لازم است.',
  blockedBodyFind: 'برای اسکن پنجره‌های زمان‌بندی، شواهد تولد لازم است.',
  agencyLine: 'METIORO هرگز تصمیم نمی‌گیرد. تصمیم همیشه با انسان است.',
  errorGeneric: 'مشکلی پیش آمد. دوباره تلاش کنید.',
  loadFrameError: 'بارگذاری این تصمیم ممکن نشد. به ASK برگردید.',
  strength: {
    strong: 'بسیار مناسب',
    favorable: 'مناسب',
    mixed: 'مختلط',
    unfavorable: 'نامساعد',
  },
  confidence: {
    high: 'بالا',
    'medium-high': 'نسبتاً بالا',
    medium: 'متوسط',
    low: 'پایین',
  },
  meaningByStrength: {
    strong: 'شرایط زمان‌بندی در این تاریخ به‌طور چشمگیر حمایت‌کننده‌اند.',
    favorable: 'شرایط زمان‌بندی در این تاریخ حمایت‌کننده‌اند.',
    mixed: 'شرایط زمان‌بندی در این تاریخ آمیخته‌اند.',
    unfavorable: 'شرایط زمان‌بندی در این تاریخ دشوارترند.',
  },
  scopeTimingGeneric:
    'این تحلیل فقط زمان‌بندی تاریخ درخواست‌شده را پوشش می‌دهد و فراتر از آن نتیجه‌ای را ارزیابی نمی‌کند.',
  scopeInterviewTiming:
    'این تحلیل زمان‌بندی مذاکره و ارتباط مصاحبه را برای تاریخ درخواست‌شده بررسی می‌کند. تناسب کارفرما، نقش، حقوق یا نتیجهٔ مصاحبه را ارزیابی نمی‌کند.',
  evidenceSupportive: 'عامل حمایت‌کننده',
  evidenceCaution: 'عامل احتیاطی',
  evidenceNeutral: 'عامل زمینه',
  topicCarInterview: 'مصاحبه کاری',
  topicInvestorMeeting: 'جلسه با سرمایه‌گذار',
  topicWeddingDate: 'انتخاب تاریخ عروسی',
  topicProductLaunch: 'لانچ پروژه یا محصول',
  topicGeneric: 'تصمیم شما',
  intakeEyebrow: 'زمان‌بندی مصاحبه',
  intakeEyebrowProductLaunch: 'زمان‌بندی لانچ',
  intakeTitle: 'مصاحبه کاری',
  intakeBody:
    'جزئیات مصاحبه را وارد کنید. زمان‌بندی را برای تاریخی که می‌دهید ارزیابی می‌کنیم.',
  intakeTitleInvestorMeeting: 'جلسه با سرمایه‌گذار',
  intakeBodyInvestorMeeting:
    'جزئیات جلسه را وارد کنید. زمان‌بندی را برای تاریخی که می‌دهید ارزیابی می‌کنیم.',
  intakeTitleWeddingDate: 'انتخاب تاریخ عروسی',
  intakeBodyWeddingDate:
    'جزئیات مراسم را وارد کنید. زمان‌بندی را برای تاریخی که می‌دهید ارزیابی می‌کنیم.',
  intakeTitleProductLaunch: 'لانچ پروژه یا محصول',
  intakeBodyProductLaunch:
    'آنچه لانچ می‌کنید را مشخص کنید. فقط زمان‌بندی روز لانچ را ارزیابی می‌کنیم — نه تناسب بازار، درآمد یا موفقیت کسب‌وکار.',
  intakeBodyProductLaunchFind:
    'آنچه لانچ می‌کنید را مشخص کنید. بازهٔ انتخاب‌شده را برای یافتن پنجره‌های زمان‌بندی قوی‌تر در همین بازه اسکن می‌کنیم — نه تناسب بازار، درآمد یا موفقیت کسب‌وکار.',
  intakeOptional: 'اختیاری',
  intakeSelect: 'انتخاب…',
  intakeSave: 'ذخیره پاسخ‌ها',
  intakeComplete: 'ادامه به ارزیابی',
  intakeCompleteFind: 'ادامه برای یافتن پنجره‌های زمان‌بندی',
  intakeRequiredFilled: 'اطلاعات لازم آماده است.',
  intakeRequiredRemaining: (fields) => `هنوز لازم است: ${fields}`,
  intakeKnownFromAsk: 'از پرسش شما فهمیده شد',
  evidenceDetailUnavailable:
    'جزئیات این عامل در این زبان هنوز در دسترس نیست.',
  intakeFieldTargetDate: 'تاریخ مصاحبه',
  intakeFieldRole: 'نقش',
  intakeFieldCompany: 'شرکت',
  intakeFieldInterviewType: 'نوع مصاحبه',
  intakeFieldMeetingDate: 'تاریخ جلسه',
  intakeFieldMeetingGoal: 'هدف جلسه',
  intakeFieldInvestorName: 'نام سرمایه‌گذار',
  intakeFieldMeetingType: 'نوع جلسه',
  intakeFieldWeddingDate: 'تاریخ عروسی',
  intakeFieldCeremonyType: 'نوع مراسم',
  intakeFieldPartnerName: 'نام شریک',
  intakeFieldVenue: 'محل برگزاری',
  intakeFieldLaunchDate: 'تاریخ لانچ',
  intakeFieldLaunchObject: 'چه چیزی لانچ می‌شود',
  intakeFieldLaunchChannel: 'کانال لانچ',
  intakeFieldBrandOrCompany: 'برند یا شرکت',
  intakeUnsupportedType: 'این نوع تصمیم هنوز برای ورود جزئیات در دسترس نیست.',
  intakeLoadError: 'بارگذاری این تصمیم ممکن نشد.',
  intakeSaveError: 'ذخیره پاسخ‌ها ممکن نشد.',
  intakeCompleteError: 'ادامه ممکن نیست.',
  backToAsk: 'بازگشت به ASK',
  evaluateUnavailableForType: 'برای این نوع تصمیم هنوز در دسترس نیست',
  capabilityTitle: 'این نوع تصمیم هنوز برای تحلیل زمان‌بندی فعال نشده است.',
  capabilityBody:
    'این نوع تصمیم هنوز برای تحلیل زمان‌بندی فعال نشده است.',
  capabilitySecondary:
    'تصمیم شما ذخیره می‌شود، اما METIORO هنوز نمی‌تواند برای آن ارزیابی قابل اتکا تولید کند.',
  capabilityBack: 'بازگشت',
  capabilityEdit: 'ویرایش تصمیم',
  apiErrors: {
    UNSUPPORTED_DECISION_TYPE:
      'این نوع تصمیم هنوز برای تحلیل زمان‌بندی فعال نشده است.',
    OPERATION_NOT_IMPLEMENTED:
      'این گزینهٔ تحلیل در این نسخه در دسترس نیست.',
    FRAMING_REQUIRED: 'قبل از ارزیابی، چند جزئیات دیگر لازم است.',
    FRAMING_UNRESOLVED: 'لطفاً ابتدا مشخص کنید چه چیزی را بررسی کنیم.',
    INTAKE_INCOMPLETE: 'برای ادامه، جزئیات لازم را کامل کنید.',
    VERSION_CONFLICT: 'این تصمیم جای دیگری به‌روز شده. لطفاً دوباره بارگذاری کنید.',
    PROVIDER_FAILURE: 'تحلیل زمان‌بندی موقتاً در دسترس نیست. دوباره تلاش کنید.',
    CASE_NOT_FOUND: 'این تصمیم پیدا نشد.',
    UNKNOWN_DECISION_TYPE:
      'این نوع تصمیم هنوز برای تحلیل زمان‌بندی فعال نشده است.',
    ENTRY_MODE_UNAVAILABLE: 'این روش شروع تصمیم در دسترس نیست.',
    VALIDATION_ERROR: 'برخی جزئیات پذیرفته نشد. بررسی کنید و دوباره تلاش کنید.',
    ILLEGAL_TRANSITION: 'این مرحله اکنون در دسترس نیست.',
  },
};

const AR: AskProductCopy = {
  dir: 'rtl',
  clarificationEyebrow: 'توضيح القرار',
  clarificationTitle: 'بعض التفاصيل قبل التقييم',
  yourDecision: 'قرارك',
  examinePrompt: 'ماذا تريد أن نفحص؟',
  examineEvaluate: 'تقييم تاريخ واحد',
  examineCompare: 'مقارنة تواريخ محددة',
  examineFind: 'إيجاد نوافذ زمنية أقوى',
  examineRecommended: 'موصى به',
  compareUnavailableForLaunch:
    'مقارنة تواريخ محددة للإطلاق غير متاحة في هذا الإصدار.',
  comingSoon: 'قريباً',
  datePrompt: 'أي تاريخ نقيّم؟',
  dateHint: 'أدخل تاريخاً صريحاً. لا تفترض METIORO «اليوم».',
  dateContinue: 'متابعة',
  dateMissing: 'يرجى إدخال تاريخ.',
  compareDatesPrompt: 'أي تواريخ نقارن؟',
  compareDatesHint:
    'أضف من تاريخين إلى خمسة بتسميات. لا تفترض METIORO «اليوم».',
  compareOptionLabel: 'التسمية',
  compareOptionDate: 'التاريخ',
  compareAddOption: 'إضافة تاريخ آخر',
  compareRemoveOption: 'إزالة',
  compareNeedTwo: 'أدخل تاريخين مختلفين على الأقل.',
  compareTooMany: 'أدخل خمسة تواريخ مرشحة كحد أقصى.',
  compareDuplicateDates: 'يجب أن يكون لكل خيار تاريخ فريد.',
  findRangePrompt: 'ما النطاق الزمني الذي نمسحه؟',
  findRangeHint:
    'أدخل بداية ونهاية شاملتين من 7 إلى 90 يوماً. لا تفترض METIORO «اليوم» ولا تختلق تاريخاً أفضل وحيداً.',
  findRangeStart: 'البداية',
  findRangeEnd: 'النهاية',
  findRangeMissing: 'يرجى إدخال تاريخي البداية والنهاية.',
  findRangeInvalid: 'يجب أن يكون تاريخ النهاية بعد تاريخ البداية.',
  findRangeTooShort: 'اختر نطاقاً لا يقل عن 7 أيام شاملة.',
  findRangeTooLong: 'اختر نطاقاً لا يزيد عن 90 يوماً شاملاً.',
  persistAndEvaluate: 'تقييم هذا التاريخ',
  persistAndCompare: 'مقارنة هذه التواريخ',
  persistAndFind: 'البحث عن نوافذ توقيت أقوى',
  evaluating: 'جارٍ تقييم التوقيت…',
  comparing: 'جارٍ مقارنة التواريخ…',
  finding: 'جارٍ مسح نوافذ التوقيت…',
  unsupportedTitle: 'هذا التحليل غير متاح بعد',
  unsupportedBody:
    'البحث عن نوافذ التوقيت غير متاح لهذا القرار بعد. يمكنك تقييم تاريخ واحد أو مقارنة مرشحين عند توفر ذلك.',
  unsupportedBack: 'اختر خياراً آخر',
  unsupportedTypeTitle: 'هذا النوع من القرار غير مدعوم بعد لتحليل التوقيت',
  unsupportedTypeBody:
    'لم يُحفظ قرارك، ولا تنتج METIORO تقييماً موثوقاً لهذا الموضوع.',
  unsupportedTypeEdit: 'تعديل القرار',
  unsupportedTypeBack: 'العودة إلى طرح السؤال',
  compareResultTitle: 'مقارنة التواريخ',
  compareWinnerLabel: 'التاريخ المفضّل',
  compareTiedLabel: 'لا فائز وحيد',
  compareRelativeWhy: 'سبب هذا الترتيب',
  compareWhyWinner: (winnerLabel, score, strengthLabel) =>
    `${winnerLabel} يأتي أولًا بدرجة توقيت ${Math.round(score)} / 100 (${strengthLabel}).`,
  compareWhyTied: (optionLabels) =>
    `هذه التواريخ متقاربة في التوقيت (${optionLabels}) — لا يُدّعى تاريخ مفضّل وحيد.`,
  blockedEyebrow: 'يلزم مزيد من المعلومات',
  blockedTitle: 'يلزم مزيد من المعلومات قبل أن تقيّم METIORO هذا التاريخ.',
  blockedBody: 'أدلة الميلاد مطلوبة لتقييم التوقيت.',
  blockedRequired: 'مطلوب للمتابعة',
  blockedNatalItem: 'أضف تاريخ الميلاد ووقته ومكانه',
  blockedNoVerdict:
    'لم يُنتج توصية توقيت. هذا ليس حكماً ملائماً / مختلطاً / غير ملائم.',
  blockedAddEvidence: 'أضف أدلة الميلاد وأعد التقييم',
  resultRecommendation: 'التوصية',
  resultWhy: 'لماذا؟',
  resultScope: 'حد مهم',
  resultConfidence: 'ثقة التحليل',
  resultScoreOf: (score) => `${String(Math.round(score)).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])} / ١٠٠`,
  timingScoreLabel: 'درجة التوقيت',
  timingScoreOf: (score) =>
    `درجة التوقيت: ${String(Math.round(score)).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])} / ١٠٠`,
  scoreHonestyNote:
    'تعكس درجة التوقيت جودة الظروف النسبية — وليس احتمالاً أو يقيناً أو نتيجة مضمونة.',
  evidenceSupportSection: 'أدلة داعمة',
  evidenceCautionSection: 'تحذيرات',
  evidenceContextSection: 'سياق إضافي',
  importance: {
    low: 'وزن أقل',
    medium: 'وزن متوسط',
    high: 'وزن أعلى',
    critical: 'وزن حرج',
  },
  limitsLabel: 'الحدود',
  nextStepsLabel: 'خطوات تالية مقترحة',
  stance: {
    proceed: 'ظروف التوقيت تدعم المضي قدماً في هذا التاريخ.',
    proceed_with_conditions:
      'ظروف التوقيت قابلة للعمل إذا أُحسنت الاستعدادات والقيود.',
    wait: 'إذا كان التاريخ لا يزال قابلاً للتغيير، تشير ظروف التوقيت إلى الانتظار.',
    prefer_alternate: 'ظروف التوقيت تفضّل النظر في تاريخ آخر.',
    no_unique_winner: 'لا يظهر تاريخ مفضّل وحيد من هذه المقارنة.',
  },
  findResultTitle: 'نوافذ التوقيت',
  findHeadlineDominant: 'نافذة توقيت أقوى',
  findHeadlineComparable: 'نوافذ قابلة للمقارنة',
  findHeadlineNone: 'لا نافذة قوية في النطاق',
  findHonestyDominant:
    'تبرز نافذة توقيت أقوى داخل النطاق الممسوح.',
  findHonestyComparable:
    'هذه نوافذ قابلة للمقارنة — دون ادعاء نافذة مهيمنة بوضوح.',
  findHonestyNone:
    'لم يُعثر على نافذة توقيت قوية بما يكفي في النطاق الممسوح.',
  findInterviewResultTitle: 'نوافذ توقيت المقابلة',
  findInterviewHeadlineDominant: 'أقوى نافذة مقابلة',
  findInterviewHeadlineComparable: 'نوافذ مقابلة قابلة للمقارنة',
  findInterviewHeadlineNone: 'لا نافذة مقابلة قوية في النطاق',
  findInterviewHonestyDominant:
    'تُظهر هذه النوافذ توقيت تواصل وظهور أقوى نسبيًا ضمن نطاق تواريخ المقابلة المحدد.',
  findInterviewHonestyComparable:
    'نوافذ المقابلة هذه متقاربة في توقيت التواصل والظهور — دون ادعاء نافذة مهيمنة بوضوح.',
  findInterviewHonestyNone:
    'لم يُعثر على نافذة تواصل/ظهور للمقابلة قوية بما يكفي في النطاق الممسوح.',
  findInterviewWindowsLabel: 'نوافذ مقابلة تستحق الانتباه',
  findInterviewWindowsEmpty: 'لا نافذة مقابلة قوية في النطاق',
  findWindowsLabel: 'نوافذ تستحق الانتباه',
  findWindowsEmpty: 'لا نافذة قوية في النطاق',
  findRangeLabel: 'النطاق الممسوح',
  findPeakLabel: 'الذروة',
  compareRankOf: (rank) =>
    `الترتيب ${String(rank).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])}`,
  compareOptionsLabel: 'التواريخ المقارنة',
  blockedTitleCompare:
    'يلزم مزيد من المعلومات قبل أن تقارن METIORO هذه التواريخ.',
  blockedBodyCompare: 'أدلة الميلاد مطلوبة لمقارنة التوقيت.',
  blockedTitleFind:
    'يلزم مزيد من المعلومات قبل أن تمسح METIORO نوافذ التوقيت.',
  blockedBodyFind: 'أدلة الميلاد مطلوبة لمسح نوافذ التوقيت.',
  agencyLine: 'METIORO لا تقرر أبداً. القرار دائماً للإنسان.',
  errorGeneric: 'حدث خطأ. حاول مرة أخرى.',
  loadFrameError: 'تعذّر تحميل هذا القرار. عد إلى ASK.',
  strength: {
    strong: 'مواتٍ جداً',
    favorable: 'مواتٍ',
    mixed: 'مختلط',
    unfavorable: 'غير مواتٍ',
  },
  confidence: {
    high: 'عالية',
    'medium-high': 'متوسطة-عالية',
    medium: 'متوسطة',
    low: 'منخفضة',
  },
  meaningByStrength: {
    strong: 'إشارة التوقيت داعمة بقوة.',
    favorable: 'إشارة التوقيت داعمة.',
    mixed: 'إشارة التوقيت مختلطة.',
    unfavorable: 'إشارة التوقيت صعبة.',
  },
  scopeTimingGeneric:
    'يغطي هذا التحليل توقيت التاريخ المطلوب فقط. ولا يقيّم نتائجًا خارج سؤال التوقيت.',
  scopeInterviewTiming:
    'يغطي هذا التحليل توقيت التفاوض والتواصل للمقابلة في التاريخ المطلوب. لا يقيّم ملاءمة صاحب العمل أو الدور أو الراتب أو نتيجة المقابلة.',
  evidenceSupportive: 'إشارة توقيت داعمة',
  evidenceCaution: 'إشارة توقيت تحذيرية',
  evidenceNeutral: 'إشارة توقيت',
  topicCarInterview: 'مقابلة عمل',
  topicInvestorMeeting: 'لقاء مع مستثمر',
  topicWeddingDate: 'اختيار تاريخ الزواج',
  topicProductLaunch: 'إطلاق مشروع أو منتج',
  topicGeneric: 'قرارك',
  intakeEyebrow: 'توقيت المقابلة',
  intakeEyebrowProductLaunch: 'توقيت الإطلاق',
  intakeTitle: 'مقابلة عمل',
  intakeBody:
    'شارك تفاصيل المقابلة. سنقيّم التوقيت للتاريخ الذي تقدّمه.',
  intakeTitleInvestorMeeting: 'لقاء مع مستثمر',
  intakeBodyInvestorMeeting:
    'شارك تفاصيل اللقاء. سنقيّم التوقيت للتاريخ الذي تقدّمه.',
  intakeTitleWeddingDate: 'اختيار تاريخ الزواج',
  intakeBodyWeddingDate:
    'شارك تفاصيل الحفل. سنقيّم التوقيت للتاريخ الذي تقدّمه.',
  intakeTitleProductLaunch: 'إطلاق مشروع أو منتج',
  intakeBodyProductLaunch:
    'حدّد ما الذي تُطلقه. نقيّم توقيت يوم الإطلاق فقط — لا ملاءمة السوق أو الإيرادات أو نجاح العمل.',
  intakeBodyProductLaunchFind:
    'حدّد ما الذي تُطلقه. سنمسح النطاق المحدد بحثًا عن نوافذ توقيت أقوى داخل هذا النطاق — لا ملاءمة السوق أو الإيرادات أو نجاح العمل.',
  intakeOptional: 'اختياري',
  intakeSelect: 'اختر…',
  intakeSave: 'حفظ الإجابات',
  intakeComplete: 'المتابعة إلى التقييم',
  intakeCompleteFind: 'المتابعة لإيجاد نوافذ التوقيت',
  intakeRequiredFilled: 'التفاصيل المطلوبة جاهزة.',
  intakeRequiredRemaining: (fields) => `ما زال مطلوبًا: ${fields}`,
  intakeKnownFromAsk: 'مفهومة من سؤالك',
  evidenceDetailUnavailable:
    'تفاصيل هذا العامل غير متاحة بعد بهذه اللغة.',
  intakeFieldTargetDate: 'تاريخ المقابلة',
  intakeFieldRole: 'الدور',
  intakeFieldCompany: 'الشركة',
  intakeFieldInterviewType: 'نوع المقابلة',
  intakeFieldMeetingDate: 'تاريخ اللقاء',
  intakeFieldMeetingGoal: 'هدف اللقاء',
  intakeFieldInvestorName: 'اسم المستثمر',
  intakeFieldMeetingType: 'نوع اللقاء',
  intakeFieldWeddingDate: 'تاريخ الزواج',
  intakeFieldCeremonyType: 'نوع الحفل',
  intakeFieldPartnerName: 'اسم الشريك',
  intakeFieldVenue: 'مكان الحفل',
  intakeFieldLaunchDate: 'تاريخ الإطلاق',
  intakeFieldLaunchObject: 'ما الذي يُطلق',
  intakeFieldLaunchChannel: 'قناة الإطلاق',
  intakeFieldBrandOrCompany: 'العلامة أو الشركة',
  intakeUnsupportedType: 'نوع القرار هذا غير متاح لإدخال التفاصيل بعد.',
  intakeLoadError: 'تعذّر تحميل هذا القرار.',
  intakeSaveError: 'تعذّر حفظ الإجابات.',
  intakeCompleteError: 'تعذّرت المتابعة.',
  backToAsk: 'العودة إلى ASK',
  evaluateUnavailableForType: 'غير متاح لهذا النوع من القرار بعد',
  capabilityTitle: 'تحليل التوقيت غير مفعّل لهذا القرار بعد.',
  capabilityBody: 'تحليل التوقيت غير مفعّل لهذا النوع من القرار في هذا الإصدار.',
  capabilitySecondary:
    'يُحتفظ بقرارك، لكن METIORO لا تستطيع بعد إنتاج تقييم موثوق له.',
  capabilityBack: 'رجوع',
  capabilityEdit: 'تعديل القرار',
  apiErrors: {
    UNSUPPORTED_DECISION_TYPE:
      'تحليل التوقيت غير مفعّل لهذا النوع من القرار بعد.',
    OPERATION_NOT_IMPLEMENTED: 'خيار التحليل هذا غير متاح في هذا الإصدار.',
    FRAMING_REQUIRED: 'يلزم مزيد من التفاصيل قبل التقييم.',
    FRAMING_UNRESOLVED: 'يرجى توضيح ما تريد فحصه أولاً.',
    INTAKE_INCOMPLETE: 'أكمل التفاصيل المطلوبة للمتابعة.',
    VERSION_CONFLICT: 'تم تحديث هذا القرار في مكان آخر. أعد التحميل.',
    PROVIDER_FAILURE: 'تحليل التوقيت غير متاح مؤقتاً. حاول مرة أخرى.',
    CASE_NOT_FOUND: 'تعذّر العثور على هذا القرار.',
    UNKNOWN_DECISION_TYPE:
      'تحليل التوقيت غير مفعّل لهذا النوع من القرار بعد.',
    ENTRY_MODE_UNAVAILABLE: 'طريقة بدء القرار هذه غير متاحة.',
    VALIDATION_ERROR: 'بعض التفاصيل لم تُقبل. راجعها وحاول مرة أخرى.',
    ILLEGAL_TRANSITION: 'هذه الخطوة غير متاحة الآن.',
  },
};

const RU: AskProductCopy = {
  dir: 'ltr',
  clarificationEyebrow: 'Уточнение решения',
  clarificationTitle: 'Несколько деталей перед оценкой',
  yourDecision: 'Ваше решение',
  examinePrompt: 'Что вы хотите проверить?',
  examineEvaluate: 'Оценить одну дату',
  examineCompare: 'Сравнить конкретные даты',
  examineFind: 'Найти более сильные окна тайминга',
  examineRecommended: 'Рекомендуется',
  compareUnavailableForLaunch:
    'Сравнение конкретных дат запуска в этой версии недоступно.',
  comingSoon: 'Скоро',
  datePrompt: 'Какую дату оценить?',
  dateHint: 'Укажите явную дату. METIORO никогда не подставляет «сегодня».',
  dateContinue: 'Продолжить',
  dateMissing: 'Пожалуйста, укажите дату.',
  compareDatesPrompt: 'Какие даты сравнить?',
  compareDatesHint:
    'Добавьте от 2 до 5 дат с подписями. METIORO никогда не подставляет «сегодня».',
  compareOptionLabel: 'Подпись',
  compareOptionDate: 'Дата',
  compareAddOption: 'Добавить ещё дату',
  compareRemoveOption: 'Удалить',
  compareNeedTwo: 'Укажите как минимум две разные даты.',
  compareTooMany: 'Укажите не более пяти дат-кандидатов.',
  compareDuplicateDates: 'У каждого варианта должна быть уникальная дата.',
  findRangePrompt: 'Какой диапазон дат просканировать?',
  findRangeHint:
    'Укажите включительные начало и конец от 7 до 90 дней. METIORO не подставляет «сегодня» и не выдумывает единственную лучшую дату.',
  findRangeStart: 'Начало',
  findRangeEnd: 'Конец',
  findRangeMissing: 'Укажите и начальную, и конечную дату.',
  findRangeInvalid: 'Дата окончания должна быть позже начала.',
  findRangeTooShort: 'Выберите диапазон не менее 7 включительных дней.',
  findRangeTooLong: 'Выберите диапазон не более 90 включительных дней.',
  persistAndEvaluate: 'Оценить эту дату',
  persistAndCompare: 'Сравнить эти даты',
  persistAndFind: 'Найти более сильные окна тайминга',
  evaluating: 'Оценка тайминга…',
  comparing: 'Сравнение дат…',
  finding: 'Сканирование окон тайминга…',
  unsupportedTitle: 'Этот анализ пока недоступен',
  unsupportedBody:
    'Поиск окон тайминга для этого решения пока недоступен. Можно оценить одну дату или сравнить несколько кандидатов, когда это предложено.',
  unsupportedBack: 'Выбрать другой вариант',
  unsupportedTypeTitle:
    'Этот тип решения пока не поддерживается для анализа тайминга',
  unsupportedTypeBody:
    'Ваше решение не сохранено, и METIORO не может дать надёжную оценку по этой теме.',
  unsupportedTypeEdit: 'Изменить решение',
  unsupportedTypeBack: 'Вернуться к вопросу',
  compareResultTitle: 'Сравнение дат',
  compareWinnerLabel: 'Предпочтительная дата',
  compareTiedLabel: 'Нет единственного победителя',
  compareRelativeWhy: 'Почему такой рейтинг',
  compareWhyWinner: (winnerLabel, score, strengthLabel) =>
    `${winnerLabel} занимает первое место с тайминг-оценкой ${Math.round(score)} / 100 (${strengthLabel}).`,
  compareWhyTied: (optionLabels) =>
    `Эти даты сопоставимы по таймингу (${optionLabels}) — единственная предпочтительная дата не утверждается.`,
  blockedEyebrow: 'Нужно больше данных',
  blockedTitle: 'Нужно больше данных, прежде чем METIORO сможет оценить эту дату.',
  blockedBody: 'Для оценки тайминга нужны данные рождения.',
  blockedRequired: 'Требуется для продолжения',
  blockedNatalItem: 'Добавьте дату, время и место рождения',
  blockedNoVerdict:
    'Рекомендация по таймингу не сформирована. Это не вердикт Благоприятно / Смешанно / Неблагоприятно.',
  blockedAddEvidence: 'Добавить данные рождения и переоценить',
  resultRecommendation: 'Рекомендация',
  resultWhy: 'Почему',
  resultScope: 'Важное ограничение',
  resultConfidence: 'Уверенность анализа',
  resultScoreOf: (score) => `${Math.round(score)} / 100`,
  timingScoreLabel: 'Оценка тайминга',
  timingScoreOf: (score) => `Оценка тайминга: ${Math.round(score)} / 100`,
  scoreHonestyNote:
    'Оценка тайминга отражает относительное качество условий — не вероятность, не гарантированный исход.',
  evidenceSupportSection: 'Поддерживающие сигналы',
  evidenceCautionSection: 'Осторожности',
  evidenceContextSection: 'Дополнительный контекст',
  importance: {
    low: 'меньший вес',
    medium: 'средний вес',
    high: 'больший вес',
    critical: 'критический вес',
  },
  limitsLabel: 'Ограничения',
  nextStepsLabel: 'Предлагаемые следующие шаги',
  stance: {
    proceed: 'Условия тайминга поддерживают движение вперёд на эту дату.',
    proceed_with_conditions:
      'Условия тайминга приемлемы, если учесть подготовку и ограничения.',
    wait: 'Если дату ещё можно сменить, условия тайминга предлагают подождать.',
    prefer_alternate: 'Условия тайминга склоняют рассмотреть другую дату.',
    no_unique_winner: 'Уникально предпочтительная дата из этого сравнения не выделяется.',
  },
  findResultTitle: 'Окна тайминга',
  findHeadlineDominant: 'Более сильное окно тайминга',
  findHeadlineComparable: 'Сопоставимые окна',
  findHeadlineNone: 'Сильного окна в диапазоне нет',
  findHonestyDominant:
    'В просканированном диапазоне выделяется более сильное окно тайминга.',
  findHonestyComparable:
    'Это сопоставимые окна — явно доминирующее окно не утверждается.',
  findHonestyNone:
    'В просканированном диапазоне достаточно сильного окна тайминга не найдено.',
  findInterviewResultTitle: 'Окна тайминга интервью',
  findInterviewHeadlineDominant: 'Самое сильное окно интервью',
  findInterviewHeadlineComparable: 'Сопоставимые окна интервью',
  findInterviewHeadlineNone: 'Сильного окна интервью в диапазоне нет',
  findInterviewHonestyDominant:
    'Эти окна показывают относительно более сильный тайминг коммуникации и видимости в заданном диапазоне дат интервью.',
  findInterviewHonestyComparable:
    'Эти окна интервью сопоставимы по таймингу коммуникации и видимости — явно доминирующее окно не утверждается.',
  findInterviewHonestyNone:
    'В просканированном диапазоне достаточно сильного окна коммуникации/видимости для интервью не найдено.',
  findInterviewWindowsLabel: 'Окна интервью, заслуживающие внимания',
  findInterviewWindowsEmpty: 'Сильного окна интервью в диапазоне нет',
  findWindowsLabel: 'Окна, заслуживающие внимания',
  findWindowsEmpty: 'Сильного окна в диапазоне нет',
  findRangeLabel: 'Просканированный диапазон',
  findPeakLabel: 'Пик',
  compareRankOf: (rank) => `Ранг ${rank}`,
  compareOptionsLabel: 'Сравниваемые даты',
  blockedTitleCompare:
    'Нужно больше данных, прежде чем METIORO сможет сравнить эти даты.',
  blockedBodyCompare: 'Для сравнения тайминга нужны данные рождения.',
  blockedTitleFind:
    'Нужно больше данных, прежде чем METIORO сможет искать окна тайминга.',
  blockedBodyFind: 'Для сканирования окон тайминга нужны данные рождения.',
  agencyLine: 'METIORO никогда не решает. Решение всегда за человеком.',
  errorGeneric: 'Что-то пошло не так. Попробуйте снова.',
  loadFrameError: 'Не удалось загрузить решение. Вернитесь в ASK.',
  strength: {
    strong: 'Очень благоприятно',
    favorable: 'Благоприятно',
    mixed: 'Смешанно',
    unfavorable: 'Неблагоприятно',
  },
  confidence: {
    high: 'Высокая',
    'medium-high': 'Средне-высокая',
    medium: 'Средняя',
    low: 'Низкая',
  },
  meaningByStrength: {
    strong: 'Сигнал тайминга сильно поддерживающий.',
    favorable: 'Сигнал тайминга поддерживающий.',
    mixed: 'Сигнал тайминга смешанный.',
    unfavorable: 'Сигнал тайминга сложный.',
  },
  scopeTimingGeneric:
    'Этот анализ касается только тайминга запрошенной даты. Он не оценивает исходы вне этого вопроса тайминга.',
  scopeInterviewTiming:
    'Этот анализ касается тайминга переговоров и коммуникации на запрошенную дату интервью. Он не оценивает соответствие работодателю, роли, зарплате или исходу интервью.',
  evidenceSupportive: 'Поддерживающий сигнал тайминга',
  evidenceCaution: 'Предупреждающий сигнал тайминга',
  evidenceNeutral: 'Сигнал тайминга',
  topicCarInterview: 'Собеседование',
  topicInvestorMeeting: 'Встреча с инвестором',
  topicWeddingDate: 'Выбор даты свадьбы',
  topicProductLaunch: 'Запуск проекта или продукта',
  topicGeneric: 'Ваше решение',
  intakeEyebrow: 'Тайминг собеседования',
  intakeEyebrowProductLaunch: 'Тайминг запуска',
  intakeTitle: 'Собеседование',
  intakeBody:
    'Укажите детали собеседования. Мы оценим тайминг для указанной даты.',
  intakeTitleInvestorMeeting: 'Встреча с инвестором',
  intakeBodyInvestorMeeting:
    'Укажите детали встречи. Мы оценим тайминг для указанной даты.',
  intakeTitleWeddingDate: 'Выбор даты свадьбы',
  intakeBodyWeddingDate:
    'Укажите детали церемонии. Мы оценим тайминг для указанной даты.',
  intakeTitleProductLaunch: 'Запуск проекта или продукта',
  intakeBodyProductLaunch:
    'Укажите, что запускаете. Мы оценим только тайминг дня запуска — не соответствие рынку, выручку или успех бизнеса.',
  intakeBodyProductLaunchFind:
    'Укажите, что запускаете. Мы просканируем выбранный диапазон, чтобы найти более сильные окна тайминга внутри этого диапазона — не соответствие рынку, выручку или успех бизнеса.',
  intakeOptional: 'необязательно',
  intakeSelect: 'Выберите…',
  intakeSave: 'Сохранить ответы',
  intakeComplete: 'Перейти к оценке',
  intakeCompleteFind: 'Продолжить к поиску окон тайминга',
  intakeRequiredFilled: 'Обязательные поля заполнены.',
  intakeRequiredRemaining: (fields) => `Ещё нужно: ${fields}`,
  intakeKnownFromAsk: 'Понято из вашего вопроса',
  evidenceDetailUnavailable:
    'Подробности этого фактора пока недоступны на этом языке.',
  intakeFieldTargetDate: 'Дата собеседования',
  intakeFieldRole: 'Роль',
  intakeFieldCompany: 'Компания',
  intakeFieldInterviewType: 'Тип собеседования',
  intakeFieldMeetingDate: 'Дата встречи',
  intakeFieldMeetingGoal: 'Цель встречи',
  intakeFieldInvestorName: 'Имя инвестора',
  intakeFieldMeetingType: 'Тип встречи',
  intakeFieldWeddingDate: 'Дата свадьбы',
  intakeFieldCeremonyType: 'Тип церемонии',
  intakeFieldPartnerName: 'Имя партнёра',
  intakeFieldVenue: 'Место проведения',
  intakeFieldLaunchDate: 'Дата запуска',
  intakeFieldLaunchObject: 'Что запускается',
  intakeFieldLaunchChannel: 'Канал запуска',
  intakeFieldBrandOrCompany: 'Бренд или компания',
  intakeUnsupportedType: 'Этот тип решения пока недоступен для ввода деталей.',
  intakeLoadError: 'Не удалось загрузить это решение.',
  intakeSaveError: 'Не удалось сохранить ответы.',
  intakeCompleteError: 'Не удалось продолжить.',
  backToAsk: 'Назад в Ask',
  evaluateUnavailableForType: 'Пока недоступно для этого типа решения',
  capabilityTitle: 'Анализ тайминга для этого решения ещё не включён.',
  capabilityBody:
    'Этот тип решения пока не включён для оценки тайминга в этом релизе.',
  capabilitySecondary:
    'Ваше решение сохраняется, но METIORO пока не может дать для него надёжную оценку.',
  capabilityBack: 'Назад',
  capabilityEdit: 'Изменить решение',
  apiErrors: {
    UNSUPPORTED_DECISION_TYPE:
      'Анализ тайминга для этого типа решения ещё не включён.',
    OPERATION_NOT_IMPLEMENTED:
      'Этот вариант анализа недоступен в этом релизе.',
    FRAMING_REQUIRED: 'Перед оценкой нужны ещё несколько деталей.',
    FRAMING_UNRESOLVED: 'Сначала уточните, что нужно проверить.',
    INTAKE_INCOMPLETE: 'Заполните обязательные поля, чтобы продолжить.',
    VERSION_CONFLICT: 'Решение обновлено в другом месте. Перезагрузите.',
    PROVIDER_FAILURE: 'Анализ тайминга временно недоступен. Попробуйте снова.',
    CASE_NOT_FOUND: 'Это решение не найдено.',
    UNKNOWN_DECISION_TYPE:
      'Анализ тайминга для этого типа решения ещё не включён.',
    ENTRY_MODE_UNAVAILABLE: 'Этот способ начать решение недоступен.',
    VALIDATION_ERROR: 'Часть данных не принята. Проверьте и попробуйте снова.',
    ILLEGAL_TRANSITION: 'Этот шаг сейчас недоступен.',
  },
};

export const ASK_PRODUCT_COPY: Record<AppLang, AskProductCopy> = {
  en: EN,
  fa: FA,
  ar: AR,
  ru: RU,
};

export function getAskProductCopy(lang: AppLang): AskProductCopy {
  return ASK_PRODUCT_COPY[lang] ?? ASK_PRODUCT_COPY.en;
}

export function localizeStrength(
  lang: AppLang,
  band: StrengthBand
): string | null {
  if (band === 'unknown') return null;
  return getAskProductCopy(lang).strength[band];
}

export function localizeConfidence(
  lang: AppLang,
  band: ConfidenceBand
): string | null {
  if (band === 'unknown') return null;
  return getAskProductCopy(lang).confidence[band];
}
