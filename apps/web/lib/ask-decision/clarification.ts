/** Single optional clarification — never a wizard. */

import type { ConversationLocale } from '@/lib/conversation-client';
import type { ClarificationState, DecisionFrame, IntentDetection } from './types';

const CLARIFY_DEFAULT: Record<ConversationLocale, string> = {
  en: 'What specifically are you deciding about (the subject, options, or deadline)?',
  fa: 'دقیقاً دربارهٔ چه چیزی تصمیم می‌گیرید (موضوع، گزینه‌ها یا مهلت)؟',
  ru: 'О чём именно вы решаете (предмет, варианты или срок)?',
  ar: 'عمّا تقرّر تحديداً (الموضوع أو الخيارات أو الموعد النهائي)؟',
};

const CLARIFY_ACCEPT: Record<ConversationLocale, string> = {
  en: 'What are you considering accepting (role, offer, deal, or other)?',
  fa: 'چه چیزی را برای پذیرش در نظر دارید (نقش، پیشنهاد، معامله یا دیگر)؟',
  ru: 'Что вы рассматриваете к принятию (роль, оффер, сделка или иное)?',
  ar: 'ما الذي تفكر في قبوله (دور، عرض، صفقة أو غير ذلك)؟',
};

const CLARIFY_TIMING: Record<ConversationLocale, string> = {
  en: 'What action are you timing, and by when do you need to decide?',
  fa: 'چه اقدامی را زمان‌بندی می‌کنید و تا کی باید تصمیم بگیرید؟',
  ru: 'Какое действие вы привязываете ко времени и к какому сроку нужно решить?',
  ar: 'ما الإجراء الذي تؤقّته ومتى يجب أن تقرّر؟',
};

const CLARIFY_WHAT: Record<ConversationLocale, string> = {
  en: 'What decision are you facing, and what outcome matters most?',
  fa: 'با چه تصمیمی روبه‌رو هستید و کدام نتیجه مهم‌تر است؟',
  ru: 'С каким решением вы сталкиваетесь и какой исход важнее всего?',
  ar: 'ما القرار الذي تواجهه وأي نتيجة أهم؟',
};

const CLARIFY_DEADLINE: Record<ConversationLocale, string> = {
  en: 'What is the latest date by which this decision must be made?',
  fa: 'آخرین مهلت برای گرفتن این تصمیم چه زمانی است؟',
  ru: 'Какая крайняя дата, к которой нужно принять это решение?',
  ar: 'ما آخر موعد يجب فيه اتخاذ هذا القرار؟',
};

export function evaluateClarification(
  frame: DecisionFrame,
  intent: IntentDetection,
  locale: ConversationLocale = 'en'
): ClarificationState {
  if (!frame.requiresClarification) {
    return {
      required: false,
      question: null,
      canContinueWithAssumptions: true,
    };
  }

  let question = CLARIFY_DEFAULT[locale] ?? CLARIFY_DEFAULT.en;

  if (/^should i accept it/i.test(frame.originalQuestion)) {
    question = CLARIFY_ACCEPT[locale] ?? CLARIFY_ACCEPT.en;
  } else if (/is this the right time/i.test(frame.originalQuestion)) {
    question = CLARIFY_TIMING[locale] ?? CLARIFY_TIMING.en;
  } else if (/^what should i do/i.test(frame.originalQuestion)) {
    question = CLARIFY_WHAT[locale] ?? CLARIFY_WHAT.en;
  } else if (intent.timingRelevant && frame.timeHorizon === 'unknown') {
    question = CLARIFY_DEADLINE[locale] ?? CLARIFY_DEADLINE.en;
  }

  return {
    required: true,
    question,
    canContinueWithAssumptions: !intent.highStakesFlag,
  };
}
