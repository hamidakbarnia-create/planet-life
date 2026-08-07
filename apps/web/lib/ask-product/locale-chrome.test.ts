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
        copy.comingSoon,
        copy.unsupportedTitle,
        copy.unsupportedBody,
        copy.blockedTitle,
        copy.resultRecommendation,
        copy.intakeTitle,
        copy.intakeBody,
      ].join(' | ');
      expect(chrome).not.toMatch(ENGINEERING);
    }
  );

  it('FA/AR expose RTL dir; EN/RU LTR', () => {
    expect(getAskProductCopy('fa').dir).toBe('rtl');
    expect(getAskProductCopy('ar').dir).toBe('rtl');
    expect(getAskProductCopy('en').dir).toBe('ltr');
    expect(getAskProductCopy('ru').dir).toBe('ltr');
  });

  it('FA examine labels match recovery framing', () => {
    const fa = getAskProductCopy('fa');
    expect(fa.examinePrompt).toBe('چه چیزی را می‌خواهید بررسی کنیم؟');
    expect(fa.examineEvaluate).toBe('بررسی یک تاریخ مشخص');
    expect(fa.examineCompare).toContain('مقایسه');
    expect(fa.comingSoon).toBe('به‌زودی');
  });
});
