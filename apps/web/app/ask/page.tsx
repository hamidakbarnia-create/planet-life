'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { HOME_LANGS } from '@/lib/home-i18n';
import type { AppLang } from '@/lib/app-settings';
import { chartPreferenceFields } from '@/lib/app-settings';
import { AnalysisResultBreakdown } from '@/components/AnalysisResultBreakdown';
import { parseAnalyzeResponse, type ScoreBreakdown } from '@/lib/score-breakdown';
import { loadBirthProfile } from '@/lib/birth-profile';
import type { BirthProfile } from '@/lib/birth-profile';
import { API_BASE } from '@/lib/calendar-scores';
import {
  ActionLocationPicker,
  canScoreWithLocation,
} from '@/components/ActionLocationPicker';
import {
  buildScoringLocationPayload,
  formatCalculatedFor,
  requiresTargetLocation,
  type LocationRole,
  type UserLocation,
} from '@/lib/user-locations';
import {
  ORACLE_MODULES,
  buildOracleAnswer,
  findModule,
  findQuestion,
  questionsByModule,
  type OracleModuleId,
  type OracleQuestion,
} from '@/lib/oracle-questions';
import { todayYMD } from '@/lib/calendar-utils';

// Sprint 1 of the Oracle (column A of the Planet Life vision).
// User picks a module → a concrete question → date (+ optional time).
// We hit the existing /api/business/analyze endpoint with the question's
// action_type and turn the executive score into a templated answer in
// the user's language. Q&A history is persisted in localStorage so the
// user can see their last 20 questions across sessions.

const ORACLE_LANGS: Record<
  AppLang,
  {
    title: string;
    subtitle: string;
    pickModule: string;
    pickQuestion: string;
    pickDate: string;
    optionalTime: string;
    askButton: string;
    asking: string;
    askAgain: string;
    back: string;
    noProfile: string;
    goProfile: string;
    noCurrentLocation: string;
    calculatedFor: string;
    history: string;
    historyEmpty: string;
    clearHistory: string;
    todayLabel: string;
    advisor: string;
    advisorBody: string;
  }
