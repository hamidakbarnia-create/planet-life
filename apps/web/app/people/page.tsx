'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { HOME_LANGS } from '@/lib/home-i18n';
import { CityAutocomplete } from '@/components/CityAutocomplete';
import { PersonAvatar } from '@/components/PersonAvatar';
import { SynergyBadgePill } from '@/components/SynergyBadge';
import { saveAppLang } from '@/lib/calendar-preferences';
import { PEOPLE_LANGS, type PeopleLang } from '@/lib/people-i18n';
import { BADGE_STYLES } from '@/lib/synergy';
import {
  addPerson,
  loadPeople,
  type Person,
  type RelationshipType,
} from '@/lib/people-storage';

const RELATIONSHIPS: RelationshipType[] = [
  'spouse',
  'business_partner',
  'family',
  'friend',
  'rival',
];

export default function PeoplePage() {
  const [lang, setLangState] = useState<PeopleLang>('en');
  const [people, setPeople] = useState<Person[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('1990-01-15');
  const [birthTime, setBirthTime] = useState('12:00');
  const [location, setLocation] = useState('New York');
  const [citySearch, setCitySearch] = useState('New York');
  const [relationship, setRelationship] = useState<RelationshipType>('friend');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>();

  const t = PEOPLE_LANGS[lang];

  const setLang = (l: PeopleLang) => {
    setLangState(l);
    saveAppLang(l);
  };

  const refresh = () => setPeople(loadPeople());

  useEffect(() => {
    const stored = localStorage.getItem('planet-life-lang');
    if (stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar') {
      setLangState(stored);
    }
    refresh();
  }, []);

  const handlePhoto = (file: File | null) => {
    if (!file) {
      setPhotoDataUrl(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    addPerson({
      name: name.trim(),
      birth_date: birthDate,
      birth_time: birthTime,
      location,
      relationship,
      photoDataUrl,
    });
    setName('');
    setShowForm(false);
    setPhotoDataUrl(undefined);
    refresh();
  };

  return (
    <AppShell
      lang={lang}
      setLang={setLang}
      dir={t.dir}
      navLabels={HOME_LANGS[lang].nav}
      fontFamily={
        lang === 'fa' || lang === 'ar' ? 'Vazirmatn, sans-serif' : 'Inter, sans-serif'
      }
    >
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="fc text-xl tracking-wide mb-1" style={{ color: '#fbbf24' }}>
            {t.title}
          </h1>
          <p className="fi text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {t.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="fc w-full py-3 rounded-xl text-sm tracking-widest mb-6"
          style={{
            background: 'linear-gradient(135deg,#d97706,#f59e0b)',
            color: '#000',
          }}
        >
          {showForm ? t.cancel : t.addPerson}
        </button>

        {showForm && (
          <div
            className="rounded-2xl p-5 mb-6 space-y-3"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div>
              <label className="fi block text-[11px] mb-1.5 text-white/35">{t.name}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="fi w-full px-3 py-2.5 text-sm rounded-[10px] bg-white/5 border border-white/10 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="fi block text-[11px] mb-1.5 text-white/35">{t.bdate}</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="fi w-full px-3 py-2.5 text-sm rounded-[10px] bg-white/5 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="fi block text-[11px] mb-1.5 text-white/35">{t.btime}</label>
                <input
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  className="fi w-full px-3 py-2.5 text-sm rounded-[10px] bg-white/5 border border-white/10 text-white"
                />
              </div>
            </div>
            <div>
              <label className="fi block text-[11px] mb-1.5 text-white/35">{t.city}</label>
              <CityAutocomplete
                value={citySearch}
                onChange={(v) => {
                  setCitySearch(v);
                  setLocation(v);
                }}
                onSelect={(c) => {
                  setCitySearch(c.short);
                  setLocation(c.short);
                }}
                placeholder={t.placeholder}
                searchingLabel={t.searching}
                noResultsLabel={t.noResults}
              />
            </div>
            <div>
              <label className="fi block text-[11px] mb-1.5 text-white/35">{t.relationship}</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value as RelationshipType)}
                className="fi w-full px-3 py-2.5 text-sm rounded-[10px] bg-[#070B14] border border-white/10 text-white"
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {t.relationships[r]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="fi block text-[11px] mb-1.5 text-white/35">{t.photo}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
                className="fi text-xs text-white/50 w-full"
              />
            </div>
            <button
              type="button"
              onClick={handleSave}
              className="fc w-full py-2.5 rounded-xl text-sm tracking-wider"
              style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}
            >
              {t.save}
            </button>
          </div>
        )}

        {people.length === 0 && !showForm && (
          <p className="fi text-sm text-center py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {t.empty}
          </p>
        )}

        <ul className="space-y-2">
          {people.map((p) => {
            const rel = t.relationships[p.relationship];
            const badgeStyle = p.synergyBadge ? BADGE_STYLES[p.synergyBadge] : null;
            return (
              <li key={p.id}>
                <Link
                  href={`/people/${p.id}`}
                  className="flex items-center gap-3 p-4 rounded-2xl no-underline transition-colors hover:bg-white/[0.03]"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <PersonAvatar
                    name={p.name}
                    photoDataUrl={p.photoDataUrl}
                    size={48}
                    borderColor={badgeStyle?.border}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="fi text-sm font-medium text-white/90 truncate">
                      {p.name}
                    </div>
                    <div className="fi text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {rel}
                    </div>
                  </div>
                  {p.synergyBadge && p.synergyScore != null && (
                    <div className="flex flex-col items-end gap-1">
                      <SynergyBadgePill badge={p.synergyBadge} label={t.badges[p.synergyBadge]} />
                      <span className="fi text-[10px]" style={{ color: badgeStyle?.text }}>
                        {p.synergyScore}
                      </span>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
}
