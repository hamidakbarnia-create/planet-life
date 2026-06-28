'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PeopleHomeRow } from '@/components/PeopleHomeRow';
import { CosmosCard } from '@/components/home/CosmosCard';
import type { BirthProfile } from '@/lib/birth-profile';
import type { AppLang } from '@/lib/app-settings';
import { chartPreferenceFields } from '@/lib/app-settings';
import { HOME_LANGS } from '@/lib/home-i18n';
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
import { todayYMD } from '@/lib/calendar-utils';
import { loadPeople } from '@/lib/people-storage';
import { PEOPLE_LANGS } from '@/lib/people-i18n';

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
  const [hourly, setHourly] = useState<HourScore[]>([]);
  const [hourlyLoading, setHourlyLoading] = useState(true);
  const [synergyAlerts, setSynergyAlerts] = useState<string[]>([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (
      !hasProfile ||
      !profile ||
      !profile.birth_date ||
      !profile.birth_time ||
      !profile.location
    ) {
      setDayLoading(false);
      setHourlyLoading(false);
      setDayScore(null);
      setHourly([]);
      return;
    }
    let cancelled = false;
    setDayLoading(true);
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
        if (!cancelled) setDayLoading(false);
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
  }, [hasProfile, profile, today, lang]);

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
    <div className="space-y-5">
      <header className="space-y-1">
        <div
          className="fi text-[10px] tracking-[0.3em] uppercase"
          style={{ color: 'rgba(251,191,36,0.7)' }}
        >
          {t.dailyBrief}
        </div>
        <h1
          className="fc text-2xl tracking-wide"
          style={{ color: '#ffffff' }}
        >
          {longDate}
        </h1>
        <div className="fi text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {t.todayLabel}
        </div>
      </header>

      {!hasProfile && (
        <div
          className="rounded-2xl p-4 fi text-sm"
          style={{
            background: 'rgba(251,191,36,0.06)',
            border: '1px solid rgba(251,191,36,0.2)',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          {t.noProfile}{' '}
          <Link href="/profile" style={{ color: '#fbbf24' }}>
            {t.goProfile}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-stretch">
        <CosmosCard lang={lang} />

        <section
          className="rounded-2xl px-5 py-6 flex flex-col items-center justify-center gap-3 md:w-44"
          style={{
            background: scoreStyle.bg,
            border: `1px solid ${scoreStyle.border}`,
          }}
        >
          <div
            className="fi text-[10px] uppercase tracking-[0.22em] text-center"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            {t.todayScore}
          </div>
          {dayLoading ? (
            <div
              className="fi text-sm"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {t.loading}
            </div>
          ) : (
            <div className="flex items-baseline justify-center gap-1">
              <div
                className="fc text-5xl leading-none"
                style={{ color: scoreStyle.text }}
              >
                {dayScore != null ? dayScore : '—'}
              </div>
              <div
                className="fi text-xs"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                /100
              </div>
            </div>
          )}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${scoreStyle.border}`,
              color: scoreStyle.text,
            }}
          >
            <span className="fc text-base">◐</span>
          </div>
        </section>
      </div>

      <section
        className="rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div
          className="fi text-[10px] uppercase tracking-widest shrink-0"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          {t.hourlyLabel}
        </div>
        {hourlyLoading ? (
          <div className="flex-1 h-6 rounded-md" style={{ background: 'rgba(255,255,255,0.04)' }} />
        ) : hourly.length === 0 ? (
          <div className="fi text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {t.noWindow}
          </div>
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
      </section>

      <section className="grid grid-cols-2 gap-3">
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
      </section>

      <section
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <ul className="space-y-3">
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
            color="#fbbf24"
            text={
              synergyAlerts.length
                ? `${t.synergyAlerts}: ${synergyAlerts.join(' · ')}`
                : t.noSynergy
            }
          />
        </ul>
      </section>

      <PeopleHomeRow lang={lang} />

      <JuliaTrustCard lang={lang} />

      <div>
        <button
          type="button"
          onClick={() => setAiOpen((o) => !o)}
          className="w-full py-3 rounded-xl fc text-sm tracking-wide"
          style={{
            background: 'rgba(251,191,36,0.12)',
            border: '1px solid rgba(251,191,36,0.35)',
            color: '#fbbf24',
          }}
        >
          {t.askAi}
        </button>
        {aiOpen && (
          <div
            className="mt-3 rounded-2xl p-4 space-y-3"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <input
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder={t.askPlaceholder}
              className="w-full fi text-sm px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white outline-none focus:border-amber-500/40"
              onKeyDown={(e) => e.key === 'Enter' && askAi()}
            />
            <button
              type="button"
              disabled={aiLoading || !aiQuestion.trim()}
              onClick={askAi}
              className="fi text-xs px-4 py-2 rounded-lg"
              style={{
                background: '#fbbf24',
                color: '#0A0E1A',
                opacity: aiLoading || !aiQuestion.trim() ? 0.5 : 1,
              }}
            >
              {aiLoading ? t.askLoading : t.askAi}
            </button>
            {aiAnswer && (
              <p
                className="fi text-sm leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.75)' }}
              >
                {aiAnswer}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function JuliaTrustCard({ lang }: { lang: AppLang }) {
  const t = JULIA_CARD[lang];
  return (
    <section
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{
        background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(124,58,237,0.10))',
        border: '1px solid rgba(251,191,36,0.22)',
      }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 fc text-xl"
        style={{
          background: 'rgba(251,191,36,0.12)',
          border: '1px solid rgba(251,191,36,0.35)',
          color: '#fbbf24',
        }}
      >
        J
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="fi text-[10px] uppercase tracking-[0.22em] mb-1"
          style={{ color: 'rgba(251,191,36,0.7)' }}
        >
          {t.eyebrow}
        </div>
        <div className="fc text-base mb-1" style={{ color: '#ffffff' }}>
          {t.title}
        </div>
        <p
          className="fi text-xs leading-relaxed mb-3"
          style={{ color: 'rgba(255,255,255,0.62)' }}
        >
          {t.body}
        </p>
        <Link
          href="/ask"
          className="inline-flex fi text-xs px-3 py-1.5 rounded-lg no-underline"
          style={{
            background: 'rgba(251,191,36,0.14)',
            border: '1px solid rgba(251,191,36,0.35)',
            color: '#fbbf24',
          }}
        >
          {t.cta}
        </Link>
      </div>
    </section>
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
      : { border: 'rgba(248,113,113,0.35)', text: '#f87171', bg: 'rgba(248,113,113,0.05)', dot: '#fbbf24' };
  // A live, gently pulsing status dot so the box reads as an active monitor
  // even when there is no window to show (empty state still feels alive).
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: palette.bg, border: `1px solid ${palette.border}` }}
    >
      <div
        className="fi text-[10px] uppercase tracking-widest mb-1 flex items-center gap-1.5"
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
        <div className="fi text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {loadingLabel}
        </div>
      ) : hour ? (
        <div className="flex items-baseline gap-2 flex-wrap">
          <div className="fc text-2xl" style={{ color: palette.text }}>
            {formatHourLabel(hour.hour, lang)}
          </div>
          <div className="fi text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {hour.score}/100
          </div>
        </div>
      ) : (
        <div className="fi text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {fallback}
        </div>
      )}
    </div>
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
    <li
      className="flex items-start gap-2 fi text-sm"
      style={{ color: 'rgba(255,255,255,0.75)' }}
    >
      <span style={{ color }}>{icon}</span>
      <span>{text}</span>
    </li>
  );
}
