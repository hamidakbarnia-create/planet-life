import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { BRAND } from '@/lib/brand';import { COLORS, COLORS_RGBA } from '@/lib/brand-theme';

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/cookies', label: 'Cookie Policy' },
  { href: '/disclaimer', label: 'Disclaimer' },
  { href: '/contact', label: 'Contact' },
] as const;

export function SiteFooter() {
  return (
    <footer
      className="border-t px-6 py-8"
      style={{ borderColor: COLORS_RGBA.white08, background: COLORS.black }}
    >
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 text-sm">
        <BrandLogo href="/" size="sm" showTagline onDark />
        <nav
          aria-label="Legal"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
        >
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors no-underline hover:opacity-100"
              style={{ color: COLORS_RGBA.white45 }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-center" style={{ color: COLORS_RGBA.white45 }}>
          {BRAND.name} © {new Date().getFullYear()} — {BRAND.tagline}
        </p>
      </div>
    </footer>
  );
}
