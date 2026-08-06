'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
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
  | 'calendar'
  | 'ask'
  | 'people'
  | 'pathfinder'
  | 'world'
  | 'profile'
  | 'settings'
  | 'vault'
  | 'upgrade'
  | 'more';

const DESKTOP_TABS: { href: string; key: NavKey; fallback: string }[] = [
  { href: '/home', key: 'today', fallback: 'Today' },
  { href: '/calendar', key: 'calendar', fallback: 'Calendar' },
  { href: '/ask', key: 'ask', fallback: 'Ask' },
  { href: '/people', key: 'people', fallback: 'People' },
  { href: '/pathfinder', key: 'pathfinder', fallback: 'Pathfinder' },
  { href: '/world', key: 'world', fallback: 'World' },
  { href: '/profile', key: 'profile', fallback: 'My Profile' },
  { href: '/settings', key: 'settings', fallback: 'Settings' },
];

/** Primary mobile bottom tabs (order is logical; CSS `dir` mirrors for RTL). */
const MOBILE_TABS: { href: string; key: NavKey; fallback: string }[] = [
  { href: '/home', key: 'today', fallback: 'Today' },
  { href: '/calendar', key: 'calendar', fallback: 'Calendar' },
  { href: '/ask', key: 'ask', fallback: 'Ask' },
  { href: '/people', key: 'people', fallback: 'People' },
];

const MORE_DESTINATIONS: { href: string; key: NavKey; fallback: string }[] = [
  { href: '/pathfinder', key: 'pathfinder', fallback: 'Pathfinder' },
  { href: '/world', key: 'world', fallback: 'World' },
  { href: '/vault', key: 'vault', fallback: 'Vault' },
  { href: '/profile', key: 'profile', fallback: 'My Profile' },
  { href: '/settings', key: 'settings', fallback: 'Settings' },
  { href: '/upgrade', key: 'upgrade', fallback: 'Upgrade' },
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
    case 'calendar':
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
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
    case 'upgrade':
      return (
        <svg {...props}>
          <path d="M12 3l3.2 6.5L22 10.8l-5 4.9 1.2 7L12 19.3 5.8 22.7 7 15.7l-5-4.9 6.8-1.3L12 3z" />
        </svg>
      );
    case 'more':
      return (
        <svg {...props}>
          <circle cx="5" cy="12" r="1.6" fill={stroke} />
          <circle cx="12" cy="12" r="1.6" fill={stroke} />
          <circle cx="19" cy="12" r="1.6" fill={stroke} />
        </svg>
      );
  }
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/');
}

function isMoreRouteActive(pathname: string): boolean {
  return MORE_DESTINATIONS.some((item) => isActive(pathname, item.href));
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
export function MobileTabBar({
  labels,
  dir = 'ltr',
}: {
  labels?: Record<string, string>;
  dir?: 'ltr' | 'rtl';
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [pathnameAtRender, setPathnameAtRender] = useState(pathname);
  const morePanelId = useId();
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const morePanelRef = useRef<HTMLDivElement>(null);
  const moreActive = isMoreRouteActive(pathname);

  // Reset open state when the route changes (back/forward, tab links, etc.)
  // without a pathname→setState effect (react-hooks/set-state-in-effect).
  if (pathname !== pathnameAtRender) {
    setPathnameAtRender(pathname);
    if (moreOpen) {
      setMoreOpen(false);
    }
  }

  const closeMore = useCallback(() => setMoreOpen(false), []);

  useEffect(() => {
    if (!moreOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMore();
        moreButtonRef.current?.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    const firstLink = morePanelRef.current?.querySelector<HTMLElement>('a');
    firstLink?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [moreOpen, closeMore]);

  const moreLabel = labels?.more ?? 'More';

  return (
    <>
      {moreOpen ? (
        <div className="metioro-more-sheet" role="presentation">
          <button
            type="button"
            className="metioro-more-sheet__backdrop"
            aria-label="Close menu"
            onClick={closeMore}
          />
          <div
            ref={morePanelRef}
            id={morePanelId}
            className="metioro-more-sheet__panel"
            role="dialog"
            aria-modal="true"
            aria-label={moreLabel}
            dir={dir}
          >
            <ul className="metioro-more-sheet__list">
              {MORE_DESTINATIONS.map((item) => {
                const active = isActive(pathname, item.href);
                const label = labels?.[item.href] ?? item.fallback;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`metioro-more-sheet__link ${active ? 'metioro-more-sheet__link--active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      onClick={closeMore}
                    >
                      <span className="metioro-more-sheet__icon" aria-hidden>
                        <NavIcon name={item.key} active={active} size={22} />
                      </span>
                      <span className="metioro-more-sheet__label fi">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}

      <nav className="metioro-mobile-nav" aria-label="Mobile navigation" dir={dir}>
        {MOBILE_TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          const label = labels?.[tab.href] ?? tab.fallback;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`metioro-mobile-nav__link ${active ? 'metioro-mobile-nav__link--active' : 'metioro-mobile-nav__link--idle'}`}
              aria-current={active ? 'page' : undefined}
              onClick={closeMore}
            >
              <span className="metioro-sidebar__icon" aria-hidden>
                <NavIcon name={tab.key} active={active} size={26} />
              </span>
              <span className="metioro-mobile-nav__label fi">{label}</span>
            </Link>
          );
        })}
        <button
          ref={moreButtonRef}
          type="button"
          className={`metioro-mobile-nav__link metioro-mobile-nav__button ${
            moreOpen || moreActive
              ? 'metioro-mobile-nav__link--active'
              : 'metioro-mobile-nav__link--idle'
          }`}
          aria-expanded={moreOpen}
          aria-controls={morePanelId}
          aria-haspopup="dialog"
          onClick={() => setMoreOpen((open) => !open)}
        >
          <span className="metioro-sidebar__icon" aria-hidden>
            <NavIcon name="more" active={moreOpen || moreActive} size={26} />
          </span>
          <span className="metioro-mobile-nav__label fi">{moreLabel}</span>
        </button>
      </nav>
    </>
  );
}

/** @deprecated Use DesktopSidebar + MobileTabBar */
export function BottomNav({
  labels,
  dir = 'ltr',
}: {
  labels?: Record<string, string>;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <>
      <DesktopSidebar labels={labels} />
      <MobileTabBar labels={labels} dir={dir} />
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
