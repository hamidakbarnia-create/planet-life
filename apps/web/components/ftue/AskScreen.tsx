'use client';

import { useRouter } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import { getAskQuestionRepository } from '@/lib/ask-question-repository';
import { trackAskEvent } from '@/lib/ftue-analytics';
import type { AppLang } from '@/lib/app-settings';
import type { AskCopy } from '@/lib/ftue-i18n';
import {
  getProfileRepository,
  isProfileRecordComplete,
} from '@/lib/profile';
import { useQueuedEffect } from '@/lib/use-queued-effect';
import { useRequireAuth } from '@/hooks/use-require-auth';

const MAX_CHARS = 500;

function askSubmittedAt(): number {
  return Date.now();
}

export function AskScreen({ copy, lang }: { copy: AskCopy; lang: AppLang }) {
  const router = useRouter();
  const authed = useRequireAuth();
  const repo = getProfileRepository();
  const askRepo = getAskQuestionRepository();
  const c = copy;
  const suggestions = c.suggestions;
  const formId = useId();
  const inputId = `${formId}-question`;
  const counterId = `${formId}-counter`;

  const [question, setQuestion] = useState('');
  const initRef = useRef(false);
  const startedRef = useRef(false);

  const profileComplete = isProfileRecordComplete(repo.loadProfile());
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
    setQuestion(value);
  };

  const handleSuggestion = (id: string, text: string) => {
    markStarted();
    trackAskEvent('ftue.ask.question_selected', { suggestion_id: id });
    setQuestion(text);
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

    const matchedSuggestion = suggestions.find((s) => s.text === text);
    askRepo.saveQuestion({
      text,
      submitted_at: askSubmittedAt(),
      source: matchedSuggestion ? 'suggestion' : 'typed',
      suggestion_id: matchedSuggestion?.id,
    });
    trackAskEvent('ftue.ask.submitted', {
      source: matchedSuggestion ? 'suggestion' : 'typed',
      length: text.length,
    });
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6" data-ftue-screen="ask" data-lang={lang}>
      <header className="mb-6">
        <p className="fi text-xs uppercase tracking-widest text-amber-400/80 mb-2">{c.step}</p>
        <h1 className="fc text-2xl tracking-wide text-white mb-2">{c.title}</h1>
        <p className="fi text-sm text-white/60 leading-relaxed">{c.sub}</p>
      </header>

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
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestion(suggestion.id, suggestion.text)}
                className="ask-chip fi text-sm px-3.5 py-2 rounded-full border border-white/15 text-white/75 hover:text-white hover:border-amber-400/40 transition-colors"
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={!canSubmit}
          className="ask-submit w-full fc py-3.5 rounded-xl text-sm font-medium tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
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
