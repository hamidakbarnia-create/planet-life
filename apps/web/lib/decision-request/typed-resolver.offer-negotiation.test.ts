import { describe, expect, it } from 'vitest';
import { resolveTypedDecisionType } from './typed-resolver';

function resolvedType(text: string, lang: 'en' | 'fa' | 'ar' | 'ru' = 'en') {
  const result = resolveTypedDecisionType(text, lang);
  return result.status === 'exact' ? result.decisionTypeId : undefined;
}

describe('typed resolver — car-offer-negotiation', () => {
  it.each([
    ['en', 'Negotiate a job offer'],
    ['en', 'Job offer negotiation'],
    ['en', 'Is September 15 a good date to negotiate my job offer?'],
    ['en', 'When should I be negotiating my job offer?'],
    ['en', 'Best day to negotiate an employment offer'],
    ['fa', 'مذاکره روی پیشنهاد شغلی'],
    ['fa', 'مذاکره پیشنهاد کاری'],
    ['fa', 'آیا ۱۵ سپتامبر برای مذاکره پیشنهاد شغلی مناسب است؟'],
    ['fa', 'بهترین روز برای مذاکره درباره پیشنهاد شغلی'],
    ['ar', 'التفاوض على عرض عمل'],
    ['ar', 'هل ١٥ سبتمبر مناسب للتفاوض على عرض العمل؟'],
    ['ar', 'التفاوض على العرض الوظيفي'],
    ['ru', 'Обсудить условия предложения о работе'],
    ['ru', 'Когда лучше провести переговоры о предложении о работе?'],
    ['ru', 'Стоит ли обсудить оффер 15 сентября?'],
  ] as const)('%s: %s resolves to car-offer-negotiation', (lang, text) => {
    expect(resolvedType(text, lang)).toBe('car-offer-negotiation');
  });

  it.each([
    ['interview', 'Is September 12 good for my job interview?', 'car-interview'],
    ['interview fa', 'زمان مصاحبه کاری من', 'car-interview'],
    ['investor meeting', 'When should I meet an investor?', 'bus-investor-meeting'],
  ] as const)(
    'keeps %s bound to its own type',
    (_label, text, expected) => {
      expect(resolvedType(text)).toBe(expected);
    }
  );

  it.each([
    ['salary review without an offer', 'Ask for a raise or salary review'],
    ['salary negotiation', 'Should I negotiate salary next month?'],
    ['salary negotiation fa', '۱۲ سپتامبر برای مذاکره حقوق خوبه؟'],
    ['accepting with no negotiation intent', 'Should I accept this job offer?'],
    ['accepting fa', 'آیا این پیشنهاد شغلی را قبول کنم؟'],
    ['career change', 'Is this a good time for a career change?'],
    ['hiring someone', 'Should I hire someone next week?'],
    ['contract signing', 'Should I sign the contract on Friday?'],
    ['generic business deal', 'Close an important business deal'],
    ['promotion', 'When should I ask for a promotion?'],
    ['promotion fa', 'چه زمانی برای درخواست ارتقا مناسب است؟'],
    ['raise', 'Best time to ask for a raise'],
    ['generic business offer', 'Should I make an offer to a supplier?'],
    ['job interview', 'job interview'],
    ['investor meeting', 'investor meeting'],
    ['accept a job', 'Should I accept a job next month?'],
  ] as const)('%s does not resolve to car-offer-negotiation', (_label, text) => {
    expect(resolvedType(text)).not.toBe('car-offer-negotiation');
  });

  it('yields to the interview family when interview cues are present', () => {
    // The interview negative on this family prevents a collision, so mixed
    // text stays on the interview type instead of becoming ambiguous.
    expect(
      resolvedType('Should I plan my job interview and my job offer negotiation?')
    ).toBe('car-interview');
  });

  it('reports the career domain for offer negotiation', () => {
    const result = resolveTypedDecisionType('Negotiate a job offer');
    expect(result.status).toBe('exact');
    expect(result.status === 'exact' ? result.domain : undefined).toBe('career');
  });
});
