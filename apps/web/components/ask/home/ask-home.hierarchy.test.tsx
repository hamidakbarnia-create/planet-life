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
          },
        ]}
        seeAllLabel="See all"
        onSeeAll={vi.fn()}
        onSelect={vi.fn()}
      />
    );
    const section = screen.getByTestId('ask-popular-decisions');
    expect(section.className).toContain(styles.popularSection);
    expect(section.className).toContain(styles.section);
  });
});
