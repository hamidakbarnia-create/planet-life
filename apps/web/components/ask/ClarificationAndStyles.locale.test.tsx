import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AskDecisionView } from '@/components/ask/AskDecisionView';
import { evaluateClarification } from '@/lib/ask-decision/clarification';
import { detectIntent } from '@/lib/ask-decision/intent';
import { frameDecision } from '@/lib/ask-decision/framing';
import { runAskDecision } from '@/lib/ask-decision/run';
import { buildLocalAnalysis } from '@/lib/ask-decision/local-build';
import {
  formatLocalizedStyleList,
  localizeStyleToken,
  localizeStyleTokensInText,
} from '@/lib/intelligence/intelligence-copy';
import { askCopy } from '@/lib/ask-decision/ask-local-copy';
import { englishProviderResult } from '@/lib/ask-decision/english-provider-result.fixture';

const RAW_STYLE_TOKENS = [
  'analytical',
  'strategic',
  'collaborative',
  'exploratory',
  'execution-focused',
  'cautious',
  'adaptive',
  'intuitive',
  'decisive',
  'risk-aware',
];

describe('clarification localization', () => {
  afterEach(() => cleanup());

  it.each(['fa', 'ar', 'ru'] as const)(
    'evaluateClarification returns localized question for %s',
    (locale) => {
      const question = 'Should I accept it?';
      const intent = detectIntent(question);
      const frame = frameDecision(question, intent);
      expect(frame.requiresClarification).toBe(true);
      const clarification = evaluateClarification(frame, intent, locale);
      expect(clarification.required).toBe(true);
      expect(clarification.question).toBeTruthy();
      expect(clarification.question).not.toMatch(
        /What specifically|What are you considering|What action are you|What decision are you|What is the latest/i
      );
    }
  );

  it.each(['fa', 'ar', 'ru'] as const)(
    'runAskDecision pending clarification is localized for %s',
    async (locale) => {
      const out = await runAskDecision({
        question: 'Should I accept it?',
        profile: null,
        locale,
      });
      expect(out.pendingClarification).toBe(true);
      expect(out.clarification.question).not.toMatch(
        /What specifically|What are you considering accepting/i
      );
      expect(out.result.recommendation).not.toMatch(
        /One clarification will improve/i
      );
    }
  );

  it.each(['fa', 'ar', 'ru'] as const)(
    'AskDecisionView clarification chrome is localized for %s',
    (lang) => {
      const question =
        lang === 'fa'
          ? 'چه چیزی را برای پذیرش در نظر دارید (نقش، پیشنهاد، معامله یا دیگر)؟'
          : lang === 'ar'
            ? 'ما الذي تفكر في قبوله (دور، عرض، صفقة أو غير ذلك)؟'
            : 'Что вы рассматриваете к принятию (роль, оффер, сделка или иное)?';
      render(
        <AskDecisionView
          result={null}
          pendingClarification
          clarification={{
            required: true,
            question,
            canContinueWithAssumptions: true,
          }}
          lang={lang}
          onClarify={() => undefined}
          onContinueWithAssumptions={() => undefined}
        />
      );
      const text = screen.getByTestId('ask-clarification').textContent ?? '';
      for (const snippet of [
        'One clarification',
        'Your answer',
        'Continue analysis',
        'Continue with assumptions',
      ]) {
        expect(text, snippet).not.toContain(snippet);
      }
      expect(text).toContain(question);
    }
  );
});

