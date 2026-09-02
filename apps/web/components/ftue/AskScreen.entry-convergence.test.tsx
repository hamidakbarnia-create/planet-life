import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AskClarificationFlow } from '@/components/ask/AskClarificationFlow';
import { AskScreen } from '@/components/ftue/AskScreen';
import {
  canEvaluateInProduction,
  canExecuteInProduction,
  listPopularDecisions,
} from '@/lib/ask-home';
import { saveSession } from '@/lib/auth';
import { buildDecisionFrame } from '@/lib/decision-frame';
import { resolveDecisionRequest } from '@/lib/decision-request';
import { getAskCopy } from '@/lib/ftue-i18n';
import {
  getAskQuestionRepository,
  resetAskQuestionRepositoryForTests,
  type FtueAskQuestion,
} from '@/lib/ask-question-repository';
import { getProfileRepository, resetProfileRepositoryForTests } from '@/lib/profile';
import { resolveAskQuestion } from '@/lib/resolve-ask-question';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock('@/lib/today-timing', () => ({
  loadTodayTiming: vi.fn(async () => ({
    score: null,
    reasoning: null,
    hourly: [],
    bestHour: null,
    riskHour: null,
  })),
}));

const ASK_SCREEN_SOURCE = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'AskScreen.tsx'),
  'utf8'
);

function capability(decisionTypeId: string | undefined) {
  return {
    evaluate: canEvaluateInProduction(decisionTypeId),
    compare: canExecuteInProduction(decisionTypeId, 'compare'),
    find: canExecuteInProduction(decisionTypeId, 'find'),
  };
}

function resolveStored(question: FtueAskQuestion) {
  return resolveDecisionRequest(resolveAskQuestion(question, 'en'));
}

const SHIPPED_ROWS = [
  {
    semantic: 'Interview',
    expectedType: 'car-interview',
    expected: { evaluate: true, compare: true, find: true },
    popularId: 'job-interview',
    guidedId: 'job-interview',
    typedEn: 'Is September 12 good for my job interview?',
  },
  {
    semantic: 'Product Launch',
    expectedType: 'bus-product-launch',
    expected: { evaluate: true, compare: false, find: true },
    popularId: 'launch-business',
    guidedId: 'launch-project',
    typedEn: 'Best time to launch my product',
  },
  {
    semantic: 'Investor Meeting',
    expectedType: 'bus-investor-meeting',
    expected: { evaluate: true, compare: true, find: false },
    popularId: 'meet-investor',
    guidedId: 'meet-investor',
    typedEn: 'When should I meet an investor?',
  },
  {
    semantic: 'Wedding',
    expectedType: 'mar-wedding-date',
    expected: { evaluate: true, compare: true, find: false },
    popularId: 'best-wedding-date',
    guidedId: undefined,
    typedEn: 'Best day for our wedding ceremony?',
  },
] as const;

describe('ASK shipped entry convergence', () => {
  it.each(SHIPPED_ROWS)(
    '$semantic Popular / Guided / Typed EN resolve to $expectedType',
    ({ expectedType, expected, popularId, guidedId, typedEn }) => {
      const popular = listPopularDecisions('en').find((item) => item.id === popularId);
      expect(popular?.decisionTypeId).toBe(expectedType);
      expect(popular?.capability).toBe('available');

      const popularResolved = resolveStored({
        submitted_at: Date.now(),
        source: 'typed',
        text: popular?.label ?? typedEn,
        decision_type_id: popular?.decisionTypeId,
      });
      expect(popularResolved.execution.decisionTypeId).toBe(expectedType);
      expect(capability(popularResolved.execution.decisionTypeId)).toEqual(expected);

      if (guidedId) {
        const guidedResolved = resolveStored({
          submitted_at: Date.now(),
          source: 'suggestion',
          suggestion_id: guidedId,
        });
        expect(guidedResolved.execution.decisionTypeId).toBe(expectedType);
        expect(capability(guidedResolved.execution.decisionTypeId)).toEqual(expected);
      }

      const typedResolved = resolveStored({
        submitted_at: Date.now(),
        source: 'typed',
        text: typedEn,
      });
      expect(typedResolved.execution.decisionTypeId).toBe(expectedType);
      expect(capability(typedResolved.execution.decisionTypeId)).toEqual(expected);

      const frame = buildDecisionFrame(typedEn, {
        decision_type_id: expectedType,
      });
      render(
        <AskClarificationFlow
          lang="en"
          frame={frame}
          caseId={null}
          caseVersion={null}
          onFrameChange={vi.fn()}
          onCaseBound={vi.fn()}
        />
      );
      expect(screen.getByTestId('examine-choices')).toBeTruthy();
      expect(screen.queryByTestId('ask-unsupported-type')).toBeNull();
      expect(screen.getByTestId('examine-evaluate').hasAttribute('disabled')).toBe(
        false
      );
      expect(screen.getByTestId('examine-compare').hasAttribute('disabled')).toBe(
        !expected.compare
      );
      expect(screen.getByTestId('examine-find').hasAttribute('disabled')).toBe(
        !expected.find
      );
      cleanup();
    }
  );
});

