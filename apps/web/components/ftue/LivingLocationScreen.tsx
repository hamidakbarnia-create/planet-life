'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useId, useMemo, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import type { AppLang } from '@/lib/app-settings';
import type { BrandLang } from '@/lib/brand';
import { localeFcFiCss, localeFontFamily } from '@/lib/brand-theme';
import { trackFtueEvent } from '@/lib/ftue-analytics';
import {
  getLivingLocationCopy,
  type LivingLocationCopy,
} from '@/lib/ftue-i18n';
import {
  ftueTodayPath,
  isFtueComplete,
  loadFtueDraft,
  updateFtueDraft,
  type FtuePlaceValue,
} from '@/lib/ftue-storage';
import { useAppLang, useClientReady } from '@/lib/use-app-lang';
import { useQueuedEffect } from '@/lib/use-queued-effect';

/** Next FTUE step — Notifications (PRD-001 §5.8). */
export const FTUE_NOTIFICATIONS_PATH = '/onboarding/notifications';

const FTUE_BIRTH_PLACE_PATH = '/onboarding/birth-place';

/**
 * Independent living-location mocks (FTUE-07).
 * Separate from Birth Place state/values even if city strings match.
 * Coordinates may be kept in the local FTUE draft; never shown or sent to analytics.
 */
export type MockLivingPlace = {
  id: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
};

export const FTUE_MOCK_LIVING_PLACES: readonly MockLivingPlace[] = [
  { id: 'tehran-ir', city: 'Tehran', country: 'Iran', latitude: 35.6892, longitude: 51.389 },
  { id: 'isfahan-ir', city: 'Isfahan', country: 'Iran', latitude: 32.6539, longitude: 51.666 },
  {
    id: 'dubai-ae',
    city: 'Dubai',
    country: 'United Arab Emirates',
    latitude: 25.2048,
    longitude: 55.2708,
  },
  {
    id: 'abu-dhabi-ae',
    city: 'Abu Dhabi',
    country: 'United Arab Emirates',
    latitude: 24.4539,
    longitude: 54.3773,
  },
  { id: 'riyadh-sa', city: 'Riyadh', country: 'Saudi Arabia', latitude: 24.7136, longitude: 46.6753 },
  { id: 'jeddah-sa', city: 'Jeddah', country: 'Saudi Arabia', latitude: 21.4858, longitude: 39.1925 },
  { id: 'istanbul-tr', city: 'Istanbul', country: 'Turkey', latitude: 41.0082, longitude: 28.9784 },
  { id: 'ankara-tr', city: 'Ankara', country: 'Turkey', latitude: 39.9334, longitude: 32.8597 },
  {
    id: 'london-gb',
    city: 'London',
    country: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
  },
  {
    id: 'manchester-gb',
    city: 'Manchester',
    country: 'United Kingdom',
    latitude: 53.4808,
    longitude: -2.2426,
  },
  {
    id: 'new-york-us',
    city: 'New York',
    country: 'United States',
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    id: 'los-angeles-us',
    city: 'Los Angeles',
    country: 'United States',
    latitude: 34.0522,
    longitude: -118.2437,
  },
  { id: 'moscow-ru', city: 'Moscow', country: 'Russia', latitude: 55.7558, longitude: 37.6173 },
  {
    id: 'saint-petersburg-ru',
    city: 'Saint Petersburg',
    country: 'Russia',
    latitude: 59.9311,
    longitude: 30.3609,
  },
  { id: 'berlin-de', city: 'Berlin', country: 'Germany', latitude: 52.52, longitude: 13.405 },
  { id: 'paris-fr', city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522 },
  { id: 'toronto-ca', city: 'Toronto', country: 'Canada', latitude: 43.6532, longitude: -79.3832 },
  { id: 'sydney-au', city: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093 },
] as const;

export type LivingLocationValidationError = keyof LivingLocationCopy['errors'];

function isRtl(lang: AppLang): boolean {
  return lang === 'fa' || lang === 'ar';
}

export function formatMockLivingPlace(place: MockLivingPlace): string {
  return `${place.city}, ${place.country}`;
}

export function filterMockLivingPlaces(
  query: string,
  places: readonly MockLivingPlace[] = FTUE_MOCK_LIVING_PLACES
): MockLivingPlace[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return places.filter(
    (p) =>
      p.city.toLowerCase().includes(q) ||
      p.country.toLowerCase().includes(q) ||
      formatMockLivingPlace(p).toLowerCase().includes(q)
  );
}

export function validateLivingLocation(
  selected: MockLivingPlace | null
): LivingLocationValidationError | null {
  return selected ? null : 'required';
}

