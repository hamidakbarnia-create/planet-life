import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '@/components/AppShell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/ask',
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

describe('AppShell locale attributes', () => {
  afterEach(() => {
    cleanup();
  });

  it('sets lang on shell and main for Arabic (CSS activators; html stays untouched)', () => {
    const { container } = render(
      <AppShell lang="ar" setLang={() => {}} dir="rtl" navLabels={{}}>
        <div>محتوى</div>
      </AppShell>
    );

    const shell = container.querySelector('.metioro-shell');
    const main = container.querySelector('main.metioro-main');
    expect(shell?.getAttribute('lang')).toBe('ar');
    expect(main?.getAttribute('lang')).toBe('ar');
    expect(main?.getAttribute('dir')).toBe('rtl');
    // Shell chrome geometry stays LTR regardless of content language.
    expect(shell?.getAttribute('dir')).toBe('ltr');
    expect(screen.getByText('محتوى')).toBeTruthy();
  });

  it('sets lang=fa on shell/main for Persian', () => {
    const { container } = render(
      <AppShell lang="fa" setLang={() => {}} dir="rtl" navLabels={{}}>
        <div>محتوا</div>
      </AppShell>
    );
    expect(container.querySelector('.metioro-shell')?.getAttribute('lang')).toBe(
      'fa'
    );
    expect(container.querySelector('main.metioro-main')?.getAttribute('lang')).toBe(
      'fa'
    );
  });
});
