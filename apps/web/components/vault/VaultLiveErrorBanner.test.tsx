import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import VaultSectionPage from '@/app/vault/[section]/page';
import { VaultLiveErrorBanner } from './VaultLiveErrorBanner';
import {
  READING_UI,
  SECTION_LANGS,
} from '@/lib/vault-section-i18n';
import { saveBirthProfile } from '@/lib/birth-profile';
import { loadAppLang } from '@/lib/calendar-preferences';
import type { VaultRequestErrorKind } from '@/lib/vault-reading';

vi.mock('next/navigation', () => ({
  useParams: () => ({ section: 'power' }),
  usePathname: () => '/vault/power',
}));
vi.mock('@/lib/calendar-preferences', async (original) => ({
  ...(await original<object>()),
  loadAppLang: vi.fn(() => 'en'),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const KINDS: VaultRequestErrorKind[] = [
  'auth',
  'forbidden',
  'rateLimit',
  'validation',
  'rejected',
  'service',
  'network',
];

const STATUS: Record<Exclude<VaultRequestErrorKind, 'network'>, number> = {
  auth: 401,
  forbidden: 403,
  rateLimit: 429,
  validation: 422,
  rejected: 400,
  service: 503,
};

describe('VaultLiveErrorBanner rendered copy', () => {
  it('renders localized classified messages without port-8000 copy', () => {
    for (const lang of ['en', 'fa', 'ru', 'ar'] as const) {
      for (const kind of KINDS) {
        const { container, unmount } = render(
          <VaultLiveErrorBanner kind={kind} copy={READING_UI[lang]} />,
        );
        const node = screen.getByTestId(`vault-reading-${kind}-error`);
        expect(node.textContent).toBe(
          {
            auth: READING_UI[lang].authError,
            forbidden: READING_UI[lang].forbiddenError,
            rateLimit: READING_UI[lang].rateLimitError,
            validation: READING_UI[lang].validationError,
            rejected: READING_UI[lang].rejectedError,
            service: READING_UI[lang].serviceError,
            network: READING_UI[lang].networkError,
          }[kind],
        );
        expect(container.textContent).not.toMatch(/8000|۸۰۰۰/);
        if (kind === 'forbidden') {
          expect(container.textContent?.toLowerCase()).not.toMatch(
            /sign in again|دوباره وارد شوید|войдите снова|تسجيل الدخول مرة أخرى ثم/,
          );
        }
        if (kind === 'auth') {
          expect(container.textContent).toMatch(
            /Sign in again|دوباره وارد شوید|Войдите снова|تسجيل الدخول مرة أخرى/,
          );
        }
        if (kind === 'validation' || kind === 'rejected') {
          expect(container.textContent?.toLowerCase()).not.toMatch(
            /invalid birth|تولد نامعتبر/,
          );
        }
        unmount();
      }
    }
  });
});

describe('Vault section page rendered error states', () => {
  it('renders each classified HTTP and network failure from the shared fetcher', async () => {
    saveBirthProfile({
      birth_date: '1990-06-15',
      birth_time: '12:00',
      location: '51.5074,-0.1278',
      action_type: 'business_launch',
    });
    const cases: Array<{
      kind: VaultRequestErrorKind;
      fetchImpl: () => Promise<unknown>;
    }> = [
      ...Object.entries(STATUS).map(([kind, status]) => ({
        kind: kind as VaultRequestErrorKind,
        fetchImpl: async () => ({
          ok: false,
          status,
          json: async () => ({ detail: 'ignored-internal' }),
        }),
      })),
      {
        kind: 'network',
        fetchImpl: async () => {
          throw new TypeError('Failed to fetch');
        },
      },
    ];

    for (const { kind, fetchImpl } of cases) {
      vi.mocked(loadAppLang).mockReturnValue('en');
      vi.stubGlobal('fetch', vi.fn(fetchImpl));
      const { unmount } = render(<VaultSectionPage />);
      fireEvent.click(screen.getByText(SECTION_LANGS.en.power.items[0].label));
      const node = await waitFor(() =>
        screen.getByTestId(`vault-reading-${kind}-error`),
      );
      expect(node.textContent).toBe(
        {
          auth: READING_UI.en.authError,
          forbidden: READING_UI.en.forbiddenError,
          rateLimit: READING_UI.en.rateLimitError,
          validation: READING_UI.en.validationError,
          rejected: READING_UI.en.rejectedError,
          service: READING_UI.en.serviceError,
          network: READING_UI.en.networkError,
        }[kind],
      );
      expect(node.textContent).not.toMatch(/8000|ignored-internal/);
      unmount();
      vi.unstubAllGlobals();
    }
  });
});
