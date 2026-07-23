import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { DesktopSidebar, MobileTabBar } from '@/components/BottomNav';
import { HOME_LANGS } from '@/lib/home-i18n';

const pathnameRef = { current: '/home' };

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameRef.current,
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('MobileTabBar', () => {
  beforeEach(() => {
    pathnameRef.current = '/home';
  });

  afterEach(() => {
    cleanup();
  });

  it('renders preferred mobile tabs including Calendar and More', () => {
    render(<MobileTabBar labels={HOME_LANGS.en.nav} dir="ltr" />);
    const nav = screen.getByRole('navigation', { name: /mobile navigation/i });
    const labels = within(nav)
      .getAllByRole('link')
      .map((el) => el.textContent?.trim())
      .concat(within(nav).getByRole('button', { name: /more/i }).textContent?.trim());

    expect(labels).toEqual(['Today', 'Calendar', 'Ask', 'People', 'More']);
    expect(within(nav).queryByRole('link', { name: /pathfinder/i })).toBeNull();
    expect(within(nav).getByRole('link', { name: /calendar/i }).getAttribute('href')).toBe(
      '/calendar'
    );
  });

  it('keeps More active on More destinations and opens all destinations', () => {
    pathnameRef.current = '/pathfinder';
    render(<MobileTabBar labels={HOME_LANGS.en.nav} dir="ltr" />);

    const more = screen.getByRole('button', { name: /more/i });
    expect(more.className).toMatch(/active/);

    fireEvent.click(more);
    const dialog = screen.getByRole('dialog', { name: /more/i });
    const hrefs = within(dialog)
      .getAllByRole('link')
      .map((el) => el.getAttribute('href'));

    expect(hrefs).toEqual([
      '/pathfinder',
      '/world',
      '/vault',
      '/profile',
      '/settings',
      '/upgrade',
    ]);
  });

  it('applies RTL dir for FA/AR tab ordering', () => {
    render(<MobileTabBar labels={HOME_LANGS.fa.nav} dir="rtl" />);
    const nav = screen.getByRole('navigation', { name: /mobile navigation/i });
    expect(nav.getAttribute('dir')).toBe('rtl');
    expect(within(nav).getByRole('button', { name: 'بیشتر' })).toBeTruthy();
    expect(within(nav).getByRole('link', { name: 'تقویم' })).toBeTruthy();
  });

  it('localizes compact More labels across EN/FA/AR/RU', () => {
    for (const [lang, expected] of [
      ['en', 'More'],
      ['fa', 'بیشتر'],
      ['ar', 'المزيد'],
      ['ru', 'Ещё'],
    ] as const) {
      cleanup();
      render(
        <MobileTabBar
          labels={HOME_LANGS[lang].nav}
          dir={HOME_LANGS[lang].dir}
        />
      );
      expect(screen.getByRole('button', { name: expected })).toBeTruthy();
    }
  });
});

describe('DesktopSidebar', () => {
  afterEach(() => {
    cleanup();
  });

  it('preserves full desktop module set including World and Settings', () => {
    pathnameRef.current = '/home';
    render(<DesktopSidebar labels={HOME_LANGS.en.nav} />);
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    const hrefs = within(nav)
      .getAllByRole('link')
      .map((el) => el.getAttribute('href'));

    expect(hrefs).toEqual([
      '/home',
      '/calendar',
      '/ask',
      '/people',
      '/pathfinder',
      '/world',
      '/profile',
      '/settings',
    ]);
    expect(within(nav).getByRole('link', { name: /calendar/i })).toBeTruthy();
  });
});
