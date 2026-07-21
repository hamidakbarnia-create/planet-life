/**
 * Post-generation language validation for Ask (and similar) prose.
 * Heuristic script detection — no external deps.
 */

import type { AppLang } from '@/lib/app-settings';

export type { AppLang };

export type LanguageCheckResult = {
  ok: boolean;
  dominant: 'en' | 'fa' | 'ar' | 'ru' | 'mixed' | 'unknown';
  reason?: string;
};

/** Retry instruction appended as an extra user message on language mismatch. */
export const LANGUAGE_RETRY_INSTRUCTION: Record<'fa' | 'ar' | 'ru', string> = {
  fa: 'مهم: تمام متن‌های کاربرپسند پاسخ (خلاصه اجرایی، توصیه، تحلیل، سناریوها، برنامه اقدام، توضیح اطمینان) را فقط به زبان فارسی بنویس. از انگلیسی برای نثر کاربرپسند استفاده نکن. نام‌های تجاری مانند METIORO و فیلدهای JSON انگلیسی مجازند.',
  ar: 'مهم: اكتب كل النصوص الموجّهة للمستخدم في الرد (الملخص التنفيذي، التوصية، التحليل، السيناريوهات، خطة العمل، شرح الثقة) بالعربية فقط. لا تستخدم الإنجليزية للنثر الموجّه للمستخدم. أسماء العلامات مثل METIORO وحقول JSON الإنجليزية مسموحة.',
  ru: 'Важно: весь пользовательский текст ответа (executive summary, recommendation, analysis, scenarios, action plan, confidence explanation) напишите только на русском. Не используйте английский для пользовательской прозы. Бренды вроде METIORO и английские JSON-поля допустимы.',
};

const ARABIC_PERSIAN = /[\u0600-\u06FF]/g;
const CYRILLIC = /[\u0400-\u04FF]/g;
const LATIN = /[A-Za-z]/g;
/** Persian-specific letters (pe, che, zhe, gaf, Persian kaf/yeh). */
const PERSIAN_MARKERS = /[\u067E\u0686\u0698\u06AF\u06A9\u06CC]/g;
/** Arabic-specific letters (teh marbuta, alef variants, Arabic yeh/kaf, yeh hamza). */
const ARABIC_MARKERS = /[\u0622\u0623\u0625\u0629\u0626\u0649\u064A\u0643]/g;

/** Strip tokens that should not count against language scoring. */
function stripAllowlisted(text: string): string {
  return text
    .replace(/\bMETIORO\b/gi, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, ' ')
    .replace(/\b(?:MC|AC|DC|IC)\b/g, ' ')
    .replace(/\b[\w.-]+\.(?:com|org|net|io|co|dev|app|ai)\S*/gi, ' ')
    .replace(/\b[A-Z]{1,5}\b/g, ' ');
}

function countMatches(text: string, re: RegExp): number {
  const m = text.match(re);
  return m ? m.length : 0;
}

function scriptCounts(stripped: string) {
  const arabicPersian = countMatches(stripped, ARABIC_PERSIAN);
  const cyrillic = countMatches(stripped, CYRILLIC);
  const latin = countMatches(stripped, LATIN);
  const letters = arabicPersian + cyrillic + latin;
  return { arabicPersian, cyrillic, latin, letters };
}

function dominantFromCounts(
  counts: ReturnType<typeof scriptCounts>,
  expected: AppLang
): LanguageCheckResult['dominant'] {
  const { arabicPersian, cyrillic, latin, letters } = counts;
  if (letters === 0) return 'unknown';

  // Script families (fa/ar share Arabic/Persian script — do not double-count).
  const families: { id: 'en' | 'arabic' | 'ru'; count: number }[] = [
    { id: 'en', count: latin },
    { id: 'arabic', count: arabicPersian },
    { id: 'ru', count: cyrillic },
  ];
  const ranked = [...families].sort((a, b) => b.count - a.count);
  const top = ranked[0]!;
  const second = ranked[1]!;
  const topRatio = top.count / letters;
  const secondRatio = second.count / letters;

  if (topRatio >= 0.25 && secondRatio >= 0.25 && topRatio - secondRatio < 0.15) {
    return 'mixed';
  }

  if (top.id === 'ru') return 'ru';
  if (top.id === 'arabic') return expected === 'ar' ? 'ar' : 'fa';
  if (top.id === 'en') return 'en';
  return 'unknown';
}

function expectedScriptPresent(
  counts: ReturnType<typeof scriptCounts>,
  expected: AppLang
): boolean {
  if (expected === 'fa' || expected === 'ar') return counts.arabicPersian > 0;
  if (expected === 'ru') return counts.cyrillic > 0;
  return counts.latin > 0;
}

