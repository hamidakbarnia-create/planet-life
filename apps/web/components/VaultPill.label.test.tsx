import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { VaultPill } from '@/components/BottomNav';
import { HOME_LANGS } from '@/lib/home-i18n';

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

afterEach(() => {
  cleanup();
});

describe('VaultPill localized product labels', () => {
  it('uses گنجینه as the Persian visible Vault label and action tooltip', () => {
    render(
      <VaultPill
        label={HOME_LANGS.fa.nav['/vault']}
        title={HOME_LANGS.fa.nav.openVault}
      />
    );
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/vault');
    expect(link.textContent).toContain('گنجینه');
    expect(link.textContent).not.toContain('محرمانه');
    expect(link.textContent).not.toContain('خزانه');
    expect(link.getAttribute('title')).toBe('باز کردن گنجینه');
    expect(link.textContent).not.toMatch(/nav\.|openVault|\/vault/);
  });

  it('keeps EN, RU, and AR Vault labels unchanged', () => {
    const expected = [
      ['en', 'Vault', 'Open the Vault'],
      ['ru', 'Хранилище', 'Открыть хранилище'],
      ['ar', 'الخزانة', 'فتح الخزانة'],
    ] as const;

    for (const [lang, label, title] of expected) {
      cleanup();
      render(
        <VaultPill
          label={HOME_LANGS[lang].nav['/vault']}
          title={HOME_LANGS[lang].nav.openVault}
        />
      );
      const link = screen.getByRole('link');
      expect(link.textContent).toContain(label);
      expect(link.getAttribute('title')).toBe(title);
      expect(link.getAttribute('href')).toBe('/vault');
    }
  });
});
