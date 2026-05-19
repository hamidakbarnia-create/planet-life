'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PeopleHomeRow } from '@/components/PeopleHomeRow';
import type { BirthProfile } from '@/lib/birth-profile';
import type { AppLang } from '@/lib/app-settings';
import { chartPreferenceFields } from '@/lib/app-settings';
import { HOME_LANGS } from '@/lib/home-i18n';
import {
  API_BASE,
  fetchDayScore,
  fetchHourlyScores,
  isDangerHour,
  isGoldenHour,
  scoreToBand,
  BAND_STYLES,
} from '@/lib/calendar-scores';
import { todayYMD } from '@/lib/calendar-utils';
import { loadPeople } from '@/lib/people-storage';
import { PEOPLE_LANGS } from '@/lib/people-i18n';

export function DailyBriefView({
  lang,
  profile,
  hasProfile,
}: {
  lang: AppLang;
  profile: BirthProfile;
  hasProfile: boolean;
}) {
  const t = HOME_LANGS[lang];
  const today = todayYMD();
  const [dayScore, setDayScore] = useState<number | null>(null);
  const [bullets, setBullets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!hasProfile) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const score = await fetchDayScore(profile, today);
      const hourly = await fetchHourlyScores(profile, today);
      if (cancelled) return;

      const golden = hourly.filter((h) => isGoldenHour(h.score)).map((h) => h.time);
      const danger = hourly.filter((h) => isDangerHour(h.score)).map((h) => h.time);
      const people = loadPeople();
      const alerts = people
        .filter((p) => p.synergyBadge === 'caution' || p.synergyBadge === 'tension')
        .slice(0, 3)
        .map((p) => {
          const badge = p.synergyBadge!;
          const label = PEOPLE_LANGS[lang].badges[badge];
          return `${p.name}: ${label}`;
        });

      const points: string[] = [];
      if (golden.length) {
        points.push(`${t.goldenHours}: ${golden.slice(0, 4).join(', ')}`);
      } else {
        points.push(t.noGolden);
      }
      if (danger.length) {
        points.push(`${t.warnings}: ${danger.slice(0, 3).join(', ')}`);
      } else {
        points.push(t.noWarnings);
      }
      if (alerts.length) {
        points.push(`${t.synergyAlerts}: ${alerts.join(' · ')}`);
      } else {
        points.push(t.noSynergy);
      }

      setDayScore(score);
      setBullets(points);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [hasProfile, profile, today, lang]);

  const askAi = useCallback(async () => {
    const q = aiQuestion.trim();
    if (!q || !hasProfile) return;
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

  return (
    <div className="space-y-5">
      <h1 className="fc text-xl tracking-wide" style={{ color: '#fbbf24' }}>
        {t.dailyBrief}
      </h1>

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

      <div
        className="rounded-2xl p-6"
        style={{
          background: scoreStyle.bg,
          border: `1px solid ${scoreStyle.border}`,
        }}
      >
        <div className="fi text-[10px] uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {t.todayScore}
        </div>
        {loading ? (
          <div className="fi text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {t.loading}
          </div>
        ) : (
          <div className="fc text-4xl" style={{ color: scoreStyle.text }}>
            {dayScore != null ? `${dayScore}/100` : '—'}
          </div>
        )}
      </div>

      <div
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <ul className="space-y-3">
          {bullets.map((line, i) => (
            <li key={i} className="flex items-start gap-2 fi text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <span style={{ color: '#fbbf24' }}>◆</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <PeopleHomeRow />

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
              <p className="fi text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {aiAnswer}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
