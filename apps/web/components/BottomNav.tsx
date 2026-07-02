'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  COLORS,
  COLORS_RGBA,
  SURFACES,
  VAULT_PILL_GLOW,
  VAULT_PILL_STYLE,
} from '@/lib/brand-theme';

type NavKey =
  | 'today'
  | 'map'
  | 'ask'
  | 'people'
  | 'pathfinder'
  | 'world'
  | 'me'
  | 'settings'
  | 'vault';

const TABS: { href: string; key: NavKey; fallback: string }[] = [
  { href: '/home', key: 'today', fallback: 'Today' },
  { href: '/calendar', key: 'map', fallback: 'Map' },
  { href: '/ask', key: 'ask', fallback: 'Ask' },
  { href: '/people', key: 'people', fallback: 'People' },
  { href: '/pathfinder', key: 'pathfinder', fallback: 'Path' },
  { href: '/world', key: 'world', fallback: 'World' },
  { href: '/profile', key: 'me', fallback: 'Me' },
  { href: '/settings', key: 'settings', fallback: 'Settings' },
];

// Vault has been moved out of the sidebar list and promoted to a
// top-right header button (see AppShell + page-level navs). The icon
// component is still exported so headers can render the same lock SVG.

function NavIcon({ name, active }: { name: NavKey; active: boolean }) {
  const stroke = active ? COLORS.goldMain : SURFACES.navInactive;
  const props = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'today':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    case 'map':
      return (
        <svg {...props}>
          <path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z" />
          <path d="M9 4v14M15 6v14" />
        </svg>
      );
    case 'ask':
      return (
        <svg {...props}>
          <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
          <circle cx="18" cy="18" r="1" fill={stroke} />
        </svg>
      );
    case 'people':
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M15 20c0-2.5 2-4 4-4" />
        </svg>
      );
    case 'world':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
        </svg>
      );
    case 'pathfinder':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 13.5c4 2.2 10.5 1.2 17-3" />
          <path d="M4.5 9.5c5.3-1.7 10.2-.9 15 2.4" />
          <path d="M12 3.5c2.2 2.7 2.2 14.3 0 17" />
          <path d="M12 3.5c-2.2 2.7-2.2 14.3 0 17" />
          <path d="M17.2 6.2l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z" />
        </svg>
      );
    case 'me':
      return (
        <svg {...props}>
          <circle cx="12" cy="9" r="3.2" />
          <circle cx="12" cy="12" r="9" opacity="0.5" />
          <path d="M6 19c1.2-2.4 3.6-3.5 6-3.5s4.8 1.1 6 3.5" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      );
    case 'vault':
      return (
        <svg
          width={22}
          height={22}
          viewBox="0 0 24 24"
          fill="none"
          stroke={active ? COLORS.goldHighlight : COLORS.goldMain}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          <path
            d="M12 14.5c-.5-1-2-1-2 .2 0 1 1 1.6 2 2.3 1-.7 2-1.3 2-2.3 0-1.2-1.5-1.2-2-.2z"
            fill={active ? COLORS.goldHighlight : COLORS.goldMain}
          />
        </svg>
      );
  }
}

export function BottomNav({ labels }: { labels?: Record<string, string> }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed top-0 left-0 bottom-0 z-40 w-20 flex flex-col"
      style={{
        background:
          `linear-gradient(180deg, ${COLORS.navy} 0%, ${COLORS.black} 100%)`,
        backdropFilter: 'blur(16px)',
        borderRight: `1px solid ${COLORS_RGBA.goldMain12}`,
        direction: 'ltr',
        boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.02), 4px 0 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* subtle starfield accent */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            `radial-gradient(circle at 50% 20%, ${COLORS_RGBA.royalBlue12}, transparent 50%), radial-gradient(circle at 50% 85%, ${COLORS_RGBA.goldMain12}, transparent 50%)`,
        }}
      />

      <div className="relative flex flex-col gap-1 px-2 pt-16 pb-3 flex-1">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(tab.href + '/');
          const label = labels?.[tab.href] ?? tab.fallback;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="group flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl no-underline transition-all"
              style={{
                color: active ? COLORS.goldMain : SURFACES.navInactive,
                background: active
                  ? `linear-gradient(180deg, ${COLORS_RGBA.goldMain18}, ${COLORS_RGBA.goldMain12})`
                  : 'transparent',
                boxShadow: active
                  ? `inset 0 0 0 1px ${COLORS_RGBA.goldMain28}, 0 0 16px ${COLORS_RGBA.goldMain12}`
                  : 'none',
              }}
            >
              <NavIcon name={tab.key} active={active} />
              <span
                className="text-[10px] font-medium tracking-wide text-center leading-tight"
                style={{
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>

    </nav>
  );
}

/**
 * Top-right Vault entry button — Premium gold CTA.
 */
export function VaultPill({ label }: { label?: string }) {
  return (
    <Link
      href="/vault"
      title="Open the Vault"
      className="group relative no-underline inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all overflow-hidden"
      style={VAULT_PILL_STYLE}
    >
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: VAULT_PILL_GLOW,
          animation: 'vault-pill-pulse 2.4s ease-in-out infinite',
          opacity: 0.6,
        }}
      />
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={COLORS.goldHighlight}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative"
      >
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      <span
        className="relative fc text-[11px] font-semibold tracking-[0.18em] uppercase"
      >
        {label ?? 'Vault'}
      </span>
      <style>{`
        @keyframes vault-pill-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </Link>
  );
}
