/**
 * Deterministic Personal Intelligence Profile generator.
 * Uses birth profile timing anchors only — no mystical language, no fake precision.
 */

import type { BirthProfile } from '@/lib/birth-profile';
import {
  INTELLIGENCE_PROFILE_VERSION,
  type EnergyRhythm,
  type LabeledInsight,
  type OpportunityZone,
  type PersonalIntelligenceProfile,
} from './types';

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function parseHour(birthTime: string): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(birthTime.trim());
  if (!m) return 12;
  const h = Number(m[1]);
  return Number.isFinite(h) ? ((h % 24) + 24) % 24 : 12;
}

function parseDateParts(birthDate: string): { month: number; day: number; dow: number } {
  const d = new Date(`${birthDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return { month: 6, day: 15, dow: 3 };
  return { month: d.getMonth() + 1, day: d.getDate(), dow: d.getDay() };
}

export function fingerprintBirthProfile(profile: BirthProfile): string {
  return [
    profile.birth_date,
    profile.birth_time,
    profile.location,
    profile.action_type || '',
    profile.current_location?.city || '',
  ].join('|');
}

type Seed = {
  hour: number;
  month: number;
  day: number;
  dow: number;
  h: number;
  morningBias: boolean;
  eveningBias: boolean;
  deepWorkBias: boolean;
  collaborativeBias: boolean;
  analyticalBias: boolean;
  creativeBias: boolean;
};

function buildSeed(profile: BirthProfile): Seed {
  const hour = parseHour(profile.birth_time);
  const { month, day, dow } = parseDateParts(profile.birth_date);
  const h = hashString(fingerprintBirthProfile(profile));
  return {
    hour,
    month,
    day,
    dow,
    h,
    morningBias: hour < 11,
    eveningBias: hour >= 17,
    deepWorkBias: hour >= 9 && hour < 15,
    collaborativeBias: dow === 1 || dow === 3 || (h % 5 === 0),
    analyticalBias: hour % 2 === 0 || (h % 3 === 1),
    creativeBias: hour >= 14 || month % 2 === 0,
  };
}

function pickDecisionStyles(seed: Seed): LabeledInsight[] {
  const out: LabeledInsight[] = [];
  if (seed.analyticalBias) {
    out.push({
      label: 'Analytical',
      why: 'Your profile timing anchors favor structured evaluation before commitment.',
    });
  } else {
    out.push({
      label: 'Adaptive',
      why: 'Your profile pattern supports adjusting course as new information arrives.',
    });
  }
  if (seed.morningBias) {
    out.push({
      label: 'Strategic',
      why: 'Earlier-day energy banding aligns with planning before execution.',
    });
  } else if (seed.eveningBias) {
    out.push({
      label: 'Patient',
      why: 'Later-day banding supports deliberate pacing over impulsive moves.',
    });
  } else {
    out.push({
      label: 'Fast',
      why: 'Midday banding supports quicker decision cycles when inputs are clear.',
    });
  }
  if (seed.collaborativeBias) {
    out.push({
      label: 'Collaborative',
      why: 'Profile signals favor decisions that incorporate other viewpoints.',
    });
  } else {
    out.push({
      label: 'Independent',
      why: 'Profile signals favor self-directed judgment with selective consultation.',
    });
  }
  out.push({
    label: 'Risk Balanced',
    why: 'Default posture weighs upside against reversibility rather than extremes.',
  });
  return out.slice(0, 4);
}

function pickStrengths(seed: Seed): LabeledInsight[] {
  const pool: LabeledInsight[] = [
    {
      label: 'Long-term planning',
      why: 'Strong when decisions are framed around multi-step outcomes.',
    },
    {
      label: seed.collaborativeBias ? 'Communication' : 'Leadership',
      why: seed.collaborativeBias
        ? 'Clarity improves when ideas are spoken and tested with others.'
        : 'Direction-setting is a natural mode under clear goals.',
    },
    {
      label: seed.analyticalBias ? 'Pattern recognition' : 'Learning speed',
      why: seed.analyticalBias
        ? 'You connect signals across contexts before acting.'
        : 'You absorb new frameworks quickly when stakes are real.',
    },
    {
      label: seed.creativeBias ? 'Creativity' : 'Negotiation',
      why: seed.creativeBias
        ? 'Fresh options surface when constraints are explicit.'
        : 'Trade-offs become clearer when interests are mapped.',
    },
    {
      label: seed.deepWorkBias ? 'Execution focus' : 'Systems thinking',
      why: seed.deepWorkBias
        ? 'Sustained focus windows convert plans into finished work.'
        : 'You see how parts interact before optimizing one piece.',
    },
    {
      label: 'Decision sequencing',
      why: 'You perform best when irreversible steps follow reversible pilots.',
    },
  ];
  const start = seed.h % pool.length;
  const ordered = [...pool.slice(start), ...pool.slice(0, start)];
  return ordered.slice(0, 6);
}

function pickBlindSpots(seed: Seed): LabeledInsight[] {
  const pool: LabeledInsight[] = [
    {
      label: seed.morningBias || seed.analyticalBias ? 'Overthinks' : 'Acts too quickly',
      why: seed.morningBias || seed.analyticalBias
        ? 'Extra analysis can delay reversible moves that would teach faster.'
        : 'Speed helps — pause once when the downside is hard to reverse.',
    },
    {
      label: seed.collaborativeBias ? 'Avoids conflict' : 'Goes solo too early',
      why: seed.collaborativeBias
        ? 'Harmony preference can postpone necessary hard conversations.'
        : 'Independent drive can skip a stakeholder who reduces risk.',
    },
    {
      label: 'Perfectionism',
      why: 'Quality standards rise under pressure; define “good enough” checkpoints.',
    },
    {
      label: seed.eveningBias ? 'Risk avoidance' : 'Emotional surge decisions',
      why: seed.eveningBias
        ? 'Caution protects you — also schedule one controlled experiment.'
        : 'Energy spikes can compress deliberation; sleep on irreversible calls.',
    },
    {
      label: 'Context switching',
      why: 'Parallel threads dilute judgment; batch decisions by domain.',
    },
    {
      label: 'Deferred follow-through',
      why: 'Insight arrives early; close the loop with a dated next action.',
    },
  ];
  const start = (seed.h >> 3) % pool.length;
  return [...pool.slice(start), ...pool.slice(0, start)].slice(0, 6);
}

function pickOpportunityZones(seed: Seed): OpportunityZone[] {
  const base: { zone: string; w: number }[] = [
    { zone: 'Career', w: 55 + (seed.deepWorkBias ? 18 : 4) },
    { zone: 'Business', w: 50 + (seed.collaborativeBias ? 8 : 14) },
    { zone: 'Money', w: 48 + (seed.analyticalBias ? 16 : 6) },
    { zone: 'Learning', w: 52 + (seed.creativeBias ? 14 : 8) },
    { zone: 'Travel', w: 42 + (seed.month % 3 === 0 ? 18 : 5) },
    { zone: 'Networking', w: 45 + (seed.collaborativeBias ? 20 : 3) },
    { zone: 'Relationships', w: 50 + (seed.dow % 2 === 0 ? 12 : 6) },
  ];
  return base
    .map((z) => ({ zone: z.zone, relative: clamp(z.w + (seed.h % 7) - 3) }))
    .sort((a, b) => b.relative - a.relative);
}

function buildEnergyRhythm(seed: Seed): EnergyRhythm {
  const morning = clamp(seed.morningBias ? 78 : seed.eveningBias ? 48 : 62);
  const afternoon = clamp(seed.deepWorkBias ? 76 : 58);
  const evening = clamp(seed.eveningBias ? 74 : seed.morningBias ? 44 : 56);
  const decision = clamp((morning + afternoon) / 2 + (seed.analyticalBias ? 6 : 0));
  const creative = clamp(seed.creativeBias ? Math.max(afternoon, evening) + 4 : afternoon - 4);
  const social = clamp(seed.collaborativeBias ? 72 : 50);
  return {
    morning,
    afternoon,
    evening,
    decision,
    creative,
    social,
    note: 'Relative energy bands derived from your birth timing anchors. Enrich with live hourly scores when available.',
  };
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function buildSummary(
  styles: LabeledInsight[],
  strengths: LabeledInsight[],
  leadership: string,
  work: string
): string {
  const styleLabels = styles.map((s) => s.label).slice(0, 3).join(', ');
  const strengthLabels = strengths.map((s) => s.label).slice(0, 3).join(', ');
  let summary =
    `You decide in a ${styleLabels.toLowerCase()} mode, with notable strengths in ${strengthLabels.toLowerCase()}. ` +
    `Leadership tends toward ${leadership.toLowerCase()}, and work rhythm favors ${work.toLowerCase()}. ` +
    `Use reversible pilots before irreversible commitments, and schedule high-stakes calls inside your stronger energy bands.`;
  const words = summary.split(/\s+/);
  if (words.length > 120) {
    summary = words.slice(0, 120).join(' ');
  }
  return summary;
}

/**
 * Build the canonical intelligence profile from an existing birth profile.
 * Synchronous and deterministic for the same inputs.
 */
export function generateIntelligenceProfile(
  profile: BirthProfile,
  nowIso = new Date().toISOString()
): PersonalIntelligenceProfile {
  const seed = buildSeed(profile);
  const decisionStyle = pickDecisionStyles(seed);
  const strengths = pickStrengths(seed);
  const blindSpots = pickBlindSpots(seed);
  const opportunityZones = pickOpportunityZones(seed);
  const energyRhythm = buildEnergyRhythm(seed);

  const leadershipStyle: LabeledInsight = seed.analyticalBias
    ? {
        label: 'Analyst',
        why: 'You lead by clarifying options, trade-offs, and evidence before directing action.',
      }
    : seed.collaborativeBias
      ? {
          label: 'Mentor',
          why: 'You lead by developing people and aligning them around shared outcomes.',
        }
      : seed.creativeBias
        ? {
            label: 'Vision driven',
            why: 'You lead by painting the destination and inviting others into the path.',
          }
        : {
            label: 'Builder',
            why: 'You lead by shipping concrete progress and refining systems in motion.',
          };

  const workStyle: LabeledInsight[] = [
    {
      label: seed.deepWorkBias ? 'Deep work' : 'Flexible',
      why: seed.deepWorkBias
        ? 'Longer uninterrupted blocks produce your best judgment.'
        : 'You adapt cadence to context without losing output quality.',
    },
    {
      label: seed.collaborativeBias ? 'Team work' : 'Execution focused',
      why: seed.collaborativeBias
        ? 'Shared ownership improves both speed and quality.'
        : 'Clear owners and finish lines keep momentum honest.',
    },
    {
      label: seed.creativeBias ? 'Creative' : 'Routine',
      why: seed.creativeBias
        ? 'Novel framing unlocks stuck decisions.'
        : 'Repeatable rituals protect consistency under load.',
    },
  ];

  const learningStyle: LabeledInsight[] = [
    {
      label: seed.analyticalBias ? 'Analytical' : 'Practical',
      why: seed.analyticalBias
        ? 'Models and frameworks stick when they explain real cases.'
        : 'You learn fastest by doing a small real version first.',
    },
    {
      label: seed.collaborativeBias ? 'Discussion' : 'Reading',
      why: seed.collaborativeBias
        ? 'Dialogue surfaces blind spots written notes miss.'
        : 'Quiet synthesis from source material builds durable understanding.',
    },
    {
      label: seed.creativeBias ? 'Experimentation' : 'Visual',
      why: seed.creativeBias
        ? 'Trials beat theory when uncertainty is high.'
        : 'Diagrams and maps make complex trade-offs graspable.',
    },
  ];

  const decisionEnvironment: LabeledInsight[] = [
    {
      label: seed.collaborativeBias ? 'Collaborative' : 'Quiet',
      why: seed.collaborativeBias
        ? 'Thinking aloud with trusted peers improves signal quality.'
        : 'Low-interruption settings protect your judgment quality.',
    },
    {
      label: seed.deepWorkBias ? 'Remote' : 'Flexible',
      why: seed.deepWorkBias
        ? 'Controlled environments sustain focus for complex calls.'
        : 'You can decide well across contexts if inputs stay clean.',
    },
    {
      label: seed.month % 2 === 0 ? 'Travel' : 'Office',
      why: seed.month % 2 === 0
        ? 'Movement and new contexts stimulate option generation.'
        : 'Stable workspace supports follow-through after the decision.',
    },
  ];

  const growthAreas = [
    'Define a 48-hour reversible experiment before any irreversible commitment.',
    blindSpots[0]
      ? `Watch for “${blindSpots[0].label.toLowerCase()}” — set one explicit checkpoint.`
      : 'Name your top risk in one sentence before deciding.',
    'Protect one deep-work decision block on high-stakes days.',
    seed.collaborativeBias
      ? 'Practice one direct conflict conversation per month with preparation notes.'
      : 'Invite one dissenting view before locking major moves.',
    'Review saved decisions monthly: what changed vs. what you recommended.',
  ].slice(0, 5);

  const summary = buildSummary(
    decisionStyle,
    strengths,
    leadershipStyle.label,
    workStyle[0]?.label ?? 'Flexible'
  );

  return {
    meta: {
      version: INTELLIGENCE_PROFILE_VERSION,
      generatedAt: nowIso,
      updatedAt: nowIso,
      sourceFingerprint: fingerprintBirthProfile(profile),
    },
    decisionStyle,
    strengths,
    blindSpots,
    opportunityZones,
    pressureResponse: {
      underStress: seed.analyticalBias
        ? 'You narrow focus and seek more data; urgency can feel like incomplete information.'
        : 'You accelerate toward action; ambiguity can feel like lost momentum.',
      recovery: seed.morningBias
        ? 'Recovery works best with early quiet resets and a written priority list.'
        : 'Recovery works best with a short walk-away, then one concrete next step.',
      approach:
        'Name the irreversible part, shrink the next step, and decide inside a stronger energy band.',
    },
    communicationStyle: {
      usual: seed.collaborativeBias
        ? 'Clear, relational, and context-rich.'
        : 'Direct, concise, and outcome-oriented.',
      environment: seed.deepWorkBias
        ? 'Prefers prepared 1:1 or focused small groups.'
        : 'Comfortable in flexible forums if goals are explicit.',
      conflict: seed.collaborativeBias
        ? 'Seeks alignment; may delay confrontation until stakes force it.'
        : 'Addresses issues head-on; may under-index on emotional pacing.',
      listening: seed.analyticalBias
        ? 'Listens for structure, inconsistencies, and decision criteria.'
        : 'Listens for intent and momentum; summarizes toward action.',
    },
    leadershipStyle,
    workStyle,
    learningStyle,
    energyRhythm,
    decisionEnvironment,
    growthAreas,
    summary: wordCount(summary) > 120 ? summary.split(/\s+/).slice(0, 120).join(' ') : summary,
  };
}
