import Link from 'next/link';
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
 * Stub/demo banner only for historical stub engine packages.
 * Blocked / insufficient_data evaluations do NOT render as normal recommendations.
 */
export function DecisionPackageView({
  package: pkg,
  dqStatus,
  caseId,
}: {
  package: DecisionEvaluationPackage;
  dqStatus?: string;
  caseId?: string;
}) {
  assertPackageRenderContract(pkg);

  const isStub = pkg.engine_id === STUB_ENGINE_ID;
  const isBlocked =
    dqStatus === 'blocked' ||
    pkg.recommendation.stance === 'insufficient_data' ||
    !pkg.timing.material;

  if (isBlocked && !isStub) {
    const missing = [
      ...pkg.recommendation.conditions,
      ...pkg.improve_accuracy.items,
      ...pkg.confidence.penalties
        .filter((p) => p.code === 'MISSING_NATAL_EVIDENCE')
        .map((p) => p.message),
    ].filter(Boolean);

    return (
      <article
        className="space-y-4"
        data-testid="decision-package-blocked"
        aria-label="Evaluation blocked — more information needed"
      >
        <p className="fi text-xs text-white/45" data-testid="runtime-engine-id">
          engine_id = {pkg.engine_id}
          {dqStatus ? ` · dq_status = ${dqStatus}` : ''}
        </p>
        <header className="space-y-2">
          <p className="fi text-xs uppercase tracking-[0.14em] text-amber-300/90">
            Evaluation blocked
          </p>
          <h2 className="fc text-xl text-white">
            More information is needed before METIORO can evaluate this date.
          </h2>
          <p className="fi text-sm text-white/65">
            {pkg.recommendation.summary}
          </p>
        </header>
        {missing.length > 0 ? (
          <section aria-label="Missing evidence">
            <p className="fi text-xs uppercase tracking-[0.12em] text-white/45">
              Required to continue
            </p>
            <ul className="fi text-sm text-white/80 list-disc pl-5 space-y-1 mt-2">
              {missing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}
        <p className="fi text-xs text-white/50">
          No timing recommendation was produced. This is not a Favorable / Mixed
          / Unfavorable verdict.
        </p>
        {caseId ? (
          <Link
            href={`/decision-cases/car-interview?caseId=${caseId}`}
            className="fi text-sm text-[#93B4FF] hover:text-white inline-block"
            data-testid="blocked-add-evidence-link"
          >
            Add birth evidence and re-evaluate
          </Link>
        ) : null}
      </article>
    );
  }

  const stubPenalty =
    pkg.confidence.penalties.find((penalty) => penalty.code === 'STUB_ENGINE') ??
    (isStub ? pkg.confidence.penalties[0] : undefined);
  const model = packageToOperationResult(pkg);

  return (
    <article
      className="space-y-5"
      data-testid="decision-package-view"
      aria-label={
        isStub
          ? 'Demo decision evaluation package'
          : 'Decision evaluation package'
      }
    >
      {isStub ? (
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
      ) : (
        <p className="fi text-xs text-white/45" data-testid="runtime-engine-id">
          engine_id = {pkg.engine_id}
          {dqStatus ? ` · dq_status = ${dqStatus}` : ''}
        </p>
      )}

      <OperationResultRouter model={model} />
    </article>
  );
}