export function LivingLocationScreen() {
  const router = useRouter();
  const [lang] = useAppLang();
  const clientReady = useClientReady();
  const formId = useId();
  const searchId = `${formId}-search`;
  const listId = `${formId}-list`;
  const descId = `${formId}-desc`;
  const errId = `${formId}-err`;

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<MockLivingPlace | null>(null);
  const [error, setError] = useState<LivingLocationValidationError | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const results = useMemo(() => filterMockLivingPlaces(query), [query]);

  useQueuedEffect(() => {
    if (isFtueComplete()) {
      router.replace(ftueTodayPath());
      return;
    }
    const place = loadFtueDraft().livingLocation;
    if (place) {
      const match =
        FTUE_MOCK_LIVING_PLACES.find((p) => p.id === place.id) ??
        ({
          id: place.id,
          city: place.city,
          country: place.country,
          latitude: place.latitude,
          longitude: place.longitude,
        } satisfies MockLivingPlace);
      setSelected(match);
      setQuery(formatMockLivingPlace(match));
    }
    setReady(true);
  }, [router]);

  const handleBack = useCallback(() => {
    router.push(FTUE_BIRTH_PLACE_PATH);
  }, [router]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setSelected(null);
    setListOpen(true);
    setError(null);
  }, []);

  const handleSelect = useCallback((place: MockLivingPlace) => {
    setSelected(place);
    setQuery(formatMockLivingPlace(place));
    setListOpen(false);
    setError(null);
  }, []);

  const handleContinue = useCallback(() => {
    const nextError = validateLivingLocation(selected);
    setError(nextError);
    if (nextError || !selected) return;

    const place: FtuePlaceValue = {
      id: selected.id,
      city: selected.city,
      country: selected.country,
      latitude: selected.latitude,
      longitude: selected.longitude,
    };
    updateFtueDraft({ livingLocation: place });
    trackFtueEvent('ftue_livinglocation_set');
    router.push(FTUE_NOTIFICATIONS_PATH);
  }, [router, selected]);

  if (!clientReady || !ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#070B14' }}
        aria-busy="true"
      />
    );
  }

  const c = getLivingLocationCopy(lang);
  const errorMessage = error ? c.errors[error] : null;
  const showResults = listOpen && query.trim().length > 0 && !selected;

  return (
    <div
      className="min-h-screen flex flex-col px-5 py-8"
      style={{
        direction: isRtl(lang) ? 'rtl' : 'ltr',
        background: 'radial-gradient(circle at top, #1a1240 0%, #070B14 55%)',
        fontFamily: localeFontFamily(lang),
      }}
    >
      <style>{`
        ${localeFcFiCss(lang)}
        .ll-field{background:rgba(255,255,255,0.04);color:#fff;border-radius:10px}
        .ll-field:focus{border-color:rgba(251,191,36,0.45);outline:none}
        .ll-btn:focus-visible,.ll-link:focus-visible,.ll-field:focus-visible,.ll-option:focus-visible{
          outline:2px solid #fbbf24;outline-offset:2px
        }
      `}</style>

      <header className="flex items-center justify-between gap-3 pt-2 pb-6 max-w-md mx-auto w-full">
        <BrandLogo lang={lang as BrandLang} href={null} size="md" showTagline />
        <button
          type="button"
          onClick={handleBack}
          className="ll-link fi text-sm text-white/55 hover:text-white/80 transition-colors min-h-11 px-2"
        >
          {c.back}
        </button>
      </header>

      <main className="flex-1 flex flex-col max-w-md mx-auto w-full gap-6">
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white fc tracking-tight">
            {c.title}
          </h1>
          <p id={descId} className="fi text-sm sm:text-base text-white/65 leading-relaxed">
            {c.description}
          </p>
        </div>

        <div className="w-full space-y-2 relative">
          <label htmlFor={searchId} className="fi block text-xs text-white/50">
            {c.searchLabel}
          </label>
          <input
            id={searchId}
            type="text"
            role="combobox"
            aria-expanded={showResults}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={errorMessage ? `${descId} ${errId}` : descId}
            autoComplete="off"
            value={query}
            placeholder={c.searchPlaceholder}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setListOpen(true)}
            className="ll-field fi w-full px-3 py-3 text-sm min-h-11"
            style={{
              border: `1px solid ${
                errorMessage ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'
              }`,
            }}
          />

          {selected && (
            <p className="fi text-xs text-amber-300/80" aria-live="polite">
              {c.selectedLabel}: {formatMockLivingPlace(selected)}
            </p>
          )}

          {showResults && (
            <ul
              id={listId}
              role="listbox"
              aria-label={c.resultsAria}
              className="absolute z-10 left-0 right-0 mt-1 max-h-56 overflow-auto rounded-xl border"
              style={{
                background: '#0d1424',
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            >
              {results.length === 0 ? (
                <li className="fi px-4 py-3 text-sm text-white/45">{c.noResults}</li>
              ) : (
                results.map((place) => (
                  <li key={place.id} role="option" aria-selected={false}>
                    <button
                      type="button"
                      className="ll-option fi w-full text-start px-4 py-3 text-sm text-white/85 hover:bg-white/5 min-h-11"
                      onClick={() => handleSelect(place)}
                    >
                      <span className="block font-medium">{place.city}</span>
                      <span className="block text-xs text-white/45 mt-0.5">
                        {place.country}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}

          {errorMessage && (
            <p id={errId} className="fi text-xs text-red-400" role="alert">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="w-full flex flex-col gap-3 mt-auto pt-4">
          <button
            type="button"
            onClick={handleContinue}
            className="ll-btn w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity fi"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
              color: '#0A0F1C',
            }}
          >
            {c.continue}
          </button>
        </div>
      </main>
    </div>
  );
}
