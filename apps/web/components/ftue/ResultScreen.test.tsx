import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ResultScreen } from '@/components/ftue/ResultScreen';
import {
  getAskQuestionRepository,
  resetAskQuestionRepositoryForTests,
} from '@/lib/ask-question-repository';
import { saveSession } from '@/lib/auth';
import type { AppLang } from '@/lib/app-settings';
import { isFtueComplete } from '@/lib/ftue-storage';
import { getProfileRepository, resetProfileRepositoryForTests } from '@/lib/profile';
import { buildResultShareText, getResultCopy } from '@/lib/ftue-i18n';
import { fetchValidatedResultChart } from '@/lib/chart-api';
import { RAFSANJAN_CHART } from '@/lib/chart-fixtures';
import * as decisionApi from '@/lib/decision-api';
import * as decisionFacade from '@/lib/decision-engine-facade';
import type { DecisionEngineResponse } from '@/lib/decision-engine-facade';

const replace = vi.fn();
const push = vi.fn();

const { runAskDecisionMock } = vi.hoisted(() => {
  const mockAskDecisionResult = {
    schemaVersion: '3.0.0',
    intent: {
      primaryIntent: 'career' as const,
      secondaryIntent: null,
      confidence: 70,
      rationale: 'Career cues',
      detectedEntities: [] as string[],
      decisionPresent: true,
      timingRelevant: true,
      peopleRelevant: false,
      financialImpactLikely: false,
      highStakesFlag: false,
    },
    decisionFrame: {
      originalQuestion: 'What should I focus on in my career this week?',
      decisionStatement: 'What should I focus on in my career this week?',
      decisionType: 'career' as const,
      objective: 'Identify focus',
      mainConcern: 'Unknown',
      options: [] as string[],
      urgency: 'high' as const,
      timeHorizon: 'days' as const,
      reversibility: 'Unknown',
      affectedAreas: ['career'],
      unknowns: [] as string[],
      assumptions: [] as string[],
      requiresClarification: false,
    },
    executiveSummary:
      'Decision: career focus this week. Recommendation: proceed with caution. Caution: scatter. Next: write one priority.',
    recommendation: 'Stage the career focus with one reversible priority.',
    recommendationStatus: 'proceed-with-caution' as const,
    scores: {
      opportunity: { value: 64, rationale: 'Constructive' },
      risk: { value: 42, rationale: 'Contained' },
      timing: { value: 60, rationale: 'Supportive' },
      readiness: { value: 61, rationale: 'Ready' },
      confidence: { value: 58, rationale: 'Moderate' },
    },
    analysis: [
      { id: 'situation' as const, title: 'Situation', body: 'Career focus.' },
      { id: 'factors' as const, title: 'Main Factors', body: 'Priorities.' },
      { id: 'opportunities' as const, title: 'Opportunities', body: 'Clarity.' },
      { id: 'risks' as const, title: 'Risks', body: 'Scatter.' },
      { id: 'tradeoffs' as const, title: 'Trade-offs', body: 'Breadth vs depth.' },
      { id: 'personal-fit' as const, title: 'Personal Fit', body: 'Fits style.' },
      { id: 'what-could-change' as const, title: 'What Could Change', body: 'New constraint.' },
      { id: 'why' as const, title: 'Why', body: 'Pick one lever.' },
    ],
    timing: {
      applicable: true,
      available: true,
      today: { label: 'Today', dateRange: '2026-07-20', score: 60, note: 'ok' },
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
      cautionWindow: { label: 'Avoid', dateRange: '2026-07-22', score: 30, note: 'low' },
      timingRationale: 'Prefer supportive windows.',
      timingConfidence: 'medium' as const,
    },
    scenarios: {
      bestCase: {
        outcome: 'Clear focus',
        likelihoodBand: 'medium' as const,
        keyConditions: ['One lever'],
        earlySignals: ['Progress'],
        mitigation: 'Protect time',
      },
      mostLikely: {
        outcome: 'Partial progress',
        likelihoodBand: 'high' as const,
        keyConditions: ['Mixed'],
        earlySignals: ['Drift'],
        mitigation: 'Weekly review',
      },
      downsideCase: {
        outcome: 'Scatter',
        likelihoodBand: 'low' as const,
        keyConditions: ['No owner'],
        earlySignals: ['Context switch'],
        mitigation: 'Batch',
      },
    },
    actionPlan: {
      now: [
        {
          action: 'Write one priority.',
          purpose: 'Clarity',
          priority: 'high' as const,
          completionSignal: 'Written',
        },
      ],
      next7Days: [
        {
          action: 'Schedule the decisive step.',
          purpose: 'Execute',
          priority: 'high' as const,
          completionSignal: 'Scheduled',
        },
      ],
      next30Days: [
        {
          action: 'Review progress.',
          purpose: 'Validate',
          priority: 'medium' as const,
          completionSignal: 'Reviewed',
        },
      ],
    },
    alternatives: [],
    assumptions: ['Week horizon as stated'],
    confidence: {
      level: 'medium' as const,
      score: 58,
      explanation: 'Proceed with staged moves.',
      missingInputs: [] as string[],
      limitingFactors: ['Not predictive'],
    },
    limitations: ['Comparative only'],
    relatedModules: [
      {
        module: 'pathfinder' as const,
        reason: 'Deeper workflow',
        actionLabel: 'Open Pathfinder',
        route: '/pathfinder',
      },
    ],
    followUpQuestions: [
      'What would make this a no?',
      'Who must agree?',
      'What proves progress?',
    ],
    safetyNotice: null,
    generatedAt: '2026-07-20T12:00:00.000Z',
  };
  return {
    runAskDecisionMock: vi.fn(async () => ({
      result: mockAskDecisionResult,
      clarification: {
        required: false,
        question: null,
        canContinueWithAssumptions: true,
      },
      pendingClarification: false,
    })),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push }),
}));

