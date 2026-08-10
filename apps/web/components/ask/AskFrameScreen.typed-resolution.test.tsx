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
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => searchParams,
}));

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
    // Date cue + shipped DT → ready evaluate (capability-aware), not disabled examine.
    expect(screen.getByTestId('ask-ready-evaluate')).toBeTruthy();
    expect(screen.getByTestId('ask-persist-evaluate')).toBeTruthy();
    expect(screen.queryByTestId('examine-evaluate')).toBeNull();
  });

  it('keeps ambiguous typed Ask fail-closed without Decision Type', async () => {
    seedTyped('Close an important business deal');

    render(<AskFrameScreen lang="en" />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-frame-screen')).toBeTruthy();
    });

    expect(loadDecisionFrame()?.decision_type_id).toBeUndefined();
    expect(screen.getByTestId('examine-evaluate').hasAttribute('disabled')).toBe(
      true
    );
  });

  it('keeps unsupported typed Ask fail-closed without Decision Type', async () => {
    seedTyped('Should I relocate to Spain?');

    render(<AskFrameScreen lang="en" />);

    await waitFor(() => {
      expect(screen.getByTestId('ask-frame-screen')).toBeTruthy();
    });

    expect(loadDecisionFrame()?.decision_type_id).toBeUndefined();
    expect(screen.getByTestId('examine-evaluate').hasAttribute('disabled')).toBe(
      true
    );
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
