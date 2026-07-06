/**
 * METIORO logo — renders official SVG assets from /public.
 * Light: /metioro-logo.svg · Dark UI: /metioro-logo-dark.svg
 */

import Link from 'next/link';
import { BRAND, BRAND_I18N, type BrandLang } from '@/lib/brand';

export const METIORO_LOGO_SRC = '/metioro-logo.svg';
export const METIORO_LOGO_DARK_SRC = '/metioro-logo-dark.svg';

type BrandLogoProps = {
  lang?: BrandLang;
  href?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'shell';
  showTagline?: boolean;
  /** Use white wordmark variant for dark app chrome (default true). */
  onDark?: boolean;
  className?: string;
};

function logoHeight(size: BrandLogoProps['size'], showTagline: boolean): number {
  if (size === 'shell') return showTagline ? 86 : 68;
  if (size === 'lg') return showTagline ? 88 : 72;
  if (size === 'sm') return showTagline ? 48 : 56;
  return showTagline ? 64 : 52;
}

function logoWidth(size: BrandLogoProps['size'], showTagline: boolean): number {
  if (size === 'shell') return showTagline ? 300 : 88;
  if (size === 'lg') return showTagline ? 280 : 220;
  if (size === 'sm') return showTagline ? 160 : 80;
  return showTagline ? 240 : 180;
}

function LogoImage({
  size = 'md',
  showTagline = true,
  onDark = true,
  className = '',
}: Pick<BrandLogoProps, 'size' | 'showTagline' | 'onDark' | 'className'>) {
  const src = onDark ? METIORO_LOGO_DARK_SRC : METIORO_LOGO_SRC;
  const height = logoHeight(size, showTagline);
  const width = logoWidth(size, showTagline);

  return (
    <img
      src={src}
      alt={`${BRAND.name} — ${BRAND.appTagline}`}
      width={width}
      height={height}
      className={`shrink-0 block ${className}`}
      style={{
        height,
        width: 'auto',
        maxWidth: width,
        minWidth: showTagline ? undefined : 56,
        objectFit: 'contain',
        objectPosition: showTagline ? 'center' : 'left center',
      }}
    />
  );
}

export function BrandLogo({
  lang = 'en',
  href = '/home',
  size = 'md',
  showTagline = true,
  onDark = true,
  className = '',
}: BrandLogoProps) {
  const content = (
    <LogoImage
      size={size}
      showTagline={showTagline}
      onDark={onDark}
      className={className}
    />
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      className="inline-flex no-underline"
      aria-label={`${BRAND.name} — ${BRAND_I18N[lang].tagline}`}
    >
      {content}
    </Link>
  );
}
