/**
 * Fixtures for InputAnalysis foundation tests (P2.1a-01).
 */

export const INPUT_ANALYSIS_FIXTURES = {
  career: {
    question: 'Should I accept this job offer or stay in my current role?',
    expectedIntent: 'career' as const,
  },
  business: {
    question: 'Should I launch my startup this quarter or keep consulting?',
    expectedIntent: 'business' as const,
  },
  finance: {
    question: 'Should I invest my savings in an index fund or keep cash?',
    expectedIntent: 'finance' as const,
  },
  relationship: {
    question: 'Should I marry my partner this year or wait?',
    expectedIntent: 'relationship' as const,
  },
  family: {
    question: 'Should we have children now or wait two years?',
    expectedIntent: 'family' as const,
  },
  relocation: {
    question: 'Should I move to Berlin for work or stay in London?',
    expectedIntent: 'relocation' as const,
  },
  education: {
    question: 'Should I pursue a university degree or take a short course?',
    expectedIntent: 'education' as const,
  },
  healthSafe: {
    question: 'Should I prioritize fitness and burnout recovery over overtime?',
    expectedIntent: 'health' as const,
  },
  legalFallback: {
    question: 'Should I sue or settle this lawsuit with my former company?',
    expectedIntent: 'other' as const,
    expectedSafety: 'legal' as const,
  },
  vague: {
    question: 'What should I do?',
    expectedIntent: 'other' as const,
  },
  mixedCareerRelocation: {
    question:
      'Should I accept the job offer and relocate to Berlin, or stay put?',
    expectedPrimary: 'career' as const,
    expectedSecondaryIncludes: ['relocation'] as const,
  },
  urgentFinance: {
    question:
      'I need to decide today — should I invest this cash or pay debt ASAP?',
    expectedIntent: 'finance' as const,
    expectedUrgency: 'critical' as const,
  },
  conversational: {
    question: 'Thanks for the help yesterday, that was useful.',
    expectedIntent: 'other' as const,
    expectedClarificationReason: 'ambiguous_intent' as const,
  },
} as const;
