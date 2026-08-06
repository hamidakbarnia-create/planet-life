import type { BirthProfile } from '@/lib/birth-profile';
import {
  buildInputAnalysis,
  buildSafeInputAnalysisFallback,
  type InputAnalysis,
} from '../input-analysis';
import type { TimingIntelligence } from '../types';

export const FIXED_NOW = '2026-07-21T12:00:00.000Z';

export const FIXTURE_QUESTIONS = {
  career: 'Should I accept this job offer or stay in my current role?',
  mixedCareerRelocation:
    'Should I accept the job offer and relocate to Berlin, or stay put?',
  vague: 'What should I do?',
} as const;

export function analysisFor(question: string): InputAnalysis {
  return buildInputAnalysis(question);
}

export function analysisFallback(): InputAnalysis {
  return buildSafeInputAnalysisFallback();
}

export const PROFILE_AVAILABLE: BirthProfile = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  location: 'New York',
  action_type: 'career_change',
  current_location: {
    city: 'Berlin',
    country: 'Germany',
    timezone: 'Europe/Berlin',
    latitude: 52.52,
    longitude: 13.405,
    confirmed: true,
    coordinate_source: 'user_confirmed',
  },
};

export const PROFILE_MINIMAL: BirthProfile = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  location: 'Secret Birth City',
  action_type: 'career_change',
};

export const TIMING_AVAILABLE: TimingIntelligence = {
  applicable: true,
  available: true,
  today: {
    label: 'Today',
    dateRange: '2026-07-21',
    score: 62,
    note: 'Moderate',
  },
  next7Days: null,
  next30Days: null,
  bestWindow: {
    label: 'Best',
    dateRange: '2026-07-22 – 2026-07-24',
    score: 71,
    note: 'Favorable',
  },
  cautionWindow: null,
  timingRationale: 'Window favors measured action.',
  timingConfidence: 'medium',
};

export const TIMING_UNAVAILABLE: TimingIntelligence = {
  applicable: true,
  available: false,
  today: null,
  next7Days: null,
  next30Days: null,
  bestWindow: null,
  cautionWindow: null,
  timingRationale: 'Timing unavailable.',
  timingConfidence: 'low',
};

export const CONVERSATION_AVAILABLE = [
  { role: 'user', content: 'I am comparing two offers.' },
  { role: 'assistant', content: 'What differs most for you?' },
  { role: 'user', content: 'Salary and relocation package.' },
];

export const INTERNAL_PROMPT_MESSAGE = {
  role: 'user',
  content:
    'You are METIORO Decision Intelligence for Ask.\nReturn ONE JSON object only\nUSER QUESTION:\nShould I accept this job offer?',
};
