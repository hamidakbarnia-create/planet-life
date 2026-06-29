'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { SynergyIntelligenceDashboard } from '@/components/SynergyIntelligenceDashboard';
import { HOME_LANGS } from '@/lib/home-i18n';
import { PersonAvatar } from '@/components/PersonAvatar';
import { getBirthProfile } from '@/lib/birth-profile';
import { saveAppLang } from '@/lib/calendar-preferences';
import { PEOPLE_LANGS, getBadgeLabel, type PeopleLang } from '@/lib/people-i18n';
import { getPerson, updatePerson } from '@/lib/people-storage';
import { resolveRelationshipProfileStrict } from '@/lib/relationship-profile';
import { relationshipProfileLabel } from '@/lib/relationship-profile-i18n';
import { buildSynergyDashboardView } from '@/lib/synastry-dashboard';
import { analyzeSynergy, BADGE_STYLES, type SynergyResult } from '@/lib/synergy';

export default function PersonSynergyPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const [lang, setLangState] = useState<PeopleLang>('en');
  const [result, setResult] = useState<SynergyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [person, setPerson] = useState(() => (id ? getPerson(id) : null));

  const t = PEOPLE_LANGS[lang];

  const setLang = (l: PeopleLang) => {
    setLangState(l);
    saveAppLang(l);
  };

  useEffect(() => {
    const stored = localStorage.getItem('planet-life-lang');
    if (stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar') {
      setLangState(stored);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    const p = getPerson(id);
    setPerson(p);
    if (!p) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    analyzeSynergy(getBirthProfile(), p).then((data) => {
      if (cancelled) return;
      if (!data) {
        setError(true);
        setLoading(false);
        return;
      }
      setResult(data);
      updatePerson(id, {
        synergyScore: data.score,
        synergyBadge: data.badge,
        synergyUpdatedAt: Date.now(),
      });
      setPerson(getPerson(id));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const profileResolved = person ? resolveRelationshipProfileStrict(person.relationship) : null;
  const profile = profileResolved?.ok ? profileResolved.profile : null;

  const dashboardView = useMemo(() => {
    if (!result || !profile) return null;
    return buildSynergyDashboardView(lang, profile, result);
  }, [lang, profile, result]);

  if (!person) {
    return (
      <AppShell lang={lang} setLang={setLang} dir={t.dir} navLabels={HOME_LANGS[lang].nav}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center fi text-sm text-white/40">
          <Link href="/people" className="text-amber-400">
            {t.back}
          </Link>
        </div>
      </AppShell>
    );
  }

  const badgeStyle = result ? BADGE_STYLES[result.badge] : null;

  return (
    <AppShell
      lang={lang}
      setLang={setLang}
      dir={t.dir}
      navLabels={HOME_LANGS[lang].nav}
      fontFamily={lang === 'fa' || lang === 'ar' ? 'Vazirmatn, sans-serif' : 'Inter, sans-serif'}
    >
      <div className="max-w-lg mx-auto px-4 py-6">
        <Link
          href="/people"
          className="fi text-xs text-white/40 hover:text-white mb-4 inline-block no-underline"
        >
          ← {t.back}
        </Link>

        <div className="flex items-center gap-4 mb-6">
          <PersonAvatar
            name={person.name}
            photoDataUrl={person.photoDataUrl}
            size={56}
            borderColor={badgeStyle?.border}
          />
          <div>
            <h1 className="fc text-lg" style={{ color: '#fbbf24' }}>
              {person.name}
            </h1>
            <p className="fi text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {profile ? relationshipProfileLabel(lang, profile.key) : t.relationships.friend} ·{' '}
              {t.synergy}
            </p>
          </div>
        </div>

        {loading && (
          <p className="fi text-sm text-center py-16" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {t.loading}
          </p>
        )}

        {error && !loading && (
          <p className="fi text-sm text-center py-16" style={{ color: '#fca5a5' }}>
            {t.apiError}
          </p>
        )}

        {dashboardView && !loading && (
          <SynergyIntelligenceDashboard
            view={dashboardView}
            lang={lang}
            badgeLabel={getBadgeLabel(t.badges, dashboardView.overall.badge)}
            dir={t.dir}
          />
        )}
      </div>
    </AppShell>
  );
}
