'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { HOME_LANGS } from '@/lib/home-i18n';
import { PersonAvatar } from '@/components/PersonAvatar';
import { SynergyBadgePill } from '@/components/SynergyBadge';
import { getBirthProfile } from '@/lib/birth-profile';
import { saveAppLang } from '@/lib/calendar-preferences';
import { PEOPLE_LANGS, type PeopleLang } from '@/lib/people-i18n';
import { getPerson, updatePerson } from '@/lib/people-storage';
import {
  analyzeSynergy,
  BADGE_STYLES,
  formatAspectLabel,
  type SynastryAspect,
  type SynergyResult,
} from '@/lib/synergy';
import {
  computeLifeAreas,
  formatModularLine,
  friendlyAspectLabel,
  getAspectInsight,
  LAYER_LABELS,
  orbStars,
  pickFeaturedAspects,
  strengthLabel,
} from '@/lib/synastry-i18n';

export default function PersonSynergyPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const [lang, setLangState] = useState<PeopleLang>('en');
  const [result, setResult] = useState<SynergyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);
  const [person, setPerson] = useState(
    () => (id ? getPerson(id) : null)
  );

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
  const featured = result
    ? pickFeaturedAspects(result.harmony, result.tension)
    : null;
  const layers = LAYER_LABELS[lang];

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
              {t.relationships[person.relationship]} · {t.synergy}
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

        {result && !loading && (
          <div className="space-y-4">
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                background: badgeStyle?.bg,
                border: `1px solid ${badgeStyle?.border}`,
              }}
            >
              <div className="fi text-[10px] uppercase tracking-widest mb-2 text-white/40">
                {t.compatibility}
              </div>
              <div className="fc text-5xl mb-2" style={{ color: badgeStyle?.text }}>
                {result.score}
              </div>
              <SynergyBadgePill badge={result.badge} label={t.badges[result.badge]} />
            </div>

            <Section title={t.lifeAreas} accent="#a78bfa">
              {computeLifeAreas(lang, result.harmony, result.tension).map((area) => (
                <LifeAreaBar key={area.key} label={area.label} pct={area.pct} dir={t.dir} />
              ))}
            </Section>

            <Section title={t.shared} accent="#4ade80">
              {result.harmony.length === 0 ? (
                <p className="fi text-xs text-white/35">{t.noHarmony}</p>
              ) : (
                result.harmony.slice(0, 8).map((row, i) => (
                  <AspectRow key={i} row={row} lang={lang} color="#4ade80" />
                ))
              )}
            </Section>

            <Section title={t.conflict} accent="#f87171">
              {result.tension.length === 0 ? (
                <p className="fi text-xs text-white/35">{t.noTension}</p>
              ) : (
                result.tension.slice(0, 8).map((row, i) => (
                  <AspectRow key={i} row={row} lang={lang} color="#f87171" />
                ))
              )}
            </Section>

            {featured && featured.featured.length > 0 && (
              <Section title={t.keyConnections} accent="#c4b5fd">
                {featured.featured.map((row, i) => (
                  <InsightCard key={i} row={row} lang={lang} layers={layers} />
                ))}
              </Section>
            )}

            {featured && featured.secondary.length > 0 && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowSecondary((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 fi text-xs text-white/50 hover:text-white/70 transition-colors"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <span>{layers.more}</span>
                  <span className="text-white/30">{showSecondary ? '▲' : '▼'}</span>
                </button>
                {showSecondary && (
                  <div className="px-4 pb-4 space-y-2 border-t border-white/5">
                    {featured.secondary.map((row, i) => {
                      const insight = getAspectInsight(lang, row);
                      if (insight.kind !== 'modular') return null;
                      return (
                        <p key={i} className="fi text-[11px] leading-relaxed text-white/45">
                          {formatModularLine(lang, insight.line)}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <Section title={t.bestDays} accent="#fbbf24">
              {result.bestDays.length === 0 ? (
                <p className="fi text-xs text-white/35">{t.apiError}</p>
              ) : (
                result.bestDays.map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                  >
                    <span className="fi text-sm text-white/80">{day.date}</span>
                    <div className="fi text-[10px] text-right text-white/45">
                      <div>
                        {t.combined}:{' '}
                        <span style={{ color: '#fbbf24' }}>{day.combined}</span>
                      </div>
                      <div>
                        {t.myScore} {day.myScore} · {t.theirScore} {day.theirScore}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </Section>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="fc text-xs tracking-wider mb-3" style={{ color: accent }}>
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function LifeAreaBar({ label, pct, dir }: { label: string; pct: number; dir: 'ltr' | 'rtl' }) {
  const tone = pct >= 70 ? '#4ade80' : pct >= 45 ? '#fbbf24' : '#f87171';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="fi text-xs text-white/70">{label}</span>
        <span className="fc text-xs" style={{ color: tone }}>
          {pct}%
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: tone,
            marginLeft: dir === 'rtl' ? 'auto' : undefined,
          }}
        />
      </div>
    </div>
  );
}

function StrengthStars({ orb, color }: { orb: number; color: string }) {
  const filled = orbStars(orb);
  return (
    <span className="inline-flex gap-0.5 shrink-0" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="text-[9px] leading-none"
          style={{ color: i < filled ? color : 'rgba(255,255,255,0.18)' }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function InsightCard({
  row,
  lang,
  layers,
}: {
  row: SynastryAspect;
  lang: PeopleLang;
  layers: (typeof LAYER_LABELS)['en'];
}) {
  const insight = getAspectInsight(lang, row);
  const isTension = row.aspect === 'square' || row.aspect === 'opposition';
  const accent = isTension ? '#f87171' : '#4ade80';

  if (insight.kind === 'modular') {
    return (
      <div
        className="rounded-xl px-3 py-2.5"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="fi text-xs text-white/65 mb-1">{friendlyAspectLabel(lang, row)}</div>
        <p className="fi text-[11px] leading-relaxed text-white/40">
          {formatModularLine(lang, insight.line)}
        </p>
      </div>
    );
  }

  const { story, strength, care } = insight.analysis;
  return (
    <div
      className="rounded-xl px-3 py-3 space-y-2"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${accent}33`,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="fi text-xs text-white/75">{friendlyAspectLabel(lang, row)}</span>
        <StrengthStars orb={row.orb} color={accent} />
      </div>
      <p className="fi text-[10px] text-white/30">{formatAspectLabel(row, lang)}</p>
      <div className="space-y-1.5 pt-1">
        <LayerLine label={layers.story} text={story} />
        <LayerLine label={layers.strength} text={strength} accent={accent} />
        <LayerLine label={layers.care} text={care} accent="#fbbf24" />
      </div>
    </div>
  );
}

function LayerLine({
  label,
  text,
  accent,
}: {
  label: string;
  text: string;
  accent?: string;
}) {
  return (
    <div>
      <span className="fi text-[10px] uppercase tracking-wide" style={{ color: accent ?? 'rgba(255,255,255,0.35)' }}>
        {label}
      </span>
      <p className="fi text-xs leading-relaxed text-white/60 mt-0.5">{text}</p>
    </div>
  );
}

function AspectRow({
  row,
  lang,
  color,
}: {
  row: SynastryAspect;
  lang: PeopleLang;
  color: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span style={{ color }} className="text-xs mt-0.5">
        ◆
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="fi text-xs leading-relaxed text-white/80">
            {friendlyAspectLabel(lang, row)}
          </span>
          <StrengthStars orb={row.orb} color={color} />
        </div>
        <div className="fi text-[10px] leading-relaxed text-white/35 mt-0.5">
          {formatAspectLabel(row, lang)} · {strengthLabel(lang, row.orb)}
        </div>
      </div>
    </div>
  );
}
