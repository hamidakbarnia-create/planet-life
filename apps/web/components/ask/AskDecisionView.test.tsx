import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AskDecisionView } from '@/components/ask/AskDecisionView';
import type { AskDecisionResult } from '@/lib/ask-decision';
import { ASK_DECISION_SCHEMA_VERSION } from '@/lib/ask-decision';

const sampleResult: AskDecisionResult = {
  schemaVersion: ASK_DECISION_SCHEMA_VERSION,
  intent: {
    primaryIntent: 'business',
    secondaryIntent: null,
    confidence: 70,
    rationale: 'Business cues',
    detectedEntities: ['launch'],
    decisionPresent: true,
    timingRelevant: true,
    peopleRelevant: false,
    financialImpactLikely: true,
    highStakesFlag: false,
  },
  decisionFrame: {
    originalQuestion: 'Should I expand the business this quarter?',
    decisionStatement: 'Should I expand the business this quarter?',
    decisionType: 'business',
    objective: 'Resolve expansion',
    mainConcern: 'Overextension',
    options: [],
    urgency: 'moderate',
    timeHorizon: 'months',
    reversibility: 'Unknown',
    affectedAreas: ['business'],
    unknowns: [],
    assumptions: ['Demand holds'],
    requiresClarification: false,
  },
  executiveSummary:
    'Decision: expand with a pilot. Recommendation: proceed with caution. Caution: overextension. Next: define non-negotiables.',
  recommendation: 'Stage expansion with a reversible pilot.',
  recommendationStatus: 'proceed-with-caution',
  scores: {
    opportunity: { value: 68, rationale: 'Constructive window' },
    risk: { value: 44, rationale: 'Manageable' },
    timing: { value: 62, rationale: 'Supportive' },
    readiness: { value: 64, rationale: 'Ready enough' },
    confidence: { value: 61, rationale: 'Moderate' },
  },
  analysis: [
    { id: 'situation', title: 'Situation', body: 'Expansion decision.' },
    { id: 'factors', title: 'Main Factors', body: 'Capital and timing.' },
    { id: 'opportunities', title: 'Opportunities', body: 'Market window.' },
    { id: 'risks', title: 'Risks', body: 'Overextension.' },
    { id: 'tradeoffs', title: 'Trade-offs', body: 'Speed vs clarity.' },
    { id: 'personal-fit', title: 'Personal Fit', body: 'Fits builder mode.' },
    { id: 'what-could-change', title: 'What Could Change', body: 'Cash constraint.' },
    { id: 'why', title: 'Why', body: 'Pilot first.' },
  ],
  timing: {
    applicable: true,
    available: true,
    today: { label: 'Today', dateRange: '2026-07-20', score: 62, note: 'ok' },
    next7Days: {
      label: 'Week',
      dateRange: '2026-07-20 → 2026-07-26',
      score: 58,
      note: 'ok',
    },
    next30Days: {
      label: 'Month',
      dateRange: '2026-07-20 → 2026-08-16',
      score: 70,
      note: 'ok',
    },
    bestWindow: {
      label: 'Best',
      dateRange: '2026-07-20 → 2026-07-26',
      score: 58,
      note: 'ok',
    },
    cautionWindow: { label: 'Avoid', dateRange: '2026-07-22', score: 31, note: 'low' },
    timingRationale: 'Prefer supportive windows.',
    timingConfidence: 'medium',
  },
  scenarios: {
    bestCase: {
      outcome: 'Clean expansion',
      likelihoodBand: 'medium',
      keyConditions: ['Demand'],
      earlySignals: ['Sales'],
      mitigation: 'Pilot',
    },
    mostLikely: {
      outcome: 'Partial progress',
      likelihoodBand: 'high',
      keyConditions: ['Mixed'],
      earlySignals: ['Delay'],
      mitigation: 'Checkpoint',
    },
    downsideCase: {
      outcome: 'Overcommit',
      likelihoodBand: 'low',
      keyConditions: ['Rush'],
      earlySignals: ['Pressure'],
      mitigation: 'Cap spend',
    },
  },
  actionPlan: {
    now: [
      {
        action: 'Write the expansion decision in one sentence',
        purpose: 'Clarity',
        priority: 'high',
        completionSignal: 'Written',
      },
    ],
    next7Days: [
      {
        action: 'Score two options on risk and timing',
        purpose: 'Compare',
        priority: 'high',
        completionSignal: 'Table',
      },
    ],
    next30Days: [
      {
        action: 'Run a mid-horizon checkpoint',
        purpose: 'Validate',
        priority: 'medium',
        completionSignal: 'Note',
      },
    ],
  },
  alternatives: [],
  assumptions: ['Demand holds'],
  confidence: {
    level: 'medium',
    score: 61,
    explanation: 'Proceed with staged moves.',
    missingInputs: [],
    limitingFactors: ['Not predictive'],
  },
  limitations: ['Comparative only'],
  relatedModules: [
    {
      module: 'pathfinder',
      reason: 'Deeper workflow',
      actionLabel: 'Open Pathfinder',
      route: '/pathfinder',
    },
  ],
  followUpQuestions: [
    'What would make this a clear no?',
    'What is the downside limit?',
    'What checkpoint proves progress?',
  ],
  safetyNotice: null,
  generatedAt: '2026-07-20T12:00:00.000Z',
};

describe('AskDecisionView', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders loading state with live region', () => {
    render(<AskDecisionView result={null} loading />);
    expect(screen.getByTestId('ask-decision-loading')).toBeTruthy();
    expect(screen.getByTestId('ask-decision-loading').getAttribute('aria-live')).toBe(
      'polite'
    );
  });

  it('renders recommendation, scores, confidence, and modules', () => {
    render(<AskDecisionView result={sampleResult} />);
    expect(screen.getByTestId('ask-decision-engine')).toBeTruthy();
    expect(screen.getByTestId('ask-recommendation-status').textContent).toMatch(
      /proceed with caution/i
    );
    expect(screen.getByTestId('ask-score-opportunity').textContent).toContain('68');
    expect(screen.getByTestId('ask-confidence-level').textContent).toMatch(/medium/i);
    expect(screen.getByTestId('ask-module-pathfinder')).toBeTruthy();
    expect(screen.getByTestId('ask-card-actions')).toBeTruthy();
  });

  it('uses responsive grid classes', () => {
    const { container } = render(<AskDecisionView result={sampleResult} />);
    expect(container.querySelector('.lg\\:grid-cols-3')).toBeTruthy();
  });

  it('exposes accessible score labels', () => {
    render(<AskDecisionView result={sampleResult} />);
    expect(
      screen.getByLabelText(/Opportunity: 68 out of 100/i)
    ).toBeTruthy();
  });
});
