import { describe, expect, it } from 'vitest';
import {
  ARABIC_TYPE,
  TYPE_SCALE,
  TYPE_WEIGHT,
  TYPOGRAPHY,
  brandBodyFont,
  brandHeadingFont,
  localeFcFiCss,
  localeFontFamily,
} from '@/lib/brand-theme';

describe('locale typography', () => {
  it('resolves Arabic to IBM Plex Sans Arabic and rejects Inter/Vazirmatn overrides', () => {
    expect(TYPOGRAPHY.bodyAr).toContain('--font-ibm-plex-sans-arabic');
    expect(TYPOGRAPHY.bodyAr).toContain('Noto Sans Arabic');
    expect(TYPOGRAPHY.bodyAr.toLowerCase()).not.toContain('cairo');
    expect(TYPOGRAPHY.bodyAr).not.toContain('Inter');
    expect(localeFontFamily('ar')).toBe(TYPOGRAPHY.bodyAr);
    expect(brandBodyFont('ar', 'Inter, sans-serif')).toBe(TYPOGRAPHY.bodyAr);
    expect(brandBodyFont('ar', 'Vazirmatn, sans-serif')).toBe(TYPOGRAPHY.bodyAr);
    expect(brandHeadingFont('ar')).toBe(TYPOGRAPHY.bodyAr);
  });

  it('resolves Persian to Vazirmatn and rejects Inter overrides', () => {
    expect(localeFontFamily('fa')).toBe(TYPOGRAPHY.bodyRtl);
    expect(brandBodyFont('fa', 'Inter, sans-serif')).toBe(TYPOGRAPHY.bodyRtl);
    expect(TYPOGRAPHY.bodyRtl).toContain('--font-vazirmatn');
  });

  it('resolves EN/RU to loaded Geist/Sora stacks (not bare Inter)', () => {
    expect(TYPOGRAPHY.chromeLtr).toBe(TYPOGRAPHY.body);
    expect(TYPOGRAPHY.chromeLtr).toContain('--font-geist-sans');
    expect(TYPOGRAPHY.chromeLtr).not.toContain('Inter');
    expect(TYPOGRAPHY.brand).toContain('--font-sora');
    expect(localeFontFamily('en')).toBe(TYPOGRAPHY.chromeLtr);
    expect(localeFontFamily('ru')).toBe(TYPOGRAPHY.chromeLtr);
    expect(brandHeadingFont('en')).toBe(TYPOGRAPHY.brand);
    expect(brandHeadingFont('ru')).toBe(TYPOGRAPHY.brand);
    expect(brandBodyFont('en')).toBe(TYPOGRAPHY.body);
  });

  it('exposes Arabic readability targets without global word-spacing inflation', () => {
    expect(TYPE_SCALE.body).toBe(16);
    expect(TYPE_SCALE.caption).toBe(12);
    expect(TYPE_WEIGHT.regular).toBe(400);
    expect(TYPE_WEIGHT.semibold).toBe(600);
    expect(ARABIC_TYPE.lineHeightBody).toBeGreaterThanOrEqual(1.7);
    expect(ARABIC_TYPE.lineHeightBody).toBeLessThanOrEqual(1.9);
    expect(ARABIC_TYPE.minBodyPx).toBe(16);
    expect(ARABIC_TYPE.wordSpacingBody).toBe('0.01em');
  });

  it('emits locale fc/fi CSS from next/font stacks only', () => {
    const ar = localeFcFiCss('ar');
    expect(ar).toContain('--font-ibm-plex-sans-arabic');
    expect(ar).toContain(`line-height:${ARABIC_TYPE.lineHeightBody}`);
    expect(ar).toContain('word-spacing:0');
    expect(ar).not.toContain('Cinzel');
    expect(ar).not.toContain('Inter');

    const en = localeFcFiCss('en');
    expect(en).toContain('--font-sora');
    expect(en).toContain('--font-geist-sans');
    expect(en).not.toContain('Cinzel');
    expect(en).not.toContain('Inter');
  });
});
