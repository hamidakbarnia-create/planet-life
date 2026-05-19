'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [lang, setLangState] = useState<AppLang>('en');
  const [homeView, setHomeView] = useState<HomeViewMode>('daily-brief');
  const [house, setHouse] = useState<HouseSystem>('placidus');
  const [zodiac, setZodiac] = useState<ZodiacSystem>('tropical');
  const [flash, setFlash] = useState(false);

  const t = HOME_LANGS[lang];

  const setLang = (l: AppLang) => {
    setLangState(l);
    saveAppLang(l);
    ping();
  };

  const ping = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 1200);
  };

  useEffect(() => {
    const stored = loadAppLang();
    if (stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar') {
      setLangState(stored);
    }
    const hv = loadHomeView();
    if (hv) setHomeView(hv);
    setHouse(loadHouseSystem());
    setZodiac(loadZodiacSystem());
  }, []);

  const onHomeView = (mode: HomeViewMode) => {
    setHomeView(mode);
    saveHomeView(mode);
    ping();
    if (mode === 'calendar') router.push('/calendar');
    else if (mode === 'heatmap' || mode === 'daily-brief') router.push('/home');
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
      lang={lang}
      setLang={setLang}
      dir={t.dir}
      navLabels={t.nav}
      fontFamily={lang === 'fa' || lang === 'ar' ? 'Vazirmatn, sans-serif' : 'Inter, sans-serif'}
    >
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="fc text-xl tracking-wide mb-1" style={{ color: '#fbbf24' }}>
          {t.settingsTitle}
        </h1>
        <p className="fi text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {t.settingsSub}
        </p>

        {flash && (
          <div
            className="fi text-xs mb-4 px-3 py-2 rounded-lg"
            style={{
              background: 'rgba(74,222,128,0.1)',
              border: '1px solid rgba(74,222,128,0.3)',
              color: '#4ade80',
            }}
          >
            {t.saved}
          </div>
        )}

        <OptionRow
          label={t.homeViewLabel}
          value={homeView}
          options={HOME_OPTIONS}
          labels={t.viewLabels}
          onChange={onHomeView}
        />

        <OptionRow
          label={t.languageLabel}
          value={lang}
          options={['en', 'ru', 'fa', 'ar']}
          labels={langLabels}
          onChange={setLang}
        />

        <OptionRow
          label={t.houseLabel}
          value={house}
          options={HOUSE_OPTIONS}
          labels={houseLabels}
          onChange={(v) => {
            setHouse(v);
            saveHouseSystem(v);
            ping();
          }}
        />

        <OptionRow
          label={t.zodiacLabel}
          value={zodiac}
          options={ZODIAC_OPTIONS}
          labels={zodiacLabels}
          onChange={(v) => {
            setZodiac(v);
            saveZodiacSystem(v);
            ping();
          }}
        />

        <Link
          href="/dashboard"
          className="fi text-sm no-underline inline-block mt-2"
          style={{ color: '#fbbf24' }}
        >
          → Dashboard (full analysis)
        </Link>
      </div>
    </AppShell>
  );
}
