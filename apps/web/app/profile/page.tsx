'use client';
import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { BirthProfileOnboardingScreen } from '@/components/ftue/BirthProfileOnboardingScreen';
import {
  NatalChart,
  NatalChartAnalysis,
  type NatalChartLabels,
} from '@/components/NatalChart';
import { ChartDevPanelGate } from '@/components/ChartDevPanelGate';
import { CalculationDetails } from '@/components/CalculationDetails';
import { FaChartConfirmModal } from '@/components/FaChartConfirmModal';
import { GeocodeConfirmDialog } from '@/components/GeocodeConfirmDialog';
import { AppShell } from '@/components/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { MetricCard } from '@/components/ui/MetricCard';
import { localeFontFamily } from '@/lib/brand-theme';
import {
  type ChartData,
  type CitySelection,
  validateChartResponse,
} from '@/lib/chart-types';
import { HOME_LANGS } from '@/lib/home-i18n';
import { loadAppLang, saveAppLang } from '@/lib/calendar-preferences';
import { useQueuedEffect } from '@/lib/use-queued-effect';
import { loadBirthProfile, saveBirthProfile } from '@/lib/birth-profile';
import type { UserLocation } from '@/lib/user-locations';
import {
  clearCalendarScoreCaches,
  currentLocationNeedsConfirm,
  logLocationDebug,
  sameUserLocation,
  saveCalendarEvaluationOverride,
} from '@/lib/user-locations';
import {
  buildPreConfirmSummary,
  chartApiCoordinatesFromResolved,
  resolveGenerateChartAction,
} from '@/lib/chart-profile-ux';
import {
  fetchLocationPreview,
  type ResolvedLocationPreview,
} from '@/lib/location-resolve';
import {
  PROFILE_LANGS,
  PLANET_LABELS,
  ASPECT_LABELS,
  buildSignNames,
  buildPersonalSignature,
  formatPlacement,
  signFromLongitude,
  type ProfileLang,
} from '@/lib/profile-i18n';
import { formatProfileBirthDate } from '@/lib/profile-calendar';

type CalendarType = 'gregorian' | 'persian' | 'hijri';

const PROFILE_NAME_KEY = 'planet-life-profile-name';

function ProfileUnlockEmpty({ message }: { message: string }) {
  return (
    <div className="mio-empty-state">
      <div className="mio-empty-state__ring" aria-hidden />
      <p className="mio-empty-state__text fi">{message}</p>
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: '#070B14' }}
          aria-busy="true"
        />
      }
    >
      <ProfileRoute />
    </Suspense>
  );
}

function ProfileRoute() {
  const onboarding = useSearchParams().get('onboarding') === '1';
  if (onboarding) return <BirthProfileOnboardingScreen />;
  return <ProfileEditor />;
}

