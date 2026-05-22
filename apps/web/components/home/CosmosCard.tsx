'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AppLang } from '@/lib/app-settings';
import { chartPreferenceFields } from '@/lib/app-settings';
import { getBirthProfile } from '@/lib/birth-profile';
import { API_BASE, fetchTransitSnapshot } from '@/lib/calendar-scores';
import { getMoonPhase, MOON_PHASE_NAMES } from '@/lib/moon-phase';
import { todayYMD } from '@/lib/calendar-utils';

interface PlanetSnapshot {
  sign: string;
  degree?: number;
  retrograde?: boolean;
}

const PLANET_GLYPHS: Record<string, string> = {
  sun: '☉',
  moon: '☽',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
};

const SIGN_NAMES: Record<AppLang, Record<string, string>> = {
  en: {
    Aries: 'Aries', Taurus: 'Taurus', Gemini: 'Gemini', Cancer: 'Cancer',
    Leo: 'Leo', Virgo: 'Virgo', Libra: 'Libra', Scorpio: 'Scorpio',
    Sagittarius: 'Sagittarius', Capricorn: 'Capricorn', Aquarius: 'Aquarius', Pisces: 'Pisces',
  },
  ru: {
    Aries: 'Овен', Taurus: 'Телец', Gemini: 'Близнецы', Cancer: 'Рак',
    Leo: 'Лев', Virgo: 'Дева', Libra: 'Весы', Scorpio: 'Скорпион',
    Sagittarius: 'Стрелец', Capricorn: 'Козерог', Aquarius: 'Водолей', Pisces: 'Рыбы',
  },
  fa: {
    Aries: 'حمل', Taurus: 'ثور', Gemini: 'جوزا', Cancer: 'سرطان',
    Leo: 'اسد', Virgo: 'سنبله', Libra: 'میزان', Scorpio: 'عقرب',
    Sagittarius: 'قوس', Capricorn: 'جدی', Aquarius: 'دلو', Pisces: 'حوت',
  },
  ar: {
    Aries: 'الحمل', Taurus: 'الثور', Gemini: 'الجوزاء', Cancer: 'السرطان',
    Leo: 'الأسد', Virgo: 'العذراء', Libra: 'الميزان', Scorpio: 'العقرب',
    Sagittarius: 'القوس', Capricorn: 'الجدي', Aquarius: 'الدلو', Pisces: 'الحوت',
  },
};

const PLANET_NAMES: Record<AppLang, Record<string, string>> = {
  en: { sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto' },
  ru: { sun: 'Солнце', moon: 'Луна', mercury: 'Меркурий', venus: 'Венера', mars: 'Марс', jupiter: 'Юпитер', saturn: 'Сатурн', uranus: 'Уран', neptune: 'Нептун', pluto: 'Плутон' },
  fa: { sun: 'خورشید', moon: 'ماه', mercury: 'عطارد', venus: 'زهره', mars: 'مریخ', jupiter: 'مشتری', saturn: 'زحل', uranus: 'اورانوس', neptune: 'نپتون', pluto: 'پلوتون' },
  ar: { sun: 'الشمس', moon: 'القمر', mercury: 'عطارد', venus: 'الزهرة', mars: 'المريخ', jupiter: 'المشتري', saturn: 'زحل', uranus: 'أورانوس', neptune: 'نبتون', pluto: 'بلوتو' },
};

const LABELS: Record<AppLang, { skyToday: string; moonPhase: string; sunIn: string; moonIn: string; retrograde: string; noRetro: string; loading: string }> = {
  en: { skyToday: "Today's sky", moonPhase: 'Moon phase', sunIn: 'Sun in', moonIn: 'Moon in', retrograde: 'Retrograde', noRetro: 'No planets are retrograde today.', loading: 'Reading the sky…' },
  ru: { skyToday: 'Небо сегодня', moonPhase: 'Фаза Луны', sunIn: 'Солнце в', moonIn: 'Луна в', retrograde: 'Ретроград', noRetro: 'Сегодня нет ретроградных планет.', loading: 'Читаем небо…' },
  fa: { skyToday: 'آسمان امروز', moonPhase: 'فاز ماه', sunIn: 'خورشید در', moonIn: 'ماه در', retrograde: 'رتروگراد', noRetro: 'امروز هیچ سیاره‌ای رتروگراد نیست.', loading: 'در حال خواندن آسمان…' },
  ar: { skyToday: 'سماء اليوم', moonPhase: 'مرحلة القمر', sunIn: 'الشمس في', moonIn: 'القمر في', retrograde: 'تراجع', noRetro: 'لا كواكب متراجعة اليوم.', loading: 'نقرأ السماء…' },
};

function MoonGlyph({ fraction, size = 80 }: { fraction: number; size?: number }) {
  // Render moon as a circle with a curved shadow that tracks the phase.
  // fraction in [0, 1): 0 new, 0.5 full, 1 back to new.
  // Illuminated portion grows from right (waxing) and shrinks from right (waning) for northern hemisphere convention.
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 1;
  // Compute terminator ellipse rx based on phase
  const phase = fraction; // 0..1
  // rx goes: 0->r (new), 0.25->0 (first quarter, terminator is straight), 0.5->-r (full), 0.75->0 (last quarter), 1->r
  const rx = r * Math.cos(2 * Math.PI * phase);
  const waxing = phase < 0.5;
  // The illuminated side: waxing -> right, waning -> left.
  // We draw the lit portion as a path.
  const litColor = '#fde68a';
  const darkColor = '#0d1220';

  // Compose: draw dark full circle, then overlay the lit shape.
  // Lit shape = half-circle on the lit side + ellipse with rx, joined.
  const sweep = waxing ? 1 : 0;
  const half = waxing ? 1 : 0; // outer arc sweep direction for waxing/waning
  const startX = cx;
  const startY = cy - r;
  const endX = cx;
  const endY = cy + r;
  const litPath = `M ${startX} ${startY} A ${r} ${r} 0 0 ${half} ${endX} ${endY} A ${Math.abs(rx)} ${r} 0 0 ${sweep} ${startX} ${startY} Z`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="moonShade" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={darkColor} stroke="rgba(251,191,36,0.35)" strokeWidth="0.5" />
      <path d={litPath} fill="url(#moonShade)" stroke={litColor} strokeWidth="0.3" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(251,191,36,0.25)" strokeWidth="0.5" />
    </svg>
  );
}

