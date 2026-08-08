'use client';

/**
 * Local-only Result UX smoke page. Not linked from product nav.
 * Delete after browser verification if undesired in the branch.
 */

import { useMemo, useState } from 'react';
import { DecisionPackageView } from '@/components/decision-case/DecisionPackageView';
import { bindDemoStubPackage } from '@/lib/decision-case';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import type { AppLang } from '@/lib/app-settings';
import { getAskProductCopy } from '@/lib/ask-product';

function investorEvaluatePackage(): DecisionEvaluationPackage {
  const base = bindDemoStubPackage({
    caseId: '11111111-1111-4111-8111-111111111111',
    caseVersion: 1,
    intake: { target_date: '2026-08-18', role: 'Founder' },
  });
  return {
    ...base,
    decision_type_id: 'bus-investor-meeting',
    engine_id: 'decision-engine-investor-meeting-v1',
    timing: {
      ...base.timing,
      score: 100,
      candidates: base.timing.candidates.map((c, i) =>
        i === 0 ? { ...c, score: 100, date: '2026-08-18' } : c
      ),
    },
    confidence: { value: 68, precision_level: 'L3', penalties: [] },
    drivers: {
      items: [
        {
          id: 'visibility-sun-1',
          label: 'Visibility',
          contribution: 3.2,
          polarity: 'supportive',
          importance: 'high',
          score: 3.2,
          band: 'high',
          support: 'Presentation timing is supportive.',
          friction: '',
        },
        {
          id: 'pace-mars-2',
          label: 'Pace pressure',
          contribution: -1.4,
          polarity: 'cautionary',
          importance: 'medium',
          score: 1.4,
          band: 'low',
          support: '',
          friction: 'Pace may feel compressed.',
        },
        {
          id: 'structure-saturn-3',
          label: 'Structure load',
          contribution: -0.9,
          polarity: 'cautionary',
          importance: 'low',
          score: 0.9,
          band: 'low',
          support: '',
          friction: 'Extra structure helps.',
        },
        {
          id: 'clarity-mercury-4',
          label: 'Clarity friction',
          contribution: -1.1,
          polarity: 'cautionary',
          importance: 'medium',
          score: 1.1,
          band: 'low',
          support: '',
          friction: 'Clarify the ask early.',
        },
      ],
    },
    explainability: {
      ...base.explainability,
      limits: [
        'Meeting timing only — not fundraising probability, investor intent, or meeting success.',
      ],
    },
  };
}

function weddingComparePackage(): DecisionEvaluationPackage {
  return {
    ...investorEvaluatePackage(),
    decision_type_id: 'mar-wedding-date',
    family_id: 'timing_opt',
    mode: 'compare_dates',
    engine_id: 'decision-engine-wedding-date-v1',
    recommendation: {
      stance: 'no_unique_winner',
      conditions: [],
      summary: 'No uniquely preferred wedding date.',
    },
    timing: {
      material: true,
      band: 'high',
      score: 70,
      candidates: [
        {
          date: '2026-09-18',
          rank: 1,
          score: 70,
          band: 'high',
          option_id: 'late',
          label: 'Late weekend',
        },
        {
          date: '2026-09-10',
          rank: 1,
          score: 70,
          band: 'high',
          option_id: 'early',
          label: 'Early weekend',
        },
      ],
      notes: 'Tied ceremony timing.',
    },
    find: undefined,
    drivers: { items: [] },
    explainability: {
      why: 'Candidates are tied on ceremony-day timing.',
      why_not: 'No unique winner.',
      assumptions: [],
      limits: ['Ceremony timing comparison only — not marriage success.'],
    },
  };
}

function launchFindPackage(): DecisionEvaluationPackage {
  return {
    ...investorEvaluatePackage(),
    decision_type_id: 'bus-product-launch',
    family_id: 'timing_opt',
    mode: 'find_dates',
    engine_id: 'decision-engine-product-launch-v1',
    recommendation: {
      stance: 'proceed_with_conditions',
      conditions: [],
      summary: 'Comparable launch windows in range.',
    },
    timing: {
      material: true,
      band: 'high',
      score: 74,
      candidates: [],
      notes: 'FIND windows',
    },
    find: {
      range_start: '2026-09-01',
      range_end: '2026-09-30',
      timezone: 'UTC',
      unique_dominant: false,
      windows: [
        {
          window_id: 'w1',
          start_date: '2026-09-08',
          end_date: '2026-09-10',
          peak_dates: ['2026-09-09'],
          peak_score: 74,
          band: 'high',
          rank: 1,
        },
        {
          window_id: 'w2',
          start_date: '2026-09-20',
          end_date: '2026-09-22',
          peak_dates: ['2026-09-21'],
          peak_score: 71,
          band: 'high',
          rank: 2,
        },
      ],
    },
    drivers: { items: [] },
    explainability: {
      why: 'Comparable windows.',
      why_not: 'No unique dominant window.',
      assumptions: [],
      limits: [
        'Launch timing windows only — not market demand, revenue, or launch success.',
      ],
    },
  };
}

type Scenario = 'investor-fa' | 'wedding-compare' | 'launch-find';

export default function ResultSmokePage() {
  const [scenario, setScenario] = useState<Scenario>('investor-fa');
  const pkg = useMemo(() => {
    if (scenario === 'wedding-compare') return weddingComparePackage();
    if (scenario === 'launch-find') return launchFindPackage();
    return investorEvaluatePackage();
  }, [scenario]);
  const lang: AppLang =
    scenario === 'investor-fa' ? 'fa' : scenario === 'wedding-compare' ? 'fa' : 'fa';
  const copy = getAskProductCopy(lang);

  return (
    <main className="min-h-screen bg-[#070b14] px-4 py-8" dir={copy.dir}>
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['investor-fa', 'A Investor FA EVALUATE'],
              ['wedding-compare', 'B Wedding COMPARE'],
              ['launch-find', 'C Launch FIND'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className="rounded border border-white/20 px-3 py-1 text-sm text-white"
              data-testid={`smoke-${id}`}
              onClick={() => setScenario(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mio-glass mio-glass--primary !p-5 sm:!p-7">
          <DecisionPackageView package={pkg} dqStatus="pass" lang={lang} />
        </div>
      </div>
    </main>
  );
}
