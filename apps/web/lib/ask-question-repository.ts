import type { AskSuggestionId } from './ftue-i18n';

export interface FtueAskQuestion {
  submitted_at: number;
  source: 'typed' | 'suggestion';
  /** Original user-entered text for typed questions. */
  text?: string;
  /** Stable locale-independent id for suggested questions. */
  suggestion_id?: AskSuggestionId;
  /**
   * Optional registry Decision Type binding (e.g. popular wedding card).
   * Never invent for free-text; only set from explicit registry-backed entry.
   */
  decision_type_id?: string;
}

export interface AskQuestionRepository {
  saveQuestion(question: FtueAskQuestion): void;
  loadQuestion(): FtueAskQuestion | null;
  clearQuestion(): void;
}

const QUESTION_KEY = 'planet-life-ftue-ask-question';

class LocalAskQuestionRepository implements AskQuestionRepository {
  saveQuestion(question: FtueAskQuestion): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(QUESTION_KEY, JSON.stringify(question));
  }

  loadQuestion(): FtueAskQuestion | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(QUESTION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as FtueAskQuestion;
    } catch {
      return null;
    }
  }

  clearQuestion(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(QUESTION_KEY);
  }
}

let singleton: AskQuestionRepository | null = null;

export function createAskQuestionRepository(): AskQuestionRepository {
  return new LocalAskQuestionRepository();
}

export function getAskQuestionRepository(): AskQuestionRepository {
  if (!singleton) singleton = createAskQuestionRepository();
  return singleton;
}

/** Test-only reset */
export function resetAskQuestionRepositoryForTests(): void {
  singleton = null;
}
