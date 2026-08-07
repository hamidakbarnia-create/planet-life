'use client';

import Link from 'next/link';
import { EvaluateProductResult } from '@/components/decision-case/EvaluateProductResult';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import {
  DEMO_STUB_NOTICE,
  STUB_ENGINE_ID,
  assertPackageRenderContract,
} from '@/lib/decision-case';
import type { AppLang } from '@/lib/app-settings';
import {
  buildEvaluatePresentation,
  getAskProductCopy,
} from '@/lib/ask-product';
import { useAppLang } from '@/lib/use-app-lang';

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
}: {
  package: DecisionEvaluationPackage;
  dqStatus?: string;
  caseId?: string;
  topic?: string;
  /** Optional override for tests / parent-owned locale. */
  lang?: AppLang;
}) {
  assertPackageRenderContract(pkg);
  const [hookLang] = useAppLang();
  const lang = langProp ?? hookLang;
  const copy = getAskProductCopy(lang);

  const isStub = pkg.engine_id === STUB_ENGINE_ID;
  const isBlocked =
    dqStatus === 'blocked' ||
    pkg.recommendation.stance === 'insufficient_data' ||
    !pkg.timing.material;

  if (isBlocked && !isStub) {
    return (
      <article
        className="space-y-4"
        data-testid="decision-package-blocked"
        dir={copy.dir}
        aria-label={copy.blockedTitle}
      >
        <header className="space-y-2">
          <p className="fi text-xs uppercase tracking-[0.14em] text-amber-300/90">
            {copy.blockedEyebrow}
          </p>
          <h2 className="fc text-xl text-white">{copy.blockedTitle}</h2>
          <p className="fi text-sm text-white/65">{copy.blockedBody}</p>
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
            href={`/decision-cases/car-interview?caseId=${caseId}`}
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

  const model = buildEvaluatePresentation(pkg, lang, { topic });
  if (!model) {
    return (
      <p className="fi text-sm text-white/65" role="status">
        {copy.blockedBody}
      </p>
    );
  }

  return (
    <div data-testid="decision-package-view">
      <EvaluateProductResult lang={lang} model={model} />
    </div>
  );
}
