import { describe, expect, it } from 'vitest';
import {
  birthSignature,
  hasCompleteBirthData,
  resolveChartRequestIntent,
  resolveChartStatus,
  shouldAutoBuildChart,
} from '@/lib/profile-status';
import { PROFILE_LANGS, type ProfileLang } from '@/lib/profile-i18n';

const COMPLETE = {
  birthDate: '1988-03-02',
  birthTime: '09:15',
  location: 'Tehran',
};

const EMPTY = { birthDate: '', birthTime: '', location: '' };

describe('hasCompleteBirthData', () => {
  it('requires date, time and city together', () => {
    expect(hasCompleteBirthData(COMPLETE)).toBe(true);
    expect(hasCompleteBirthData(EMPTY)).toBe(false);
    expect(hasCompleteBirthData({ ...COMPLETE, location: '' })).toBe(false);
    expect(hasCompleteBirthData({ ...COMPLETE, birthTime: '' })).toBe(false);
    expect(hasCompleteBirthData({ ...COMPLETE, birthDate: '' })).toBe(false);
  });

  it('treats blank-only values as missing', () => {
    expect(hasCompleteBirthData({ ...COMPLETE, location: '   ' })).toBe(false);
  });
});

describe('resolveChartStatus', () => {
  const base = {
    profileLoaded: true,
    loading: false,
    hasChart: false,
    hasError: false,
    awaitingLocationConfirm: false,
    birth: COMPLETE,
  };

  it('reports missing-data instead of pending when birth data is absent', () => {
    // Regression: the hero previously showed "Awaiting chart" for a profile
    // that had no birth data at all, implying a chart was on its way.
    expect(resolveChartStatus({ ...base, birth: EMPTY })).toBe('missing-data');
  });

  it('stays pending until the persisted profile has loaded', () => {
    expect(
      resolveChartStatus({ ...base, profileLoaded: false, birth: EMPTY })
    ).toBe('pending');
  });

  it('reports pending when data is complete but no chart exists yet', () => {
    expect(resolveChartStatus(base)).toBe('pending');
  });

  it('reports loading, ready and error states', () => {
    expect(resolveChartStatus({ ...base, loading: true })).toBe('loading');
    expect(resolveChartStatus({ ...base, hasChart: true })).toBe('ready');
    expect(resolveChartStatus({ ...base, hasError: true })).toBe('error');
  });

  it('prefers ready over a stale error', () => {
    expect(
      resolveChartStatus({ ...base, hasChart: true, hasError: true })
    ).toBe('ready');
  });

  it('reports needs-location while a geocoded chart awaits confirmation', () => {
    // Regression: an auto-resumed geocoded_fallback chart reported the generic
    // "Awaiting chart", hiding the fact that the user had to confirm a city.
    expect(
      resolveChartStatus({ ...base, awaitingLocationConfirm: true })
    ).toBe('needs-location');
  });

  it('prefers an applied chart over a pending confirmation', () => {
    expect(
      resolveChartStatus({ ...base, awaitingLocationConfirm: true, hasChart: true })
    ).toBe('ready');
  });
});

describe('birthSignature', () => {
  it('ignores surrounding whitespace', () => {
    expect(birthSignature({ ...COMPLETE, location: ' Tehran ' })).toBe(
      birthSignature(COMPLETE)
    );
  });

  it('changes when any birth field changes', () => {
    const signature = birthSignature(COMPLETE);
    expect(birthSignature({ ...COMPLETE, location: 'Shiraz' })).not.toBe(signature);
    expect(birthSignature({ ...COMPLETE, birthTime: '09:16' })).not.toBe(signature);
    expect(birthSignature({ ...COMPLETE, birthDate: '1988-03-03' })).not.toBe(signature);
  });
});

describe('resolveChartRequestIntent', () => {
  it('confirms a retained chart instead of repeating the request', () => {
    // Regression: an auto-resumed geocoded_fallback result was discarded, so
    // pressing Create Chart re-issued an identical request to rebuild it.
    expect(
      resolveChartRequestIntent({
        pendingBirthSignature: birthSignature(COMPLETE),
        birth: COMPLETE,
      })
    ).toBe('confirm-retained');
  });

  it('requests a fresh chart when nothing is retained', () => {
    expect(
      resolveChartRequestIntent({ pendingBirthSignature: null, birth: COMPLETE })
    ).toBe('request');
  });

  it('never confirms a chart built from different birth inputs', () => {
    expect(
      resolveChartRequestIntent({
        pendingBirthSignature: birthSignature(COMPLETE),
        birth: { ...COMPLETE, location: 'Shiraz' },
      })
    ).toBe('request');
  });
});

describe('shouldAutoBuildChart', () => {
  const base = {
    profileLoaded: true,
    loading: false,
    hasChart: false,
    alreadyAttempted: false,
    birth: COMPLETE,
  };

  it('resumes a chart for a complete persisted profile', () => {
    // Regression: reloading /profile left a fully populated profile stuck on
    // "Awaiting chart" because nothing re-requested the chart.
    expect(shouldAutoBuildChart(base)).toBe(true);
  });

  it('never resumes without complete birth data', () => {
    expect(shouldAutoBuildChart({ ...base, birth: EMPTY })).toBe(false);
    expect(
      shouldAutoBuildChart({ ...base, birth: { ...COMPLETE, location: '' } })
    ).toBe(false);
  });

  it('does not resume before the profile has loaded', () => {
    expect(shouldAutoBuildChart({ ...base, profileLoaded: false })).toBe(false);
  });

  it('retries at most once so a failed request cannot loop', () => {
    expect(shouldAutoBuildChart({ ...base, alreadyAttempted: true })).toBe(false);
  });

  it('does not duplicate an in-flight or completed build', () => {
    expect(shouldAutoBuildChart({ ...base, loading: true })).toBe(false);
    expect(shouldAutoBuildChart({ ...base, hasChart: true })).toBe(false);
  });
});

describe('status localisation', () => {
  const langs: ProfileLang[] = ['en', 'ru', 'fa', 'ar'];

  it('defines the new status strings in every locale', () => {
    for (const lang of langs) {
      const t = PROFILE_LANGS[lang];
      expect(t.statusMissingData.trim()).not.toBe('');
      expect(t.statusError.trim()).not.toBe('');
      expect(t.missingBirthData.trim()).not.toBe('');
      expect(t.statusNeedsLocation.trim()).not.toBe('');
      expect(t.geocodeConfirmRequired.trim()).not.toBe('');
    }
  });

  it('does not fall back to English for ru/fa/ar', () => {
    const en = PROFILE_LANGS.en;
    for (const lang of ['ru', 'fa', 'ar'] as ProfileLang[]) {
      const t = PROFILE_LANGS[lang];
      expect(t.statusMissingData).not.toBe(en.statusMissingData);
      expect(t.missingBirthData).not.toBe(en.missingBirthData);
      expect(t.statusNeedsLocation).not.toBe(en.statusNeedsLocation);
      expect(t.geocodeConfirmRequired).not.toBe(en.geocodeConfirmRequired);
    }
  });
});
