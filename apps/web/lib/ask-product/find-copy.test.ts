import { describe, expect, it } from 'vitest';
import type { AppLang } from '@/lib/app-settings';
import { getAskProductCopy } from '@/lib/ask-product';

const LANGS: AppLang[] = ['en', 'fa', 'ar', 'ru'];

const EVALUATE_LEAK =
  /continue to evaluation|evaluate this date|evaluate launch-day|for the date you provide|ادامه به ارزیابی|المتابعة إلى التقييم|Перейти к оценке/i;

describe('Product Launch FIND copy honesty', () => {
  it('keeps EVALUATE intake/CTA wording unchanged', () => {
    const en = getAskProductCopy('en');
    expect(en.intakeComplete).toBe('Continue to evaluation');
    expect(en.intakeBodyProductLaunch).toMatch(/evaluate launch-day timing/);
    expect(en.intakeBodyProductLaunch).toMatch(/date you provide/);
    expect(en.persistAndEvaluate).toBe('Evaluate this date');
  });

  it.each(LANGS)(
    '%s FIND intake/CTA avoids evaluate/single-date wording',
    (lang) => {
      const copy = getAskProductCopy(lang);
      expect(copy.intakeBodyProductLaunchFind).toBeTruthy();
      expect(copy.intakeCompleteFind).toBeTruthy();
      expect(copy.intakeBodyProductLaunchFind).not.toMatch(EVALUATE_LEAK);
      expect(copy.intakeCompleteFind).not.toMatch(EVALUATE_LEAK);
      expect(copy.persistAndFind).not.toMatch(EVALUATE_LEAK);
      expect(copy.intakeCompleteFind).not.toBe(copy.intakeComplete);
      expect(copy.intakeBodyProductLaunchFind).not.toBe(
        copy.intakeBodyProductLaunch
      );
    }
  );

  it('EN FIND copy names range scan / timing windows', () => {
    const en = getAskProductCopy('en');
    expect(en.intakeCompleteFind).toBe('Continue to find timing windows');
    expect(en.intakeBodyProductLaunchFind).toMatch(/scan the selected range/i);
    expect(en.intakeBodyProductLaunchFind).toMatch(
      /stronger timing windows within this range/i
    );
    expect(en.persistAndFind).toBe('Find stronger timing windows');
  });
});
