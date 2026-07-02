/**
 * METIORO Brand Identity v1.0 — design tokens.
 * Single source for colors, gradients, typography, tier styling, and copy.
 */

import type { CSSProperties } from 'react';
import type { MembershipTier } from './membership';
import { BRAND, BRAND_I18N, type BrandLang } from './brand';

export { BRAND, BRAND_I18N, type BrandLang };

/** Core palette — locked brand colors */
export const COLORS = {
  royalBlue: '#305CDE',
  navy: '#0B1736',
  white: '#FFFFFF',
  lightGray: '#F6F8FC',
  gray: '#E6EAF1',
  charcoal: '#1A2333',
  black: '#0A0F1C',
  goldHighlight: '#F2CF75',
  goldMain: '#D4AF37',
  goldShadow: '#B59410',
} as const;

/** RGBA helpers for glows, borders, and overlays */
export const COLORS_RGBA = {
  royalBlue12: 'rgba(48,92,222,0.12)',
  royalBlue18: 'rgba(48,92,222,0.18)',
  royalBlue28: 'rgba(48,92,222,0.28)',
  royalBlue45: 'rgba(48,92,222,0.45)',
  navy80: 'rgba(11,23,54,0.80)',
  goldHighlight15: 'rgba(242,207,117,0.15)',
  goldHighlight22: 'rgba(242,207,117,0.22)',
  goldMain12: 'rgba(212,175,55,0.12)',
  goldMain18: 'rgba(212,175,55,0.18)',
  goldMain28: 'rgba(212,175,55,0.28)',
  goldMain45: 'rgba(212,175,55,0.45)',
  goldShadow10: 'rgba(181,148,16,0.10)',
  white04: 'rgba(255,255,255,0.04)',
  white06: 'rgba(255,255,255,0.06)',
  white08: 'rgba(255,255,255,0.08)',
  white10: 'rgba(255,255,255,0.10)',
  white45: 'rgba(255,255,255,0.45)',
  white60: 'rgba(255,255,255,0.60)',
  white70: 'rgba(255,255,255,0.70)',
  charcoal70: 'rgba(26,35,51,0.70)',
} as const;

