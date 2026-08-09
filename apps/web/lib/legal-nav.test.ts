import { describe, expect, it } from 'vitest';
import {
  LEGAL_NAV_HREFS,
  LEGAL_NAV_LINKS,
  getLegalNavLinks,
} from './legal-nav';

describe('legal-nav localization', () => {
  it('keeps English labels and stable hrefs', () => {
    const en = getLegalNavLinks('en');
    expect(en.map((l) => l.href)).toEqual([...LEGAL_NAV_HREFS]);
    expect(en.map((l) => l.label)).toEqual([
      'Terms of Service',
      'Privacy Policy',
      'Cookie Policy',
      'Disclaimer',
      'Contact',
    ]);
    expect(LEGAL_NAV_LINKS.map((l) => l.href)).toEqual([...LEGAL_NAV_HREFS]);
  });

  it.each(['fa', 'ar', 'ru'] as const)(
    '%s labels differ from English while hrefs stay fixed',
    (lang) => {
      const links = getLegalNavLinks(lang);
      const en = getLegalNavLinks('en');
      expect(links.map((l) => l.href)).toEqual(en.map((l) => l.href));
      for (let i = 0; i < links.length; i++) {
        expect(links[i]!.label).not.toBe(en[i]!.label);
        expect(links[i]!.label.length).toBeGreaterThan(0);
      }
    }
  );
});
