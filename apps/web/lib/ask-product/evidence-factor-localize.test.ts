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
        contribution: 2.1,
        importance: 'high',
      });
      expect(result.title).toBe(getAskProductCopy(lang).evidenceDetailUnavailable);
      expect(result.title).not.toMatch(/Mercury|Transit|square/i);
      expect(result.detail).toBeTruthy();
      expect(result.detail).not.toMatch(/Mercury|Transit|square/i);
      expect(result.detail).toContain(getAskProductCopy(lang).evidenceSupportive);
      expect(result.detail).toContain(getAskProductCopy(lang).importance.high);
    }
  );

  it('unknown FA caution rows differ by contribution/importance metadata', () => {
    const a = localizeEvidenceFactor('fa', undefined, {
      polarity: 'cautionary',
      label: 'Pace',
      contribution: -1.4,
      importance: 'medium',
    });
    const b = localizeEvidenceFactor('fa', undefined, {
      polarity: 'cautionary',
      label: 'Structure',
      contribution: -0.9,
      importance: 'low',
    });
    const c = localizeEvidenceFactor('fa', undefined, {
      polarity: 'cautionary',
      label: 'Clarity',
      contribution: -1.1,
      importance: 'medium',
    });
    expect(a.title).toBe(b.title);
    expect(a.detail).not.toEqual(b.detail);
    expect(a.detail).not.toEqual(c.detail);
    expect(b.detail).not.toEqual(c.detail);
    expect(`${a.detail}${b.detail}${c.detail}`).not.toMatch(/Pace|Structure|Clarity/);
  });

  it('known factor_key ignores fallback metadata for title', () => {
    const result = localizeEvidenceFactor('fa', 'aspect.mercury.square.saturn', {
      polarity: 'cautionary',
      label: 'Pace',
      contribution: -1.4,
      importance: 'medium',
    });
    expect(result.title).toContain('عطارد');
    expect(result.title).not.toBe(getAskProductCopy('fa').evidenceDetailUnavailable);
    expect(result.detail).toBeUndefined();
  });

  it('EN unknown key may use package label', () => {
    const result = localizeEvidenceFactor('en', 'unknown.factor', {
      polarity: 'cautionary',
      label: 'Visibility',
    });
    expect(result.title).toBe('Visibility');
  });
});
