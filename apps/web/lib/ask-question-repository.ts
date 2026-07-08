export interface FtueAskQuestion {
  text: string;
  submitted_at: number;
  source: 'typed' | 'suggestion';
  suggestion_id?: string;
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
