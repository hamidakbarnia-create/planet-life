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
    onboardingTitle: 'The Final Decision Is Always Yours',
    onboardingBody:
      'METIORO helps you evaluate your options with data and analysis. It never decides for you. Every decision remains yours.',
    onboardingCheckbox: 'I understand and agree',
    onboardingContinue: 'Continue',
    moduleWarning:
      'This analysis is based on analytical timing models. Not financial advice.',
    actionDisclaimer:
      'Acting on this timing is your personal decision and responsibility.',
  },
  ru: {
    dir: 'ltr',
    onboardingTitle: 'Окончательное решение всегда за вами',
    onboardingBody:
      'METIORO помогает оценить возможные варианты с помощью анализа и данных, но никогда не принимает решение вместо вас. Окончательный выбор всегда остаётся за вами.',
    onboardingCheckbox: 'Я понимаю и соглашаюсь',
    onboardingContinue: 'Продолжить',
    moduleWarning:
      'Этот анализ основан на аналитических моделях тайминга. Не является финансовой консультацией.',
    actionDisclaimer:
      'Действие в это время — ваше личное решение и ответственность.',
  },
  fa: {
    dir: 'rtl',
    onboardingTitle: 'تصمیم نهایی همیشه با شماست',
    onboardingBody:
      'METIORO با تحلیل و اطلاعات به شما کمک می‌کند تصمیم آگاهانه‌تری بگیرید، اما هرگز به جای شما تصمیم نمی‌گیرد. انتخاب نهایی همیشه با شماست.',
    onboardingCheckbox: 'می‌فهمم و موافقم',
    onboardingContinue: 'ادامه',
    moduleWarning:
      'این تحلیل بر اساس مدل‌های تحلیلی زمان‌بندی است. مشاوره مالی نیست.',
    actionDisclaimer:
      'اقدام در این زمان تصمیم و مسئولیت شخصی شماست.',
  },
  ar: {
    dir: 'rtl',
    onboardingTitle: 'القرار النهائي لك دائماً',
    onboardingBody:
      'يساعدك METIORO على تقييم خياراتك من خلال التحليل والبيانات، لكنه لا يقرر بدلاً منك. القرار النهائي يبقى لك دائماً.',
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
