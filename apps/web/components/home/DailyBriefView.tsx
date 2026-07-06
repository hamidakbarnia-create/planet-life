'use client';

import Link from 'next/link';
import { PeopleHomeRow } from '@/components/PeopleHomeRow';
import { CosmosCard } from '@/components/home/CosmosCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageHeader } from '@/components/ui/PageHeader';
import type { BirthProfile } from '@/lib/birth-profile';
import type { AppLang } from '@/lib/app-settings';
import { chartPreferenceFields } from '@/lib/app-settings';
import { HOME_LANGS } from '@/lib/home-i18n';
import { COLORS } from '@/lib/brand-theme';
import {
  API_BASE,
  fetchDayScore,
  fetchHourlyScores,
  formatHourLabel,
  isDangerHour,
  isGoldenHour,
  scoreToBand,
  BAND_STYLES,
  type HourScore,
} from '@/lib/calendar-scores';
import { hasConfirmedCurrentLocation } from '@/lib/user-locations';
import { todayYMD } from '@/lib/calendar-utils';
import { loadPeople } from '@/lib/people-storage';
import { PEOPLE_LANGS } from '@/lib/people-i18n';
import { useCallback, useEffect, useMemo, useState } from 'react';

const LOCALE_MAP: Record<AppLang, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  fa: 'fa-IR',
  ar: 'ar-EG',
};

const JULIA_CARD: Record<
  AppLang,
  {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
  }
> = {
  en: {
    eyebrow: 'Private astrologer',
    title: 'Julia, Russian astrologer',
    body:
      'For deeper timing questions, Julia reviews the context behind the score and turns it into a practical decision.',
    cta: 'Ask a question',
  },
  ru: {
    eyebrow: 'Личный астролог',
    title: 'Юлия, российский астролог',
    body:
      'Для глубоких вопросов Юлия разбирает контекст оценки и переводит его в практическое решение.',
    cta: 'Задать вопрос',
  },
  fa: {
    eyebrow: 'منجم خصوصی',
    title: 'جولیا، منجم روسی',
    body:
      'برای سوال‌های عمیق‌تر، جولیا زمینه پشت امتیاز را بررسی می‌کند و آن را به یک تصمیم عملی تبدیل می‌کند.',
    cta: 'طرح سوال',
  },
  ar: {
    eyebrow: 'منجّمة خاصة',
    title: 'جوليا، منجّمة روسية',
    body:
      'للأسئلة الأعمق، تراجع جوليا السياق خلف الدرجة وتحوله إلى قرار عملي.',
    cta: 'اطرح سؤالك',
  },
};

