'use client';

import { LtrNumericSequence } from '@/components/ui/LtrNumericSequence';
import type { AppLang } from '@/lib/app-settings';
import { splitPowerBandLabel } from '@/lib/calendar-page-i18n';
import type { CountedPowerBand } from '@/lib/calendar-power-presentation';

export function PowerBandLabel({
  lang,
  band,
}: {
  lang: AppLang;
  band: CountedPowerBand;
}) {
  const { before, range, after } = splitPowerBandLabel(lang, band);

  return (
    <span data-power-band-label={band}>
      {before}
      <LtrNumericSequence kind="interval">{range}</LtrNumericSequence>
      {after}
    </span>
  );
}
