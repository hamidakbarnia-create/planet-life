import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VaultSectionPage from '@/app/vault/[section]/page';
import { AppShell } from '@/components/AppShell';
import { SECTION_LANGS } from '@/lib/vault-section-i18n';
import { saveBirthProfile } from '@/lib/birth-profile';
import { loadAppLang } from '@/lib/calendar-preferences';

vi.mock('next/navigation', () => ({ useParams: () => ({ section: 'power' }), usePathname: () => '/vault/power' }));
vi.mock('@/lib/calendar-preferences', async (original) => ({ ...await original<object>(), loadAppLang: vi.fn(() => 'en') }));
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
const labels = { en: 'Mixed / proceed with awareness', ru: 'Неоднозначно / действуйте осмотрительно', fa: 'ترکیبی؛ با دقت پیش بروید', ar: 'متباين؛ المتابعة بحذر' };
const free = { en: 'FREE', ru: 'Бесплатно', fa: 'رایگان', ar: 'مجاني' };
for (const lang of ['en', 'ru', 'fa', 'ar'] as const) {
  it(`${lang}: Yes Day API label survives actual page parsing and renders without the legacy enum`, async () => {
    vi.mocked(loadAppLang).mockReturnValue(lang);
    saveBirthProfile({ birth_date: '1990-06-15', birth_time: '12:00', location: '51.5074,-0.1278', action_type: 'business_launch' });
    const slot = { date: '2026-09-10', score: 57, confidence: 'low', action_type: 'negotiation', rating: 'Mixed / Proceed with Awareness', rating_label: labels[lang] };
    const response = { planet: 'yes', lang, verdict: { ask: slot, commit: slot, sign: slot, window_relationship: 'independent' }, reading: { headline: 'Symbolic windows', executive: 'Independent windows', evidence_status: 'unvalidated', confidence_basis: 'unvalidated_symbolic_guidance', limitation: 'A symbolic prompt, not a prediction.', action: 'Review the actual stage.' } };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => response });
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<VaultSectionPage />);
    await waitFor(() => expect(screen.getByText(SECTION_LANGS[lang].power.items[3].label)).toBeTruthy());
    fireEvent.click(screen.getByText(SECTION_LANGS[lang].power.items[3].label));
    await waitFor(() => expect(container.textContent).toContain(labels[lang]));
    expect(container.textContent).not.toContain('Mixed / Proceed with Awareness');
    expect(container.textContent).not.toContain('high — clear enough to act on');
    expect(fetchMock.mock.calls[0][0]).toContain('/api/vault/yes-day');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).lang).toBe(lang);
    expect(slot.rating).toBe('Mixed / Proceed with Awareness');
  });
  it(`${lang}: FREE badge and tooltip use localized copy without modifying tier storage`, () => {
    render(<AppShell lang={lang} dir={lang === 'fa' || lang === 'ar' ? 'rtl' : 'ltr'} setLang={() => {}}>Vault</AppShell>);
    const badge = screen.getByRole('link', { name: free[lang] });
    expect(badge.getAttribute('title')).toBe(free[lang]);
    expect(badge.getAttribute('href')).toBe('/upgrade');
    expect(localStorage.getItem('planet-life-membership')).toBeNull();
    if (lang !== 'en') expect(screen.queryByText('FREE', { exact: true })).toBeNull();
  });
}
it('Arabic Sensuality documented strings do not gender the reader', () => {
  const copy = SECTION_LANGS.ar.sensuality;
  const { container } = render(<section dir="rtl"><p>{copy.sub}</p><p>{copy.intro}</p></section>);
  expect(container.textContent).not.toMatch(/توقيتكِ|اختاري|تقتربين/);
  expect(container.textContent).toContain('بصمة الرغبة');
  expect(container.textContent).toContain('غير مبنية بعد');
});
