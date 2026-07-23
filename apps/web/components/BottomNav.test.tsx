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
  it('closes More sheet when a destination is selected and keeps the href', () => {
    render(<MobileTabBar labels={HOME_LANGS.en.nav} dir="ltr" />);
    fireEvent.click(screen.getByRole('button', { name: /more/i }));
    expect(screen.getByRole('dialog', { name: /more/i })).toBeTruthy();

    const world = screen.getByRole('link', { name: /world/i });
    expect(world.getAttribute('href')).toBe('/world');
    fireEvent.click(world);

    expect(screen.queryByRole('dialog', { name: /more/i })).toBeNull();
    expect(screen.getByRole('button', { name: /more/i }).getAttribute('aria-expanded')).toBe(
      'false'
    );
  });

  it('can reopen More after closing via a destination', () => {
    render(<MobileTabBar labels={HOME_LANGS.en.nav} dir="ltr" />);
    const more = screen.getByRole('button', { name: /more/i });
    fireEvent.click(more);
    fireEvent.click(screen.getByRole('link', { name: /settings/i }));
    expect(screen.queryByRole('dialog', { name: /more/i })).toBeNull();

    fireEvent.click(more);
    expect(screen.getByRole('dialog', { name: /more/i })).toBeTruthy();
    expect(
      within(screen.getByRole('dialog', { name: /more/i }))
        .getAllByRole('link')
        .map((el) => el.getAttribute('href'))
    ).toEqual(['/pathfinder', '/world', '/vault', '/profile', '/settings', '/upgrade']);
  });

  it('closes More when a primary tab is clicked and keeps Calendar/Today/Ask/People', () => {
    render(<MobileTabBar labels={HOME_LANGS.en.nav} dir="ltr" />);
    fireEvent.click(screen.getByRole('button', { name: /more/i }));
    expect(screen.getByRole('dialog', { name: /more/i })).toBeTruthy();

    const calendar = screen.getByRole('link', { name: /^calendar$/i });
    expect(calendar.getAttribute('href')).toBe('/calendar');
    fireEvent.click(calendar);
    expect(screen.queryByRole('dialog', { name: /more/i })).toBeNull();

    const nav = screen.getByRole('navigation', { name: /mobile navigation/i });
    expect(within(nav).getByRole('link', { name: /^today$/i })).toBeTruthy();
    expect(within(nav).getByRole('link', { name: /^ask$/i })).toBeTruthy();
    expect(within(nav).getByRole('link', { name: /^people$/i })).toBeTruthy();
  });

  it('closes More when the route changes without a destination click', () => {
    const { rerender } = render(<MobileTabBar labels={HOME_LANGS.en.nav} dir="ltr" />);
    fireEvent.click(screen.getByRole('button', { name: /more/i }));
    expect(screen.getByRole('dialog', { name: /more/i })).toBeTruthy();

    pathnameRef.current = '/ask';
    rerender(<MobileTabBar labels={HOME_LANGS.en.nav} dir="ltr" />);
    expect(screen.queryByRole('dialog', { name: /more/i })).toBeNull();
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
