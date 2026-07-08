export const WELCOME_COPY = {
  headline: 'Know your best next move.',
  subline: 'Structured timing guidance with visible reasoning.',
  steps: [
    'Set your birth context once',
    "See today's decision window",
    'Ask one real question and see why',
  ],
  getStarted: 'Get started',
  howItWorks: 'See how it works',
  howItWorksHide: 'Hide',
  offlineCta: 'Connect to continue',
  disclaimerLink: 'Educational use disclaimer',
} as const;

export const PROFILE_ONBOARDING_COPY = {
  step: 'Step 3 of 3',
  title: 'Your birth context',
  sub: 'We use date, time, and city to anchor timing — not personality labels.',
  nameLabel: 'Name (optional)',
  namePlaceholder: 'How we address you',
  dateLabel: 'Birth date',
  timeLabel: 'Birth time',
  timeHint: 'Use local time at birth. Approximate time is OK.',
  cityLabel: 'Birth city',
  cityPlaceholder: 'Start typing a city…',
  citySearching: 'Searching cities…',
  cityNoResults: 'No cities found',
  whyTitle: 'Why we need this',
  whyBody:
    'Date, time, and place set the astronomical reference for timing windows. We show the reasoning behind every suggestion.',
  save: 'Save and continue',
  saving: 'Saving…',
  back: 'Back to sign in',
  discardTitle: 'Discard profile progress?',
  discardBody: 'Unsaved changes will be kept as a draft unless you discard.',
  discardConfirm: 'Discard draft',
  discardCancel: 'Keep editing',
  required: 'Required',
} as const;

export const PREPARING_COPY = {
  step: 'Step 4 of 8',
  title: 'Preparing your first insight',
  sub: 'METIORO is building timing context from your birth profile. This usually takes a few seconds.',
  statusLoading: 'Preparing your intelligence…',
  statusSuccess: 'Ready — opening your brief',
  statusError: 'Preparation paused',
  offlineError: 'Connect to prepare your brief.',
  retry: 'Try again',
  continueAnyway: 'Continue without score',
  stepDone: 'Complete',
  stepActive: 'In progress',
  stepPending: 'Waiting',
} as const;

export const TODAY_COPY = {
  step: 'Step 5 of 8',
  title: 'Your Today is ready',
  briefEyebrow: 'Today brief',
  briefBody:
    'Your timing context is set. Focus on one decision at a time — ask a specific question to see scored guidance for your situation.',
  previewNote:
    'Early preview — this is your first personalized insight. It will grow richer as you use METIORO.',
  scoreUnavailable: 'Score unavailable today. You can still ask your first question.',
  cta: 'Ask your first question',
  personalizedWithNameAndCity: (name: string, city: string) =>
    `${name}, your timing context is anchored to ${city}.`,
  personalizedWithName: (name: string) =>
    `${name}, your timing context is ready for today.`,
  personalizedWithCity: (city: string) =>
    `Your timing context is anchored to ${city}.`,
  personalizedDefault: 'Your timing context is ready for today.',
} as const;

export const ASK_COPY = {
  step: 'Step 6 of 8',
  title: 'Ask METIORO',
  sub: 'Your first question helps introduce how METIORO delivers personalized guidance.',
  inputLabel: 'Your question',
  inputPlaceholder: 'What would you like guidance on?',
  suggestionsLabel: 'Suggested topics',
  submit: 'Get guidance',
  charCounter: (count: number, max: number) => `${count} of ${max} characters`,
} as const;

export const ASK_SUGGESTIONS = [
  {
    id: 'career',
    label: 'Career',
    text: 'What should I focus on in my career this week?',
  },
  {
    id: 'relationships',
    label: 'Relationships',
    text: 'How can I strengthen an important relationship right now?',
  },
  {
    id: 'todays-focus',
    label: "Today's focus",
    text: 'What deserves my attention most today?',
  },
  {
    id: 'energy',
    label: 'Energy',
    text: 'How can I use my energy wisely today?',
  },
  {
    id: 'opportunities',
    label: 'Opportunities',
    text: 'What opportunity should I pay attention to right now?',
  },
] as const;

export const LOGIN_FTUE_COPY = {
  title: 'Sign in to continue',
  sub: 'Save your profile and decision guidance securely.',
  oauthSoon: 'Social sign-in is coming soon. Use email or phone for now.',
  backWelcome: 'Back to welcome',
  termsPrefix: 'By continuing you agree to the',
  termsLink: 'educational use disclaimer',
  rateLimited: 'Too many attempts. Try again in a few minutes.',
} as const;
