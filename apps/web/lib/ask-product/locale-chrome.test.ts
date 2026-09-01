import { describe, expect, it } from 'vitest';
import { getAskProductCopy } from './copy';

const ENGINEERING =
  /\b(Decision Case|engine_id|dq_status|Package|Runtime|Frame|schema_version|OPERATION_NOT_IMPLEMENTED)\b/i;

describe('ask-product consumer chrome locales', () => {
  it.each(['en', 'fa', 'ar', 'ru'] as const)(
    '%s copy has no engineering terminology in core chrome',
    (lang) => {
      const copy = getAskProductCopy(lang);
      const chrome = [
        copy.clarificationTitle,
        copy.examinePrompt,
        copy.examineEvaluate,
        copy.examineCompare,
        copy.examineFind,
        copy.examineRecommended,
        copy.compareUnavailableForLaunch,
        copy.comingSoon,
        copy.unsupportedTitle,
        copy.unsupportedBody,
        copy.unsupportedTypeTitle,
        copy.unsupportedTypeBody,
        copy.unsupportedTypeEdit,
        copy.unsupportedTypeBack,
        copy.blockedTitle,
        copy.resultRecommendation,
        copy.intakeTitle,
        copy.intakeBody,
      ].join(' | ');
      expect(chrome).not.toMatch(ENGINEERING);
    }
  );

  it('EN/FA/AR/RU selector copy has no internal IDs', () => {
    for (const lang of ['en', 'fa', 'ar', 'ru'] as const) {
      const copy = getAskProductCopy(lang);
      const chrome = [
        copy.examineEvaluate,
        copy.examineCompare,
        copy.examineFind,
        copy.examineRecommended,
        copy.compareUnavailableForLaunch,
      ].join(' | ');
      expect(chrome).not.toMatch(
        /bus-product-launch|car-interview|compare_dates|find_dates|evaluate_date|decision_type/i
      );
    }
    expect(getAskProductCopy('en').examineEvaluate).toBe('Evaluate one date');
    expect(getAskProductCopy('en').examineCompare).toBe('Compare specific dates');
    expect(getAskProductCopy('en').examineFind).toBe(
      'Find stronger timing windows'
    );
  });

  it('FA/AR expose RTL dir; EN/RU LTR', () => {
    expect(getAskProductCopy('fa').dir).toBe('rtl');
    expect(getAskProductCopy('ar').dir).toBe('rtl');
    expect(getAskProductCopy('en').dir).toBe('ltr');
    expect(getAskProductCopy('ru').dir).toBe('ltr');
  });

  it('FA examine labels match recovery framing', () => {
    const fa = getAskProductCopy('fa');
    expect(fa.examinePrompt).toBe('چه چیزی را می‌خواهید بررسی کنیم؟');
    expect(fa.examineEvaluate).toBe('ارزیابی یک تاریخ');
    expect(fa.examineCompare).toBe('مقایسه چند تاریخ مشخص');
    expect(fa.examineFind).toBe('یافتن پنجره‌های زمانی قوی‌تر');
    expect(fa.compareUnavailableForLaunch).toBe(
      'مقایسه تاریخ‌های مشخص برای لانچ در این نسخه فعال نیست.'
    );
    expect(fa.comingSoon).toBe('به‌زودی');
  });

  it('FA capability copy matches product contract (consumer language only)', () => {
    const fa = getAskProductCopy('fa');
    expect(fa.capabilityTitle).toContain('فعال نشده');
    expect(fa.capabilitySecondary).toContain('METIORO');
    expect(fa.evaluateUnavailableForType).toContain('در دسترس نیست');
    expect(fa.capabilityBack).toBe('بازگشت');
    expect(fa.capabilityEdit).toBe('ویرایش تصمیم');
    const chrome = [
      fa.capabilityTitle,
      fa.capabilityBody,
      fa.capabilitySecondary,
      fa.evaluateUnavailableForType,
      ...Object.values(fa.apiErrors),
    ].join(' | ');
    expect(chrome).not.toMatch(ENGINEERING);
    expect(chrome).not.toMatch(/UNSUPPORTED_DECISION_TYPE|runtime|registry/i);
  });

  it('FA/AR/RU unsupported-type copy is localized without internal IDs', () => {
    const fa = getAskProductCopy('fa');
    expect(fa.unsupportedTypeTitle).toBe(
      'این نوع تصمیم هنوز برای تحلیل زمان‌بندی پشتیبانی نمی‌شود'
    );
    expect(fa.unsupportedTypeBody).toBe(
      'تصمیم شما ذخیره نشده و METIORO برای این موضوع ارزیابی قابل‌اتکا تولید نمی‌کند.'
    );
    expect(fa.unsupportedTypeEdit).toBe('ویرایش تصمیم');
    expect(fa.unsupportedTypeBack).toBe('بازگشت به طرح پرسش');
    for (const lang of ['en', 'fa', 'ar', 'ru'] as const) {
      const copy = getAskProductCopy(lang);
      const chrome = [
        copy.unsupportedTypeTitle,
        copy.unsupportedTypeBody,
        copy.unsupportedTypeEdit,
        copy.unsupportedTypeBack,
      ].join(' | ');
      expect(chrome).not.toMatch(
        /bus-product-launch|car-interview|compare_dates|find_dates|evaluate_date|decision_type|coming soon|Coming soon|قريباً|به‌زودی|Скоро/i
      );
      expect(chrome).not.toMatch(ENGINEERING);
    }
    const ar = getAskProductCopy('ar');
    const ru = getAskProductCopy('ru');
    expect(ar.unsupportedTypeTitle).not.toMatch(/[A-Za-z]{4,}/);
    expect(ar.unsupportedTypeBody).toContain('METIORO');
    expect(ru.unsupportedTypeTitle).toContain('тайминг');
    expect(getAskProductCopy('en').unsupportedTypeEdit).toBe('Edit decision');
    expect(getAskProductCopy('en').unsupportedTypeBack).toBe('Back to Ask');
  });
});
