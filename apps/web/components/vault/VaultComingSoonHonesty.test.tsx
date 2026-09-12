import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VaultSectionPage from '@/app/vault/[section]/page';
import { PREVIEW_LOCK_LANGS, SECTION_LANGS } from '@/lib/vault-section-i18n';
import { loadAppLang } from '@/lib/calendar-preferences';
import { saveTier } from '@/lib/membership';
import { useParams } from 'next/navigation';

vi.mock('next/navigation', () => ({ useParams: vi.fn(() => ({ section: 'sensuality' })) }));
vi.mock('@/components/AppShell', () => ({ AppShell: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/lib/calendar-preferences', () => ({ loadAppLang: vi.fn(() => 'en'), saveAppLang: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

async function expandComingSoon(
  lang: 'en' | 'ru' | 'fa' | 'ar',
  section: 'sensuality' | 'shadow',
  itemIndex: number,
) {
  vi.mocked(loadAppLang).mockReturnValue(lang);
  vi.mocked(useParams).mockReturnValue({ section });
  render(<VaultSectionPage />);
  const label = SECTION_LANGS[lang][section].items[itemIndex].label;
  await waitFor(() => expect(screen.getByText(label)).toBeTruthy());
  fireEvent.click(screen.getByText(label));
  return waitFor(() => screen.getByTestId('vault-coming-soon-honesty'));
}

async function expandDeepFantasies(lang: 'en' | 'ru' | 'fa' | 'ar') {
  return expandComingSoon(lang, 'sensuality', 1);
}

for (const lang of ['en', 'ru', 'fa', 'ar'] as const) {
  it(`${lang}: expanded Coming Soon card says the tool is unimplemented and does not sell unlock`, async () => {
    const panel = await expandDeepFantasies(lang);
    const lock = PREVIEW_LOCK_LANGS[lang];
    expect(panel.textContent).toContain(lock.notBuiltTitle);
    expect(panel.textContent).toContain(lock.notBuiltBody);
    expect(panel.textContent).toContain(lock.membershipDoesNotActivate);
    expect(panel.querySelector('a[href="/upgrade"]')).toBeNull();
    expect(panel.textContent).not.toContain(lock.unlock);
    expect(panel.textContent).not.toContain(lock.teaser);
    expect(panel.textContent).not.toContain(lock.unlockedBadge);
    expect(panel.textContent).not.toContain(lock.unlockedNote);
  });
}

for (const lang of ['en', 'ru', 'fa', 'ar'] as const) {
  it(`${lang}: Private Conversation Timing Coming Soon card does not sell unlock`, async () => {
    const panel = await expandComingSoon(lang, 'shadow', 3);
    const lock = PREVIEW_LOCK_LANGS[lang];
    expect(panel.textContent).toContain(lock.notBuiltTitle);
    expect(panel.textContent).toContain(lock.notBuiltBody);
    expect(panel.textContent).toContain(lock.membershipDoesNotActivate);
    expect(panel.querySelector('a[href="/upgrade"]')).toBeNull();
    expect(panel.textContent).not.toContain(lock.unlock);
    expect(panel.textContent).not.toContain(lock.teaser);
  });
}

it('premium membership still shows Coming Soon honesty instead of Unlocked', async () => {
  saveTier('premium');
  const panel = await expandDeepFantasies('en');
  expect(panel.textContent).toContain(PREVIEW_LOCK_LANGS.en.notBuiltBody);
  expect(panel.textContent).not.toContain(PREVIEW_LOCK_LANGS.en.unlockedBadge);
  expect(panel.textContent).not.toContain(PREVIEW_LOCK_LANGS.en.unlockedNote);
  expect(panel.querySelector('a[href="/upgrade"]')).toBeNull();
  expect(localStorage.getItem('planet-life-membership')).toBe('premium');
});
