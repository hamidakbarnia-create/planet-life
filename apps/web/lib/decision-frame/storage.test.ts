import { afterEach, describe, expect, it } from 'vitest';
import { buildDecisionFrame } from './frame';
import {
  clearDecisionFrame,
  loadDecisionFrame,
  saveDecisionFrame,
  sessionFrameBelongsToCurrentQuestion,
} from './storage';

afterEach(() => {
  sessionStorage.clear();
});

describe('sessionFrameBelongsToCurrentQuestion', () => {
  it('accepts matching raw_intent and decision_type_id', () => {
    const frame = buildDecisionFrame('Choose wedding date', {
      decision_type_id: 'mar-wedding-date',
    });
    expect(
      sessionFrameBelongsToCurrentQuestion(frame, {
        text: 'Choose wedding date',
        decisionTypeId: 'mar-wedding-date',
      })
    ).toBe(true);
  });

  it('rejects different raw_intent', () => {
    const frame = buildDecisionFrame('Choose wedding date', {
      decision_type_id: 'mar-wedding-date',
    });
    expect(
      sessionFrameBelongsToCurrentQuestion(frame, {
        text: 'Close an important business deal',
      })
    ).toBe(false);
  });

  it('rejects decision_type_id mismatch when intents match', () => {
    const frame = buildDecisionFrame('Launch timing', {
      decision_type_id: 'bus-product-launch',
    });
    expect(
      sessionFrameBelongsToCurrentQuestion(frame, {
        text: 'Launch timing',
        decisionTypeId: 'bus-investor-meeting',
      })
    ).toBe(false);
  });

  it('rejects when frame has a type binding and question does not', () => {
    const frame = buildDecisionFrame('Choose wedding date', {
      decision_type_id: 'mar-wedding-date',
    });
    expect(
      sessionFrameBelongsToCurrentQuestion(frame, {
        text: 'Choose wedding date',
      })
    ).toBe(false);
  });
});

describe('clearDecisionFrame', () => {
  it('removes the session DecisionFrame key', () => {
    saveDecisionFrame(buildDecisionFrame('Seeded frame'));
    expect(loadDecisionFrame()).not.toBeNull();
    clearDecisionFrame();
    expect(loadDecisionFrame()).toBeNull();
  });
});
