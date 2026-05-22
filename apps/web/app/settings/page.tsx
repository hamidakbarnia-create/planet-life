'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  loadHomeView,
  loadHouseSystem,
  loadZodiacSystem,
  saveHomeView,
  saveHouseSystem,
  saveZodiacSystem,
  type AppLang,
  type HomeViewMode,
  type HouseSystem,
  type ZodiacSystem,
} from '@/lib/app-settings';
import { loadAppLang, saveAppLang } from '@/lib/calendar-preferences';
import { HOME_LANGS } from '@/lib/home-i18n';

const HOME_OPTIONS: HomeViewMode[] = ['daily-brief', 'calendar', 'heatmap'];
const HOUSE_OPTIONS: HouseSystem[] = ['placidus', 'whole_sign'];
const ZODIAC_OPTIONS: ZodiacSystem[] = ['tropical', 'sidereal'];

function OptionRow<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  labels: Record<T, string>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mb-6">
      <div className="fi text-[10px] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className="fi text-xs px-3 py-2 rounded-lg border transition-all"
              style={
                active
                  ? {
                      borderColor: 'rgba(251,191,36,0.5)',
                      color: '#fbbf24',
                      background: 'rgba(251,191,36,0.08)',
                    }
                  : {
                      borderColor: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.5)',
                    }
              }
            >
              {labels[opt]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [lang, setLangState] = useState<AppLang>('en');
  const [homeView, setHomeView] = useState<HomeViewMode>('daily-brief');
  const [house, setHouse] = useState<HouseSystem>('placidus');
  const [zodiac, setZodiac] = useState<ZodiacSystem>('tropical');
  const [savedLang, setSavedLang] = useState<AppLang>('en');
  const [savedHome, setSavedHome] = useState<HomeViewMode>('daily-brief');
  const [savedHouse, setSavedHouse] = useState<HouseSystem>('placidus');
  const [savedZodiac, setSavedZodiac] = useState<ZodiacSystem>('tropical');
  const [flash, setFlash] = useState(false);

  // The Settings page itself uses the *saved* language for all text and
  // direction. Picking a different language as a pending change does not
  // flip the page; everything switches only after you press Save changes.
  const t = HOME_LANGS[savedLang];

  useEffect(() => {
    const stored = loadAppLang();
    const startLang: AppLang =
      stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar'
        ? stored
        : 'en';
    setLangState(startLang);
    setSavedLang(startLang);

    const hv = loadHomeView() ?? 'daily-brief';
    setHomeView(hv);
    setSavedHome(hv);

    const h = loadHouseSystem();
    setHouse(h);
    setSavedHouse(h);

    const z = loadZodiacSystem();
    setZodiac(z);
    setSavedZodiac(z);
  }, []);

  const isDirty =
    lang !== savedLang ||
    homeView !== savedHome ||
    house !== savedHouse ||
    zodiac !== savedZodiac;

  const saveAll = () => {
    saveAppLang(lang);
    saveHomeView(homeView);
    saveHouseSystem(house);
    saveZodiacSystem(zodiac);
    setSavedLang(lang);
    setSavedHome(homeView);
    setSavedHouse(house);
    setSavedZodiac(zodiac);
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  };

  const discardAll = () => {
    setLangState(savedLang);
    setHomeView(savedHome);
    setHouse(savedHouse);
    setZodiac(savedZodiac);
  };

  const houseLabels: Record<HouseSystem, string> = {
    placidus: t.placidus,
    whole_sign: t.wholeSign,
  };

  const zodiacLabels: Record<ZodiacSystem, string> = {
    tropical: t.tropical,
    sidereal: t.sidereal,
  };

  const langLabels: Record<AppLang, string> = {
    en: 'EN',
    ru: 'RU',
    fa: 'FA',
    ar: 'AR',
  };

  return (
    <AppShell
      lang={savedLang}
      setLang={(l) => setLangState(l)}
      dir={t.dir}
      navLabels={t.nav}
    >
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="fc text-xl tracking-wide mb-1" style={{ color: '#fbbf24' }}>
          {t.settingsTitle}
        </h1>
        <p className="fi text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {t.settingsSub}
        </p>

        <OptionRow
          label={t.homeViewLabel}
          value={homeView}
          options={HOME_OPTIONS}
          labels={t.viewLabels}
          onChange={setHomeView}
        />

        <OptionRow
          label={t.languageLabel}
          value={lang}
          options={['en', 'ru', 'fa', 'ar']}
          labels={langLabels}
          onChange={setLangState}
        />

        <OptionRow
          label={t.houseLabel}
          value={house}
          options={HOUSE_OPTIONS}
          labels={houseLabels}
          onChange={setHouse}
        />

        <OptionRow
          label={t.zodiacLabel}
          value={zodiac}
          options={ZODIAC_OPTIONS}
          labels={zodiacLabels}
          onChange={setZodiac}
        />

        <div
          className="mt-8 pt-6 flex flex-wrap items-center gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            type="button"
            onClick={saveAll}
            disabled={!isDirty}
            className="fi text-xs px-5 py-2.5 rounded-lg border transition-all"
            style={
              isDirty
                ? {
                    borderColor: 'rgba(74,222,128,0.5)',
                    color: '#4ade80',
                    background: 'rgba(74,222,128,0.1)',
                    cursor: 'pointer',
                  }
                : {
                    borderColor: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.3)',
                    background: 'transparent',
                    cursor: 'not-allowed',
                  }
            }
          >
            {t.saveAll ?? 'Save changes'}
          </button>
          {isDirty && (
            <button
              type="button"
              onClick={discardAll}
              className="fi text-xs px-4 py-2.5 rounded-lg border transition-all"
              style={{
                borderColor: 'rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}
            >
              {t.discard ?? 'Discard'}
            </button>
          )}
          {flash && !isDirty && (
            <span
              className="fi text-xs"
              style={{ color: '#4ade80' }}
            >
              {t.saved}
            </span>
          )}
          {isDirty && (
            <span
              className="fi text-xs"
              style={{ color: 'rgba(251,191,36,0.7)' }}
            >
              {t.unsaved ?? 'Unsaved changes'}
            </span>
          )}
        </div>

      </div>
    </AppShell>
  );
}
