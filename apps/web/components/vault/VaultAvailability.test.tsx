import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import VaultSectionPage from '@/app/vault/[section]/page';
import { VAULT_AVAILABILITY } from '@/lib/vault-availability';
import { PREVIEW_LOCK_LANGS } from '@/lib/vault-section-i18n';
import { loadAppLang } from '@/lib/calendar-preferences';
import { useParams } from 'next/navigation';

vi.mock('next/navigation', () => ({ useParams: vi.fn(() => ({ section: 'provider' })) }));
vi.mock('@/components/AppShell', () => ({ AppShell: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/lib/calendar-preferences', () => ({ loadAppLang: vi.fn(() => 'en'), saveAppLang: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); localStorage.clear(); });
for (const lang of ['en', 'ru', 'fa', 'ar'] as const) {
  for (const [section, available, upcoming] of [['provider', 4, 0], ['look', 4, 0], ['shadow', 3, 1], ['sensuality', 1, 3], ['power', 4, 0]] as const) {
    it(`${lang}/${section}: footer matches actual badges with no entitlement change`, async () => {
      vi.mocked(loadAppLang).mockReturnValue(lang);
      vi.mocked(useParams).mockReturnValue({ section });
      render(<VaultSectionPage />);
      const copy = VAULT_AVAILABILITY[lang];
      await waitFor(() => expect(screen.getByText(copy.summary(available, upcoming))).toBeTruthy());
      expect(screen.getAllByText(copy.live, { exact: true })).toHaveLength(available);
      expect(screen.queryAllByText(PREVIEW_LOCK_LANGS[lang].comingSoon, { exact: true })).toHaveLength(upcoming);
      expect(localStorage.getItem('planet-life-membership')).toBeNull();
    });
  }
}
