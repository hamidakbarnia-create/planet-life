'use client';

import { useRouter } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { getAskQuestionRepository } from '@/lib/ask-question-repository';
import type { AppLang } from '@/lib/app-settings';
import { trackAskEvent } from '@/lib/ftue-analytics';
import type { AskCopy } from '@/lib/ftue-i18n';
import {
  getProfileRepository,
  isProfileRecordComplete,
} from '@/lib/profile';
import { detectIntent } from '@/lib/ask-decision';
import {
  getDecisionUi,
  localizeIntent,
} from '@/lib/decision-ui-i18n';
import { getAskProfileContext } from '@/lib/intelligence-profile';
import {
  findGuidedQuestion,
  getAllQuestionCategories,
  questionsByCategory,
  resolveGuidedQuestionText,
  type GuidedQuestionId,
  type QuestionCategoryId,
} from '@/lib/question-library';
import { useQueuedEffect } from '@/lib/use-queued-effect';
import { QuestionTopics } from '@/components/ask/QuestionTopics';

const MAX_CHARS = 500;
const QUESTION_CATEGORIES = getAllQuestionCategories();
const DEFAULT_CATEGORY_ID = QUESTION_CATEGORIES[0]?.id ?? 'career-work';

function askSubmittedAt(): number {
  return Date.now();
}