vi.mock('@/lib/chart-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/chart-api')>();
  return {
    ...actual,
    fetchValidatedResultChart: vi.fn(),
  };
});

vi.mock('@/lib/ask-decision', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ask-decision')>();
  return {
    ...actual,
    runAskDecision: runAskDecisionMock,
  };
});

const mockFetchValidatedResultChart = vi.mocked(fetchValidatedResultChart);

const GUIDED_DISPLAY_TEXT =
  'What should I focus on in my career this week?';

const UNIQUE_API_SUMMARY =
  'DECISION_API_BOUNDARY_SUMMARY_MUST_NOT_RENDER_7f3c';

function successDecisionFetchResponse(summary = UNIQUE_API_SUMMARY) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      status: 'completed' as const,
      result: {
        requestId: 'career-focus-week:career_focus',
        actionType: 'career_focus',
        guidedQuestionId: 'career-focus-week',
        categoryId: 'career-work',
        needsTime: false,
        summary,
        source: 'decision_api_boundary',
      },
    }),
  };
}

function renderResult(lang: AppLang = 'en') {
  return render(<ResultScreen lang={lang} />);
}

describe('ResultScreen', () => {
  const sampleProfile = {
    birth_date: '1990-06-15',
    birth_time: '14:30',
    birth_place: {
      name: 'New York, New York, United States',
      short: 'New York',
      lat: 40.7128,
      lon: -74.006,
    },
    name: 'Alex',
    action_type: 'business_launch',
  };

  const sampleQuestion = {
    text: 'What should I focus on in my career this week?',
    submitted_at: Date.now(),
    source: 'typed' as const,
  };

  const guidedReadyQuestion = {
    submitted_at: Date.now(),
    source: 'suggestion' as const,
    suggestion_id: 'career-focus-week',
  };

  const unresolvedLegacyQuestion = {
    submitted_at: Date.now(),
    source: 'suggestion' as const,
    suggestion_id: 'career',
  };

  beforeEach(() => {
    localStorage.clear();
    resetProfileRepositoryForTests();
    resetAskQuestionRepositoryForTests();
    replace.mockClear();
    push.mockClear();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    saveSession({ method: 'email', identifier: 'user@test.com', verifiedAt: Date.now() });
    mockFetchValidatedResultChart.mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    resetProfileRepositoryForTests();
    resetAskQuestionRepositoryForTests();
  });

  it('renders Result screen when profile and question exist', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    expect(
      await screen.findByRole('heading', { name: /your journey begins/i })
    ).toBeTruthy();
    expect(screen.getByText(sampleQuestion.text)).toBeTruthy();
    expect(screen.getByText(/early preview/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /complete onboarding/i })).toBeTruthy();
  });

  it('redirects to profile onboarding when birth profile is missing', async () => {
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/profile?onboarding=1');
    });

    const queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('ftue.result.missing_profile');
  });

  it('redirects to ask when question is missing', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    renderResult('en');

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/ask');
    });

    const queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('ftue.result.missing_question');
  });

  it('displays structured decision intelligence instead of a generic chat answer', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    expect(await screen.findByTestId('ask-decision-engine')).toBeTruthy();
    expect(screen.getByTestId('ask-recommendation-status')).toBeTruthy();
    // Legacy insight retained for share/FTUE compatibility but not as the main answer surface.
    expect(screen.getByTestId('result-insight-legacy')).toBeTruthy();
  });

  it('marks FTUE complete and navigates to /home on completion', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    fireEvent.click(await screen.findByRole('button', { name: /complete onboarding/i }));

    expect(isFtueComplete()).toBe(true);
    expect(push).toHaveBeenCalledWith('/home');
  });

  it('fires analytics events on view and completion', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    await screen.findByRole('heading', { name: /your journey begins/i });

    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events');
      expect(queue).toContain('ftue.result.view');
      expect(queue).toContain('ftue.result.started');
    });

    fireEvent.click(screen.getByRole('button', { name: /complete onboarding/i }));
    await waitFor(() => {
      const queue = localStorage.getItem('planet-life-ftue-events');
      expect(queue).toContain('ftue.result.completed');
    });
  });

  it('localizes a stored suggestion when the active locale changes', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion({
      submitted_at: Date.now(),
      source: 'suggestion',
      suggestion_id: 'career',
    });
    const { rerender } = renderResult('en');
    await screen.findByRole('heading', { name: /your journey begins/i });
    expect(
      screen.getByText('What should I focus on in my career this week?')
    ).toBeTruthy();

    rerender(<ResultScreen lang="fa" />);

    expect(
      screen.getByText('این هفته روی چه چیزی در مسیر شغلی‌ام تمرکز کنم؟')
    ).toBeTruthy();
  });

  it('keeps typed question text when the active locale changes', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion({
      submitted_at: Date.now(),
      source: 'typed',
      text: 'My own question in English',
    });
    const { rerender } = renderResult('en');
    await screen.findByRole('heading', { name: /your journey begins/i });
    expect(screen.getByText('My own question in English')).toBeTruthy();

    rerender(<ResultScreen lang="fa" />);

    expect(screen.getByText('My own question in English')).toBeTruthy();
  });

  it('updates copy when the active locale changes', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    const { rerender } = renderResult('en');
    await screen.findByRole('heading', { name: /your journey begins/i });

    rerender(<ResultScreen lang="fa" />);

    expect(screen.getByRole('heading', { name: /آغاز مسیر شما/i })).toBeTruthy();
    expect(screen.getByText(/پیش‌نمایش اولیه/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /تکمیل فرآیند شروع/i })).toBeTruthy();
  });

  it('localizes the loading label when the active locale changes', () => {
    const { rerender } = renderResult('en');
    expect(screen.getByText('Loading…')).toBeTruthy();

    rerender(<ResultScreen lang="fa" />);
    expect(screen.getByText('در حال بارگذاری…')).toBeTruthy();
  });

  it('shows a localized empty chart state when chart data is unavailable', async () => {
    mockFetchValidatedResultChart.mockResolvedValue(null);
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    expect(await screen.findByText(/chart preview unavailable/i)).toBeTruthy();
    expect(document.querySelector('[data-result-chart="empty"]')).toBeTruthy();
  });

  it('shows a localized loading chart state before chart data resolves', async () => {
    mockFetchValidatedResultChart.mockImplementation(
      () => new Promise(() => {})
    );
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    await screen.findByRole('heading', { name: /your journey begins/i });
    expect(screen.getByText(/loading your chart/i)).toBeTruthy();
    expect(document.querySelector('[data-result-chart="loading"]')).toBeTruthy();
  });

  it('renders the chart when validated chart data is available', async () => {
    mockFetchValidatedResultChart.mockResolvedValue(RAFSANJAN_CHART);
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    await waitFor(() => {
      expect(document.querySelector('[data-result-chart="ready"]')).toBeTruthy();
    });
    expect(screen.getByRole('heading', { name: /your journey begins/i })).toBeTruthy();
  });

  it('does not crash when chart data is incomplete', async () => {
    mockFetchValidatedResultChart.mockResolvedValue({
      ...RAFSANJAN_CHART,
      planets: {},
    });
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    expect(await screen.findByText(/chart preview unavailable/i)).toBeTruthy();
  });

  it('uses the new localized title in each language', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);

    const { rerender } = renderResult('en');
    expect(await screen.findByRole('heading', { name: 'Your Journey Begins' })).toBeTruthy();

    rerender(<ResultScreen lang="fa" />);
    expect(screen.getByRole('heading', { name: 'آغاز مسیر شما' })).toBeTruthy();

    rerender(<ResultScreen lang="ar" />);
    expect(screen.getByRole('heading', { name: 'بداية رحلتك' })).toBeTruthy();

    rerender(<ResultScreen lang="ru" />);
    expect(screen.getByRole('heading', { name: 'Начало вашего пути' })).toBeTruthy();
  });

  it('shares only safe insight content without profile or location fields', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });

    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    fireEvent.click(await screen.findByRole('button', { name: /share insight/i }));

    await waitFor(() => {
      expect(share).toHaveBeenCalled();
    });

    const payload = share.mock.calls[0][0] as { title: string; text: string };
    expect(payload.title).toBe('Your Journey Begins');
    expect(payload.text).toBe(buildResultShareText(getResultCopy('en'), sampleQuestion.text));
    expect(payload.text).not.toMatch(/New York|40\.7128|1990-06-15|14:30|Alex|United States/i);

    vi.unstubAllGlobals();
  });

  it('makes zero Decision API calls during synchronous render', () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(successDecisionFetchResponse());
    vi.stubGlobal('fetch', fetchSpy);
    const postSpy = vi.spyOn(decisionApi, 'postDecisionExecute');
    const executeSpy = vi.spyOn(decisionFacade, 'executePreparedDecision');

    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(guidedReadyQuestion);
    renderResult('en');

    // useQueuedEffect schedules after commit via microtask — render itself must not execute.
    expect(executeSpy).not.toHaveBeenCalled();
    expect(postSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('executes Guided Ready from the effect with exactly one network request', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(successDecisionFetchResponse());
    vi.stubGlobal('fetch', fetchSpy);
    const postSpy = vi.spyOn(decisionApi, 'postDecisionExecute');
    const executeSpy = vi.spyOn(decisionFacade, 'executePreparedDecision');

    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(guidedReadyQuestion);
    const { rerender } = renderResult('en');

    expect(executeSpy).not.toHaveBeenCalled();
    expect(postSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();

    expect(
      await screen.findByRole('heading', { name: /your journey begins/i })
    ).toBeTruthy();

    await waitFor(() => {
      expect(executeSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    // Rerender with unchanged execution inputs must not trigger another execution.
    rerender(<ResultScreen lang="en" />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /your journey begins/i })).toBeTruthy();
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('propagates effect cleanup abort to the fetch AbortSignal', async () => {
    let capturedSignal: AbortSignal | undefined;
    const fetchSpy = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      capturedSignal = init?.signal ?? undefined;
      return new Promise(() => {});
    });
    vi.stubGlobal('fetch', fetchSpy);

    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(guidedReadyQuestion);
    const { unmount } = renderResult('en');

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    expect(capturedSignal).toBeInstanceOf(AbortSignal);
    expect(capturedSignal!.aborted).toBe(false);

    unmount();

    expect(capturedSignal!.aborted).toBe(true);
  });

  it('returns build_failed without HTTP when the request builder rejects', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const postSpy = vi.spyOn(decisionApi, 'postDecisionExecute');
    const executeSpy = vi.spyOn(decisionFacade, 'executePreparedDecision');

    // Complete for ResultScreen guards, rejected by buildDecisionExecuteRequest.
    getProfileRepository().saveProfile({
      ...sampleProfile,
      action_type: '   ',
    });
    getAskQuestionRepository().saveQuestion(guidedReadyQuestion);
    renderResult('en');

    expect(
      await screen.findByRole('heading', { name: /your journey begins/i })
    ).toBeTruthy();

    await waitFor(() => {
      expect(executeSpy).toHaveBeenCalledTimes(1);
    });

    const response = (await executeSpy.mock.results[0]
      ?.value) as DecisionEngineResponse;

    expect(response).toEqual({
      status: 'completed',
      result: expect.objectContaining({
        source: 'placeholder',
        guidedQuestionId: 'career-focus-week',
      }),
      execution: { executed: false, reason: 'build_failed' },
    });
    expect(response.status === 'completed' ? response.api : undefined).toBeUndefined();
    expect(postSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('keeps Decision API success boundary-only: no UI, navigation, or repository writes', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(successDecisionFetchResponse(UNIQUE_API_SUMMARY));
    vi.stubGlobal('fetch', fetchSpy);

    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(guidedReadyQuestion);

    const profileSaveSpy = vi.spyOn(getProfileRepository(), 'saveProfile');
    const questionSaveSpy = vi.spyOn(getAskQuestionRepository(), 'saveQuestion');

    replace.mockClear();
    push.mockClear();

    renderResult('en');

    expect(
      await screen.findByRole('heading', { name: /your journey begins/i })
    ).toBeTruthy();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    // Allow the execute promise to settle after fetch resolves.
    await waitFor(async () => {
      const last = fetchSpy.mock.results[0];
      expect(last?.type).toBe('return');
      await last?.value;
    });
    await Promise.resolve();
    await Promise.resolve();

    // A) Visible output unchanged — API summary never rendered.
    expect(screen.getAllByText(GUIDED_DISPLAY_TEXT).length).toBeGreaterThan(0);
    expect(screen.getByText(/early preview/i)).toBeTruthy();
    expect(screen.getByTestId('result-insight-legacy')).toBeTruthy();
    expect(document.querySelector('[data-result-chart="empty"]')).toBeTruthy();
    expect(screen.queryByText(UNIQUE_API_SUMMARY)).toBeNull();

    // B) Navigation untouched by Decision API success.
    expect(replace).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();

    // C) Repositories untouched after fixture setup.
    expect(profileSaveSpy).not.toHaveBeenCalled();
    expect(questionSaveSpy).not.toHaveBeenCalled();
  });

  it('renders Ask Decision Intelligence cards for a stored question', async () => {
    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    expect(await screen.findByTestId('ask-decision-engine')).toBeTruthy();
    expect(screen.getByTestId('ask-detected-intent').textContent).toBe('Career');
    expect(screen.getByTestId('ask-score-opportunity')).toBeTruthy();
    expect(screen.getByTestId('ask-confidence-level').textContent).toMatch(/medium/i);
  });

  it('does not call the Decision API for typed questions', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const postSpy = vi.spyOn(decisionApi, 'postDecisionExecute');
    const executeSpy = vi.spyOn(decisionFacade, 'executePreparedDecision');

    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(sampleQuestion);
    renderResult('en');

    await screen.findByRole('heading', { name: /your journey begins/i });
    await waitFor(() => {
      expect(mockFetchValidatedResultChart).toHaveBeenCalled();
    });

    expect(executeSpy).not.toHaveBeenCalled();
    expect(postSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not call the Decision API for unresolved preparations', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const postSpy = vi.spyOn(decisionApi, 'postDecisionExecute');
    const executeSpy = vi.spyOn(decisionFacade, 'executePreparedDecision');

    getProfileRepository().saveProfile(sampleProfile);
    getAskQuestionRepository().saveQuestion(unresolvedLegacyQuestion);
    renderResult('en');

    await screen.findByRole('heading', { name: /your journey begins/i });
    await waitFor(() => {
      expect(mockFetchValidatedResultChart).toHaveBeenCalled();
    });

    expect(executeSpy).not.toHaveBeenCalled();
    expect(postSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
