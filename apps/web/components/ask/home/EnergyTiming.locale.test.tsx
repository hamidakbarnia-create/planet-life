import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { EnergyWidget } from './EnergyWidget';
import { TimingWidget } from './TimingWidget';
import { getAskHomeCopy } from '@/lib/ask-home';
import { formatHourLabel } from '@/lib/calendar-scores';

afterEach(() => cleanup());

describe('Energy/Timing locale-sensitive chrome', () => {
  it('re-resolves titles/prefixes/hour labels when locale props change', () => {
    const en = getAskHomeCopy('en');
    const fa = getAskHomeCopy('fa');
    const hourLabelEn = formatHourLabel(14, 'en');
    const hourLabelFa = formatHourLabel(14, 'fa');

    const { rerender } = render(
      <>
        <EnergyWidget
          title={en.energyTitle}
          description={en.energyDescription}
          bestWindowPrefix={en.energyBestWindow}
          seeDetailsLabel={en.energySeeDetails}
          state={{
            score: 72,
            loading: false,
            description: en.energyDescription,
            bestWindowLabel: hourLabelEn,
            detailsHref: '/home',
          }}
        />
        <TimingWidget
          title={en.timingTitle}
          bestWindowPrefix={en.timingBestWindow}
          state={{
            loading: false,
            points: [
              { hour: 14, label: hourLabelEn, score: 72, isBest: true },
            ],
            bestWindowLabel: hourLabelEn,
            emptyLabel: en.timingEmpty,
          }}
        />
      </>
    );

    expect(screen.getByText(en.energyTitle)).toBeTruthy();
    expect(screen.getByText(en.timingTitle)).toBeTruthy();

    rerender(
      <>
        <EnergyWidget
          title={fa.energyTitle}
          description={fa.energyDescription}
          bestWindowPrefix={fa.energyBestWindow}
          seeDetailsLabel={fa.energySeeDetails}
          state={{
            score: 72,
            loading: false,
            description: fa.energyDescription,
            bestWindowLabel: hourLabelFa,
            detailsHref: '/home',
          }}
        />
        <TimingWidget
          title={fa.timingTitle}
          bestWindowPrefix={fa.timingBestWindow}
          state={{
            loading: false,
            points: [
              { hour: 14, label: hourLabelFa, score: 72, isBest: true },
            ],
            bestWindowLabel: hourLabelFa,
            emptyLabel: fa.timingEmpty,
          }}
        />
      </>
    );

    expect(screen.getByText(fa.energyTitle)).toBeTruthy();
    expect(screen.getByText(fa.timingTitle)).toBeTruthy();
    expect(screen.getByText(fa.energyDescription)).toBeTruthy();
    expect(screen.queryByText(en.energyTitle)).toBeNull();
    expect(screen.queryByText(en.timingTitle)).toBeNull();
  });
});
