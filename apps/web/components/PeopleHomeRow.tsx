'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PEOPLE_LANGS, type PeopleLang } from '@/lib/people-i18n';
import { BADGE_STYLES } from '@/lib/synergy';
import { initials, loadPeople, type Person } from '@/lib/people-storage';
import { loadAppLang } from '@/lib/calendar-preferences';
import { useQueuedEffect } from '@/lib/use-queued-effect';

export function PeopleHomeRow({ lang: langProp }: { lang?: PeopleLang } = {}) {
  const [people, setPeople] = useState<Person[]>([]);
  const [storedLang, setStoredLang] = useState<PeopleLang>(() => {
    const stored = loadAppLang();
    if (stored === 'ru' || stored === 'fa' || stored === 'ar' || stored === 'en') return stored;
    return 'en';
  });
  const lang = langProp ?? storedLang;

  useQueuedEffect(() => {
    if (!langProp) {
      const stored = loadAppLang();
      if (stored === 'ru' || stored === 'fa' || stored === 'ar' || stored === 'en') {
        setStoredLang(stored);
      }
    }
    setPeople(loadPeople().slice(0, 8));
  }, [langProp]);

  if (people.length === 0) return null;

  const t = PEOPLE_LANGS[lang];

  return (
    <section className="border-t border-white/10 pt-1">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white/90">{t.homeTitle}</h2>
        <Link href="/people" className="text-sm text-amber-400 hover:text-amber-300 no-underline">
          {t.homeSeeAll}
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3">
        {people.map((p) => {
          const badge = p.synergyBadge;
          const style = badge ? BADGE_STYLES[badge] : null;
          return (
            <Link
              key={p.id}
              href={`/people/${p.id}`}
              className="flex-shrink-0 flex flex-col items-center gap-2 no-underline w-20"
            >
              <div className="flex flex-col items-center gap-1.5 min-h-[4.75rem]">
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
                {badge ? (
                  <span
                    className="text-[8px] leading-none px-1.5 py-0.5 rounded-full whitespace-nowrap font-medium"
                    style={{
                      background: style!.bg,
                      color: style!.text,
                      border: `1px solid ${style!.border}`,
                    }}
                  >
                    {t.badges[badge]}
                  </span>
                ) : (
                  <span className="h-3.5" aria-hidden />
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
