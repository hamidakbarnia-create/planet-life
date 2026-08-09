'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { BRAND, BRAND_I18N, type BrandLang } from '@/lib/brand';
import {
  getLegalNavAriaLabel,
  getLegalNavLinks,
} from '@/lib/legal-nav';
import { COLORS, COLORS_RGBA } from '@/lib/brand-theme';
import type { AppLang } from '@/lib/app-settings';
import { useAppLang } from '@/lib/use-app-lang';

export function SiteFooter({ lang: langProp }: { lang?: AppLang }) {
  const [hookLang] = useAppLang();
  const lang = langProp ?? hookLang;
  const links = getLegalNavLinks(lang);
  const tagline =
    BRAND_I18N[lang as BrandLang]?.tagline ?? BRAND_I18N.en.tagline;

  return (
    <footer
      className="border-t px-6 py-8"
      style={{ borderColor: COLORS_RGBA.white08, background: COLORS.black }}
      data-testid="site-footer"
      lang={lang}
    >
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 text-sm">
        <BrandLogo href="/" size="sm" showTagline onDark lang={lang as BrandLang} />
        <nav
          aria-label={getLegalNavAriaLabel(lang)}
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          data-testid="site-footer-legal-nav"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors no-underline hover:opacity-100"
              style={{ color: COLORS_RGBA.white45 }}
              data-testid={`site-footer-link-${link.href.replace('/', '')}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p
          className="text-center"
          style={{ color: COLORS_RGBA.white45 }}
          data-testid="site-footer-tagline"
        >
          {BRAND.name} © {new Date().getFullYear()} — {tagline}
        </p>
      </div>
    </footer>
  );
}
