/**
 * Shared intake field presentation helpers — known vs missing emphasis.
 * No semantic interpretation; UI chrome only.
 */

export function intakeControlClassName(opts: {
  known?: boolean;
  focusMissing?: boolean;
  optional?: boolean;
}): string {
  const base =
    'w-full rounded-xl border bg-black/30 px-3 py-2.5 fi text-sm text-white outline-none focus-visible:border-amber-400/50';
  if (opts.focusMissing) {
    return `${base} border-amber-400/55 ring-1 ring-amber-400/25`;
  }
  if (opts.known) {
    return `${base} border-white/15 bg-black/20 text-white/90`;
  }
  if (opts.optional) {
    return `${base} border-white/10 opacity-90`;
  }
  return `${base} border-white/10`;
}

export function intakeLabelClassName(opts: {
  known?: boolean;
  focusMissing?: boolean;
  optional?: boolean;
}): string {
  if (opts.focusMissing) {
    return 'fi text-sm text-amber-100/95';
  }
  if (opts.known) {
    return 'fi text-sm text-white/55';
  }
  if (opts.optional) {
    return 'fi text-sm text-white/45';
  }
  return 'fi text-sm text-white/75';
}

/** When required fields are complete, Continue is the primary action. */
export function intakePrimaryAction(
  requiredPresent: boolean
): 'complete' | 'save' {
  return requiredPresent ? 'complete' : 'save';
}

export function intakePrimaryButtonClassName(): string {
  return 'fc rounded-xl px-4 py-2.5 text-sm font-medium text-[#0a0f1c] disabled:cursor-not-allowed disabled:opacity-40';
}

export function intakeSecondaryButtonClassName(): string {
  return 'fc rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/85 disabled:cursor-not-allowed disabled:opacity-40';
}

export const intakePrimaryButtonStyle = {
  background: 'linear-gradient(135deg, #f2cf75, #d4af37)',
} as const;
