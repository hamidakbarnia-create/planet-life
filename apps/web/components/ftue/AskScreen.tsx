'use client';

import { useRouter } from 'next/navigation';
import { useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { QuestionTopics } from '@/components/ask/QuestionTopics';
import {
  AskHero,
  DecisionEntryCards,
  DecisionSearch,
  EnergyWidget,
  HowItWorksWidget,
  HumanAgencyBanner,
  PopularDecisionGrid,
  RecentDecisionList,
  TimingWidget,
} from '@/components/ask/home';
import askHomeStyles from '@/components/ask/home/ask-home.module.css';
import { useRequireAuth } from '@/hooks/use-require-auth';
import type { AppLang } from '@/lib/app-settings';
import {
  getAskHomeCopy,
  listPopularDecisions,
  listRecentDecisions,
  type AskHomeEnergyState,
  type AskHomeTimingState,
  type DecisionEntryModeId,
  type PopularDecision,
} from '@/lib/ask-home';
import { getAskQuestionRepository } from '@/lib/ask-question-repository';
import { loadBirthProfile } from '@/lib/birth-profile';
import { formatHourLabel } from '@/lib/calendar-scores';
import { todayYMD } from '@/lib/calendar-utils';
import { trackAskEvent } from '@/lib/ftue-analytics';
import type { AskCopy } from '@/lib/ftue-i18n';
import {
  getProfileRepository,
  isProfileRecordComplete,
} from '@/lib/profile';
import {
  findGuidedQuestion,
  getAllQuestionCategories,
  questionsByCategory,
  resolveGuidedQuestionText,
  type GuidedQuestionId,
  type QuestionCategoryId,
} from '@/lib/question-library';
import { loadTodayTiming } from '@/lib/today-timing';
import { useQueuedEffect } from '@/lib/use-queued-effect';
import { hasConfirmedCurrentLocation } from '@/lib/user-locations';

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
  const home = getAskHomeCopy(lang);
  const formId = useId();
  const inputId = `${formId}-question`;
  const searchRef = useRef<HTMLDivElement | null>(null);
  const initRef = useRef(false);
  const startedRef = useRef(false);

  const [typedQuestion, setTypedQuestion] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<QuestionCategoryId>(DEFAULT_CATEGORY_ID);
  const [selectedSuggestionId, setSelectedSuggestionId] =
    useState<GuidedQuestionId | null>(null);
  const [entryMode, setEntryMode] = useState<DecisionEntryModeId | null>(null);
  const [energy, setEnergy] = useState<AskHomeEnergyState>({
    score: null,
    loading: true,
    description: home.energyDescription,
    bestWindowLabel: home.energyLoading,
    detailsHref: '/home',
  });
  const [timing, setTiming] = useState<AskHomeTimingState>({
    loading: true,
    points: [],
    bestWindowLabel: home.timingLoading,
    emptyLabel: home.timingLoading,
  });

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

  const popularItems = useMemo(() => listPopularDecisions(lang), [lang]);

  const recentRows = useMemo(
    () => listRecentDecisions(lang, home.unknownDecisionType),
    [lang, home.unknownDecisionType]
  );

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

  useQueuedEffect(() => {
    if (!authed || !profileComplete) return;

    const profile = loadBirthProfile();
    const profileReady =
      !!profile &&
      !!profile.birth_date &&
      !!profile.birth_time &&
      !!profile.location &&
      hasConfirmedCurrentLocation(profile);

    // Always re-bind locale-sensitive chrome immediately on lang change
    // so Energy/Timing never keep a previous locale's strings (incl. hour labels).
    let reboundBestLabel: string | null = null;
    setTiming((prev) => {
      const bestPoint = prev.points.find((p) => p.isBest);
      const points = prev.points.map((p) => ({
        ...p,
        label: formatHourLabel(p.hour, lang),
      }));
      const nextBest =
        points.length === 0
          ? home.energyUnavailable
          : bestPoint
            ? formatHourLabel(bestPoint.hour, lang)
            : prev.bestWindowLabel;
      reboundBestLabel = nextBest;
      return {
        ...prev,
        points,
        emptyLabel: home.timingEmpty,
        bestWindowLabel: nextBest,
      };
    });
    setEnergy((prev) => ({
      ...prev,
      description: home.energyDescription,
      bestWindowLabel:
        prev.score == null
          ? home.energyUnavailable
          : reboundBestLabel ?? prev.bestWindowLabel,
      detailsHref: '/home',
    }));

    if (!profileReady || !profile) {
      setEnergy({
        score: null,
        loading: false,
        description: home.energyDescription,
        bestWindowLabel: home.energyUnavailable,
        detailsHref: '/home',
      });
      setTiming({
        loading: false,
        points: [],
        bestWindowLabel: home.energyUnavailable,
        emptyLabel: home.timingEmpty,
      });
      return;
    }

    let cancelled = false;
    setEnergy((prev) => ({
      ...prev,
      loading: true,
      description: home.energyDescription,
    }));
    setTiming((prev) => ({
      ...prev,
      loading: true,
      emptyLabel: home.timingLoading,
    }));

    loadTodayTiming(profile, todayYMD(), lang)
      .then((bundle) => {
        if (cancelled) return;
        const bestLabel = bundle.bestHour
          ? formatHourLabel(bundle.bestHour.hour, lang)
          : home.energyUnavailable;
        setTiming({
          loading: false,
          points: bundle.hourly.map((hour) => ({
            hour: hour.hour,
            label: formatHourLabel(hour.hour, lang),
            score: hour.score,
            isBest: bundle.bestHour?.hour === hour.hour,
          })),
          bestWindowLabel: bestLabel,
          emptyLabel: home.timingEmpty,
        });
        setEnergy({
          score: bundle.score,
          loading: false,
          description: home.energyDescription,
          bestWindowLabel: bestLabel,
          detailsHref: '/home',
        });
      })
      .catch(() => {
        if (cancelled) return;
        setTiming({
          loading: false,
          points: [],
          bestWindowLabel: home.energyUnavailable,
          emptyLabel: home.timingEmpty,
        });
        setEnergy({
          score: null,
          loading: false,
          description: home.energyDescription,
          bestWindowLabel: home.energyUnavailable,
          detailsHref: '/home',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    authed,
    profileComplete,
    lang,
    home.energyDescription,
    home.energyUnavailable,
    home.energyLoading,
    home.timingEmpty,
    home.timingLoading,
  ]);

  const handleChange = (value: string) => {
    if (value.length > MAX_CHARS) {
      trackAskEvent('ftue.ask.validation_failed', { reason: 'max_length' });
      return;
    }
    markStarted();
    setSelectedSuggestionId(null);
    setTypedQuestion(value);
  };

  const handleGuidedQuestion = (questionId: GuidedQuestionId) => {
    const guidedQuestion = findGuidedQuestion(questionId);
    if (!guidedQuestion) return;
    markStarted();
    trackAskEvent('ftue.ask.question_selected', { suggestion_id: questionId });
    // PR-1/PR-2: car-interview enters Decision Case intake (backend Case API).
    if (questionId === 'job-interview') {
      router.push('/decision-cases/car-interview');
      return;
    }
    setSelectedSuggestionId(questionId);
  };

  const focusSearch = () => {
    searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.requestAnimationFrame(() => {
      document.getElementById(inputId)?.focus();
    });
  };

  const handleEntrySelect = (modeId: DecisionEntryModeId) => {
    setEntryMode(modeId);
    if (modeId === 'ask-anything') {
      focusSearch();
    }
  };

  const handlePopularSelect = (item: PopularDecision) => {
    markStarted();
    // PR-1/PR-2: Interview popular card enters Decision Case API flow.
    if (
      item.decisionTypeId === 'car-interview' ||
      item.guidedQuestionId === 'job-interview'
    ) {
      trackAskEvent('ftue.ask.question_selected', {
        suggestion_id: item.decisionTypeId ?? item.guidedQuestionId,
      });
      router.push('/decision-cases/car-interview');
      return;
    }
    if (item.guidedQuestionId) {
      handleGuidedQuestion(item.guidedQuestionId);
      setEntryMode('help-me-decide');
      return;
    }
    setSelectedSuggestionId(null);
    setTypedQuestion(item.label);
    setEntryMode('ask-anything');
    focusSearch();
  };

  const handleSubmit = (event: FormEvent) => {
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
    // New ASK path: Decision Frame first (operation/time). Legacy /result preserved.
    router.push('/ask/frame');
  };

  if (!authed || !profileComplete) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center" aria-busy="true" />
    );
  }

  return (
    <div
      className={askHomeStyles.workspace}
      data-ftue-screen="ask"
      data-lang={lang}
      data-ask-home="v2"
    >
      <div className={askHomeStyles.layout}>
        <div className={askHomeStyles.main}>
          <div ref={searchRef}>
            <AskHero title={home.heroTitle} subtitle={home.heroSubtitle}>
              <DecisionSearch
                id={inputId}
                value={question}
                placeholder={home.searchPlaceholder}
                ariaLabel={home.searchAriaLabel}
                submitAria={home.searchSubmitAria}
                counterLabel={home.charCounter(question.length, MAX_CHARS)}
                disabled={!canSubmit}
                onChange={handleChange}
                onSubmit={handleSubmit}
              />
            </AskHero>
          </div>

          <div>
            <DecisionEntryCards
              title={home.entryTitle}
              modes={home.entryModes}
              activeMode={entryMode}
              onSelect={handleEntrySelect}
            />

            {entryMode === 'help-me-decide' ? (
              <div
                className={askHomeStyles.guidedPanel}
                data-testid="ask-guided-panel"
              >
                <p className={`fi ${askHomeStyles.sectionTitle}`}>
                  {home.guidedTopicsLabel}
                </p>
                <QuestionTopics
                  categories={QUESTION_CATEGORIES}
                  selectedCategoryId={selectedCategoryId}
                  onSelect={setSelectedCategoryId}
                  lang={lang}
                  label={copy.suggestionsLabel}
                />
                <ul className={askHomeStyles.guidedChips}>
                  {categoryQuestions.map((guidedQuestion) => {
                    const label = resolveGuidedQuestionText(guidedQuestion, lang);
                    const active = selectedSuggestionId === guidedQuestion.id;
                    return (
                      <li key={guidedQuestion.id}>
                        <button
                          type="button"
                          className={`fi ${askHomeStyles.guidedChip} ${
                            active ? askHomeStyles.guidedChipActive : ''
                          }`.trim()}
                          onClick={() => handleGuidedQuestion(guidedQuestion.id)}
                        >
                          {label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Demoted below entry controls — must not compete with hero. */}
          <PopularDecisionGrid
            title={home.popularTitle}
            items={popularItems}
            seeAllLabel={home.seeAllDecisions}
            onSeeAll={() => handleEntrySelect('help-me-decide')}
            onSelect={handlePopularSelect}
          />

          <RecentDecisionList
            title={home.recentTitle}
            emptyLabel={home.recentEmpty}
            columns={home.recentColumns}
            rows={recentRows}
          />

          <HumanAgencyBanner line1={home.agencyLine1} line2={home.agencyLine2} />

          {/* Secondary discovery — never competes with primary ask. */}
          <div
            className={askHomeStyles.secondaryRail}
            data-testid="ask-secondary-widgets"
          >
            <HowItWorksWidget title={home.howTitle} steps={home.howSteps} />
            <EnergyWidget
              title={home.energyTitle}
              description={home.energyDescription}
              bestWindowPrefix={home.energyBestWindow}
              seeDetailsLabel={home.energySeeDetails}
              state={energy}
            />
            <TimingWidget
              title={home.timingTitle}
              bestWindowPrefix={home.timingBestWindow}
              state={timing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
