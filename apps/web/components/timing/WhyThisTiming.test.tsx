import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { WhyThisTiming } from './WhyThisTiming';
import type { ScoreReasoning } from '@/lib/score-reasoning';

afterEach(() => {
  cleanup();
});

const labels = {
  dir: 'ltr' as const,
  whyTiming: 'Why this timing',
  supportingReasons: 'Supporting details',
};

const SAMPLE: ScoreReasoning = {
  summary: 'Shared producer summary.',
  confidence: 0.5,
  reasons: [
    {
      category: 'timing',
      importance: 'high',
      score: 10,
      title: 'Title',
      explanation: 'Explanation',
      evidence: {},
    },
  ],
};

describe('WhyThisTiming', () => {
  it('renders producer summary only when present', () => {
    render(<WhyThisTiming labels={labels} reasoning={SAMPLE} />);
    expect(screen.getByTestId('calendar-why-timing-summary').textContent).toBe(
      'Shared producer summary.'
    );
    expect(screen.queryByText(/0\.5/)).toBeNull();
  });

  it('renders nothing when summary is absent', () => {
    const { container } = render(<WhyThisTiming labels={labels} reasoning={null} />);
    expect(container.firstChild).toBeNull();
  });
});
