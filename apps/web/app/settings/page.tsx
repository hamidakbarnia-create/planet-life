'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  loadCalendarSystem,
  loadHomeView,
  loadHouseSystem,
  loadZodiacSystem,
  saveCalendarSystem,
  saveHomeView,
  saveHouseSystem,
  saveZodiacSystem,
  type AppLang,
  type CalendarSystem,
  type HomeViewMode,
  type HouseSystem,
  type ZodiacSystem,
} from '@/lib/app-settings';
import { loadAppLang, saveAppLang } from '@/lib/calendar-preferences';
import { HOME_LANGS } from '@/lib/home-i18n';

const HOME_OPTIONS: HomeViewMode[] = ['daily-brief', 'calendar', 'heatmap'];
const HOUSE_OPTIONS: HouseSystem[] = ['placidus', 'whole_sign'];
const ZODIAC_OPTIONS: ZodiacSystem[] = ['tropical', 'sidereal'];
const CALENDAR_OPTIONS: CalendarSystem[] = ['gregorian', 'shamsi', 'hijri'];

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
  const [homeView, setHomeView] = useState<HomeViewMode>('daily-brief');
  const [house, setHouse] = useState<HouseSystem>('placidus');
  const [zodiac, setZodiac] = useState<ZodiacSystem>('tropical');
  const [calendar, setCalendar] = useState<CalendarSystem>('gregorian');
  const [savedLang, setSavedLang] = useState<AppLang>('en');
  const [savedHome, setSavedHome] = useState<HomeViewMode>('daily-brief');
  const [savedHouse, setSavedHouse] = useState<HouseSystem>('placidus');
  const [savedZodiac, setSavedZodiac] = useState<ZodiacSystem>('tropical');
  const [savedCalendar, setSavedCalendar] = useState<CalendarSystem>('gregorian');

  // The page text/direction follows the active language. Language applies
  // instantly (see applyLang), so this updates the moment you switch it from
  // either the header or the in-page selector.
  const t = HOME_LANGS[savedLang];

  useEffect(() => {
    const stored = loadAppLang();
    const startLang: AppLang =
      stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar'
        ? stored
        : 'en';
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

    const c = loadCalendarSystem();
    setCalendar(c);
    setSavedCalendar(c);
  }, []);

  // Language is special: the header switcher changes it live everywhere else
  // in the app, so here it also applies instantly (from both the header and the
  // in-page selector) instead of waiting for Save. The other settings stay on
  // the Save / Discard batch.
  const applyLang = (next: AppLang) => {
    setSavedLang(next);
    saveAppLang(next);
  };

  const isDirty =
    homeView !== savedHome ||
    house !== savedHouse ||
    zodiac !== savedZodiac ||
    calendar !== savedCalendar;

  const saveAll = () => {
    saveHomeView(homeView);
    saveHouseSystem(house);
    saveZodiacSystem(zodiac);
    saveCalendarSystem(calendar);
    setSavedHome(homeView);
    setSavedHouse(house);
    setSavedZodiac(zodiac);
    setSavedCalendar(calendar);
  };

  const discardAll = () => {
    setHomeView(savedHome);
    setHouse(savedHouse);
    setZodiac(savedZodiac);
    setCalendar(savedCalendar);
  };

  const houseLabels: Record<HouseSystem, string> = {
    placidus: t.placidus,
    whole_sign: t.wholeSign,
  };

  const zodiacLabels: Record<ZodiacSystem, string> = {
    tropical: t.tropical,
    sidereal: t.sidereal,
  };

  const calendarLabels: Record<CalendarSystem, string> = {
    gregorian: t.calendarGregorian,
    shamsi: t.calendarShamsi,
    hijri: t.calendarHijri,
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
      setLang={applyLang}
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
          value={savedLang}
          options={['en', 'ru', 'fa', 'ar']}
          labels={langLabels}
          onChange={applyLang}
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

        <OptionRow
          label={t.calendarLabel}
          value={calendar}
          options={CALENDAR_OPTIONS}
          labels={calendarLabels}
          onChange={setCalendar}
        />

        <div
          className="mt-8 pt-6 sticky bottom-0 flex flex-wrap items-center gap-3"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'linear-gradient(180deg, rgba(7,11,20,0), rgba(7,11,20,0.92) 40%)',
            paddingBottom: '1rem',
          }}
        >
          <button
            type="button"
            onClick={saveAll}
            disabled={!isDirty}
            className="fi text-sm px-6 py-2.5 rounded-lg border transition-all"
            style={
              isDirty
                ? {
                    borderColor: 'rgba(74,222,128,0.6)',
                    color: '#0a0f0a',
                    background: '#4ade80',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }
                : {
                    borderColor: 'rgba(255,255,255,0.14)',
                    color: 'rgba(255,255,255,0.45)',
                    background: 'rgba(255,255,255,0.04)',
                    cursor: 'not-allowed',
                  }
            }
          >
            {t.saveAll ?? 'Save changes'}
          </button>

          <button
            type="button"
            onClick={discardAll}
            disabled={!isDirty}
            className="fi text-sm px-4 py-2.5 rounded-lg border transition-all"
            style={{
              borderColor: 'rgba(255,255,255,0.14)',
              color: isDirty ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
              background: 'transparent',
              cursor: isDirty ? 'pointer' : 'not-allowed',
            }}
          >
            {t.discard ?? 'Discard'}
          </button>

          {/* Persistent status — never auto-hides, so the user always knows
              whether their settings are saved. */}
          <span
            className="fi text-xs ml-auto"
            style={{ color: isDirty ? 'rgba(251,191,36,0.85)' : 'rgba(74,222,128,0.85)' }}
          >
            {isDirty ? (t.unsaved ?? 'Unsaved changes') : (t.saved ?? 'Saved ✓')}
          </span>
        </div>

      </div>
    </AppShell>
  );
}
