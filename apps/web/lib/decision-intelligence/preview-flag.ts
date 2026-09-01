/** Internal debug gate for Decision Intelligence preview. Default OFF. */

export const DECISION_SEMANTICS_PREVIEW_ENV =
  'NEXT_PUBLIC_DECISION_SEMANTICS_PREVIEW' as const;

export function isDecisionSemanticsPreviewEnabled(
  env: Partial<Record<string, string>> = {
    [DECISION_SEMANTICS_PREVIEW_ENV]:
      process.env.NEXT_PUBLIC_DECISION_SEMANTICS_PREVIEW,
  }
): boolean {
  return env[DECISION_SEMANTICS_PREVIEW_ENV] === 'true';
}
