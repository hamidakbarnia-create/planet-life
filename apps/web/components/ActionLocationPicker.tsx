'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppLang } from '@/lib/app-settings';
import type { BirthProfile } from '@/lib/birth-profile';
import type { CitySelection } from '@/lib/chart-types';
import {
  cityToUserLocation,
  locationLabel,
  resolveEvaluationLocation,
  type LocationRole,
  type UserLocation,
} from '@/lib/user-locations';

const LABELS: Record<
  AppLang,
  {
    title: string;
    useCurrent: string;
    searchCity: string;
    placeholder: string;
    searching: string;
    noResults: string;
    noCurrent: string;
    confirmProfile: string;
  }
> = {
  en: {
    title: 'Where is this question/action taking place?',
    useCurrent: 'Use current living location',
    searchCity: 'Search another city',
    placeholder: 'e.g. London, New York, Dubai…',
    searching: 'Searching…',
    noResults: 'No cities found',
    noCurrent: 'Add your current living city in Profile first.',
    confirmProfile: 'Go to Profile',
  },
  fa: {
    title: 'این سوال/اقدام کجا انجام می‌شود؟',
    useCurrent: 'از شهر محل زندگی فعلی استفاده کن',
    searchCity: 'جستجوی شهر دیگر',
    placeholder: 'مثلاً لندن، نیویورک، دبی…',
    searching: 'در حال جستجو…',
    noResults: 'شهری یافت نشد',
    noCurrent: 'ابتدا شهر محل زندگی فعلی را در پروفایل اضافه کن.',
    confirmProfile: 'برو به پروفایل',
  },
  ru: {
    title: 'Где произойдёт это действие?',
    useCurrent: 'Использовать текущий город проживания',
    searchCity: 'Найти другой город',
    placeholder: 'напр. Лондон, Нью-Йорк, Дубай…',
    searching: 'Поиск…',
    noResults: 'Города не найдены',
    noCurrent: 'Сначала добавьте текущий город в Профиле.',
    confirmProfile: 'В профиль',
  },
  ar: {
    title: 'أين سيحدث هذا السؤال/الإجراء؟',
    useCurrent: 'استخدم مدينة الإقامة الحالية',
    searchCity: 'ابحث عن مدينة أخرى',
    placeholder: 'مثل لندن، نيويورك، دبي…',
    searching: 'جاري البحث…',
    noResults: 'لا توجد مدن',
    noCurrent: 'أضف مدينة إقامتك الحالية في الملف أولاً.',
    confirmProfile: 'الذهاب للملف',
  },
};

export type ActionLocationPickerProps = {
  profile: BirthProfile;
  lang: AppLang;
  value: UserLocation | null;
  onChange: (loc: UserLocation | null, role: LocationRole) => void;
  /** When true, user must pick a target city (travel/property questions). */
  requireTarget?: boolean;
};

export function ActionLocationPicker({
  profile,
  lang,
  value,
  onChange,
  requireTarget = false,
}: ActionLocationPickerProps) {
  const t = LABELS[lang];
  const current = profile.current_location;
  const hasCurrent = !!(current?.confirmed && current.city);
  const [mode, setMode] = useState<'current' | 'search'>(
    requireTarget ? 'search' : hasCurrent ? 'current' : 'search'
  );
  const [citySearch, setCitySearch] = useState('');
  const [cities, setCities] = useState<CitySelection[]>([]);
  const [showCities, setShowCities] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCities(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchCities = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (q.length < 2) {
        setCities([]);
        return;
      }
      setCityLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/cities?q=${encodeURIComponent(q)}&lang=${lang}`
          );
          const data = await res.json();
          setCities(Array.isArray(data) ? data : []);
        } catch {
          setCities([]);
        }
        setCityLoading(false);
      }, 300);
    },
    [lang]
  );

  const selectCity = (city: CitySelection) => {
    const loc = cityToUserLocation(city);
    setCitySearch(city.short);
    setShowCities(false);
    onChange(loc, requireTarget ? 'target' : 'question');
    setMode('search');
  };

  const useCurrent = () => {
    if (!current?.city) return;
    onChange(current, 'current');
    setMode('current');
  };

  return (
    <div className="space-y-2">
      <label
        className="fi text-[11px] uppercase tracking-widest block"
        style={{ color: 'rgba(255,255,255,0.45)' }}
      >
        {t.title}
      </label>

      {!requireTarget && (
        <button
          type="button"
          onClick={useCurrent}
          disabled={!hasCurrent}
          className="w-full text-start rounded-xl px-3 py-2.5 fi text-sm transition-colors disabled:opacity-40"
          style={{
            background:
              mode === 'current' && hasCurrent
                ? 'rgba(74,222,128,0.08)'
                : 'rgba(255,255,255,0.03)',
            border: `1px solid ${
              mode === 'current' && hasCurrent
                ? 'rgba(74,222,128,0.4)'
                : 'rgba(255,255,255,0.08)'
            }`,
            color: '#ffffff',
          }}
        >
          {hasCurrent ? `${t.useCurrent}: ${locationLabel(current!)}` : t.noCurrent}
        </button>
      )}

      <div ref={cityRef} className="relative">
        <div
          className="fi text-[10px] uppercase tracking-widest mb-1"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          {t.searchCity}
        </div>
        <input
          type="text"
          value={citySearch}
          placeholder={t.placeholder}
          onChange={(e) => {
            setCitySearch(e.target.value);
            searchCities(e.target.value);
            setShowCities(true);
            setMode('search');
          }}
          onFocus={() => citySearch.length >= 2 && setShowCities(true)}
          className="fi w-full px-3 py-2 text-sm rounded-lg bg-black/30 border border-white/10 text-white outline-none focus:border-amber-500/40"
        />
        {showCities && (cityLoading || cities.length > 0) && (
          <div
            className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-2xl"
            style={{
              background: '#0d1220',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {cityLoading && (
              <div
                className="fi px-4 py-3 text-xs"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {t.searching}
              </div>
            )}
            {!cityLoading && cities.length === 0 && (
              <div
                className="fi px-4 py-3 text-xs"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {t.noResults}
              </div>
            )}
            {cities.map((city, i) => (
              <div
                key={i}
                className="px-4 py-2.5 cursor-pointer transition-colors hover:bg-white/5"
                onMouseDown={() => selectCity(city)}
              >
                <div
                  className="fi text-sm"
                  style={{ color: 'rgba(255,255,255,0.8)' }}
                >
                  {city.short}
                </div>
                <div
                  className="fi text-[11px] truncate"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  {city.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {value?.city && (
        <p className="fi text-[11px]" style={{ color: 'rgba(74,222,128,0.85)' }}>
          {locationLabel(value)}
        </p>
      )}
    </div>
  );
}

export function canScoreWithLocation(
  profile: BirthProfile,
  questionLocation: UserLocation | null
): boolean {
  return !!resolveEvaluationLocation(profile, questionLocation);
}
