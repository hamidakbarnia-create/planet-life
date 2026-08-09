import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PopularDecisionGrid } from './PopularDecisionGrid';
import styles from './ask-home.module.css';

afterEach(() => cleanup());

describe('ASK Home Popular hierarchy', () => {
  it('marks Popular as secondary section (demoted styling hook)', () => {
    render(
      <PopularDecisionGrid
        title="Popular Decisions"
        items={[
          {
            id: 'car-interview',
            label: 'Job interview',
            decisionTypeId: 'car-interview',
            source: 'registry',
            capability: 'available',
          },
        ]}
        seeAllLabel="See all"
        availableBadge="Available"
        unavailableBadge="Coming soon"
        onSeeAll={vi.fn()}
        onSelect={vi.fn()}
      />
    );
    const section = screen.getByTestId('ask-popular-decisions');
    expect(section.className).toContain(styles.popularSection);
    expect(section.className).toContain(styles.section);
  });

  it('exposes available vs unavailable capability on cards', () => {
    render(
      <PopularDecisionGrid
        title="Popular Decisions"
        items={[
          {
            id: 'job-interview',
            label: 'Job interview',
            decisionTypeId: 'car-interview',
            source: 'registry',
            capability: 'available',
          },
          {
            id: 'career-change',
            label: 'Career change',
            source: 'question-library',
            capability: 'unavailable',
          },
        ]}
        seeAllLabel="See all"
        availableBadge="Available"
        unavailableBadge="Coming soon"
        onSeeAll={vi.fn()}
        onSelect={vi.fn()}
      />
    );
    expect(
      screen.getByTestId('ask-popular-job-interview').getAttribute('data-capability')
    ).toBe('available');
    expect(
      screen.getByTestId('ask-popular-career-change').getAttribute('data-capability')
    ).toBe('unavailable');
    expect(screen.getByTestId('ask-popular-badge-job-interview').textContent).toBe(
      'Available'
    );
    expect(screen.getByTestId('ask-popular-badge-career-change').textContent).toBe(
      'Coming soon'
    );
  });
});