function mostlyNonLetters(stripped: string, letters: number): boolean {
  const nonSpace = stripped.replace(/\s+/g, '').length;
  if (nonSpace === 0) return true;
  return letters / nonSpace < 0.35;
}

/**
 * Check whether `text` is acceptably in `expected` language.
 * English expected → always ok.
 */
export function checkResponseLanguage(
  text: string,
  expected: AppLang
): LanguageCheckResult {
  if (expected === 'en') {
    return { ok: true, dominant: 'en' };
  }

  const stripped = stripAllowlisted(text);
  const counts = scriptCounts(stripped);
  const dominant = dominantFromCounts(counts, expected);

  // Short texts: ok if any expected script present OR mostly numbers/symbols
  if (stripped.replace(/\s+/g, '').length < 40) {
    if (
      expectedScriptPresent(counts, expected) ||
      mostlyNonLetters(stripped, counts.letters)
    ) {
      return { ok: true, dominant };
    }
    return {
      ok: false,
      dominant,
      reason: 'short_text_missing_expected_script',
    };
  }

  if (counts.letters === 0) {
    return { ok: true, dominant: 'unknown' };
  }

  const latinRatio = counts.latin / counts.letters;
  const expectedRatio =
    expected === 'ru'
      ? counts.cyrillic / counts.letters
      : counts.arabicPersian / counts.letters;

  // English-dominant fail for fa/ar/ru
  if (latinRatio > 0.65 && expectedRatio < 0.2) {
    return {
      ok: false,
      dominant,
      reason: 'english_dominant',
    };
  }

  if (expectedRatio < 0.2 && latinRatio > 0.5) {
    return {
      ok: false,
      dominant,
      reason: 'expected_script_too_low',
    };
  }

  // fa ≠ ar: shared script family must not pass sibling-language prose
  if (expected === 'fa' || expected === 'ar') {
    const faMarks = countMatches(stripped, PERSIAN_MARKERS);
    const arMarks = countMatches(stripped, ARABIC_MARKERS);
    if (expected === 'fa' && arMarks >= 3 && arMarks > faMarks * 2) {
      return {
        ok: false,
        dominant: 'ar',
        reason: 'arabic_when_persian_expected',
      };
    }
    if (expected === 'ar' && faMarks >= 3 && faMarks > arMarks * 2) {
      return {
        ok: false,
        dominant: 'fa',
        reason: 'persian_when_arabic_expected',
      };
    }
  }

  return { ok: true, dominant };
}

/** True when Latin letters dominate prose after allowlist stripping. */
export function isEnglishDominantProse(text: string): boolean {
  const stripped = stripAllowlisted(text);
  const counts = scriptCounts(stripped);
  if (counts.letters === 0) return false;
  const latinRatio = counts.latin / counts.letters;
  const otherRatio =
    Math.max(counts.arabicPersian, counts.cyrillic) / counts.letters;
  return latinRatio > 0.65 && otherRatio < 0.2;
}

/**
 * Concatenate main user-facing Ask prose fields for language checking.
 */
export function extractUserFacingAskProse(result: {
  executiveSummary?: string;
  recommendation?: string;
  analysis?: { title: string; body: string }[];
  scenarios?: {
    bestCase?: { outcome?: string; mitigation?: string };
    mostLikely?: { outcome?: string; mitigation?: string };
    downsideCase?: { outcome?: string; mitigation?: string };
  };
  actionPlan?: {
    now?: { action?: string; purpose?: string }[];
    next7Days?: { action?: string; purpose?: string }[];
    next30Days?: { action?: string; purpose?: string }[];
  };
  confidence?: { explanation?: string };
  followUpQuestions?: string[];
}): string {
  const parts: string[] = [];
  if (result.executiveSummary) parts.push(result.executiveSummary);
  if (result.recommendation) parts.push(result.recommendation);
  for (const section of result.analysis ?? []) {
    if (section.title) parts.push(section.title);
    if (section.body) parts.push(section.body);
  }
  const scenarios = result.scenarios;
  if (scenarios) {
    for (const key of ['bestCase', 'mostLikely', 'downsideCase'] as const) {
      const block = scenarios[key];
      if (block?.outcome) parts.push(block.outcome);
      if (block?.mitigation) parts.push(block.mitigation);
    }
  }
  const plan = result.actionPlan;
  if (plan) {
    for (const bucket of [plan.now, plan.next7Days, plan.next30Days]) {
      for (const item of bucket ?? []) {
        if (item.action) parts.push(item.action);
        if (item.purpose) parts.push(item.purpose);
      }
    }
  }
  if (result.confidence?.explanation) parts.push(result.confidence.explanation);
  for (const q of result.followUpQuestions ?? []) {
    if (q) parts.push(q);
  }
  return parts.join('\n');
}
