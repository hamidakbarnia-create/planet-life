'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  COLORS,
  COLORS_RGBA,
  SURFACES,
  VAULT_PILL_STYLE,
} from '@/lib/brand-theme';

type NavKey =
  | 'today'
  | 'map'
  | 'ask'
  | 'people'
  | 'pathfinder'
  | 'world'
  | 'profile'
  | 'settings'
  | 'vault';

const DESKTOP_TABS: { href: string; key: NavKey; fallback: string }[] = [
  { href: '/home', key: 'today', fallback: 'Today' },
  { href: '/calendar', key: 'map', fallback: 'Map' },
  { href: '/ask', key: 'ask', fallback: 'Ask' },
  { href: '/people', key: 'people', fallback: 'People' },
  { href: '/pathfinder', key: 'pathfinder', fallback: 'Pathfinder' },
  { href: '/world', key: 'world', fallback: 'World' },
  { href: '/profile', key: 'profile', fallback: 'My Profile' },
  { href: '/settings', key: 'settings', fallback: 'Settings' },
];

const MOBILE_TABS: { href: string; key: NavKey; fallback: string }[] = [
  { href: '/home', key: 'today', fallback: 'Today' },
  { href: '/ask', key: 'ask', fallback: 'Ask' },
  { href: '/people', key: 'people', fallback: 'People' },
  { href: '/pathfinder', key: 'pathfinder', fallback: 'Pathfinder' },
  { href: '/profile', key: 'profile', fallback: 'My Profile' },
];

function NavIcon({ name, active, size = 22 }: { name: NavKey; active: boolean; size?: number }) {
  const stroke = active ? COLORS.goldMain : SURFACES.navInactive;
  const props = {
    width: size,
    height: size,
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
          <path d="M17.2 6.2l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z" />
        </svg>
      );
    case 'profile':
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
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={active ? COLORS.goldHighlight : COLORS.goldMain}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      );
  }
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/');
}

function SidebarLink({
  href,
  navKey,
  label,
  active,
}: {
  href: string;
  navKey: NavKey;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`metioro-sidebar__link ${active ? 'metioro-sidebar__link--active' : 'metioro-sidebar__link--idle'}`}
    >
      <span className="metioro-sidebar__icon" aria-hidden>
        <NavIcon name={navKey} active={active} size={24} />
      </span>
      <span className="metioro-sidebar__label fi">{label}</span>
    </Link>
  );
}

/** Desktop sidebar — hidden below 768px */
export function DesktopSidebar({ labels }: { labels?: Record<string, string> }) {
  const pathname = usePathname();

  return (
    <nav className="metioro-sidebar" aria-label="Main navigation">
      <div className="metioro-sidebar__inner">
        {DESKTOP_TABS.map((tab) => (
          <SidebarLink
            key={tab.href}
            href={tab.href}
            navKey={tab.key}
            label={labels?.[tab.href] ?? tab.fallback}
            active={isActive(pathname, tab.href)}
          />
        ))}
      </div>
    </nav>
  );
}

/** Mobile bottom tab bar — hidden at 768px and above */
export function MobileTabBar({ labels }: { labels?: Record<string, string> }) {
  const pathname = usePathname();

  return (
    <nav className="metioro-mobile-nav" aria-label="Mobile navigation">
      {MOBILE_TABS.map((tab) => {
        const active = isActive(pathname, tab.href);
        const label = labels?.[tab.href] ?? tab.fallback;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`metioro-mobile-nav__link ${active ? 'metioro-mobile-nav__link--active' : 'metioro-mobile-nav__link--idle'}`}
          >
            <span className="metioro-sidebar__icon" aria-hidden>
              <NavIcon name={tab.key} active={active} size={26} />
            </span>
            <span className="metioro-mobile-nav__label fi">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** @deprecated Use DesktopSidebar + MobileTabBar */
export function BottomNav({ labels }: { labels?: Record<string, string> }) {
  return (
    <>
      <DesktopSidebar labels={labels} />
      <MobileTabBar labels={labels} />
    </>
  );
}

export function VaultPill({ label }: { label?: string }) {
  return (
    <Link
      href="/vault"
      title="Open the Vault"
      className="no-underline inline-flex items-center gap-2 shrink-0 rounded-full transition-opacity hover:opacity-90"
      style={{
        ...VAULT_PILL_STYLE,
        paddingInline: '16px',
        paddingBlock: '8px',
        boxShadow: `0 0 18px ${COLORS_RGBA.goldMain18}`,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={COLORS.goldHighlight}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      <span className="fc text-[11px] font-semibold tracking-[0.18em] uppercase whitespace-nowrap">
        {label ?? 'Vault'}
      </span>
    </Link>
  );
}
