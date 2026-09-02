import { describe, expect, it } from 'vitest';
import {
  normalizeTypedAskText,
  resolveTypedDecisionType,
} from './typed-resolver';

describe('normalizeTypedAskText', () => {
  it('strips punctuation and collapses spacing without transliteration', () => {
    expect(normalizeTypedAskText('  When، should I؟  ')).toBe('when should i');
    expect(normalizeTypedAskText('جلسه با سرمایه‌گذار')).toContain('سرمایه');
  });
});

describe('resolveTypedDecisionType exact matches', () => {
  it.each([
    ['en', 'Is September 12 good for my job interview?', 'car-interview'],
    ['en', 'When should I schedule my interview for this role?', 'car-interview'],
    ['fa', 'آیا ۱۲ سپتامبر برای مصاحبه کاری من خوب است؟', 'car-interview'],
    ['fa', 'آیا ۱۲ سپتامبر برای مصاحبه خوبه؟', 'car-interview'],
    ['fa', 'برای مصاحبه کاری ۱۲ سپتامبر چطوره؟', 'car-interview'],
    ['fa', 'بهترین روز مصاحبه را در ۳۰ روز آینده پیدا کن', 'car-interview'],
    ['ar', 'هل ١٢ سبتمبر مناسب لمقابلة عمل؟', 'car-interview'],
    ['ru', 'Подходит ли 12 сентября для собеседования?', 'car-interview'],
    ['en', 'What date should we get married?', 'mar-wedding-date'],
    ['en', 'Best day for our wedding ceremony?', 'mar-wedding-date'],
    ['fa', 'چه تاریخی برای عروسی مناسب است؟', 'mar-wedding-date'],
    ['ar', 'ما أفضل تاريخ للزفاف؟', 'mar-wedding-date'],
    ['ru', 'Какую дату свадьбы выбрать?', 'mar-wedding-date'],
    ['en', 'When should I meet an investor?', 'bus-investor-meeting'],
    ['en', 'Best date for our VC pitch?', 'bus-investor-meeting'],
    ['fa', 'جلسه با سرمایه‌گذار برای جذب سرمایه', 'bus-investor-meeting'],
    ['ar', 'متى ألتقي مستثمر للتمويل؟', 'bus-investor-meeting'],
    ['ru', 'Когда встретиться с инвестором?', 'bus-investor-meeting'],
    ['en', 'When should I launch my app?', 'bus-product-launch'],
    ['en', 'Best date to release our product?', 'bus-product-launch'],
    ['fa', 'بهترین زمان برای لانچ محصول جدید چیست؟', 'bus-product-launch'],
    ['ar', 'متى يجب إطلاق تطبيقنا؟', 'bus-product-launch'],
    ['ru', 'Когда лучше запустить приложение?', 'bus-product-launch'],
  ] as const)(
    '%s exact: %s → %s',
    (lang, text, decisionTypeId) => {
      const result = resolveTypedDecisionType(text, lang);
      expect(result).toEqual({
        status: 'exact',
        decisionTypeId,
        domain: expect.any(String),
      });
      if (result.status === 'exact') {
        expect(result.decisionTypeId).toBe(decisionTypeId);
      }
    }
  );
});

describe('resolveTypedDecisionType negative guards', () => {
  it.each([
    ['Should I accept this job?', 'car-interview'],
    ['Should I negotiate this offer?', 'car-interview'],
    ['Podcast interview next week', 'car-interview'],
    ['Should I invest in this stock?', 'bus-investor-meeting'],
    ['Is crypto a good investment?', 'bus-investor-meeting'],
    ['Close an important business deal', 'bus-investor-meeting'],
    ['Should I start a business?', 'bus-product-launch'],
    ['Close a client deal', 'bus-product-launch'],
    ['Should I pivot the company?', 'bus-product-launch'],
    ['Should I marry this person?', 'mar-wedding-date'],
    ['Is this relationship right for me?', 'mar-wedding-date'],
    ['۱۲ سپتامبر برای مذاکره پیشنهاد شغلی خوبه؟', 'car-interview'],
    ['۱۲ سپتامبر برای مذاکره حقوق خوبه؟', 'car-interview'],
    ['۱۵ سپتامبر برای خرید بیت‌کوین خوبه؟', 'car-interview'],
    ['فردا برای مهاجرت خوبه؟', 'car-interview'],
    ['Should I negotiate my job offer tomorrow?', 'car-interview'],
  ] as const)('does not bind %s to %s', (text, bannedId) => {
    const result = resolveTypedDecisionType(text, 'en');
    if (result.status === 'exact') {
      expect(result.decisionTypeId).not.toBe(bannedId);
    } else {
      expect(result.status).not.toBe('exact');
    }
  });
});

describe('resolveTypedDecisionType ambiguous', () => {
  it.each([
    'Close an important business deal',
    'Important meeting next week',
    'I have a big business decision',
  ])('returns ambiguous for %s', (text) => {
    const result = resolveTypedDecisionType(text, 'en');
    expect(result.status).toBe('ambiguous');
    expect('decisionTypeId' in result && result.decisionTypeId).toBeFalsy();
  });

  it('returns ambiguous on exact-family collision', () => {
    const result = resolveTypedDecisionType(
      'Job interview before our wedding ceremony',
      'en'
    );
    expect(result).toEqual({
      status: 'ambiguous',
      domain: 'collision',
      clarificationKind: 'decision_type_collision',
    });
  });
});

describe('resolveTypedDecisionType unsupported', () => {
  it.each([
    ['Should I relocate to Spain?', 'relocation'],
    ['Which university course should I take?', 'education'],
    ['Do I need a lawyer for this lawsuit?', 'legal'],
    ['Should we sign a commercial agreement?', 'commercial_agreement'],
    ['Is this relationship right for me?', 'relationship'],
    ['Should I invest in this stock?', 'personal_investment'],
    ['۱۵ سپتامبر برای خرید بیت‌کوین خوبه؟', 'personal_investment'],
    ['فردا برای مهاجرت خوبه؟', 'relocation'],
  ] as const)('unsupported: %s', (text, domain) => {
    const result = resolveTypedDecisionType(text, 'en');
    expect(result.status).toBe('unsupported');
    if (result.status === 'unsupported') {
      expect(result.domain).toBe(domain);
    }
  });

  it('never nearest-maps generic business deal to a shipped runtime', () => {
    const result = resolveTypedDecisionType(
      'Close an important business deal',
      'en'
    );
    expect(result.status).toBe('ambiguous');
  });
});