/** Brand gradients */
export const GRADIENTS = {
  gold: `linear-gradient(135deg, ${COLORS.goldHighlight}, ${COLORS.goldMain}, ${COLORS.goldShadow})`,
  goldHorizontal: `linear-gradient(90deg, ${COLORS.goldHighlight}, ${COLORS.goldMain}, ${COLORS.goldShadow})`,
  goldSubtle: `linear-gradient(135deg, ${COLORS_RGBA.goldHighlight15}, ${COLORS_RGBA.goldMain12})`,
  goldGlow: `linear-gradient(135deg, rgba(242,207,117,0.28), rgba(212,175,55,0.22))`,
  royalBlue: `linear-gradient(135deg, ${COLORS.royalBlue}, #2548B0)`,
  royalBlueSubtle: `linear-gradient(135deg, ${COLORS_RGBA.royalBlue18}, rgba(48,92,222,0.08))`,
  navySurface: `linear-gradient(135deg, rgba(11,23,54,0.92), rgba(10,15,28,0.92))`,
  cardSurface: `linear-gradient(135deg, rgba(26,35,51,0.72), rgba(11,23,54,0.72))`,
  vipSurface: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.black})`,
  pageAmbient: `radial-gradient(ellipse 70% 50% at 50% 0%, ${COLORS_RGBA.royalBlue12}, transparent 60%), radial-gradient(ellipse 50% 40% at 70% 60%, ${COLORS_RGBA.goldMain12}, transparent 60%), radial-gradient(ellipse 50% 40% at 30% 80%, ${COLORS_RGBA.navy80}, transparent 60%)`,
  vaultAmbient: `radial-gradient(ellipse 60% 40% at 50% 0%, ${COLORS_RGBA.goldMain18}, transparent 60%), radial-gradient(ellipse 50% 50% at 50% 100%, ${COLORS_RGBA.goldShadow10}, transparent 60%)`,
} as const;

/** Typography — Sora for brand LTR; RTL keeps existing Arabic/Persian stacks */
export const TYPOGRAPHY = {
  brand: "var(--font-sora), var(--font-geist-sans), sans-serif",
  body: "var(--font-geist-sans), sans-serif",
  bodyRtl: "var(--font-vazirmatn), var(--font-cairo), var(--font-geist-sans), sans-serif",
  bodyAr: "var(--font-cairo), var(--font-vazirmatn), sans-serif",
  mono: "var(--font-geist-mono), monospace",
} as const;

export function brandHeadingFont(lang: BrandLang): string {
  if (lang === 'ar') return TYPOGRAPHY.bodyAr;
  if (lang === 'fa') return TYPOGRAPHY.bodyRtl;
  return TYPOGRAPHY.brand;
}

export function brandBodyFont(lang: BrandLang, override?: string): string {
  if (override) return override;
  if (lang === 'ar') return TYPOGRAPHY.bodyAr;
  if (lang === 'fa') return TYPOGRAPHY.bodyRtl;
  return TYPOGRAPHY.body;
}

/** Tier visual system */
export type TierKey = MembershipTier;

export interface TierTheme {
  tint: string;
  ring: string;
  glow: string;
  badgeBg: string;
  badgeText: string;
  ctaBg: string;
  ctaBorder: string;
  ctaText: string;
  popular?: boolean;
}

export const TIER_THEME: Record<TierKey, TierTheme> = {
  free: {
    tint: COLORS.gray,
    ring: COLORS_RGBA.white10,
    glow: COLORS_RGBA.white06,
    badgeBg: COLORS_RGBA.white06,
    badgeText: COLORS_RGBA.white60,
    ctaBg: COLORS_RGBA.white04,
    ctaBorder: COLORS_RGBA.white08,
    ctaText: COLORS_RGBA.white70,
  },
  pro: {
    tint: COLORS.royalBlue,
    ring: COLORS_RGBA.royalBlue45,
    glow: COLORS_RGBA.royalBlue18,
    badgeBg: COLORS_RGBA.royalBlue18,
    badgeText: '#93B4FF',
    ctaBg: GRADIENTS.royalBlueSubtle,
    ctaBorder: COLORS_RGBA.royalBlue45,
    ctaText: '#93B4FF',
    popular: true,
  },
  premium: {
    tint: COLORS.goldMain,
    ring: COLORS_RGBA.goldMain45,
    glow: COLORS_RGBA.goldMain18,
    badgeBg: GRADIENTS.gold,
    badgeText: COLORS.navy,
    ctaBg: GRADIENTS.goldGlow,
    ctaBorder: COLORS_RGBA.goldMain45,
    ctaText: COLORS.goldHighlight,
  },
  vip: {
    tint: COLORS.goldHighlight,
    ring: COLORS_RGBA.goldMain45,
    glow: COLORS_RGBA.goldMain28,
    badgeBg: COLORS.navy,
    badgeText: COLORS.goldHighlight,
    ctaBg: GRADIENTS.vipSurface,
    ctaBorder: COLORS_RGBA.goldMain45,
    ctaText: COLORS.goldHighlight,
  },
};

export function getTierTheme(tier: TierKey): TierTheme {
  return TIER_THEME[tier];
}

/** Header tier pill styles */
export function tierBadgeStyle(tier: TierKey): React.CSSProperties {
  const theme = TIER_THEME[tier];
  if (tier === 'free') {
    return {
      border: `1px solid ${COLORS_RGBA.white10}`,
      background: COLORS_RGBA.white04,
      color: COLORS_RGBA.white60,
    };
  }
  if (tier === 'pro') {
    return {
      border: `1px solid ${COLORS_RGBA.royalBlue28}`,
      background: COLORS_RGBA.royalBlue12,
      color: '#93B4FF',
    };
  }
  if (tier === 'premium') {
    return {
      border: `1px solid ${COLORS_RGBA.goldMain28}`,
      background: COLORS_RGBA.goldMain12,
      color: COLORS.goldHighlight,
    };
  }
  return {
    border: `1px solid ${theme.ring}`,
    background: COLORS.navy,
    color: theme.tint,
    boxShadow: `0 0 12px ${theme.glow}`,
  };
}

/** Focus ring for interactive brand elements */
export function focusRingStyle(accent: string = COLORS.royalBlue): CSSProperties {
  return {
    outline: 'none',
    boxShadow: `0 0 0 2px ${COLORS.black}, 0 0 0 4px ${accent}`,
  };
}

/** Vault / Premium CTA pill (header) */
export const VAULT_PILL_STYLE: CSSProperties = {
  background: GRADIENTS.goldSubtle,
  border: `1px solid ${COLORS_RGBA.goldMain45}`,
  color: COLORS.goldHighlight,
  boxShadow: `0 0 18px ${COLORS_RGBA.goldMain18}, inset 0 0 0 1px rgba(255,255,255,0.05)`,
};

export const VAULT_PILL_GLOW = `radial-gradient(circle at 50% 50%, ${COLORS_RGBA.goldMain28}, transparent 70%)`;

/** Primary CTA button base */
export function primaryCtaStyle(variant: 'royal' | 'gold' = 'royal'): CSSProperties {
  if (variant === 'gold') {
    return {
      background: GRADIENTS.gold,
      border: `1px solid ${COLORS_RGBA.goldMain45}`,
      color: COLORS.navy,
    };
  }
  return {
    background: GRADIENTS.royalBlue,
    border: `1px solid ${COLORS_RGBA.royalBlue45}`,
    color: COLORS.white,
  };
}

/** App shell surfaces */
export const SURFACES = {
  appBackground: COLORS.black,
  headerBorder: COLORS_RGBA.white08,
  navActive: COLORS.goldMain,
  navInactive: COLORS_RGBA.white45,
  signInBorder: COLORS_RGBA.royalBlue45,
  signInBg: COLORS_RGBA.royalBlue12,
  signInText: '#93B4FF',
  langActiveBorder: COLORS_RGBA.royalBlue45,
  langActiveBg: COLORS_RGBA.royalBlue12,
  langActiveText: '#93B4FF',
} as const;