export function CosmosCard({ lang }: { lang: AppLang }) {
  const t = LABELS[lang];
  const today = todayYMD();
  const [planets, setPlanets] = useState<Record<string, PlanetSnapshot> | null>(null);
  const [loading, setLoading] = useState(true);

  const moon = useMemo(() => getMoonPhase(new Date()), []);
  const moonPhaseName = MOON_PHASE_NAMES[lang]?.[moon.key] ?? MOON_PHASE_NAMES.en[moon.key];

  useEffect(() => {
    let cancelled = false;
    const profile = getBirthProfile();
    (async () => {
      try {
        const transit = await fetchTransitSnapshot(profile, today);
        if (cancelled) return;
        if (transit.length > 0) {
          setPlanets(
            Object.fromEntries(
              transit.map((planet) => [
                planet.name,
                {
                  sign: planet.sign,
                  degree: planet.degreeInSign,
                  retrograde: planet.retrograde,
                },
              ])
            ) as Record<string, PlanetSnapshot>
          );
          return;
        }

        // Fallback for older API servers that do not expose /api/transit yet.
        const res = await fetch(`${API_BASE}/api/business/chart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birth_date: profile.birth_date,
            birth_time: profile.birth_time,
            location: profile.location,
            action_type: profile.action_type,
            target_date: today,
            ...chartPreferenceFields(),
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.planets) {
          setPlanets(data.planets as Record<string, PlanetSnapshot>);
        } else {
          setPlanets(null);
        }
      } catch {
        if (!cancelled) setPlanets(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [today]);

  const signs = SIGN_NAMES[lang];
  const planetNames = PLANET_NAMES[lang];

  const sun = planets?.sun;
  const moonP = planets?.moon;

  const retrogrades = useMemo(() => {
    if (!planets) return [];
    return Object.entries(planets)
      .filter(([name, info]) => info?.retrograde && PLANET_GLYPHS[name])
      .map(([name, info]) => ({ name, sign: info.sign }));
  }, [planets]);

  return (
    <section
      className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(160deg, rgba(34,11,61,0.35), rgba(7,11,20,0.6))',
        border: '1px solid rgba(251,191,36,0.18)',
      }}
    >
      <div
        className="fi text-[10px] uppercase tracking-[0.3em] mb-3"
        style={{ color: 'rgba(251,191,36,0.7)' }}
      >
        {t.skyToday}
      </div>

      <div className="flex items-center gap-5">
        <div
          className="relative shrink-0"
          style={{
            filter:
              'drop-shadow(0 0 18px rgba(251,191,36,0.25)) drop-shadow(0 0 32px rgba(251,191,36,0.12))',
          }}
        >
          <MoonGlyph fraction={moon.fraction} size={120} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="fc text-2xl leading-tight" style={{ color: '#ffffff' }}>
            {moonPhaseName}
          </div>
          <div className="fi text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {Math.round(moon.illumination * 100)}% · {t.moonPhase}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <SkyTile
          icon={PLANET_GLYPHS.sun}
          label={t.sunIn}
          value={loading ? '…' : sun?.sign ? signs[sun.sign] ?? sun.sign : '—'}
        />
        <SkyTile
          icon={PLANET_GLYPHS.moon}
          label={t.moonIn}
          value={loading ? '…' : moonP?.sign ? signs[moonP.sign] ?? moonP.sign : '—'}
        />
      </div>

      <div
        className="mt-4 rounded-xl p-3"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          className="fi text-[10px] uppercase tracking-widest mb-2"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          {t.retrograde}
        </div>
        {loading ? (
          <div className="fi text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {t.loading}
          </div>
        ) : retrogrades.length === 0 ? (
          <div className="fi text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {t.noRetro}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {retrogrades.map((r) => (
              <span
                key={r.name}
                className="fi text-xs px-2 py-1 rounded-md inline-flex items-center gap-1.5"
                style={{
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.35)',
                  color: '#fca5a5',
                }}
              >
                <span style={{ color: '#fca5a5' }}>{PLANET_GLYPHS[r.name]}</span>
                <span>{planetNames[r.name] ?? r.name}</span>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {signs[r.sign] ?? r.sign}
                </span>
                <span style={{ color: '#f87171' }}>℞</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SkyTile({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-xl p-3 flex items-center gap-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="fc text-lg w-8 h-8 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(251,191,36,0.08)',
          border: '1px solid rgba(251,191,36,0.25)',
          color: '#fbbf24',
        }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div
          className="fi text-[10px] uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          {label}
        </div>
        <div className="fi text-sm truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {value}
        </div>
      </div>
    </div>
  );
}
