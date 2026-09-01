import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  formatTimingStrength,
  splitPrefixedNumericSequence,
} from './product-copy';
import { getAskProductCopy } from '@/lib/ask-product';

const DIRECTION_CONTROLS =
  /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/;

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      walkTsFiles(full, out);
    } else if (
      /\.(ts|tsx)$/.test(name) &&
      !name.includes('.test.') &&
      (name.includes('i18n') ||
        name.includes('copy') ||
        name.includes('chrome') ||
        name.endsWith('-langs.ts'))
    ) {
      out.push(full);
    }
  }
  return out;
}

describe('splitPrefixedNumericSequence', () => {
  it('leaves unprefixed timing strength intact', () => {
    expect(splitPrefixedNumericSequence(formatTimingStrength(66))).toEqual({
      prefix: '',
      sequence: '66 / 100',
    });
  });

  it('splits Evaluate prefixes from the fraction', () => {
    const expected = {
      en: '66 / 100',
      ru: '66 / 100',
      fa: '۶۶ / ۱۰۰',
      ar: '٦٦ / ١٠٠',
    } as const;
    for (const lang of ['en', 'fa', 'ar', 'ru'] as const) {
      const formatted = getAskProductCopy(lang).timingScoreOf(66);
      const split = splitPrefixedNumericSequence(formatted);
      expect(split.sequence).toBe(expected[lang]);
      expect(split.prefix + split.sequence).toBe(formatted);
      expect(split.prefix).toContain(getAskProductCopy(lang).timingScoreLabel);
    }
  });
});

describe('catalogs stay free of raw Unicode direction controls', () => {
  it('does not scatter LRM/RLM/embedding marks in copy catalogs', () => {
    const roots = [
      resolve(__dirname, '..'),
      resolve(__dirname, '../../app'),
    ];
    const files = roots.flatMap((root) => walkTsFiles(root));
    expect(files.length).toBeGreaterThan(8);
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(DIRECTION_CONTROLS);
    }
  });
});
