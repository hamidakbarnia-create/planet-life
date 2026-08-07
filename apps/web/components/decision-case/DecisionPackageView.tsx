import { OperationResultRouter } from '@/components/decision-frame';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import {
  DEMO_STUB_NOTICE,
  STUB_ENGINE_ID,
  assertPackageRenderContract,
} from '@/lib/decision-case';
import { packageToOperationResult } from '@/lib/decision-frame';

/**
 * Case-path package renderer.
 * Adapts DecisionEvaluationPackage → operation-specific first viewport.
 * Does not use the legacy AskDecisionView coaching hierarchy.
 */
export function DecisionPackageView({
  package: pkg,
}: {
  package: DecisionEvaluationPackage;
}) {
  assertPackageRenderContract(pkg);

  const stubPenalty =
    pkg.confidence.penalties.find((penalty) => penalty.code === 'STUB_ENGINE') ??
    pkg.confidence.penalties[0];
  const model = packageToOperationResult(pkg);

  return (
    <article
      className="space-y-5"
      data-testid="decision-package-view"
      aria-label="Demo decision evaluation package"
    >
      <aside
        className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 space-y-1"
        data-testid="demo-evaluation-notice"
        role="status"
      >
        <p className="fc text-sm text-amber-200">{DEMO_STUB_NOTICE}</p>
        <p className="fi text-xs text-amber-100/80" data-testid="demo-engine-id">
          engine_id = {pkg.engine_id || STUB_ENGINE_ID}
        </p>
        {stubPenalty ? (
          <p
            className="fi text-xs text-amber-100/70"
            data-testid="demo-stub-penalty"
          >
            {stubPenalty.code}: {stubPenalty.message}
          </p>
        ) : null}
      </aside>

      <OperationResultRouter model={model} />
    </article>
  );
}
