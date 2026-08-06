import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getAskQuestionRepository,
  resetAskQuestionRepositoryForTests,
} from './ask-question-repository';

describe('ask-question-repository', () => {
  beforeEach(() => {
    localStorage.clear();
    resetAskQuestionRepositoryForTests();
  });

  afterEach(() => {
    localStorage.clear();
    resetAskQuestionRepositoryForTests();
  });

  it('saves and loads a typed question', () => {
    const repo = getAskQuestionRepository();
    const question = {
      text: 'What should I focus on today?',
      submitted_at: Date.now(),
      source: 'typed' as const,
    };
    repo.saveQuestion(question);
    expect(repo.loadQuestion()).toEqual(question);
  });

  it('saves and loads a suggestion by id', () => {
    const repo = getAskQuestionRepository();
    const question = {
      submitted_at: Date.now(),
      source: 'suggestion' as const,
      suggestion_id: 'career' as const,
    };
    repo.saveQuestion(question);
    expect(repo.loadQuestion()).toEqual(question);
  });

  it('clears a stored question', () => {
    const repo = getAskQuestionRepository();
    repo.saveQuestion({
      submitted_at: Date.now(),
      source: 'suggestion',
      suggestion_id: 'career',
    });
    repo.clearQuestion();
    expect(repo.loadQuestion()).toBeNull();
  });
});
