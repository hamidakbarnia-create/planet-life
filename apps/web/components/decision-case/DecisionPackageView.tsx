'use client';

import Link from 'next/link';
import { EvaluateProductResult } from '@/components/decision-case/EvaluateProductResult';
import { CompareResultView } from '@/components/decision-frame/CompareResultView';
import { FindResultView } from '@/components/decision-frame/FindResultView';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import {
  DEMO_STUB_NOTICE,
  STUB_ENGINE_ID,
  assertPackageRenderContract,
} from '@/lib/decision-case';
import type { AppLang } from '@/lib/app-settings';
import {
  buildEvaluatePresentation,
  buildOfferNegotiationResultView,
  getAskProductCopy,
  type OfferNegotiationContext,
} from '@/lib/ask-product';
import { OfferNegotiationResultPanel } from '@/components/decision-case/OfferNegotiationResultPanel';
import {
  packageToCompareView,
  packageToFindView,
} from '@/lib/decision-frame/package-adapter';
import { useAppLang } from '@/lib/use-app-lang';
import { PackageSemanticPreview } from '@/components/decision-intelligence/PackageSemanticPreview';
import { DayIntelligencePanel } from '@/components/decision-intelligence/DayIntelligencePanel';
import { isDecisionSemanticsPreviewEnabled } from '@/lib/decision-intelligence/preview-flag';
import {
  buildDayIntelligenceView,
  evaluatePosture,
  explanationFromEvaluatePackage,
} from '@/lib/decision-intelligence/day-intelligence-view';
import type { SemanticPreviewLocale } from '@/lib/decision-intelligence/types';

/**
 * Case-path package renderer (consumer product surface).
 * No engine_id / dq_status chrome. No Unknown filler grids.
 */
export function DecisionPackageView({
  package: pkg,
  dqStatus,
  caseId,
  topic,
  lang: langProp,
  intake,
}: {
  package: DecisionEvaluationPackage;
  dqStatus?: string;
  caseId?: string;
  topic?: string;
  /** Optional override for tests / parent-owned locale. */
  lang?: AppLang;
  /**
   * Optional Case intake. Used only to scope offer-negotiation wording; it
   * never affects any score.
   */
  intake?: OfferNegotiationContext;
}) {
  assertPackageRenderContract(pkg);
  const [hookLang] = useAppLang();
  const lang = langProp ?? hookLang;
  const copy = getAskProductCopy(lang);

  const isStub = pkg.engine_id === STUB_ENGINE_ID;
  // FIND may set timing.material=false when no strong window exists — that is a
  // real FIND outcome, not a natal evidence block.
  const isBlocked =
    dqStatus === 'blocked' ||
    pkg.recommendation.stance === 'insufficient_data' ||
    (pkg.mode !== 'find_dates' && !pkg.timing.material);

  const preview = isDecisionSemanticsPreviewEnabled() ? (
    <PackageSemanticPreview package={pkg} lang={lang} />
  ) : null;
  // car-offer-negotiation gets a negotiation-specific reading instead of the
  // generic day-intelligence panel, so the same evidence is not narrated twice.
  const offerNegotiationView = buildOfferNegotiationResultView(
    pkg,
    lang,
    intake
  );
  const evaluateView =
    pkg.mode === 'evaluate_date' && !offerNegotiationView
      ? buildDayIntelligenceView({
          explanation: explanationFromEvaluatePackage(pkg),
          locale: lang as SemanticPreviewLocale,
          score: pkg.timing.score,
          stance: pkg.recommendation.stance,
          posture: evaluatePosture(pkg),
        })
      : null;

  if (pkg.mode === 'find_dates' && pkg.find && !isBlocked && !isStub) {
    return (
      <div data-testid="decision-package-view" data-mode="find_dates">
        <FindResultView lang={lang} model={packageToFindView(pkg, lang)} />
        {preview}
      </div>
    );
  }

  if (isBlocked && !isStub) {
    const blockedTitle =
      pkg.mode === 'compare_dates'
        ? copy.blockedTitleCompare
        : pkg.mode === 'find_dates'
          ? copy.blockedTitleFind
          : copy.blockedTitle;
    const blockedBody =
      pkg.mode === 'compare_dates'
        ? copy.blockedBodyCompare
        : pkg.mode === 'find_dates'
          ? copy.blockedBodyFind
          : copy.blockedBody;

    return (
      <article
        className="space-y-4"
        data-testid="decision-package-blocked"
        dir={copy.dir}
        aria-label={blockedTitle}
      >
        <header className="space-y-2">
          <p className="fi text-xs uppercase tracking-[0.14em] text-amber-300/90">
            {copy.blockedEyebrow}
          </p>
          <h2 className="fc text-xl text-white">{blockedTitle}</h2>
          <p className="fi text-sm text-white/65">{blockedBody}</p>
        </header>
        <section aria-label={copy.blockedRequired}>
          <p className="fi text-xs uppercase tracking-[0.12em] text-white/45">
            {copy.blockedRequired}
          </p>
          <ul className="fi text-sm text-white/80 list-disc ps-5 space-y-1 mt-2">
            <li>{copy.blockedNatalItem}</li>
          </ul>
        </section>
        <p className="fi text-xs text-white/50">{copy.blockedNoVerdict}</p>
        {caseId ? (
          <Link
            href={`/decision-cases/${caseId}/intake`}
            className="fi text-sm text-[#93B4FF] hover:text-white inline-block"
            data-testid="blocked-add-evidence-link"
          >
            {copy.blockedAddEvidence}
          </Link>
        ) : null}
      </article>
    );
  }

  if (isStub) {
    return (
      <aside
        className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 space-y-1"
        data-testid="demo-evaluation-notice"
        role="status"
      >
        <p className="fc text-sm text-amber-200">{DEMO_STUB_NOTICE}</p>
      </aside>
    );
  }

  if (pkg.mode === 'compare_dates') {
    return (
      <div data-testid="decision-package-view" data-mode="compare_dates">
        <CompareResultView lang={lang} model={packageToCompareView(pkg, lang)} />
        {preview}
      </div>
    );
  }

  const model = buildEvaluatePresentation(pkg, lang, { topic });
  if (!model) {
    return (
      <p className="fi text-sm text-white/65" role="status">
        {copy.blockedBody}
      </p>
    );
  }

  return (
    <div data-testid="decision-package-view" data-mode="evaluate_date">
      <EvaluateProductResult
        lang={lang}
        model={model}
        narrative={offerNegotiationView ? 'chrome' : 'full'}
        verdictOverride={offerNegotiationView?.headline ?? null}
        insight={
          offerNegotiationView ? (
            <div data-testid="evaluate-offer-negotiation">
              <OfferNegotiationResultPanel
                lang={lang}
                view={offerNegotiationView}
              />
            </div>
          ) : null
        }
        omitLimitsScope={Boolean(offerNegotiationView)}
        isolateDates={Boolean(offerNegotiationView)}
        compact={Boolean(offerNegotiationView)}
        omitAgency={Boolean(offerNegotiationView)}
      />
      {evaluateView ? (
        <div className="mt-4" data-testid="evaluate-day-intelligence">
          <DayIntelligencePanel view={evaluateView} />
        </div>
      ) : null}
      {preview}
    </div>
  );
}
