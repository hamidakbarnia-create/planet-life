import type { AppLang } from './app-settings';
import type { FtueAskQuestion } from './ask-question-repository';
import {
  resolveTypedDecisionType,
  type TypedDecisionResolution,
} from './decision-request/typed-resolver';
import { getAskCopy, type AskSuggestionId } from './ftue-i18n';
import {
  findGuidedQuestion,
  resolveGuidedQuestionText,
  type GuidedQuestion,
  type QuestionCategoryId,
} from './question-library';

export type { TypedDecisionResolution };

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
  | 'typed_question_unresolved'
  | 'typed_decision_ambiguous'
  | 'typed_decision_unsupported';

export interface ResolvedAskQuestion {
  source: 'typed' | 'suggestion';
  displayText: string;
  guidedQuestion?: GuidedQuestion;
  typedText?: string;
  /** Explicit registry Decision Type when provided by a structured entry. */
  decisionTypeId?: string;
  executionMetadata?: AskExecutionMetadata;
  executionUnresolvedReason?: AskUnresolvedReason;
  /** Structured typed free-text resolution (absent when explicit DT wins). */
  typedResolution?: TypedDecisionResolution;
}

function getLegacySuggestionText(lang: AppLang, id: AskSuggestionId): string | null {
  const match = getAskCopy(lang).suggestions.find((suggestion) => suggestion.id === id);
  return match?.text ?? null;
}

function applyTypedResolution(
  typedText: string,
  lang: AppLang
): Pick<
  ResolvedAskQuestion,
  'decisionTypeId' | 'executionUnresolvedReason' | 'typedResolution'
> {
  const typedResolution = resolveTypedDecisionType(typedText, lang);
  if (typedResolution.status === 'exact') {
    return {
      decisionTypeId: typedResolution.decisionTypeId,
      typedResolution,
    };
  }
  if (typedResolution.status === 'ambiguous') {
    return {
      executionUnresolvedReason: 'typed_decision_ambiguous',
      typedResolution,
    };
  }
  return {
    executionUnresolvedReason: 'typed_decision_unsupported',
    typedResolution,
  };
}

/** Single authoritative interpretation of a stored Ask question. */
export function resolveAskQuestion(
  question: FtueAskQuestion,
  lang: AppLang
): ResolvedAskQuestion {
  if (question.source === 'typed') {
    const typedText = question.text?.trim() ?? '';
    const explicitDecisionTypeId = question.decision_type_id?.trim() || undefined;

    if (!typedText) {
      return {
        source: 'typed',
        displayText: typedText,
        typedText,
        executionUnresolvedReason: 'missing_question_text',
      };
    }

    // Explicit registry binding always wins over typed semantic resolution.
    if (explicitDecisionTypeId) {
      return {
        source: 'typed',
        displayText: typedText,
        typedText,
        decisionTypeId: explicitDecisionTypeId,
      };
    }

    const resolved = applyTypedResolution(typedText, lang);
    return {
      source: 'typed',
      displayText: typedText,
      typedText,
      ...resolved,
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