describe('ASK home must not shortcut to Decision Case', () => {
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
    action_type: 'business_launch' as const,
    gender: 'female' as const,
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetAskQuestionRepositoryForTests();
    resetProfileRepositoryForTests();
    push.mockReset();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    saveSession({
      method: 'email',
      identifier: 'user@test.com',
      verifiedAt: Date.now(),
    });
    getProfileRepository().saveProfile(sampleProfile);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('contains no /decision-cases/ route in ASK-home entry handling', () => {
    expect(ASK_SCREEN_SOURCE).not.toMatch(/\/decision-cases\//);
  });

  it.each([
    ['job-interview', 'car-interview'],
    ['launch-business', 'bus-product-launch'],
    ['meet-investor', 'bus-investor-meeting'],
    ['best-wedding-date', 'mar-wedding-date'],
  ] as const)('Popular %s enters /ask/frame with %s', async (popularId, decisionTypeId) => {
    render(<AskScreen copy={getAskCopy('en')} lang="en" />);
    await screen.findByTestId(`ask-popular-${popularId}`);
    fireEvent.click(screen.getByTestId(`ask-popular-${popularId}`));
    expect(push).toHaveBeenCalledWith('/ask/frame');
    expect(push.mock.calls.flat().join('\n')).not.toMatch(/\/decision-cases\//);
    expect(getAskQuestionRepository().loadQuestion()?.decision_type_id).toBe(
      decisionTypeId
    );
  });
});

describe('unsupported entry remain fail-closed', () => {
  it.each([
    {
      label: 'Guided negotiate-offer',
      question: {
        submitted_at: 1,
        source: 'suggestion' as const,
        suggestion_id: 'negotiate-offer',
      },
    },
    {
      label: 'Typed offer negotiation',
      question: {
        submitted_at: 1,
        source: 'typed' as const,
        text: 'Should I negotiate my job offer tomorrow?',
      },
    },
    {
      label: 'Guided salary',
      question: {
        submitted_at: 1,
        source: 'suggestion' as const,
        suggestion_id: 'ask-raise',
      },
    },
    {
      label: 'Guided promotion',
      question: {
        submitted_at: 1,
        source: 'suggestion' as const,
        suggestion_id: 'ask-promotion',
      },
    },
    {
      label: 'Typed business deal',
      question: {
        submitted_at: 1,
        source: 'typed' as const,
        text: 'Close an important business deal',
      },
    },
    {
      label: 'Guided property',
      question: {
        submitted_at: 1,
        source: 'suggestion' as const,
        suggestion_id: 'buy-sell-property',
      },
    },
    {
      label: 'Typed investment',
      question: {
        submitted_at: 1,
        source: 'typed' as const,
        text: 'Should I invest in this stock?',
      },
    },
    {
      label: 'Typed relocation',
      question: {
        submitted_at: 1,
        source: 'typed' as const,
        text: 'Should I relocate to Spain?',
      },
    },
  ])('$label has no executable Decision Type', ({ question }) => {
    const request = resolveStored(question);
    expect(request.execution.decisionTypeId).toBeUndefined();
    expect(request.execution.decisionTypeId).not.toBe('car-interview');
    expect(capability(request.execution.decisionTypeId)).toEqual({
      evaluate: false,
      compare: false,
      find: false,
    });

    const frame = buildDecisionFrame(
      request.displayText || 'Untitled decision',
      { decision_type_id: request.execution.decisionTypeId }
    );
    render(
      <AskClarificationFlow
        lang="en"
        frame={frame}
        caseId={null}
        caseVersion={null}
        onFrameChange={vi.fn()}
        onCaseBound={vi.fn()}
      />
    );
    expect(screen.getByTestId('ask-unsupported-type')).toBeTruthy();
    expect(screen.queryByTestId('examine-choices')).toBeNull();
    cleanup();
  });
});
