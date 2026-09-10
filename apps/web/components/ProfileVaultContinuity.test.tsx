import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Profile from '@/app/profile/page';
import { PROFILE_LANGS } from '@/lib/profile-i18n';
import { loadAppLang } from '@/lib/calendar-preferences';
import { loadBirthProfile, saveBirthProfile } from '@/lib/birth-profile';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('@/components/AppShell', () => ({ AppShell: ({ children, dir }: { children: ReactNode; dir: string }) => <main dir={dir}>{children}</main> }));
vi.mock('@/components/NatalChart', () => ({ NatalChart: () => <div>Chart preview</div>, NatalChartAnalysis: () => null }));
vi.mock('@/components/ChartDevPanelGate', () => ({ ChartDevPanelGate: () => null }));
vi.mock('@/components/CalculationDetails', () => ({ CalculationDetails: () => null }));
vi.mock('@/lib/calendar-preferences', () => ({ loadAppLang: vi.fn(() => 'en'), saveAppLang: vi.fn() }));
vi.mock('@/lib/birth-profile', () => ({ loadBirthProfile: vi.fn(() => null), saveBirthProfile: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });

for (const lang of ['en', 'ru', 'fa', 'ar'] as const) {
  it(`explains preview versus local saving beside both actions in ${lang}`, async () => {
    vi.mocked(loadAppLang).mockReturnValue(lang);
    render(<Profile />);
    const copy = PROFILE_LANGS[lang];
    await waitFor(() => expect(screen.getByTestId('profile-vault-continuity').textContent).toBe(copy.vaultContinuity));
    const block = screen.getByTestId('profile-vault-continuity').parentElement!;
    expect(block.contains(screen.getByRole('button', { name: copy.generate }))).toBe(true);
    expect(block.contains(screen.getByRole('button', { name: copy.save }))).toBe(true);
    expect(saveBirthProfile).not.toHaveBeenCalled();
    expect(screen.getByRole('main').dir).toBe(lang === 'fa' || lang === 'ar' ? 'rtl' : 'ltr');
  });
}
it('successful Create Chart remains a preview and does not silently save a profile', async () => {
  vi.mocked(loadAppLang).mockReturnValue('en');
  vi.mocked(loadBirthProfile).mockReturnValue({ birth_date: '1990-06-15', birth_time: '12:00', location: '51.5074,-0.1278', action_type: 'business_launch', gender: 'prefer_not_to_say' });
  const chart = { planets: { sun: { longitude: 84, sign: 3, degree: 24, house: 10, retrograde: false } }, ascendant: 180, midheaven: 90, houses: [180,210,240,270,300,330,0,30,60,90,120,150], latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London', local_datetime: '1990-06-15T12:00:00+01:00', utc_datetime: '1990-06-15 11:00:00', julian_day: 2448058.9583, house_system: 'placidus', zodiac: 'tropical', node_type: 'mean', location: 'London', ephemeris_engine: 'Swiss Ephemeris', coordinate_source: 'selected_city_coordinates' };
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => chart });
  vi.stubGlobal('fetch', fetchMock);
  render(<Profile />);
  await waitFor(() => expect(loadBirthProfile).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('button', { name: 'Create Chart' }));
  await screen.findByText('Chart preview');
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(String(fetchMock.mock.calls[0][0])).toContain('/api/business/chart');
  expect(saveBirthProfile).not.toHaveBeenCalled();
  expect(screen.getByTestId('profile-vault-continuity').textContent).toContain('Save Profile');
});
