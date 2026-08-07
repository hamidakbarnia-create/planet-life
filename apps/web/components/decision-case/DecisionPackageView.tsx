import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import {
  DEMO_STUB_NOTICE,
  STUB_ENGINE_ID,
  assertPackageRenderContract,
} from '@/lib/decision-case';

export function DecisionPackageView({
  package: pkg,
}: {
  package: DecisionEvaluationPackage;
}) {
  assertPackageRenderContract(pkg);

  const stubPenalty =
    pkg.confidence.penalties.find((penalty) => penalty.code === 'STUB_ENGINE') ??
    pkg.confidence.penalties[0];

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

      <header className="space-y-1">
        <p className="fi text-xs uppercase tracking-[0.16em] text-amber-400/80">
          DecisionEvaluationPackage v{pkg.schema_version} · demo fixture
        </p>
        <h2 className="fc text-xl text-white">
          {pkg.recommendation.stance.replace(/_/g, ' ')}
        </h2>
        <p className="fi text-sm text-white/70 leading-relaxed">
          {pkg.recommendation.summary}
        </p>
      </header>

      <section className="mio-glass mio-glass--secondary space-y-2" aria-labelledby="pkg-timing">
        <h3 id="pkg-timing" className="fc text-sm text-amber-300/90">
          Timing (demo)
        </h3>
        <p className="fi text-sm text-white/75">
          {pkg.timing.notes} · band {pkg.timing.band}
        </p>
        <ul className="fi text-xs text-white/55 space-y-1">
          {pkg.timing.candidates.map((candidate) => (
            <li key={`${candidate.date}-${candidate.rank}`}>
              #{candidate.rank} {candidate.date} — band {candidate.band}
            </li>
          ))}
        </ul>
        <p className="fi text-xs text-white/40">
          Numeric demo scores are omitted on purpose — not production analysis.
        </p>
      </section>

      <section
        className="mio-glass mio-glass--secondary space-y-2"
        aria-labelledby="pkg-confidence"
      >
        <h3 id="pkg-confidence" className="fc text-sm text-amber-300/90">
          Confidence (demo)
        </h3>
        <p className="fi text-sm text-white/75">
          Precision {pkg.confidence.precision_level} · stub penalties apply
        </p>
      </section>

      <section className="mio-glass mio-glass--secondary space-y-2" aria-labelledby="pkg-plan">
        <h3 id="pkg-plan" className="fc text-sm text-amber-300/90">
          Action plan
        </h3>
        <ol className="fi text-sm text-white/75 space-y-1 list-decimal list-inside">
          {pkg.action_plan.steps.map((step) => (
            <li key={step.order}>{step.action}</li>
          ))}
        </ol>
      </section>

      <section className="mio-glass mio-glass--secondary space-y-2" aria-labelledby="pkg-explain">
        <h3 id="pkg-explain" className="fc text-sm text-amber-300/90">
          Why
        </h3>
        <p className="fi text-sm text-white/75">{pkg.explainability.why}</p>
        <p className="fi text-sm text-white/55">{pkg.explainability.why_not}</p>
      </section>

      {pkg.recommendation.conditions.length > 0 ? (
        <section
          className="mio-glass mio-glass--secondary space-y-2"
          aria-labelledby="pkg-conditions"
        >
          <h3 id="pkg-conditions" className="fc text-sm text-amber-300/90">
            Conditions
          </h3>
          <ul className="fi text-sm text-white/75 space-y-1 list-disc list-inside">
            {pkg.recommendation.conditions.map((condition) => (
              <li key={condition}>{condition}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
