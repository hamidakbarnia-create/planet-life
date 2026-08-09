import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SiteFooter } from './SiteFooter';
import { BRAND_I18N } from '@/lib/brand';
import { LEGAL_NAV_HREFS, getLegalNavLinks } from '@/lib/legal-nav';

afterEach(() => cleanup());

describe('SiteFooter localization', () => {
  it.each(['en', 'fa', 'ar', 'ru'] as const)(
    'renders %s legal labels and tagline with unchanged hrefs',
    (lang) => {
      render(<SiteFooter lang={lang} />);
      const nav = screen.getByTestId('site-footer-legal-nav');
      const expected = getLegalNavLinks(lang);
      for (const link of expected) {
        expect(nav.textContent).toContain(link.label);
      }
      for (const href of LEGAL_NAV_HREFS) {
        const el = screen.getByTestId(
          `site-footer-link-${href.replace('/', '')}`
        );
        expect(el.getAttribute('href')).toBe(href);
      }
      expect(screen.getByTestId('site-footer-tagline').textContent).toContain(
        BRAND_I18N[lang].tagline
      );
    }
  );
});