> = {
  en: {
    title: 'Ask a question',
    subtitle: 'Ask one question. Get one scored answer.',
    pickModule: 'Pick the area you want to ask about',
    pickQuestion: 'Pick your question',
    pickDate: 'When?',
    optionalTime: 'Time (optional)',
    askButton: 'Read the sky',
    asking: 'Reading the sky…',
    askAgain: 'Ask another',
    back: 'Back',
    noProfile:
      'Save your birth date, time and city in Profile first — the answer is built from your natal chart.',
    goProfile: 'Go to Profile',
    noCurrentLocation:
      'Add your current living city in Profile, or search where this action happens.',
    calculatedFor: 'Calculated for',
    history: 'Recent questions',
    historyEmpty: 'No questions yet. Try one above.',
    clearHistory: 'Clear',
    todayLabel: 'Today',
    advisor: 'Want a deeper reading?',
    advisorBody:
      'A 30-minute private session with Julia covers the full context behind this score.',
  },
  fa: {
    title: 'طرح سوال',
    subtitle: 'یک سوال بپرس. یک جواب نمره‌دار بگیر.',
    pickModule: 'حوزه‌ای که می‌خوای بپرسی رو انتخاب کن',
    pickQuestion: 'سوالت رو انتخاب کن',
    pickDate: 'چه روزی؟',
    optionalTime: 'ساعت (اختیاری)',
    askButton: 'آسمان را بخوان',
    asking: 'در حال خواندن آسمان…',
    askAgain: 'یک سوال دیگه',
    back: 'بازگشت',
    noProfile:
      'ابتدا تاریخ، ساعت و شهر تولدت رو در پروفایل ذخیره کن — پاسخ بر اساس چارت تولدت ساخته می‌شود.',
    goProfile: 'برو به پروفایل',
    noCurrentLocation:
      'شهر محل زندگی فعلی را در پروفایل اضافه کن، یا محل انجام این کار را جستجو کن.',
    calculatedFor: 'محاسبه‌شده برای',
    history: 'سوال‌های اخیر',
    historyEmpty: 'هنوز سوالی نپرسیدی. بالا یکی رو امتحان کن.',
    clearHistory: 'پاک کن',
    todayLabel: 'امروز',
    advisor: 'خوانش عمیق‌تر می‌خوای؟',
    advisorBody:
      'جلسه ۳۰ دقیقه‌ای خصوصی با جولیا، تمام زمینه پشت این امتیاز را پوشش می‌دهد.',
  },
  ru: {
    title: 'Задать вопрос',
    subtitle: 'Один вопрос. Один точный ответ.',
    pickModule: 'Выберите область вопроса',
    pickQuestion: 'Выберите вопрос',
    pickDate: 'Когда?',
    optionalTime: 'Время (необязательно)',
    askButton: 'Прочитать небо',
    asking: 'Читаем небо…',
    askAgain: 'Спросить ещё',
    back: 'Назад',
    noProfile:
      'Сначала сохраните дату, время и город рождения в Профиле — ответ строится по вашей натальной карте.',
    goProfile: 'В профиль',
    noCurrentLocation:
      'Добавьте текущий город в Профиле или найдите город, где произойдёт действие.',
    calculatedFor: 'Расчёт для',
    history: 'Недавние вопросы',
    historyEmpty: 'Пока вопросов нет. Попробуйте сверху.',
    clearHistory: 'Очистить',
    todayLabel: 'Сегодня',
    advisor: 'Хотите глубокий разбор?',
    advisorBody:
      '30-минутная частная сессия с Юлией раскроет весь контекст этой оценки.',
  },
  ar: {
    title: 'اطرح سؤالك',
    subtitle: 'سؤال واحد. إجابة واحدة بدرجة.',
    pickModule: 'اختر المجال الذي تريد السؤال عنه',
    pickQuestion: 'اختر سؤالك',
    pickDate: 'متى؟',
    optionalTime: 'الوقت (اختياري)',
    askButton: 'اقرأ السماء',
    asking: 'نقرأ السماء…',
    askAgain: 'اسأل مرة أخرى',
    back: 'رجوع',
    noProfile:
      'احفظ تاريخ ووقت ومدينة ميلادك في الملف الشخصي أولاً — تُبنى الإجابة من خريطة ميلادك.',
    goProfile: 'الذهاب للملف',
    noCurrentLocation:
      'أضف مدينة إقامتك الحالية في الملف، أو ابحث عن مكان حدوث الإجراء.',
    calculatedFor: 'محسوب لـ',
    history: 'الأسئلة الأخيرة',
    historyEmpty: 'لا توجد أسئلة بعد. جرّب واحدًا أعلاه.',
    clearHistory: 'مسح',
    todayLabel: 'اليوم',
    advisor: 'تريد قراءة أعمق؟',
    advisorBody:
      'جلسة خاصة لمدة 30 دقيقة مع جوليا تغطي السياق الكامل خلف هذه الدرجة.',
  },
};

const HISTORY_KEY = 'planet-life-oracle-history';
const HISTORY_MAX = 20;

interface OracleHistoryEntry {
  id: string;
  ts: number;
  module: OracleModuleId;
  questionId: string;
  date: string;
  time: string | null;
  score: number | null;
  band: 'gold' | 'green' | 'yellow' | 'red' | 'unknown';
  locationContext?: {
    city: string;
    country?: string;
    role: LocationRole;
    latitude?: number;
    longitude?: number;
  };
  calculatedFor?: string;
  scoreBreakdown?: ScoreBreakdown | null;
}

function loadHistory(): OracleHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OracleHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: OracleHistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, HISTORY_MAX)));
}

const BAND_PALETTE: Record<
  'gold' | 'green' | 'yellow' | 'red' | 'unknown',
  { bg: string; border: string; text: string }
> = {
  gold: {
    bg: 'rgba(74,222,128,0.10)',
    border: 'rgba(74,222,128,0.45)',
    text: '#4ade80',
  },
  green: {
    bg: 'rgba(251,191,36,0.10)',
    border: 'rgba(251,191,36,0.45)',
    text: '#fbbf24',
  },
  yellow: {
    bg: 'rgba(251,146,60,0.10)',
    border: 'rgba(251,146,60,0.45)',
    text: '#fb923c',
  },
  red: {
    bg: 'rgba(248,113,113,0.10)',
    border: 'rgba(248,113,113,0.45)',
    text: '#f87171',
  },
  unknown: {
    bg: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.12)',
    text: 'rgba(255,255,255,0.6)',
  },
};

function loadStoredLang(): AppLang {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('planet-life-lang');
  return stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar'
    ? stored
    : 'en';
}

