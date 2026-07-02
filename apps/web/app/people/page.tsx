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
  removePerson,
  updatePerson,
  type Person,
  type RelationshipType,
} from '@/lib/people-storage';
import { relationshipProfileLabel } from '@/lib/relationship-profile-i18n';
import { RELATIONSHIP_PICKER_TYPES } from '@/lib/relationship-profile';

const RELATIONSHIPS = RELATIONSHIP_PICKER_TYPES;

export default function PeoplePage() {
  const [lang, setLangState] = useState<PeopleLang>('en');
  const [people, setPeople] = useState<Person[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('1990-01-15');
  const [birthTime, setBirthTime] = useState('12:00');
  const [location, setLocation] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType>('friend');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>();

  const t = PEOPLE_LANGS[lang];

  const relLabel = (r: RelationshipType) => relationshipProfileLabel(lang, r);

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
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Downscale to keep localStorage small (base64 photos otherwise blow
        // the ~5MB quota and the whole save silently fails).
        const MAX = 256;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setPhotoDataUrl(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        setPhotoDataUrl(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => setPhotoDataUrl(reader.result as string);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setBirthDate('1990-01-15');
    setBirthTime('12:00');
    setLocation('');
    setCitySearch('');
    setRelationship('friend');
    setPhotoDataUrl(undefined);
  };

  const startEdit = (p: Person) => {
    setEditingId(p.id);
    setName(p.name);
    setBirthDate(p.birth_date);
    setBirthTime(p.birth_time);
    setLocation(p.location);
    setCitySearch(p.location);
    setRelationship(p.relationship);
    setPhotoDataUrl(p.photoDataUrl);
    setShowForm(true);
  };

  const handleDelete = (p: Person) => {
    if (!window.confirm(`${t.confirmDelete} (${p.name})`)) return;
    removePerson(p.id);
    if (editingId === p.id) {
      resetForm();
      setShowForm(false);
    }
    refresh();
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const saved = editingId
      ? updatePerson(editingId, {
          name: name.trim(),
          birth_date: birthDate,
          birth_time: birthTime,
          location,
          relationship,
          photoDataUrl,
          // birth details changed → drop stale synergy so the detail page recomputes
          synergyScore: undefined,
          synergyBadge: undefined,
          synergyUpdatedAt: undefined,
        })
      : addPerson({
          name: name.trim(),
          birth_date: birthDate,
          birth_time: birthTime,
          location,
          relationship,
          photoDataUrl,
        });
    if (!saved) {
      window.alert(t.saveError);
      return;
    }
    resetForm();
    setShowForm(false);
    refresh();
  };

  const toggleForm = () => {
    if (showForm) {
      resetForm();
      setShowForm(false);
    } else {
      resetForm();
      setShowForm(true);
    }
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
          onClick={toggleForm}
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
            <div className="fc text-xs tracking-wider mb-1" style={{ color: '#fbbf24' }}>
              {editingId ? t.editTitle : t.addPerson}
            </div>
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
                <div className="grid grid-cols-2 gap-1" dir="ltr">
                  <select
                    aria-label="hour"
                    value={(birthTime.split(':')[0] ?? '12').padStart(2, '0')}
                    onChange={(e) =>
                      setBirthTime(`${e.target.value}:${(birthTime.split(':')[1] ?? '00').padStart(2, '0')}`)
                    }
                    className="fi w-full px-2 py-2.5 text-sm rounded-[10px] bg-[#070B14] border border-white/10 text-white"
                  >
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="minute"
                    value={(birthTime.split(':')[1] ?? '00').padStart(2, '0')}
                    onChange={(e) =>
                      setBirthTime(`${(birthTime.split(':')[0] ?? '12').padStart(2, '0')}:${e.target.value}`)
                    }
                    className="fi w-full px-2 py-2.5 text-sm rounded-[10px] bg-[#070B14] border border-white/10 text-white"
                  >
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="fi block text-[11px] mb-1.5 text-white/35">{t.city}</label>
              <CityAutocomplete
                value={citySearch}
                lang={lang}
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
                    {relLabel(r)}
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
            const rel = relLabel(p.relationship);
            const badgeStyle = p.synergyBadge ? BADGE_STYLES[p.synergyBadge] : null;
            return (
              <li key={p.id}>
                <div
                  className="flex items-center gap-3 p-4 rounded-2xl transition-colors hover:bg-white/[0.03]"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <Link
                    href={`/people/${p.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0 no-underline"
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
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      aria-label={t.edit}
                      title={t.edit}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      aria-label={t.delete}
                      title={t.delete}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
}
