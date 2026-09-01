import { LtrNumericSequence } from '@/components/ui/LtrNumericSequence';
import {
  formatTimingStrength,
  splitPrefixedNumericSequence,
} from '@/lib/decision-intelligence/product-copy';

/** Renders shared `N / 100` timing-strength text with LTR isolation. */
export function TimingStrengthText({
  score,
  formatted,
}: {
  score?: number;
  formatted?: string | null;
}) {
  const value =
    formatted ?? (score == null ? null : formatTimingStrength(score));
  if (!value) return null;
  const { prefix, sequence } = splitPrefixedNumericSequence(value);
  return (
    <>
      {prefix}
      <LtrNumericSequence kind="fraction">{sequence}</LtrNumericSequence>
    </>
  );
}