export function AskScreen({ copy, lang }: { copy: AskCopy; lang: AppLang }) {
  const router = useRouter();
  const authed = useRequireAuth();
  const repo = getProfileRepository();
  const askRepo = getAskQuestionRepository();
  const c = copy;
  const formId = useId();
  const inputId = `${formId}-question`;
  const counterId = `${formId}-counter`;

  const [typedQuestion, setTypedQuestion] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<QuestionCategoryId>(DEFAULT_CATEGORY_ID);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<GuidedQuestionId | null>(null);
  const initRef = useRef(false);
  const startedRef = useRef(false);

  const categoryQuestions = questionsByCategory(selectedCategoryId);
  const profileComplete = isProfileRecordComplete(repo.loadProfile());
  const selectedGuidedQuestion = selectedSuggestionId
    ? findGuidedQuestion(selectedSuggestionId)
    : undefined;
  const question = selectedGuidedQuestion
    ? resolveGuidedQuestionText(selectedGuidedQuestion, lang)
    : typedQuestion;
  const trimmed = question.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= MAX_CHARS;

  const markStarted = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackAskEvent('ftue.ask.started');
  };

  useQueuedEffect(() => {
    if (!authed || initRef.current) return;

    if (!profileComplete) {
      router.replace('/profile?onboarding=1');
      return;
    }

    initRef.current = true;
    trackAskEvent('ftue.ask.view');
  }, [authed, profileComplete, router]);

  const handleChange = (value: string) => {
    if (value.length > MAX_CHARS) {
      trackAskEvent('ftue.ask.validation_failed', { reason: 'max_length' });
      return;
    }
    markStarted();
    setSelectedSuggestionId(null);
    setTypedQuestion(value);
  };

  const handleCategory = (categoryId: QuestionCategoryId) => {
    setSelectedCategoryId(categoryId);
  };

  const handleGuidedQuestion = (questionId: GuidedQuestionId) => {
    const guidedQuestion = findGuidedQuestion(questionId);
    if (!guidedQuestion) return;
    markStarted();
    trackAskEvent('ftue.ask.question_selected', { suggestion_id: questionId });
    // PR-1 walking skeleton: car-interview enters demo intake (not /result).
    if (questionId === 'job-interview') {
      router.push('/decision-cases/car-interview');
      return;
    }
    setSelectedSuggestionId(questionId);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = question.trim();
    if (!text) {
      trackAskEvent('ftue.ask.validation_failed', { reason: 'empty' });
      return;
    }
    if (text.length > MAX_CHARS) {
      trackAskEvent('ftue.ask.validation_failed', { reason: 'max_length' });
      return;
    }

    if (selectedSuggestionId && selectedGuidedQuestion) {
      askRepo.saveQuestion({
        submitted_at: askSubmittedAt(),
        source: 'suggestion',
        suggestion_id: selectedSuggestionId,
      });
      trackAskEvent('ftue.ask.submitted', {
        source: 'suggestion',
        length: text.length,
      });
    } else {
      askRepo.saveQuestion({
        submitted_at: askSubmittedAt(),
        source: 'typed',
        text,
      });
      trackAskEvent('ftue.ask.submitted', {
        source: 'typed',
        length: text.length,
      });
    }
    router.push('/result');
  };

  if (!authed || !profileComplete) {
    return (
      <div
        className="min-h-[50vh] flex items-center justify-center"
        aria-busy="true"
      />
    );
  }

  const charCount = question.length;
  const askIntel = getAskProfileContext();
  const decisionUi = getDecisionUi(lang);
  // Decision-style tags stay as standard English labels (Analytical · Cautious …);
  // only the section title follows locale. getAskProfileContext already Title-Cases IDs.
  const decisionStyleTags = askIntel?.decisionStyles ?? [];
  const liveIntent = trimmed ? detectIntent(trimmed).primaryIntent : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6" data-ftue-screen="ask" data-lang={lang}>
      <header className="mb-6">
        <p className="fi text-xs uppercase tracking-widest text-amber-400/80 mb-2">{c.step}</p>
        <h1 className="fc text-2xl tracking-wide text-white mb-2">{c.title}</h1>
        <p className="fi text-sm text-white/60 leading-relaxed">{c.sub}</p>
        <p className="fi text-xs text-white/45 mt-2">{decisionUi.askIntro}</p>
        {decisionStyleTags.length > 0 ? (
          <p
            className="fi text-xs text-[#93B4FF] mt-3"
            data-testid="ask-decision-style"
          >
            {decisionUi.decisionStyle}: {decisionStyleTags.join(' · ')}
          </p>
        ) : null}
        {liveIntent ? (
          <p
            className="fi text-xs text-white/55 mt-2"
            data-testid="ask-live-intent"
          >
            {decisionUi.detectedIntent}:{' '}
            <span className="text-[#93B4FF]">
              {localizeIntent(liveIntent, lang)}
            </span>
          </p>
        ) : null}
      </header>

      <div className="mb-4 flex flex-wrap gap-2" data-testid="ask-example-prompts">
        {decisionUi.examplePrompts.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              markStarted();
              setSelectedSuggestionId(null);
              setTypedQuestion(example);
            }}
            className="ask-chip fi text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-amber-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            {example}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div>
          <label htmlFor={inputId} className="fi text-sm text-white/80 mb-2 block">
            {c.inputLabel}
          </label>
          <textarea
            id={inputId}
            name="question"
            value={question}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={c.inputPlaceholder}
            rows={4}
            maxLength={MAX_CHARS}
            aria-describedby={counterId}
            className="ask-input w-full fi text-sm px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white outline-none resize-y min-h-[120px]"
          />
          <p
            id={counterId}
            aria-live="polite"
            className="fi text-xs text-white/45 mt-2 text-end"
          >
            {c.charCounter(charCount, MAX_CHARS)}
          </p>
        </div>

        <fieldset>
          <legend className="fi text-xs uppercase tracking-widest text-white/45 mb-3">
            {c.suggestionsLabel}
          </legend>
          <QuestionTopics
            categories={QUESTION_CATEGORIES}
            selectedCategoryId={selectedCategoryId}
            onSelect={handleCategory}
            lang={lang}
            label={c.suggestionsLabel}
          />
          <div className="flex flex-wrap gap-2 mt-3" role="tabpanel">
            {categoryQuestions.map((guidedQuestion) => (
              <button
                key={guidedQuestion.id}
                type="button"
                onClick={() => handleGuidedQuestion(guidedQuestion.id)}
                className="ask-chip fi text-sm px-3.5 py-2 rounded-full border border-white/15 text-white/75 hover:text-white hover:border-amber-400/40 transition-colors"
              >
                {resolveGuidedQuestionText(guidedQuestion, lang)}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={!canSubmit}
          aria-busy={false}
          className="ask-submit w-full fc py-3.5 rounded-xl text-sm font-medium tracking-wide disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#0a0a0a',
          }}
        >
          {c.submit}
        </button>
      </form>

      <style>{`
        .ask-input:focus-visible{outline:2px solid rgba(251,191,36,0.7);outline-offset:2px;border-color:rgba(251,191,36,0.4)}
        .ask-chip:focus-visible{outline:2px solid rgba(251,191,36,0.7);outline-offset:2px}
        .ask-submit:focus-visible:not(:disabled){outline:2px solid rgba(251,191,36,0.7);outline-offset:2px}
      `}</style>
    </div>
  );
}
