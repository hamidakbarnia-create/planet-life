import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  PREVIEW_MATRIX,
  TRADEOFF_LABELS,
} from './preview-fixtures';
import {
  catalogMessages,
  renderSemanticExplanation,
  SUPPORTED_LOCALES,
} from './semantic-render';

describe('semantic renderer catalogs', () => {
  it('web catalogs match decision_engine catalogs', () => {
    const root = resolve(__dirname, '../../../../packages/decision_engine/i18n/catalogs');
    for (const locale of SUPPORTED_LOCALES) {
      const engine = JSON.parse(
        readFileSync(resolve(root, `${locale}.json`), 'utf8')
      );
      const web = JSON.parse(
        readFileSync(resolve(__dirname, `./catalogs/${locale}.json`), 'utf8')
      );
      expect(web).toEqual(engine);
    }
  });

  it('matrix cases render in all locales without leftover slots', () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const [name, explanation] of Object.entries(PREVIEW_MATRIX)) {
        const rendered = renderSemanticExplanation(
          explanation,
          locale,
          name === 'tradeoff' || name === 'nearTie' ? TRADEOFF_LABELS : {}
        );
        expect(rendered.status, `${name} ${locale}`).toBe('ok');
        expect(rendered.headline).toBeTruthy();
        expect(rendered.headline).not.toContain('{');
        if (locale !== 'en') {
          expect(rendered.headline).not.toBe(
            renderSemanticExplanation(explanation, 'en', TRADEOFF_LABELS).headline
          );
        }
      }
    }
  });

  it('unsupported locale is unavailable, not English copy', () => {
    const rendered = renderSemanticExplanation(PREVIEW_MATRIX.strongAction, 'de');
    expect(rendered.status).toBe('unavailable');
    expect(rendered.headline).toBeNull();
  });

  it('every catalog message exists in all locales', () => {
    const en = catalogMessages('en');
    for (const locale of SUPPORTED_LOCALES) {
      const other = catalogMessages(locale);
      expect(Object.keys(other).sort()).toEqual(Object.keys(en).sort());
    }
  });
});
