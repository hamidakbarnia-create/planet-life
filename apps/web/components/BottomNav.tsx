'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/home', label: 'Home', icon: '☀' },
  { href: '/calendar', label: 'Calendar', icon: '▦' },
  { href: '/people', label: 'People', icon: '◇' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
  { href: '/profile', label: 'Profile', icon: '◎' },
] as const;

export function BottomNav({ labels }: { labels?: Record<string, string> }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10"
      style={{
        background: 'rgba(7,11,20,0.92)',
        backdropFilter: 'blur(12px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="max-w-xl mx-auto flex justify-around items-stretch h-14 px-1">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(tab.href + '/');
          const label = labels?.[tab.href] ?? tab.label;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 no-underline transition-colors"
              style={{
                color: active ? '#fbbf24' : 'rgba(255,255,255,0.4)',
              }}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              <span className="text-[9px] font-medium tracking-wide">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
