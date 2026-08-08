import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FindResultView } from './FindResultView';
import type { FindResultViewModel } from '@/lib/decision-frame';

afterEach(() => cleanup());

describe('FindResultView honesty', () => {
  it('never labels a fabricated best date; shows comparable windows', () => {
    const model: FindResultViewModel = {
      operation: 'find',
      headline: 'Comparable windows',
      unique_dominant: false,
      windows: [
        {
          window_id: 'w1',
          start_label: 'Nov 3, 2026',
          end_label: 'Nov 5, 2026',
          peak_labels: ['Nov 4, 2026'],
          strength: 'strong',
          band: 'high',
          peak_score: 78,
        },
        {
          window_id: 'w2',
          start_label: 'Nov 12, 2026',
          end_label: 'Nov 14, 2026',
          peak_labels: ['Nov 13, 2026'],
          strength: 'strong',
          band: 'high',
          peak_score: 76,
        },
      ],
      range_context: 'Nov 1, 2026 – Nov 30, 2026',
      confidence: 'medium',
      limitations: ['Does not assess market fit or revenue.'],
    };

    render(<FindResultView model={model} />);
    expect(screen.getByTestId('find-headline').textContent).toBe(
      'Comparable windows'
    );
    expect(screen.getByTestId('find-honesty').textContent).toMatch(
      /comparable windows/i
    );
    expect(screen.queryByText(/best date/i)).toBeNull();
    expect(screen.getAllByTestId('find-window')).toHaveLength(2);
    expect(screen.getByTestId('find-range').textContent).toContain('Nov');
    expect(screen.getByTestId('find-limits').textContent).toContain(
      'market fit'
    );
  });

  it('shows no clearly dominant window when empty', () => {
    const model: FindResultViewModel = {
      operation: 'find',
      headline: 'No clearly dominant window',
      unique_dominant: false,
      windows: [],
      range_context: 'Nov 1, 2026 – Nov 30, 2026',
      confidence: 'medium',
    };
    render(<FindResultView model={model} />);
    expect(screen.getByTestId('find-windows-empty')).toBeTruthy();
    expect(screen.queryByText(/best date/i)).toBeNull();
  });
});