describe('decision-style token localization', () => {
  afterEach(() => cleanup());

  it.each(['fa', 'ar', 'ru'] as const)(
    'localizeStyleToken maps canonical ids for %s',
    (locale) => {
      for (const token of RAW_STYLE_TOKENS) {
        expect(localizeStyleToken(token, locale).toLowerCase()).not.toBe(token);
      }
    }
  );

  it('uses expected Persian / Arabic / Russian labels', () => {
    expect(localizeStyleToken('analytical', 'fa')).toBe('تحلیلی');
    expect(localizeStyleToken('execution-focused', 'fa')).toBe('نتیجه‌محور');
    expect(localizeStyleToken('analytical', 'ar')).toBe('تحليلي');
    expect(localizeStyleToken('execution-focused', 'ar')).toMatch(/تنفيذ/);
    expect(localizeStyleToken('analytical', 'ru').toLowerCase()).toContain(
      'аналитическ'
    );
  });

  it.each(['fa', 'ar', 'ru'] as const)(
    'Personal Fit local-build body has no raw style tokens for %s',
    (locale) => {
      const q = 'Should I launch this quarter?';
      const intent = detectIntent(q);
      const frame = frameDecision(q, intent);
      const analysis = buildLocalAnalysis(
        frame,
        intent,
        'rec',
        true,
        ['analytical', 'execution-focused', 'cautious'],
        locale
      );
      const personal = analysis.find((c) => c.id === 'personal-fit')!;
      for (const token of RAW_STYLE_TOKENS) {
        expect(personal.body.toLowerCase()).not.toContain(token);
      }
    }
  );

  it('formatLocalizedStyleList joins with locale conjunction', () => {
    const fa = formatLocalizedStyleList(
      ['analytical', 'execution-focused'],
      'fa',
      (key) => askCopy('fa', key)
    );
    expect(fa).toContain('تحلیلی');
    expect(fa).toContain('نتیجه‌محور');
    expect(fa).toContain(' و ');
    expect(fa).not.toMatch(/analytical|execution-focused/i);
  });

  it('localizeStyleTokensInText replaces raw ids inside mixed prose', () => {
    const scrubbed = localizeStyleTokensInText(
      'signals (analytical, execution-focused) matter',
      'fa'
    );
    expect(scrubbed).toContain('تحلیلی');
    expect(scrubbed).toContain('نتیجه‌محور');
    expect(scrubbed).not.toMatch(/analytical|execution-focused/i);
  });

  it.each(['fa', 'ar', 'ru'] as const)(
    'AskDecisionView scrubs raw style tokens from mixed Personal Fit prose for %s',
    (lang) => {
      const mixedBody =
        lang === 'fa'
          ? 'سبک تصمیم analytical و execution-focused پیشنهاد می‌کند با احتیاط پیش بروید و گام بعدی را روشن کنید کامل.'
          : lang === 'ar'
            ? 'أسلوب القرار analytical و execution-focused يقترح المضي بحذر وتوضيح الخطوة التالية بالكامل.'
            : 'Стиль решений analytical и execution-focused предлагает двигаться осторожно и уточнить следующий шаг полностью.';

      const localizedProse =
        lang === 'fa'
          ? 'متن فارسی کافی برای عبور از دروازه زبان در کارت‌های دیگر این نتیجه تصمیم.'
          : lang === 'ar'
            ? 'نص عربي كافٍ لتجاوز بوابة اللغة في بطاقات النتيجة الأخرى لهذا القرار.'
            : 'Достаточный русский текст для языкового шлюза в остальных карточках этого результата.';

      const result = {
        ...englishProviderResult,
        recommendation:
          lang === 'fa'
            ? 'قبل از تعهد یک ورودی حیاتی درباره بازار جمع کنید و معیار موفقیت را روشن کنید.'
            : lang === 'ar'
              ? 'اجمع إدخالاً حرجاً واحداً عن السوق قبل الالتزام وحدد معيار النجاح بوضوح.'
              : 'Соберите один критический рыночный ввод перед обязательством и зафиксируйте критерий успеха.',
        executiveSummary: localizedProse,
        analysis: [
          {
            id: 'personal-fit' as const,
            title: 'Personal Fit',
            body: mixedBody,
          },
          {
            id: 'factors' as const,
            title: 'Main Factors',
            body: localizedProse,
          },
        ],
        actionPlan: {
          now: [
            {
              action: localizedProse,
              purpose: localizedProse,
              priority: 'high' as const,
              completionSignal: 'ok',
            },
          ],
          next7Days: [],
          next30Days: [],
        },
        scenarios: {
          bestCase: {
            outcome: localizedProse,
            likelihoodBand: 'medium' as const,
            keyConditions: [],
            earlySignals: [],
            mitigation: localizedProse,
          },
          mostLikely: {
            outcome: localizedProse,
            likelihoodBand: 'high' as const,
            keyConditions: [],
            earlySignals: [],
            mitigation: localizedProse,
          },
          downsideCase: {
            outcome: localizedProse,
            likelihoodBand: 'low' as const,
            keyConditions: [],
            earlySignals: [],
            mitigation: localizedProse,
          },
        },
        confidence: {
          ...englishProviderResult.confidence,
          explanation: localizedProse,
        },
        scores: {
          opportunity: { value: 55, rationale: localizedProse },
          risk: { value: 48, rationale: localizedProse },
          timing: { value: 50, rationale: localizedProse },
          readiness: { value: 45, rationale: localizedProse },
          confidence: { value: 65, rationale: localizedProse },
        },
      };

      const { container } = render(
        <AskDecisionView result={result} lang={lang} />
      );
      const text = container.textContent ?? '';
      for (const token of ['analytical', 'execution-focused']) {
        expect(text.toLowerCase(), token).not.toContain(token);
      }
    }
  );
});
