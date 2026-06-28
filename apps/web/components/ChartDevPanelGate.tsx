'use client';

import type { ChartData } from '@/lib/chart-types';
import { shouldRenderChartDevPanel } from '@/lib/chart-profile-ux';
import type { ProfileLang } from '@/lib/chart-profile-i18n';

type Props = { chart: ChartData; lang?: ProfileLang };

/**
 * Renders ChartDevPanel only when NODE_ENV === 'development'.
 * Uses a runtime require so production bundles omit the dev panel module.
 */
export function ChartDevPanelGate({ chart, lang = 'en' }: Props) {
  if (!shouldRenderChartDevPanel()) return null;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ChartDevPanel } = require('@/components/ChartDevPanel') as typeof import('@/components/ChartDevPanel');
  return <ChartDevPanel chart={chart} lang={lang} />;
}
