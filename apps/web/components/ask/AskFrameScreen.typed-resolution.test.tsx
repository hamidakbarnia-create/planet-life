import {
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AskFrameScreen } from './AskFrameScreen';
import { loadDecisionFrame } from '@/lib/ask-product';
import {
  getAskQuestionRepository,
  resetAskQuestionRepositoryForTests,
} from '@/lib/ask-question-repository';

const replace = vi.fn();
const push = vi.fn();
const persistFrameToCase = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => searchParams,
}));

vi.mock('@/lib/ask-product', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ask-product')>(
    '@/lib/ask-product'
  );
  return {
    ...actual,
    persistFrameToCase: (...args: unknown[]) => persistFrameToCase(...args),
  };
});

function seedTyped(text: string, decisionTypeId?: string) {
  getAskQuestionRepository().saveQuestion({
    submitted_at: Date.now(),
    source: 'typed',
    text,
    ...(decisionTypeId ? { decision_type_id: decisionTypeId } : {}),
  });
}

describe('AskFrameScreen typed resolution integration', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetAskQuestionRepositoryForTests();
    replace.mockReset();
    push.mockReset();
    persistFrameToCase.mockReset();
    searchParams = new URLSearchParams();
  });

  afterEach(() => {
    cleanup();
  });

  it('binds exact typed Ask to Decision Type and enables capability-aware evaluate', async () => {
    seedTyped('Is September 12 good for my job interview?');

    render(<AskFrameScreen lang="en" />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-frame-screen')).toBeTruthy();
    });

    expect(loadDecisionFrame()?.decision_type_id).toBe('car-interview');
    expect(screen.getByTestId('ask-intent-preserve').textContent).toContain(
      'job interview'
    );
    // Date cue + shipped DT → ready evaluate. Selector stays visible.
    const evaluateChoice = screen.getByTestId('examine-evaluate');
    expect(evaluateChoice).toBeTruthy();
    expect(evaluateChoice.getAttribute('data-recommended')).toBe('true');
    expect(evaluateChoice.getAttribute('data-selected')).toBe('true');
    expect(screen.getByTestId('ask-ready-evaluate')).toBeTruthy();
    expect(screen.getByTestId('ask-persist-evaluate')).toBeTruthy();
    expect(persistFrameToCase).not.toHaveBeenCalled();
  });

  it('keeps ambiguous typed Ask fail-closed without Decision Type', async () => {
    seedTyped('Close an important business deal');

    render(<AskFrameScreen lang="en" />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-frame-screen')).toBeTruthy();
    });

    expect(loadDecisionFrame()?.decision_type_id).toBeUndefined();
    expect(screen.getByTestId('ask-unsupported-type')).toBeTruthy();
    expect(screen.queryByTestId('examine-choices')).toBeNull();
    expect(screen.queryByTestId('examine-evaluate')).toBeNull();
    expect(persistFrameToCase).not.toHaveBeenCalled();
  });

  it('keeps unsupported typed Ask fail-closed without Decision Type', async () => {
    seedTyped('Should I relocate to Spain?');

    render(<AskFrameScreen lang="en" />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-frame-screen')).toBeTruthy();
    });

    expect(loadDecisionFrame()?.decision_type_id).toBeUndefined();
    expect(screen.getByTestId('ask-unsupported-type')).toBeTruthy();
    expect(screen.queryByTestId('examine-choices')).toBeNull();
    expect(screen.queryByTestId('examine-evaluate')).toBeNull();
    expect(persistFrameToCase).not.toHaveBeenCalled();
  });

  it('resolves guided launch-project to Product Launch selector', async () => {
    getAskQuestionRepository().saveQuestion({
      submitted_at: Date.now(),
      source: 'suggestion',
      suggestion_id: 'launch-project',
    });

    render(<AskFrameScreen lang="en" />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-frame-screen')).toBeTruthy();
    });

    expect(loadDecisionFrame()?.decision_type_id).toBe('bus-product-launch');
    expect(screen.getByTestId('examine-choices')).toBeTruthy();
    expect(screen.queryByTestId('ask-unsupported-type')).toBeNull();
    expect(screen.getByTestId('examine-evaluate').hasAttribute('disabled')).toBe(
      false
    );
    expect(screen.getByTestId('examine-find').hasAttribute('disabled')).toBe(
      false
    );
    expect(screen.getByTestId('examine-compare').hasAttribute('disabled')).toBe(
      true
    );
    expect(persistFrameToCase).not.toHaveBeenCalled();
  });

  it('shows unsupported panel for guided negotiate-offer without inventing a type', async () => {
    getAskQuestionRepository().saveQuestion({
      submitted_at: Date.now(),
      source: 'suggestion',
      suggestion_id: 'negotiate-offer',
    });

    render(<AskFrameScreen lang="en" />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-frame-screen')).toBeTruthy();
    });

    expect(loadDecisionFrame()?.decision_type_id).toBeUndefined();
    expect(screen.getByTestId('ask-unsupported-type')).toBeTruthy();
    expect(screen.queryByTestId('examine-choices')).toBeNull();
    expect(persistFrameToCase).not.toHaveBeenCalled();
  });

  it('shows unsupported panel for negotiate-offer without inventing a type', async () => {
    seedTyped('مذاکره روی پیشنهاد شغلی');

    render(<AskFrameScreen lang="fa" />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-frame-screen')).toBeTruthy();
    });

    expect(loadDecisionFrame()?.decision_type_id).toBeUndefined();
    expect(screen.getByTestId('ask-unsupported-type')).toBeTruthy();
    expect(screen.getByTestId('ask-intent-preserve').textContent).toContain(
      'مذاکره روی پیشنهاد شغلی'
    );
    expect(screen.queryByTestId('examine-choices')).toBeNull();
    expect(screen.queryByTestId('examine-evaluate')).toBeNull();
    expect(screen.queryByTestId('examine-compare')).toBeNull();
    expect(screen.queryByTestId('examine-find')).toBeNull();
    expect(persistFrameToCase).not.toHaveBeenCalled();
  });

  it('honors explicit stored decision_type_id over typed text cues', async () => {
    seedTyped('Is September 12 good for my job interview?', 'mar-wedding-date');

    render(<AskFrameScreen lang="en" />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-frame-screen')).toBeTruthy();
    });

    expect(loadDecisionFrame()?.decision_type_id).toBe('mar-wedding-date');
  });
});
