import type { Metadata } from 'next';
import { BRAND } from './brand';

/** METIORO brand mark — icon extracted from official logo. */
export const BRAND_FAVICON = '/brand/favicon.svg';
export const METIORO_LOGO = '/metioro-logo.svg';

export const rootMetadata: Metadata = {
  metadataBase: new URL(BRAND.siteUrl),
  applicationName: BRAND.name,
  title: {
    default: BRAND.name,
    template: `%s — ${BRAND.name}`,
  },
  description: BRAND.description,
  icons: {
    icon: [{ url: BRAND_FAVICON, type: 'image/svg+xml' }],
    shortcut: BRAND_FAVICON,
    apple: BRAND_FAVICON,
  },
  alternates: {
    canonical: BRAND.siteUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BRAND.siteUrl,
    siteName: BRAND.name,
    title: BRAND.name,
    description: BRAND.description,
  },
  twitter: {
    card: 'summary',
    title: BRAND.name,
    description: BRAND.description,
  },
};

export function legalPageMetadata(
  title: string,
  description: string,
  path: string
): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: `${BRAND.siteUrl}${path}`,
    },
    openGraph: {
      title: `${title} — ${BRAND.name}`,
      description,
      url: `${BRAND.siteUrl}${path}`,
      siteName: BRAND.name,
    },
    twitter: {
      card: 'summary',
      title: `${title} — ${BRAND.name}`,
      description,
    },
  };
}