function ProfileEditor() {
  const [lang, setLangState] = useState<ProfileLang>('en');
  const [calendarType, setCalendarType] = useState<CalendarType>('gregorian');
  const [birthDate, setBirthDate] = useState('1990-06-15');
  const [birthTime, setBirthTime] = useState('14:30');
  const [location, setLocation] = useState('');
  const [name, setName] = useState('');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [pendingGeocodeChart, setPendingGeocodeChart] = useState<ChartData | null>(null);
  const [selectedCity, setSelectedCity] = useState<CitySelection | null>(null);
  const [chartError, setChartError] = useState('');
  const [loading, setLoading] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [cities, setCities] = useState<CitySelection[]>([]);
  const [showCities, setShowCities] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [birthFormOpen, setBirthFormOpen] = useState(true);
  const [faConfirmOpen, setFaConfirmOpen] = useState(false);
  const [preConfirmSummary, setPreConfirmSummary] = useState<ReturnType<typeof buildPreConfirmSummary> | null>(null);
  const [resolvedLocation, setResolvedLocation] = useState<ResolvedLocationPreview | null>(null);
  const [currentCitySearch, setCurrentCitySearch] = useState('');
  const [currentSelectedCity, setCurrentSelectedCity] = useState<CitySelection | null>(null);
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);
  const [currentCities, setCurrentCities] = useState<CitySelection[]>([]);
  const [showCurrentCities, setShowCurrentCities] = useState(false);
  const [currentCityLoading, setCurrentCityLoading] = useState(false);
  const [currentLocationError, setCurrentLocationError] = useState('');
  const cityRef = useRef<HTMLDivElement>(null);
  const currentCityRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const t = PROFILE_LANGS[lang];
  const months = HOME_LANGS[lang].months;

  const setLang = (l: ProfileLang) => {
    setLangState(l);
    saveAppLang(l);
  };

  const identity = useMemo(() => {
    if (!chartData) return null;
    const sunLon = chartData.planets.sun?.longitude;
    const moonLon = chartData.planets.moon?.longitude;
    const asc = chartData.ascendant;
    if (
      !Number.isFinite(sunLon) ||
      !Number.isFinite(moonLon) ||
      !Number.isFinite(asc)
    ) {
      return null;
    }
    const ascSign = signFromLongitude(asc);
    return {
      sun: formatPlacement(sunLon!, lang),
      moon: formatPlacement(moonLon!, lang),
      ascendant: formatPlacement(asc, lang),
      ascSign,
    };
  }, [chartData, lang]);

  const personalSignature = useMemo(
    () => buildPersonalSignature(chartData, birthDate, lang),
    [chartData, birthDate, lang]
  );

  const displayBirthDate = useMemo(
    () => formatProfileBirthDate(lang, birthDate, calendarType),
    [lang, birthDate, calendarType]
  );

  const calendarLabel = useMemo(() => {
    if (calendarType === 'persian') return t.calendarPersian;
    if (calendarType === 'hijri') return t.calendarHijri;
    return t.calendarGregorian;
  }, [calendarType, t]);

  const buildStatus = loading
    ? t.statusLoading
    : chartData
      ? t.statusReady
      : t.statusPending;

  const buildStatusClass = loading
    ? 'mio-obs-metric__value--loading'
    : chartData
      ? 'mio-obs-metric__value--ready'
      : 'mio-obs-metric__value--pending';

  useQueuedEffect(() => {
    const storedLang = loadAppLang();
    if (storedLang === 'en' || storedLang === 'ru' || storedLang === 'fa' || storedLang === 'ar') {
      setLangState(storedLang);
    }
    const saved = loadBirthProfile();
    const savedName = localStorage.getItem(PROFILE_NAME_KEY);
    if (saved) {
      setBirthDate(saved.birth_date);
      setBirthTime(saved.birth_time);
      setLocation(saved.location);
      setCitySearch(saved.location);
      if (saved.current_location?.city) {
        setCurrentLocation(saved.current_location);
        setCurrentCitySearch(saved.current_location.city);
      }
    }
    if (savedName) setName(savedName);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useQueuedEffect(() => {
    if (chartData) setBirthFormOpen(false);
  }, [chartData]);

  const buildConfirmedCurrentLocation = async (
    city: CitySelection
  ): Promise<UserLocation> => {
    const resolved = await fetchLocationPreview({
      location: city.short,
      latitude: city.lat,
      longitude: city.lon,
    });
    return {
      city: city.short,
      country: city.country,
      latitude: city.lat,
      longitude: city.lon,
      timezone: resolved.timezone,
      coordinate_source: resolved.coordinate_source,
      confirmed: true,
    };
  };

  const handleSaveProfile = useCallback(async () => {
    setCurrentLocationError('');
    const previous = loadBirthProfile();
    let locToSave = currentLocation;

    if (currentLocationNeedsConfirm(currentSelectedCity, currentLocation)) {
      if (!currentSelectedCity) {
        setCurrentLocationError(t.currentPickFromList);
        return;
      }
      try {
        locToSave = await buildConfirmedCurrentLocation(currentSelectedCity);
        setCurrentLocation(locToSave);
        setCurrentSelectedCity(null);
      } catch (err) {
        setCurrentLocationError(
          err instanceof Error ? err.message : t.currentSaveFailed
        );
        return;
      }
    }

    const profileToSave = {
      birth_date: birthDate,
      birth_time: birthTime,
      location,
      action_type: 'business_launch' as const,
      ...(locToSave?.confirmed ? { current_location: locToSave } : {}),
    };

    logLocationDebug('profile save payload', profileToSave);
    saveBirthProfile(profileToSave);

    if (!sameUserLocation(previous?.current_location, locToSave)) {
      saveCalendarEvaluationOverride(null);
      clearCalendarScoreCaches();
      logLocationDebug('cleared calendar override + score caches', {
        from: previous?.current_location?.city,
        to: locToSave?.city,
      });
    }

    const persisted = loadBirthProfile();
    logLocationDebug('profile after persistence', persisted);

    localStorage.setItem(PROFILE_NAME_KEY, name);
    setSavedToast(true);
    if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setSavedToast(false);
      toastTimerRef.current = null;
    }, 2000);
  }, [
    birthDate,
    birthTime,
    location,
    name,
    currentLocation,
    currentSelectedCity,
    t.currentPickFromList,
    t.currentSaveFailed,
  ]);

  const chartLabels: NatalChartLabels = useMemo(
    () => ({
      empty: t.chartUnlockMessage,
      elementsTitle: t.elementsTitle,
      strengthsTitle: t.strengthsTitle,
      elements: {
        fire: t.elFire,
        earth: t.elEarth,
        air: t.elAir,
        water: t.elWater,
      },
      planetNames: PLANET_LABELS[lang] ?? PLANET_LABELS.en,
      signNames: buildSignNames(lang),
      aspectLegend: ASPECT_LABELS[lang] ?? ASPECT_LABELS.en,
      lang,
    }),
    [lang, t]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if(cityRef.current&&!cityRef.current.contains(e.target as Node))setShowCities(false);
      if(currentCityRef.current&&!currentCityRef.current.contains(e.target as Node))setShowCurrentCities(false);
    };
    document.addEventListener('mousedown', handler);
    return ()=>document.removeEventListener('mousedown',handler);
  },[]);

  const searchCurrentCities = useCallback((q: string) => {
    if(currentDebounceRef.current)clearTimeout(currentDebounceRef.current);
    if(q.length<2){setCurrentCities([]);return;}
    setCurrentCityLoading(true);
    currentDebounceRef.current = setTimeout(async()=>{
      try{
        const res=await fetch(`/api/cities?q=${encodeURIComponent(q)}&lang=${lang}`);
        const data=await res.json();
        setCurrentCities(data);
      }catch{setCurrentCities([]);}
      setCurrentCityLoading(false);
    },300);
  },[lang]);

  const selectCurrentCity = (city: CitySelection) => {
    if (!Number.isFinite(city.lat) || !Number.isFinite(city.lon)) return;
    setCurrentCitySearch(city.short);
    setCurrentSelectedCity(city);
    setCurrentLocationError('');
    setShowCurrentCities(false);
  };

  const confirmCurrentLocation = async () => {
    if (!currentSelectedCity) return;
    setCurrentLocationError('');
    try {
      const loc = await buildConfirmedCurrentLocation(currentSelectedCity);
      setCurrentLocation(loc);
      setCurrentSelectedCity(null);
      logLocationDebug('current location confirmed', loc);
    } catch (err) {
      setCurrentLocationError(
        err instanceof Error ? err.message : t.currentSaveFailed
      );
    }
  };

  const searchCities = useCallback((q: string) => {
    if(debounceRef.current)clearTimeout(debounceRef.current);
    if(q.length<2){setCities([]);return;}
    setCityLoading(true);
    debounceRef.current = setTimeout(async()=>{
      try{
        const res=await fetch(`/api/cities?q=${encodeURIComponent(q)}&lang=${lang}`);
        const data=await res.json();
        setCities(data);
      }catch{setCities([]);}
      setCityLoading(false);
    },300);
  },[lang]);

  const selectCity = (city: CitySelection) => {
    if (!Number.isFinite(city.lat) || !Number.isFinite(city.lon)) {
      setChartError(t.chartErrorCoords);
      return;
    }
    setCitySearch(city.short);
    setLocation(city.short);
    setSelectedCity(city);
    setShowCities(false);
  };

  const handleGenerateClick = () => {
    if (selectedCity && (!Number.isFinite(selectedCity.lat) || !Number.isFinite(selectedCity.lon))) {
      setChartError(t.chartErrorCoords);
      return;
    }

    const action = resolveGenerateChartAction(lang);
    if (action === 'show-confirm-modal') {
      void openFaConfirmModal();
      return;
    }
    void executeGenerateChart();
  };

  const openFaConfirmModal = async () => {
    setChartError('');
    setFaConfirmOpen(true);
    setResolvedLocation(null);
    setPreConfirmSummary(
      buildPreConfirmSummary({
        name,
        birthDate,
        birthTime,
        location,
        resolved: null,
        resolving: true,
      })
    );

    try {
      const resolved = await fetchLocationPreview({
        location,
        latitude: selectedCity?.lat ?? null,
        longitude: selectedCity?.lon ?? null,
      });
      setResolvedLocation(resolved);
      setPreConfirmSummary(
        buildPreConfirmSummary({
          name,
          birthDate,
          birthTime,
          location,
          resolved,
          resolving: false,
        })
      );
    } catch (err) {
      setFaConfirmOpen(false);
      setPreConfirmSummary(null);
      setChartError(err instanceof Error ? err.message : t.chartErrorLocation);
    }
  };

  const executeGenerateChart = async () => {
    setFaConfirmOpen(false);
    setLoading(true);
    setChartError('');
    setChartData(null);

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';
      const coords = chartApiCoordinatesFromResolved(resolvedLocation, selectedCity);
      const body: Record<string, unknown> = {
        birth_date: birthDate,
        birth_time: birthTime,
        location: location,
        action_type: 'business_launch',
        target_date: new Date().toISOString().split('T')[0],
        house_system: 'placidus',
        zodiac: 'tropical',
        node_type: 'mean',
        ...coords,
      };
      if (selectedCity?.country) {
        body.country = selectedCity.country;
      }
      const res = await fetch(`${apiBase}/api/business/chart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.detail) {
        setChartError(typeof data.detail === 'string' ? data.detail : 'Chart request failed');
      } else {
        const result = validateChartResponse(data, location);
        if (result.ok) {
          if (selectedCity?.country) result.data.country = selectedCity.country;
          if (result.data.coordinate_source === 'geocoded_fallback') {
            setPendingGeocodeChart(result.data);
          } else {
            setChartData(result.data);
          }
        } else {
          setChartError(`${t.chartErrorIncomplete}: ${result.errors.join(' ')}`);
        }
      }
    } catch {
      setChartError(t.chartErrorApi);
    }
    setLoading(false);
  };

  const fontFamily = localeFontFamily(lang);

  return (
    <AppShell
      lang={lang}
      setLang={setLang}
      dir={t.dir}
      navLabels={HOME_LANGS[lang].nav}
      fontFamily={fontFamily}
    >
      <style>{`
        select option{background:#0d1220!important;color:#ffffff!important}
        input[type="time"]::-webkit-calendar-picker-indicator,
        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(1) brightness(1.4);opacity:0.9;cursor:pointer}
        .city-row:hover{background:rgba(212,175,55,0.08)}
      `}</style>

      <div className="metioro-page--observatory mio-obs-dashboard" dir={t.dir} lang={lang}>
        <section className="mio-obs-hero" aria-label={t.heroTitle}>
          <div className="mio-obs-hero__orbit" aria-hidden />
          <div className="mio-obs-hero__glow" aria-hidden />
          <div className="mio-obs-hero__inner">
            <h1 className="mio-obs-hero__title fc">
              {name.trim() || t.heroTitle}
            </h1>
            <p className="mio-obs-hero__tagline fi">{t.heroMessage}</p>
            <div className="mio-obs-hero__metrics">
              <div className="mio-obs-metric">
                <span className="mio-obs-metric__label fi">{t.bdate}</span>
                <span className="mio-obs-metric__value fi">{displayBirthDate}</span>
              </div>
              <div className="mio-obs-metric">
                <span className="mio-obs-metric__label fi">{t.city}</span>
                <span className="mio-obs-metric__value fi">{location.trim() || '—'}</span>
              </div>
              <div className="mio-obs-metric">
                <span className="mio-obs-metric__label fi">{t.buildStatus}</span>
                <span className={`mio-obs-metric__value fi ${buildStatusClass}`}>
                  {buildStatus}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="mio-obs-grid">
          <div className="mio-obs-slot mio-obs-slot--identity">
            <GlassCard variant="secondary" eyebrow={t.identitySnapshotTitle}>
              {identity && personalSignature ? (
                <>
                  <div className="mio-id-row">
                    <span className="mio-label fi">{t.sun}</span>
                    <span className="mio-value fi">{identity.sun}</span>
                  </div>
                  <div className="mio-id-row">
                    <span className="mio-label fi">{t.moon}</span>
                    <span className="mio-value fi">{identity.moon}</span>
                  </div>
                  <div className="mio-id-row">
                    <span className="mio-label fi">{t.ascendant}</span>
                    <span className="mio-value fi">{identity.ascendant}</span>
                  </div>
                  <div className="mio-id-row">
                    <span className="mio-label fi">{t.chartRuler}</span>
                    <span className="mio-value fi">{personalSignature.ruler}</span>
                  </div>
                  <div className="mio-id-row">
                    <span className="mio-label fi">{t.dominantElement}</span>
                    <span className="mio-value fi">{personalSignature.element}</span>
                  </div>
                  <div className="mio-id-row">
                    <span className="mio-label fi">{t.calendarType}</span>
                    <span className="mio-value fi">{calendarLabel}</span>
                  </div>
                </>
              ) : (
                <ProfileUnlockEmpty message={t.chartUnlockMessage} />
              )}
            </GlassCard>
          </div>

          <div className="mio-obs-slot mio-obs-slot--signature">
            <GlassCard variant="signature" eyebrow={t.signatureTitle}>
              {personalSignature ? (
                <div className="mio-sig-grid">
                  <MetricCard
                    icon="🎨"
                    label={t.color}
                    value={
                      <>
                        <span
                          className="mio-sig-swatch"
                          style={{ background: personalSignature.colorHex }}
                          aria-hidden
                        />
                        {personalSignature.color}
                      </>
                    }
                  />
                  <MetricCard icon="💎" label={t.stone} value={personalSignature.stone} />
                  <MetricCard icon="🔢" label={t.resonance} value={personalSignature.resonance} />
                  <MetricCard icon="🌿" label={t.element} value={personalSignature.element} />
                  <MetricCard icon="🪐" label={t.ruler} value={personalSignature.ruler} />
                </div>
              ) : (
                <ProfileUnlockEmpty message={t.chartUnlockMessage} />
              )}
            </GlassCard>
          </div>

          <div className="mio-obs-slot mio-obs-slot--chart">
            <GlassCard variant="secondary" eyebrow={t.natalChart}>
              {loading ? (
                <div className="w-full min-h-[140px] flex items-center justify-center">
                  <div className="fi text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {t.loading}
                  </div>
                </div>
              ) : (
                <NatalChart
                  chart={chartData}
                  labels={chartLabels}
                  empty={!chartData}
                  observatory
                  showInsights={false}
                />
              )}
            {pendingGeocodeChart && !chartData && (
              <div
                className="w-full mt-3 rounded-xl px-3 py-2.5 flex items-start gap-2"
                style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.35)' }}
              >
                <span className="fi text-sm leading-none mt-0.5" style={{ color: '#fb923c' }}>
                  ⚠
                </span>
                <span className="fi text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {t.geocodePending}
                </span>
              </div>
            )}
            {chartError && (
              <p className="fi mt-3 text-xs text-center px-2" style={{ color: '#fca5a5' }}>
                {chartError}
              </p>
            )}
            </GlassCard>
          </div>

          <div className="mio-obs-slot mio-obs-slot--birth">
            <GlassCard variant="secondary" className="mio-birth-compact p-4">
              <div
                className={`mio-birth-collapsible ${birthFormOpen ? '' : 'mio-birth-collapsible--collapsed'}`}
              >
                <button
                  type="button"
                  className="mio-birth-collapsible__toggle"
                  onClick={() => setBirthFormOpen((open) => !open)}
                  aria-expanded={birthFormOpen}
                >
                  <span className="mio-eyebrow fc" style={{ margin: 0 }}>
                    {t.birthControlsTitle}
                  </span>
                  <span className="mio-birth-collapsible__chevron" aria-hidden>
                    {birthFormOpen ? '▲' : '▼'}
                  </span>
                </button>
                {!birthFormOpen && (
                  <p className="mio-birth-collapsible__summary fi">
                    {displayBirthDate} · {birthTime} · {location.trim() || '—'}
                  </p>
                )}
                <div className="mio-birth-collapsible__body">
              <div className="flex flex-col gap-2">
                <label className="metioro-field-label fi">{t.nameLabel}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="metioro-input fi"
                />
              </div>
              <div>
                <div className="mio-birth-date-head">
                  <label className="metioro-field-label fi">{t.bdate}</label>
                  <select
                    value={calendarType}
                    onChange={(e) => setCalendarType(e.target.value as CalendarType)}
                    className="metioro-select fi mio-select-inline"
                    aria-label={t.calendarType}
                  >
                    <option value="gregorian">{t.calendarGregorian}</option>
                    <option value="persian">{t.calendarPersian}</option>
                    <option value="hijri">{t.calendarHijri}</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <select
                    value={birthDate.split('-')[2]}
                    onChange={(e) =>
                      setBirthDate(
                        `${birthDate.split('-')[0]}-${birthDate.split('-')[1]}-${e.target.value}`
                      )
                    }
                    className="metioro-select fi"
                  >
                    {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(
                      (d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      )
                    )}
                  </select>
                  <select
                    value={birthDate.split('-')[1]}
                    onChange={(e) =>
                      setBirthDate(
                        `${birthDate.split('-')[0]}-${e.target.value}-${birthDate.split('-')[2]}`
                      )
                    }
                    className="metioro-select fi"
                  >
                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(
                      (m, i) => (
                        <option key={m} value={m}>
                          {months[i]}
                        </option>
                      )
                    )}
                  </select>
                  <select
                    value={birthDate.split('-')[0]}
                    onChange={(e) =>
                      setBirthDate(
                        `${e.target.value}-${birthDate.split('-')[1]}-${birthDate.split('-')[2]}`
                      )
                    }
                    className="metioro-select fi"
                  >
                    {Array.from({ length: 100 }, (_, i) =>
                      String(new Date().getFullYear() - i)
                    ).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                {calendarType !== 'gregorian' && (
                  <p className="fi mio-birth-alt-date" aria-live="polite">
                    {displayBirthDate}
                  </p>
                )}
              </div>
              <div>
                <label className="metioro-field-label fi">{t.btime}</label>
                <div className="grid grid-cols-2 gap-1" dir="ltr">
                  <select
                    aria-label="hour"
                    value={(birthTime.split(':')[0] ?? '14').padStart(2, '0')}
                    onChange={(e) =>
                      setBirthTime(
                        `${e.target.value}:${(birthTime.split(':')[1] ?? '30').padStart(2, '0')}`
                      )
                    }
                    className="metioro-select fi"
                  >
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="minute"
                    value={(birthTime.split(':')[1] ?? '30').padStart(2, '0')}
                    onChange={(e) =>
                      setBirthTime(
                        `${(birthTime.split(':')[0] ?? '14').padStart(2, '0')}:${e.target.value}`
                      )
                    }
                    className="metioro-select fi"
                  >
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div ref={cityRef} className="relative">
                <label className="metioro-field-label fi">{t.city}</label>
                <input
                  type="text"
                  value={citySearch}
                  placeholder={t.placeholder}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    setLocation(e.target.value);
                    setSelectedCity(null);
                    searchCities(e.target.value);
                    setShowCities(true);
                  }}
                  onFocus={() => citySearch.length >= 2 && setShowCities(true)}
                  className="metioro-input fi"
                />
                {showCities && (cityLoading || cities.length > 0) && (
                  <div
                    className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-2xl"
                    style={{ background: '#0d1220', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {cityLoading && (
                      <div className="fi px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {t.searching}
                      </div>
                    )}
                    {!cityLoading && cities.length === 0 && (
                      <div className="fi px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {t.noResults}
                      </div>
                    )}
                    {cities.map((city, i) => (
                      <div
                        key={i}
                        className="city-row px-4 py-2.5 cursor-pointer transition-colors"
                        onMouseDown={() => selectCity(city)}
                      >
                        <div className="fi text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                          {city.short}
                        </div>
                        <div className="fi text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {city.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-white/10">
                <div
                  className="fi text-[10px] uppercase tracking-widest mb-2"
                  style={{ color: 'rgba(212,175,55,0.65)' }}
                >
                  {t.currentSection}
                </div>
                <div ref={currentCityRef} className="relative mb-2">
                  <label className="metioro-field-label fi">{t.currentCity}</label>
                  <input
                    type="text"
                    value={currentCitySearch}
                    placeholder={t.placeholder}
                    onChange={(e) => {
                      setCurrentCitySearch(e.target.value);
                      setCurrentSelectedCity(null);
                      searchCurrentCities(e.target.value);
                      setShowCurrentCities(true);
                    }}
                    onFocus={() => currentCitySearch.length >= 2 && setShowCurrentCities(true)}
                    className="metioro-input fi"
                  />
                  {showCurrentCities && (currentCityLoading || currentCities.length > 0) && (
                    <div
                      className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-2xl"
                      style={{ background: '#0d1220', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      {currentCityLoading && (
                        <div className="fi px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {t.searching}
                        </div>
                      )}
                      {!currentCityLoading && currentCities.length === 0 && (
                        <div className="fi px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {t.noResults}
                        </div>
                      )}
                      {currentCities.map((city, i) => (
                        <div
                          key={i}
                          className="city-row px-4 py-2.5 cursor-pointer transition-colors"
                          onMouseDown={() => selectCurrentCity(city)}
                        >
                          <div className="fi text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                            {city.short}
                          </div>
                          <div className="fi text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {city.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {currentSelectedCity &&
                  currentLocationNeedsConfirm(currentSelectedCity, currentLocation) && (
                    <button
                      type="button"
                      onClick={() => void confirmCurrentLocation()}
                      className="metioro-btn metioro-btn--secondary fi mb-2"
                      style={{ borderColor: 'rgba(34,197,94,0.4)', color: '#86efac' }}
                    >
                      {t.confirmCurrent}
                    </button>
                  )}
                {currentLocation?.confirmed &&
                  !currentLocationNeedsConfirm(currentSelectedCity, currentLocation) && (
                    <p className="fi text-[11px] mb-2" style={{ color: 'rgba(74,222,128,0.85)' }}>
                      {t.currentConfirmed}: {currentLocation.city}
                      {currentLocation.country ? `, ${currentLocation.country}` : ''}
                    </p>
                  )}
                {currentLocationError && (
                  <p className="fi text-[11px] mb-2" style={{ color: '#fca5a5' }}>
                    {currentLocationError}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleGenerateClick}
                  disabled={loading}
                  className="metioro-btn metioro-btn--primary fc"
                >
                  {loading ? t.loading : t.generate}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveProfile()}
                  className="metioro-btn metioro-btn--secondary fc"
                >
                  {t.save}
                </button>
              </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {chartData && (
            <>
              <div className="mio-obs-slot mio-obs-slot--analysis">
                <div className="mio-analysis-grid">
                  <NatalChartAnalysis chart={chartData} labels={chartLabels} />
                </div>
                <ChartDevPanelGate chart={chartData} lang={lang} />
              </div>
              <div className="mio-obs-slot mio-obs-slot--transparency">
                <GlassCard variant="technical">
                  <CalculationDetails chart={chartData} lang={lang} embedded />
                </GlassCard>
              </div>
            </>
          )}
        </div>
      </div>

      {savedToast && (
        <div className="mio-toast fi" role="status" aria-live="polite">
          {t.saved}
        </div>
      )}
      {faConfirmOpen && preConfirmSummary && (
        <FaChartConfirmModal
          lang={lang}
          summary={preConfirmSummary}
          onConfirm={() => void executeGenerateChart()}
          onEdit={() => {
            setFaConfirmOpen(false);
            setPreConfirmSummary(null);
            setResolvedLocation(null);
          }}
        />
      )}
      {pendingGeocodeChart && (
        <GeocodeConfirmDialog
          chart={pendingGeocodeChart}
          onConfirm={() => {
            setChartData(pendingGeocodeChart);
            setPendingGeocodeChart(null);
          }}
          onReject={() => {
            setPendingGeocodeChart(null);
            setChartError(t.chartErrorGeocode);
          }}
        />
      )}
    </AppShell>
  );
}