function formatLongDate(ymd: string, lang: AppLang): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  try {
    return new Intl.DateTimeFormat(LOCALE_MAP[lang], {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return ymd;
  }
}

export function DailyBriefView({
  lang,
  profile,
  hasProfile,
}: {
  lang: AppLang;
  profile: BirthProfile | null;
  hasProfile: boolean;
}) {
  const t = HOME_LANGS[lang];
  const today = todayYMD();
  const [dayScore, setDayScore] = useState<number | null>(null);
  const [dayLoading, setDayLoading] = useState(true);
  const [scoreFetchComplete, setScoreFetchComplete] = useState(false);
  const [hourly, setHourly] = useState<HourScore[]>([]);
  const [hourlyLoading, setHourlyLoading] = useState(true);
  const [synergyAlerts, setSynergyAlerts] = useState<string[]>([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const profileReady =
    hasProfile &&
    !!profile &&
    !!profile.birth_date &&
    !!profile.birth_time &&
    !!profile.location &&
    hasConfirmedCurrentLocation(profile);

  useEffect(() => {
    if (!profileReady) {
      setDayLoading(false);
      setScoreFetchComplete(false);
      setHourlyLoading(false);
      setDayScore(null);
      setHourly([]);
      return;
    }
    let cancelled = false;
    setDayLoading(true);
    setScoreFetchComplete(false);
    setHourlyLoading(true);
    setDayScore(null);
    setHourly([]);

    fetchDayScore(profile, today)
      .then((score) => {
        if (cancelled) return;
        setDayScore(score);
      })
      .catch(() => {
        if (!cancelled) setDayScore(null);
      })
      .finally(() => {
        if (!cancelled) {
          setDayLoading(false);
          setScoreFetchComplete(true);
        }
      });

    fetchHourlyScores(profile, today)
      .then((data) => {
        if (cancelled) return;
        setHourly(data);
      })
      .catch(() => {
        if (!cancelled) setHourly([]);
      })
      .finally(() => {
        if (!cancelled) setHourlyLoading(false);
      });

    try {
      const people = loadPeople();
      const alerts = people
        .filter(
          (p) => p.synergyBadge === 'caution' || p.synergyBadge === 'tension'
        )
        .slice(0, 3)
        .map((p) => {
          const badge = p.synergyBadge!;
          const label = PEOPLE_LANGS[lang].badges[badge];
          return `${p.name}: ${label}`;
        });
      setSynergyAlerts(alerts);
    } catch {
      setSynergyAlerts([]);
    }

    return () => {
      cancelled = true;
    };
  }, [profileReady, profile, today, lang]);

  const showScoreCalculating = profileReady && (!scoreFetchComplete || dayLoading);

  const askAi = useCallback(async () => {
    const q = aiQuestion.trim();
    if (!q || !hasProfile || !profile) return;
    setAiLoading(true);
    setAiAnswer('');
    try {
      const res = await fetch(`${API_BASE}/api/business/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birth_date: profile.birth_date,
          birth_time: profile.birth_time,
          location: profile.location,
          action_type: q,
          target_date: today,
          ...chartPreferenceFields(),
        }),
      });
      const data = await res.json();
      if (data.detail) setAiAnswer(String(data.detail));
      else setAiAnswer(data.executive?.recommendation ?? '—');
    } catch {
      setAiAnswer('Cannot connect to API.');
    }
    setAiLoading(false);
  }, [aiQuestion, hasProfile, profile, today]);

  const band = scoreToBand(dayScore ?? undefined);
  const scoreStyle = BAND_STYLES[band];

  const goldenHours = useMemo(
    () => hourly.filter((h) => isGoldenHour(h.score)),
    [hourly]
  );
  const dangerHours = useMemo(
    () => hourly.filter((h) => isDangerHour(h.score)),
    [hourly]
  );

  const bestHour = useMemo(() => {
    if (!hourly.length) return null;
    return hourly.reduce((best, h) => (h.score > best.score ? h : best), hourly[0]);
  }, [hourly]);

  const worstHour = useMemo(() => {
    if (!hourly.length) return null;
    return hourly.reduce((worst, h) => (h.score < worst.score ? h : worst), hourly[0]);
  }, [hourly]);

  const longDate = useMemo(() => formatLongDate(today, lang), [today, lang]);

  return (
    <div className="mio-home-dashboard">
      <PageHeader eyebrow={t.dailyBrief} title={longDate} subtitle={t.todayLabel} />

      <div className="mio-home-grid mio-home-grid--primary">
        <div
          className="mio-home-score mio-glass mio-glass--metric"
          style={{
            background: scoreStyle.bg,
            border: `1px solid ${scoreStyle.border}`,
          }}
        >
          <div className="mio-label fi">{t.todayScore}</div>
          {showScoreCalculating ? (
            <div
              className="fi text-sm text-center mio-caption"
              data-testid="daily-score-loading"
            >
              {t.calculatingScore}
            </div>
          ) : dayScore != null ? (
            <div className="flex items-baseline justify-center gap-1">
              <div className="mio-home-score__value fc" style={{ color: scoreStyle.text }}>
                {dayScore}
              </div>
              <div className="fi text-xs mio-caption">/100</div>
            </div>
          ) : (
            <div className="mio-home-score__value fc" style={{ color: scoreStyle.text }}>
              —
            </div>
          )}
        </div>

        <CosmosCard lang={lang} className="mio-home-cosmos" />
      </div>

      <GlassCard variant="secondary" className="!py-3 !px-4">
        <div className="flex items-center gap-3">
          <div className="mio-label fi shrink-0">{t.hourlyLabel}</div>
          {hourlyLoading ? (
            <div className="flex-1 h-6 rounded-md" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ) : hourly.length === 0 ? (
            <div className="fi text-xs mio-caption">{t.noWindow}</div>
          ) : (
            <div
              className="flex gap-[2px] h-6 rounded-md overflow-hidden flex-1"
              style={{ direction: 'ltr' }}
            >
              {hourly.map((h) => {
                const s = BAND_STYLES[h.band];
                return (
                  <div
                    key={h.hour}
                    title={`${formatHourLabel(h.hour, lang)} · ${h.score}/100`}
                    className="flex-1 relative group"
                    style={{ background: s.bg, borderTop: `2px solid ${s.border}` }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </GlassCard>

      <div className="mio-home-grid mio-home-grid--windows">
        <HighlightCard
          label={t.bestWindow}
          hour={bestHour && isGoldenHour(bestHour.score) ? bestHour : null}
          fallback={t.noGolden}
          loading={hourlyLoading}
          loadingLabel={t.loading}
          accent="green"
          lang={lang}
        />
        <HighlightCard
          label={t.avoidWindow}
          hour={worstHour && isDangerHour(worstHour.score) ? worstHour : null}
          fallback={t.noWarnings}
          loading={hourlyLoading}
          loadingLabel={t.loading}
          accent="red"
          lang={lang}
        />
      </div>

      <GlassCard variant="secondary">
        <ul className="space-y-2">
          <BulletLine
            icon="✦"
            color="#4ade80"
            text={
              hourlyLoading
                ? t.loading
                : goldenHours.length
                  ? `${t.goldenHours}: ${goldenHours.slice(0, 4).map((h) => formatHourLabel(h.hour, lang)).join(', ')}`
                  : t.noGolden
            }
          />
          <BulletLine
            icon="⚡"
            color="#f87171"
            text={
              hourlyLoading
                ? t.loading
                : dangerHours.length
                  ? `${t.warnings}: ${dangerHours.slice(0, 3).map((h) => formatHourLabel(h.hour, lang)).join(', ')}`
                  : t.noWarnings
            }
          />
          <BulletLine
            icon="◆"
            color={COLORS.goldMain}
            text={
              synergyAlerts.length
                ? `${t.synergyAlerts}: ${synergyAlerts.join(' · ')}`
                : t.noSynergy
            }
          />
        </ul>
      </GlassCard>

      <PeopleHomeRow lang={lang} />

      <JuliaTrustCard lang={lang} />

      <div>
        <button type="button" onClick={() => setAiOpen((o) => !o)} className="metioro-btn metioro-btn--secondary fc w-full">
          {t.askAi}
        </button>
        {aiOpen && (
          <GlassCard variant="secondary" className="mt-3 !p-4 space-y-3">
            <input
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder={t.askPlaceholder}
              className="metioro-input fi w-full"
              onKeyDown={(e) => e.key === 'Enter' && askAi()}
            />
            <button
              type="button"
              disabled={aiLoading || !aiQuestion.trim()}
              onClick={askAi}
              className="metioro-btn metioro-btn--primary fi !w-auto !min-h-0 px-4 py-2"
              style={{ opacity: aiLoading || !aiQuestion.trim() ? 0.5 : 1 }}
            >
              {aiLoading ? t.askLoading : t.askAi}
            </button>
            {aiAnswer && (
              <p className="fi text-sm leading-relaxed mio-caption">{aiAnswer}</p>
            )}
          </GlassCard>
        )}
      </div>
    </div>
  );
}

function JuliaTrustCard({ lang }: { lang: AppLang }) {
  const t = JULIA_CARD[lang];
  return (
    <GlassCard variant="signature" className="flex items-center gap-4 !p-4">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 fc text-xl"
        style={{
          background: 'rgba(212, 175, 55, 0.12)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          color: COLORS.goldMain,
        }}
      >
        J
      </div>
      <div className="flex-1 min-w-0">
        <div className="mio-label fi mb-1">{t.eyebrow}</div>
        <div className="mio-value fc mb-1">{t.title}</div>
        <p className="mio-caption fi mb-3">{t.body}</p>
        <Link
          href="/ask"
          className="inline-flex fi text-xs px-3 py-1.5 rounded-lg no-underline metioro-header-chip"
          style={{
            borderColor: 'rgba(212, 175, 55, 0.35)',
            color: COLORS.goldMain,
            background: 'rgba(212, 175, 55, 0.1)',
          }}
        >
          {t.cta}
        </Link>
      </div>
    </GlassCard>
  );
}

function HighlightCard({
  label,
  hour,
  fallback,
  loading,
  loadingLabel,
  accent,
  lang,
}: {
  label: string;
  hour: HourScore | null;
  fallback: string;
  loading: boolean;
  loadingLabel: string;
  accent: 'green' | 'red';
  lang: AppLang;
}) {
  const palette =
    accent === 'green'
      ? { border: 'rgba(74,222,128,0.35)', text: '#4ade80', bg: 'rgba(74,222,128,0.05)', dot: '#4ade80' }
      : { border: 'rgba(248,113,113,0.35)', text: '#f87171', bg: 'rgba(248,113,113,0.05)', dot: '#f87171' };

  return (
    <GlassCard variant="metric">
      <div
        className="fi text-[10px] uppercase tracking-widest mb-1 flex items-center gap-1.5 mio-label"
        style={{ color: 'rgba(255,255,255,0.45)' }}
      >
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full animate-pulse shrink-0"
          style={{ background: palette.dot, boxShadow: `0 0 6px ${palette.dot}` }}
        />
        {label}
      </div>
      {loading ? (
        <div className="fi text-xs mio-caption">{loadingLabel}</div>
      ) : hour ? (
        <div className="flex items-baseline gap-2 flex-wrap">
          <div className="fc text-2xl mio-value" style={{ color: palette.text }}>
            {formatHourLabel(hour.hour, lang)}
          </div>
          <div className="fi text-xs mio-caption">{hour.score}/100</div>
        </div>
      ) : (
        <div className="fi text-xs mio-caption">{fallback}</div>
      )}
    </GlassCard>
  );
}

function BulletLine({
  icon,
  color,
  text,
}: {
  icon: string;
  color: string;
  text: string;
}) {
  return (
    <li className="flex items-start gap-2 fi text-sm mio-caption">
      <span style={{ color }}>{icon}</span>
      <span>{text}</span>
    </li>
  );
}
