/**
 * Presentation-only safeguard helpers.
 * Collapse exact repeats; never drop a distinct localized warning.
 */

export function normalizeComparableText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** True when the localized statement is already present; no English-only keywords. */
export function statementAlreadyPresent(
  haystack: string | undefined | null,
  statement: string | undefined | null,
): boolean {
  const h = normalizeComparableText(haystack ?? '');
  const s = normalizeComparableText(statement ?? '');
  if (!h || !s) return false;
  return h.includes(s);
}

/**
 * Known localized forms of the same predictive-validity warning.
 * Used only to omit a duplicate line — never to hide a distinct limitation.
 */
const VALIDITY_WARNING_FORMS = [
  'predictive validity has not been established',
  'predictive validity is unestablished',
  'predictive reliability is unvalidated',
  'предсказательная достоверность не подтверждена',
  'прогностическая достоверность не установлена',
  'надёжность прогноза не подтверждена',
  'اعتبار پیش‌بینی تأیید نشده است',
  'لم تثبت صلاحية هذه القراءة للتنبؤ',
  'لم تثبت صلاحيتها للتنبؤ',
  'موثوقية التنبؤ غير مثبتة',
];

/** True when the limitation already states the same validity warning. */
export function validityWarningAlreadyPresent(
  limitation: string | undefined | null,
  evidence: string | undefined | null,
): boolean {
  if (statementAlreadyPresent(limitation, evidence)) return true;
  const haystack = normalizeComparableText(limitation ?? '');
  if (!haystack) return false;
  return VALIDITY_WARNING_FORMS.some((form) => haystack.includes(form));
}

function stripTrailingPunctuation(value: string): string {
  return value.replace(/[.!?…؟]+$/u, '').trim();
}

/** Hide Overall Situation only for a complete normalized duplicate; keep extra content. */
export function interpretationRepeatsAction(
  interpretation: string | undefined | null,
  action: string | undefined | null,
): boolean {
  const left = stripTrailingPunctuation(normalizeComparableText(interpretation ?? ''));
  const right = stripTrailingPunctuation(normalizeComparableText(action ?? ''));
  if (!left || !right) return false;
  return left === right;
}

function splitSafeguardSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…؟])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Keep first occurrence of each sentence after locale-safe normalization. */
export function uniqueSentences(
  parts: Array<string | null | undefined>,
): string[] {
  const unique: string[] = [];
  for (const part of parts) {
    if (!part?.trim()) continue;
    for (const sentence of splitSafeguardSentences(part)) {
      if (
        unique.some(
          (existing) =>
            normalizeComparableText(existing) ===
            normalizeComparableText(sentence),
        )
      ) {
        continue;
      }
      unique.push(sentence);
    }
  }
  return unique;
}

/** Drop exact semicolon clauses; keep distinct evidence text. */
export function collapseRepeatedReason(reason: string): string {
  const arabic = reason.includes('؛');
  const sep = arabic ? '؛' : ';';
  const join = arabic ? '؛ ' : '; ';
  const unique: string[] = [];
  for (const clause of reason.split(sep).map((part) => part.trim()).filter(Boolean)) {
    if (
      unique.some(
        (existing) =>
          normalizeComparableText(existing) === normalizeComparableText(clause),
      )
    ) {
      continue;
    }
    unique.push(clause);
  }
  return unique.join(join);
}
