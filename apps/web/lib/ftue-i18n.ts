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

export const LOGIN_FTUE_COPY = {
  title: 'Sign in to continue',
  sub: 'Save your profile and decision guidance securely.',
  oauthSoon: 'Social sign-in is coming soon. Use email or phone for now.',
  backWelcome: 'Back to welcome',
  termsPrefix: 'By continuing you agree to the',
  termsLink: 'educational use disclaimer',
  rateLimited: 'Too many attempts. Try again in a few minutes.',
} as const;
