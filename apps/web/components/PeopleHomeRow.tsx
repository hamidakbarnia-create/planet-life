'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PEOPLE_LANGS, type PeopleLang } from '@/lib/people-i18n';
import { BADGE_STYLES } from '@/lib/synergy';
import { initials, loadPeople, type Person } from '@/lib/people-storage';
import { loadAppLang } from '@/lib/calendar-preferences';

export function PeopleHomeRow({ lang: langProp }: { lang?: PeopleLang } = {}) {
  const [people, setPeople] = useState<Person[]>([]);
  const [lang, setLang] = useState<PeopleLang>(langProp ?? 'en');

  // When the parent controls the language (e.g. the landing page), follow it
  // live so the section title switches with the rest of the page.
  useEffect(() => {
    if (langProp) setLang(langProp);
  }, [langProp]);

  useEffect(() => {
    if (!langProp) {
      const stored = loadAppLang();
      if (stored === 'ru' || stored === 'fa' || stored === 'ar' || stored === 'en') {
        setLang(stored);
      }
    }
    setPeople(loadPeople().slice(0, 8));
  }, [langProp]);

  if (people.length === 0) return null;

  const t = PEOPLE_LANGS[lang];

  return (
    <section className="px-8 py-10 max-w-5xl mx-auto border-t border-white/10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white/90">{t.homeTitle}</h2>
        <Link href="/people" className="text-sm text-amber-400 hover:text-amber-300 no-underline">
          {t.homeSeeAll}
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {people.map((p) => {
          const badge = p.synergyBadge;
          const style = badge ? BADGE_STYLES[badge] : null;
          return (
            <Link
              key={p.id}
              href={`/people/${p.id}`}
              className="flex-shrink-0 flex flex-col items-center gap-2 no-underline w-20"
            >
              <div className="relative">
                {p.photoDataUrl ? (
                  <img
                    src={p.photoDataUrl}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover border-2"
                    style={{ borderColor: style?.border ?? 'rgba(255,255,255,0.15)' }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-semibold border-2"
                    style={{
                      background: 'rgba(251,191,36,0.12)',
                      color: '#fbbf24',
                      borderColor: style?.border ?? 'rgba(255,255,255,0.15)',
                    }}
                  >
                    {initials(p.name)}
                  </div>
                )}
                {badge && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] px-1.5 py-0.5 rounded-full whitespace-nowrap font-medium"
                    style={{
                      background: style!.bg,
                      color: style!.text,
                      border: `1px solid ${style!.border}`,
                    }}
                  >
                    {t.badges[badge]}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-white/60 text-center truncate w-full">
                {p.name.split(' ')[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
