import { describe, expect, it } from 'vitest';
import { splitPaletteNames, swatchHexForPaletteName } from './vault-color-swatches';

describe('vault color swatches', () => {
  it('maps known EN/RU/FA/AR names and leaves unknown names as text', () => {
    expect(swatchHexForPaletteName('Stone beige')).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(swatchHexForPaletteName('Каменный беж')).toBe(swatchHexForPaletteName('Stone beige'));
    expect(swatchHexForPaletteName('بژ سنگی')).toBe(swatchHexForPaletteName('Stone beige'));
    expect(swatchHexForPaletteName('بيج حجري')).toBe(swatchHexForPaletteName('Stone beige'));
    expect(swatchHexForPaletteName('Not A Real Color')).toBeNull();
    expect(splitPaletteNames('Stone beige · Navy')).toEqual(['Stone beige', 'Navy']);
  });
});
