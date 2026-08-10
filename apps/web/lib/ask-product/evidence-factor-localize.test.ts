import { describe, expect, it } from 'vitest';
import {
  localizeEvidenceFactor,
  tryLocalizeFactorKey,
} from './evidence-factor-localize';
import { getAskProductCopy } from './copy';

describe('evidence factor localization catalog', () => {
  it('localizes aspect / house / angular / retrograde / electional keys', () => {
    expect(tryLocalizeFactorKey('en', 'aspect.mercury.square.saturn')?.title).toBe(
      'Transit Mercury square natal Saturn'
    );
    expect(tryLocalizeFactorKey('fa', 'aspect.mercury.square.saturn')?.title).toContain(
      'عطارد'
    );
    expect(tryLocalizeFactorKey('en', 'house.natal.mercury.10')?.title).toBe(
      'Natal Mercury in 10th house'
    );
    expect(tryLocalizeFactorKey('en', 'house.transit.mercury.12.retrograde')?.title).toBe(
      'Retrograde Mercury in 12th house'
    );
    expect(tryLocalizeFactorKey('en', 'angular.jupiter.mc')?.title).toBe('Jupiter near MC');
    expect(tryLocalizeFactorKey('en', 'retrograde.mercury')?.title).toBe(
      'Mercury retrograde'
    );
    expect(
      tryLocalizeFactorKey('en', 'electional.location_mode.eventlocation')?.title
    ).toBe('Timed for event location');
  });

  it('returns null for unknown catalog keys', () => {
    expect(tryLocalizeFactorKey('en', 'aspect.mercury.banana.saturn')).toBeNull();
    expect(tryLocalizeFactorKey('en', 'made.up.key')).toBeNull();
    expect(tryLocalizeFactorKey('en', '')).toBeNull();
  });

  it.each(['fa', 'ar', 'ru'] as const)(
    'uses honest unavailable fallback for %s without English label dump',
    (lang) => {
      const result = localizeEvidenceFactor(lang, undefined, {
        polarity: 'supportive',
        label: 'Transit Mercury square natal Saturn',
      });
      expect(result.title).toBe(getAskProductCopy(lang).evidenceDetailUnavailable);
      expect(result.title).not.toMatch(/Mercury|Transit|square/i);
    }
  );

  it('EN unknown key may use package label', () => {
    const result = localizeEvidenceFactor('en', 'unknown.factor', {
      polarity: 'cautionary',
      label: 'Visibility',
    });
    expect(result.title).toBe('Visibility');
  });
});