export default function OracleAskPage() {
  const [lang, setLangState] = useState<AppLang>(() => loadStoredLang());
  const [profile] = useState<BirthProfile | null>(() => loadBirthProfile());
  const [selectedModule, setSelectedModule] = useState<OracleModuleId | null>(
    null
  );
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null
  );
  const [date, setDate] = useState<string>(todayYMD());
  const [time, setTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [history, setHistory] = useState<OracleHistoryEntry[]>(() => loadHistory());
  const [questionLocation, setQuestionLocation] = useState<UserLocation | null>(null);
  const [locationRole, setLocationRole] = useState<LocationRole>('current');
  const [calculatedFor, setCalculatedFor] = useState<string | null>(null);

  const t = ORACLE_LANGS[lang];
  const homeNav = HOME_LANGS[lang].nav;
  const dir = HOME_LANGS[lang].dir;
  const hasProfile = !!profile;
  const selectedQuestion: OracleQuestion | undefined = selectedQuestionId
    ? findQuestion(selectedQuestionId)
    : undefined;
  const selectedModuleDef = selectedModule ? findModule(selectedModule) : undefined;

  const setLang = (l: AppLang) => {
    setLangState(l);
    localStorage.setItem('planet-life-lang', l);
  };

  useEffect(() => {
    if (!profile || !selectedQuestion) return;
    if (requiresTargetLocation(selectedModule ?? undefined)) {
      setQuestionLocation(null);
      setLocationRole('target');
      return;
    }
    if (profile.current_location?.confirmed && profile.current_location.city) {
      setQuestionLocation(profile.current_location);
      setLocationRole('current');
    } else {
      setQuestionLocation(null);
    }
  }, [profile, selectedQuestion, selectedModule, selectedQuestionId]);

  const reset = () => {
    setSelectedModule(null);
    setSelectedQuestionId(null);
    setDate(todayYMD());
    setTime('');
    setScore(null);
    setScoreBreakdown(null);
    setHasAnswered(false);
    setQuestionLocation(null);
    setCalculatedFor(null);
  };

  const handleAsk = async () => {
    if (!profile || !selectedQuestion) return;
    if (!canScoreWithLocation(profile, questionLocation)) return;
    const locFields = buildScoringLocationPayload(profile, questionLocation);
    if (!locFields) return;

    setLoading(true);
    setHasAnswered(false);
    setScore(null);
    setScoreBreakdown(null);
    setCalculatedFor(null);
    try {
      const res = await fetch(`${API_BASE}/api/business/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birth_date: profile.birth_date,
          birth_time: profile.birth_time,
          action_type: selectedQuestion.actionType,
          target_date: date,
          ...(time ? { target_time: time } : {}),
          ...locFields,
          ...chartPreferenceFields(),
        }),
      });
      const data = await res.json();
      const parsed = parseAnalyzeResponse(data);
      setScore(parsed.score);
      setScoreBreakdown(parsed.breakdown);
      const evalLabel =
        parsed.breakdown?.calculatedFor ??
        data?.location_context?.calculated_for ??
        data?.location_context?.evaluation_location ??
        locFields.evaluation_location;
      setCalculatedFor(evalLabel);
      const answer = buildOracleAnswer(
        selectedQuestion,
        parsed.score,
        date,
        time || undefined,
        lang
      );
      const historyOrdinal = history.length + 1;
      const activeLoc = questionLocation ?? profile.current_location!;
      const entry: OracleHistoryEntry = {
        id: `${selectedQuestion.id}-${date}-${time || 'day'}-${historyOrdinal}`,
        ts: historyOrdinal,
        module: selectedQuestion.module,
        questionId: selectedQuestion.id,
        date,
        time: time || null,
        score: parsed.score,
        band: answer.band,
        calculatedFor: evalLabel,
        scoreBreakdown: parsed.breakdown,
        locationContext: {
          city: activeLoc.city,
          country: activeLoc.country,
          role: locationRole,
          latitude: activeLoc.latitude,
          longitude: activeLoc.longitude,
        },
      };
      const next = [entry, ...history];
      setHistory(next);
      saveHistory(next);
    } catch {
      setScore(null);
      setScoreBreakdown(null);
    } finally {
      setLoading(false);
      setHasAnswered(true);
    }
  };

  const answer =
    selectedQuestion && hasAnswered
      ? buildOracleAnswer(selectedQuestion, score, date, time || undefined, lang)
      : null;

  return (
    <AppShell
      lang={lang}
      setLang={setLang}
      dir={dir}
      navLabels={homeNav}
      fontFamily={
        lang === 'fa' || lang === 'ar' ? 'Vazirmatn, sans-serif' : 'Inter, sans-serif'
      }
    >
      <div className="max-w-2xl mx-auto px-4 py-6">
        <header className="mb-6">
          <div
            className="fi text-[10px] tracking-[0.3em] uppercase mb-1"
            style={{ color: 'rgba(251,191,36,0.7)' }}
          >
            {t.title}
          </div>
          <h1 className="fc text-2xl tracking-wide" style={{ color: '#ffffff' }}>
            {t.subtitle}
          </h1>
        </header>

        {!hasProfile && (
          <div
            className="rounded-2xl p-4 mb-6 fi text-sm"
            style={{
              background: 'rgba(251,191,36,0.06)',
              border: '1px solid rgba(251,191,36,0.2)',
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            {t.noProfile}{' '}
            <Link href="/profile" style={{ color: '#fbbf24' }}>
              {t.goProfile}
            </Link>
          </div>
        )}

        {/* Step 1: pick a module */}
        {!selectedModule && (
          <section className="mb-6">
            <h2
              className="fi text-[11px] uppercase tracking-widest mb-3"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              {t.pickModule}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {ORACLE_MODULES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModule(m.id)}
                  className="text-start rounded-2xl p-4 transition-transform hover:scale-[1.02]"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${m.color}55`,
                  }}
                >
                  <div
                    className="fc text-2xl mb-2"
                    style={{ color: m.color }}
                  >
                    {m.icon}
                  </div>
                  <div
                    className="fc text-sm leading-tight mb-1"
                    style={{ color: '#ffffff' }}
                  >
                    {m.labels[lang]}
                  </div>
                  <div
                    className="fi text-[11px] leading-snug"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {m.description[lang]}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step 2: pick a question within the module */}
        {selectedModule && !hasAnswered && (
          <section className="mb-6">
            <button
              type="button"
              onClick={reset}
              className="fi text-xs px-3 py-1.5 mb-4 rounded-lg border border-white/10"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              ← {t.back}
            </button>
            <h2
              className="fi text-[11px] uppercase tracking-widest mb-3"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              <span style={{ color: selectedModuleDef?.color }}>
                {selectedModuleDef?.icon}{' '}
              </span>
              {selectedModuleDef?.labels[lang]} — {t.pickQuestion}
            </h2>
            <div className="space-y-2 mb-6">
              {questionsByModule(selectedModule).map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setSelectedQuestionId(q.id)}
                  className="w-full text-start rounded-xl p-3 transition-colors"
                  style={{
                    background:
                      selectedQuestionId === q.id
                        ? 'rgba(251,191,36,0.08)'
                        : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${
                      selectedQuestionId === q.id
                        ? 'rgba(251,191,36,0.4)'
                        : 'rgba(255,255,255,0.07)'
                    }`,
                  }}
                >
                  <span className="fi text-sm" style={{ color: '#ffffff' }}>
                    {q.labels[lang]}
                  </span>
                </button>
              ))}
            </div>

            {selectedQuestion && (
              <div
                className="rounded-2xl p-4 space-y-3"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div>
                  <label
                    className="fi text-[11px] uppercase tracking-widest mb-1.5 block"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    {t.pickDate}
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full fi text-sm px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white outline-none focus:border-amber-500/40"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                {selectedQuestion.needsTime && (
                  <div>
                    <label
                      className="fi text-[11px] uppercase tracking-widest mb-1.5 block"
                      style={{ color: 'rgba(255,255,255,0.45)' }}
                    >
                      {t.optionalTime}
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full fi text-sm px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white outline-none focus:border-amber-500/40"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                )}
                {profile && (
                  <ActionLocationPicker
                    profile={profile}
                    lang={lang}
                    value={questionLocation}
                    onChange={(loc, role) => {
                      setQuestionLocation(loc);
                      setLocationRole(role);
                    }}
                    requireTarget={requiresTargetLocation(selectedModule ?? undefined)}
                  />
                )}
                {!canScoreWithLocation(profile!, questionLocation) && (
                  <p
                    className="fi text-xs"
                    style={{ color: 'rgba(251,146,60,0.9)' }}
                  >
                    {t.noCurrentLocation}{' '}
                    <Link href="/profile" style={{ color: '#fbbf24' }}>
                      {t.goProfile}
                    </Link>
                  </p>
                )}
                <button
                  type="button"
                  disabled={
                    !hasProfile ||
                    loading ||
                    !canScoreWithLocation(profile!, questionLocation)
                  }
                  onClick={handleAsk}
                  className="w-full fc py-3 rounded-xl text-sm tracking-wide disabled:opacity-40"
                  style={{
                    background: 'linear-gradient(135deg,#d97706,#f59e0b)',
                    color: '#000',
                  }}
                >
                  {loading ? t.asking : t.askButton}
                </button>
              </div>
            )}
          </section>
        )}

        {/* Step 3: the answer */}
        {hasAnswered && answer && selectedQuestion && selectedModuleDef && (
          <section className="mb-6">
            <div
              className="rounded-2xl p-5 mb-4"
              style={{
                background: BAND_PALETTE[answer.band].bg,
                border: `1px solid ${BAND_PALETTE[answer.band].border}`,
              }}
            >
              <div
                className="fi text-[11px] uppercase tracking-widest mb-1"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                <span style={{ color: selectedModuleDef.color }}>
                  {selectedModuleDef.icon}{' '}
                </span>
                {selectedModuleDef.labels[lang]}
              </div>
              <div
                className="fc text-base mb-3"
                style={{ color: 'rgba(255,255,255,0.85)' }}
              >
                {selectedQuestion.labels[lang]}
              </div>
              <div
                className="fc text-2xl mb-3"
                style={{ color: BAND_PALETTE[answer.band].text }}
              >
                {answer.headline}
              </div>
              <p
                className="fi text-sm leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.8)' }}
              >
                {answer.body}
              </p>
              {calculatedFor && (
                <p
                  className="fi text-[11px] mt-3 pt-3 border-t border-white/10"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                >
                  {formatCalculatedFor(calculatedFor, lang)}
                </p>
              )}
            </div>

            <AnalysisResultBreakdown breakdown={scoreBreakdown} />

            <div
              className="rounded-2xl p-4 mb-4"
              style={{
                background: 'rgba(251,191,36,0.05)',
                border: '1px solid rgba(251,191,36,0.2)',
              }}
            >
              <div
                className="fc text-sm mb-1"
                style={{ color: '#fbbf24' }}
              >
                {t.advisor}
              </div>
              <p
                className="fi text-xs"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                {t.advisorBody}
              </p>
            </div>

            <button
              type="button"
              onClick={reset}
              className="w-full fi py-2.5 rounded-xl text-sm border border-white/15"
              style={{ color: 'rgba(255,255,255,0.75)' }}
            >
              {t.askAgain}
            </button>
          </section>
        )}

        {/* History */}
        <section
          className="rounded-2xl p-4"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2
              className="fi text-[11px] uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              {t.history}
            </h2>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setHistory([]);
                  saveHistory([]);
                }}
                className="fi text-[10px] uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                {t.clearHistory}
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p
              className="fi text-xs"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {t.historyEmpty}
            </p>
          ) : (
            <ul className="space-y-2">
              {history.slice(0, 8).map((h) => {
                const q = findQuestion(h.questionId);
                const m = findModule(h.module);
                const palette = BAND_PALETTE[h.band];
                return (
                  <li
                    key={h.id}
                    className="rounded-lg px-3 py-2"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                    <span
                      className="fc text-base shrink-0"
                      style={{ color: m?.color ?? '#fbbf24', width: 22 }}
                    >
                      {m?.icon ?? '·'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className="fi text-xs truncate"
                        style={{ color: 'rgba(255,255,255,0.85)' }}
                      >
                        {q?.labels[lang] ?? h.questionId}
                      </div>
                      <div
                        className="fi text-[10px]"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                      >
                        {h.date}
                        {h.time ? ` · ${h.time}` : ''}
                        {h.calculatedFor ? ` · ${h.calculatedFor}` : ''}
                      </div>
                    </div>
                    {h.score != null && (
                      <span
                        className="fc text-sm shrink-0"
                        style={{ color: palette.text }}
                      >
                        {h.score}
                      </span>
                    )}
                    </div>
                    {h.scoreBreakdown && (
                      <AnalysisResultBreakdown breakdown={h.scoreBreakdown} compact />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
