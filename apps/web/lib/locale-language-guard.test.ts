import { describe, expect, it } from 'vitest';
import {
  checkResponseLanguage,
  extractUserFacingAskProse,
  isEnglishDominantProse,
  LANGUAGE_RETRY_INSTRUCTION,
} from '@/lib/locale-language-guard';

describe('checkResponseLanguage', () => {
  it('accepts valid Persian prose for fa', () => {
    const text =
      'توصیه این است که با یک آزمایش برگشت‌پذیر پیش بروید و نقاط کنترل روشن داشته باشید تا ریسک کاهش یابد.';
    const result = checkResponseLanguage(text, 'fa');
    expect(result.ok).toBe(true);
    expect(result.dominant).toBe('fa');
  });

  it('fails English prose when expected is fa', () => {
    const text =
      'Recommendation: proceed with caution. Main Factors include timing and risk. Gather one critical input before committing to irreversible steps this week.';
    const result = checkResponseLanguage(text, 'fa');
    expect(result.ok).toBe(false);
    expect(result.dominant).toBe('en');
    expect(isEnglishDominantProse(text)).toBe(true);
  });

  it('allows METIORO brand tokens mixed into Persian', () => {
    const text =
      'بر اساس METIORO و امتیازهای AC شما می‌توانید با احتیاط پیش بروید و گام بعدی را روشن کنید.';
    const result = checkResponseLanguage(text, 'fa');
    expect(result.ok).toBe(true);
  });

  it('accepts short text with expected script', () => {
    const result = checkResponseLanguage('پیش بروید', 'fa');
    expect(result.ok).toBe(true);
  });

  it('accepts short mostly-numeric text', () => {
    const result = checkResponseLanguage('42 / 58', 'fa');
    expect(result.ok).toBe(true);
  });

  it('always ok for en expected', () => {
    const result = checkResponseLanguage('Любой текст или فارسی', 'en');
    expect(result.ok).toBe(true);
  });
});

describe('extractUserFacingAskProse', () => {
  it('concatenates main prose fields', () => {
    const prose = extractUserFacingAskProse({
      executiveSummary: 'Summary one.',
      recommendation: 'Do this.',
      analysis: [{ title: 'Situation', body: 'Body text.' }],
      confidence: { explanation: 'Medium confidence.' },
    });
    expect(prose).toContain('Summary one.');
    expect(prose).toContain('Do this.');
    expect(prose).toContain('Situation');
    expect(prose).toContain('Body text.');
    expect(prose).toContain('Medium confidence.');
  });
});

describe('LANGUAGE_RETRY_INSTRUCTION', () => {
  it('has fa/ar/ru instructions', () => {
    expect(LANGUAGE_RETRY_INSTRUCTION.fa).toMatch(/فارسی/);
    expect(LANGUAGE_RETRY_INSTRUCTION.ar.length).toBeGreaterThan(20);
    expect(LANGUAGE_RETRY_INSTRUCTION.ru.length).toBeGreaterThan(20);
  });
});
