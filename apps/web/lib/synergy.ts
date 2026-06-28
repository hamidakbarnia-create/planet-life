import type { AstroLang } from './astrology-i18n';
import { trAspect, trPlanet } from './astrology-i18n';
import type { BirthProfile } from './birth-profile';
import { fetchDayScore } from './calendar-scores';
import { fetchNatalChart } from './chart-api';
import { detectAspect } from './natal-aspects';
import type { Person, SynergyBadge } from './people-storage';

const SYNASTRY_PLANETS = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
] as const;

const HARMONY_ASPECTS = new Set(['trine', 'sextile', 'conjunction']);
const TENSION_ASPECTS = new Set(['square', 'opposition']);

const HARMONY_WEIGHT: Record<string, number> = {
  trine: 8,
  sextile: 6,
  conjunction: 5,
};

const TENSION_WEIGHT: Record<string, number> = {
  square: 8,
  opposition: 7,
};

export interface SynastryAspect {
  myPlanet: string;
  theirPlanet: string;
  aspect: string;
  orb: number;
}

export interface SynergyResult {
  score: number;
  badge: SynergyBadge;
  harmony: SynastryAspect[];
  tension: SynastryAspect[];
  bestDays: MeetingDay[];
}

export interface MeetingDay {
  date: string;
  combined: number;
  myScore: number;
  theirScore: number;
}

export function synergyBadge(score: number): SynergyBadge {
  if (score >= 70) return 'aligned';
  if (score >= 40) return 'caution';
  return 'tension';
}

export const BADGE_STYLES: Record<
  SynergyBadge,
  { bg: string; border: string; text: string; label: string }
> = {
  aligned: {
    bg: 'rgba(74,222,128,0.15)',
    border: '#4ade80',
    text: '#4ade80',
    label: 'aligned',
  },
  caution: {
    bg: 'rgba(251,191,36,0.12)',
    border: '#fbbf24',
    text: '#fbbf24',
    label: 'caution',
  },
  tension: {
    bg: 'rgba(248,113,113,0.12)',
    border: '#f87171',
    text: '#f87171',
    label: 'tension',
  },
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function orbStrength(orb: number, max = 8) {
  return Math.max(0, 1 - orb / max);
}

export function computeSynastry(
  mine: Record<string, { longitude: number }>,
  theirs: Record<string, { longitude: number }>
): { score: number; badge: SynergyBadge; harmony: SynastryAspect[]; tension: SynastryAspect[] } {
  const harmony: SynastryAspect[] = [];
  const tension: SynastryAspect[] = [];

  for (const pA of SYNASTRY_PLANETS) {
    if (mine[pA]?.longitude == null) continue;
    for (const pB of SYNASTRY_PLANETS) {
      if (theirs[pB]?.longitude == null) continue;
      const hit = detectAspect(mine[pA].longitude, theirs[pB].longitude);
      if (!hit) continue;
      const row: SynastryAspect = {
        myPlanet: pA,
        theirPlanet: pB,
        aspect: hit.aspect,
        orb: hit.orb,
      };
      if (HARMONY_ASPECTS.has(hit.aspect)) harmony.push(row);
      else if (TENSION_ASPECTS.has(hit.aspect)) tension.push(row);
    }
  }

  let score = 50;
  for (const h of harmony) {
    const w = HARMONY_WEIGHT[h.aspect] ?? 4;
    score += w * orbStrength(h.orb);
  }
  for (const t of tension) {
    const w = TENSION_WEIGHT[t.aspect] ?? 6;
    score -= w * orbStrength(t.orb);
  }

  const final = clamp(score);
  return { score: final, badge: synergyBadge(final), harmony, tension };
}

function nextWeekDates(): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < 7; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    out.push(x.toISOString().split('T')[0]);
  }
  return out;
}

export async function findBestMeetingDays(
  myProfile: BirthProfile,
  person: Person
): Promise<MeetingDay[]> {
  const theirProfile: BirthProfile = {
    birth_date: person.birth_date,
    birth_time: person.birth_time,
    location: person.location,
    action_type: 'negotiation',
  };
  const myNegotiation = { ...myProfile, action_type: 'negotiation' };

  const days = nextWeekDates();
  const results: MeetingDay[] = [];

  for (const date of days) {
    const [myScore, theirScore] = await Promise.all([
      fetchDayScore(myNegotiation, date),
      fetchDayScore(theirProfile, date),
    ]);
    if (myScore == null || theirScore == null) continue;
    results.push({
      date,
      myScore,
      theirScore,
      combined: Math.round((myScore + theirScore) / 2),
    });
  }

  return results.sort((a, b) => b.combined - a.combined).slice(0, 3);
}

export async function analyzeSynergy(
  myProfile: BirthProfile,
  person: Person
): Promise<SynergyResult | null> {
  const [mine, theirs] = await Promise.all([
    fetchNatalChart(myProfile.birth_date, myProfile.birth_time, myProfile.location),
    fetchNatalChart(person.birth_date, person.birth_time, person.location),
  ]);
  if (!mine || !theirs) return null;

  const syn = computeSynastry(mine, theirs);
  const bestDays = await findBestMeetingDays(myProfile, person);

  return { ...syn, bestDays };
}

export function formatAspectLabel(row: SynastryAspect, lang: AstroLang = 'en') {
  const mp = trPlanet(row.myPlanet, lang);
  const tp = trPlanet(row.theirPlanet, lang);
  const asp = trAspect(row.aspect, lang);
  const orb = row.orb.toFixed(1);
  switch (lang) {
    case 'ru':
      return `Ваш ${mp} ${asp} их ${tp} · орб ${orb}°`;
    case 'fa':
      return `${mp}ِ شما ${asp} با ${tp}ِ او · فاصله ${orb}°`;
    case 'ar':
      return `${mp} لديك ${asp} ${tp} لدى الطرف الآخر · مدار ${orb}°`;
    default:
      return `Your ${mp} ${asp} their ${tp} · orb ${orb}°`;
  }
}
