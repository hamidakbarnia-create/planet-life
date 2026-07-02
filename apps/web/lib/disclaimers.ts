export type DisclaimerLang = 'en' | 'ru' | 'fa' | 'ar';

export const DISCLAIMER_ACCEPTED_KEY = 'planet-life-disclaimer-accepted';

export const DISCLAIMER_LANGS: Record<
  DisclaimerLang,
  {
    dir: 'ltr' | 'rtl';
    onboardingTitle: string;
    onboardingBody: string;
    onboardingCheckbox: string;
    onboardingContinue: string;
    moduleWarning: string;
    actionDisclaimer: string;
  }
> = {
  en: {
    dir: 'ltr',
    onboardingTitle: 'Before you continue',
    onboardingBody:
      'METIORO is a personal decision intelligence tool based on analytical models and astronomical calculations. All content is for informational purposes only and does not replace financial, legal, or medical advice. All decisions are your sole responsibility.',
    onboardingCheckbox: 'I understand and agree',
    onboardingContinue: 'Continue',
    moduleWarning:
      'This analysis is based on analytical timing models. Not financial advice.',
    actionDisclaimer:
      'Acting on this timing is your personal decision and responsibility.',
  },
  ru: {
    dir: 'ltr',
    onboardingTitle: 'Прежде чем продолжить',
    onboardingBody:
      'METIORO — инструмент персонального интеллекта решений на основе аналитических моделей и астрономических расчётов. Весь контент носит информационный характер и не заменяет финансовые, юридические или медицинские консультации. Все решения — ваша личная ответственность.',
    onboardingCheckbox: 'Я понимаю и соглашаюсь',
    onboardingContinue: 'Продолжить',
    moduleWarning:
      'Этот анализ основан на аналитических моделях тайминга. Не является финансовой консультацией.',
    actionDisclaimer:
      'Действие в это время — ваше личное решение и ответственность.',
  },
  fa: {
    dir: 'rtl',
    onboardingTitle: 'قبل از ادامه',
    onboardingBody:
      'METIORO ابزاری برای هوش تصمیم‌گیری شخصی بر پایه مدل‌های تحلیلی و محاسبات نجومی است. تمام محتوا صرفاً جهت اطلاع‌رسانی است و جایگزین مشاوره مالی، حقوقی یا پزشکی نیست. تمام تصمیم‌ها بر عهده خود شماست.',
    onboardingCheckbox: 'می‌فهمم و موافقم',
    onboardingContinue: 'ادامه',
    moduleWarning:
      'این تحلیل بر اساس مدل‌های تحلیلی زمان‌بندی است. مشاوره مالی نیست.',
    actionDisclaimer:
      'اقدام در این زمان تصمیم و مسئولیت شخصی شماست.',
  },
  ar: {
    dir: 'rtl',
    onboardingTitle: 'قبل المتابعة',
    onboardingBody:
      'METIORO أداة ذكاء قرار شخصي تعتمد على نماذج تحليلية وحسابات فلكية. كل المحتوى لأغراض معلوماتية فقط ولا يحل محل المشورة المالية أو القانونية أو الطبية. جميع القرارات مسؤوليتك وحدك.',
    onboardingCheckbox: 'أفهم وأوافق',
    onboardingContinue: 'متابعة',
    moduleWarning:
      'هذا التحليل مبني على نماذج توقيت تحليلية. ليس نصيحة مالية.',
    actionDisclaimer:
      'التصرف في هذا التوقيت قرارك ومسؤوليتك الشخصية.',
  },
};

export function isDisclaimerAccepted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DISCLAIMER_ACCEPTED_KEY) === 'true';
}

export function acceptDisclaimer(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DISCLAIMER_ACCEPTED_KEY, 'true');
}

export function resolveDisclaimerLang(): DisclaimerLang {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('planet-life-lang');
  if (stored === 'ru' || stored === 'fa' || stored === 'ar' || stored === 'en') {
    return stored;
  }
  return 'en';
}
