import type { AppLang } from './app-settings';
import type { FtueAskQuestion } from './ask-question-repository';
import { getAskCopy, type AskSuggestionId } from './ftue-i18n';
import {
  findGuidedQuestion,
  resolveGuidedQuestionText,
  type GuidedQuestion,
  type QuestionCategoryId,
} from './question-library';

export interface AskExecutionMetadata {
  actionType: string;
  categoryId: QuestionCategoryId;
  needsTime: boolean;
}

export type AskUnresolvedReason =
  | 'missing_question_text'
  | 'missing_suggestion_id'
  | 'legacy_suggestion_id'
  | 'unknown_suggestion_id'
  | 'typed_question_unresolved';

export interface ResolvedAskQuestion {
  source: 'typed' | 'suggestion';
  displayText: string;
  guidedQuestion?: GuidedQuestion;
  typedText?: string;
  executionMetadata?: AskExecutionMetadata;
  executionUnresolvedReason?: AskUnresolvedReason;
}

function getLegacySuggestionText(lang: AppLang, id: AskSuggestionId): string | null {
  const match = getAskCopy(lang).suggestions.find((suggestion) => suggestion.id === id);
  return match?.text ?? null;
}

/** Single authoritative interpretation of a stored Ask question. */
export function resolveAskQuestion(
  question: FtueAskQuestion,
  lang: AppLang
): ResolvedAskQuestion {
  if (question.source === 'typed') {
    const typedText = question.text?.trim() ?? '';
    return {
      source: 'typed',
      displayText: typedText,
      typedText,
      executionUnresolvedReason: typedText
        ? 'typed_question_unresolved'
        : 'missing_question_text',
    };
  }

  const suggestionId = question.suggestion_id;
  if (!suggestionId) {
    return {
      source: 'suggestion',
      displayText: question.text?.trim() ?? '',
      executionUnresolvedReason: 'missing_suggestion_id',
    };
  }

  const guidedQuestion = findGuidedQuestion(suggestionId);
  if (guidedQuestion) {
    return {
      source: 'suggestion',
      displayText: resolveGuidedQuestionText(guidedQuestion, lang),
      guidedQuestion,
      executionMetadata: {
        actionType: guidedQuestion.actionType,
        categoryId: guidedQuestion.categoryId,
        needsTime: guidedQuestion.needsTime,
      },
    };
  }

  const legacyText = getLegacySuggestionText(lang, suggestionId);
  if (legacyText) {
    return {
      source: 'suggestion',
      displayText: legacyText,
      executionUnresolvedReason: 'legacy_suggestion_id',
    };
  }

  return {
    source: 'suggestion',
    displayText: question.text?.trim() ?? '',
    executionUnresolvedReason: 'unknown_suggestion_id',
  };
}

export function getSuggestionText(lang: AppLang, id: AskSuggestionId): string | null {
  const resolved = resolveAskQuestion(
    {
      submitted_at: 0,
      source: 'suggestion',
      suggestion_id: id,
    },
    lang
  );
  return resolved.displayText || null;
}

/** Display text for a stored question in the active locale. */
export function resolveStoredAskQuestionText(
  question: FtueAskQuestion,
  lang: AppLang
): string {
  return resolveAskQuestion(question, lang).displayText;
}

export function hasStoredAskQuestion(question: FtueAskQuestion | null): boolean {
  if (!question) return false;
  if (question.source === 'suggestion') return Boolean(question.suggestion_id);
  return Boolean(question.text?.trim());
}
