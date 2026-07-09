import type { AppLang } from './app-settings';
import type { FtueAskQuestion } from './ask-question-repository';
import { getAskCopy, type AskSuggestionId } from './ftue-i18n';
import { findGuidedQuestion, resolveGuidedQuestionText } from './question-library';

export function getSuggestionText(lang: AppLang, id: AskSuggestionId): string | null {
  const fromLibrary = findGuidedQuestion(id);
  if (fromLibrary) return resolveGuidedQuestionText(fromLibrary, lang);
  const match = getAskCopy(lang).suggestions.find((s) => s.id === id);
  return match?.text ?? null;
}

/** Display text for a stored question in the active locale. */
export function resolveStoredAskQuestionText(
  question: FtueAskQuestion,
  lang: AppLang
): string {
  if (question.source === 'suggestion' && question.suggestion_id) {
    const localized = getSuggestionText(lang, question.suggestion_id);
    if (localized) return localized;
  }
  return question.text?.trim() ?? '';
}

export function hasStoredAskQuestion(question: FtueAskQuestion | null): boolean {
  if (!question) return false;
  if (question.source === 'suggestion') return Boolean(question.suggestion_id);
  return Boolean(question.text?.trim());
}
