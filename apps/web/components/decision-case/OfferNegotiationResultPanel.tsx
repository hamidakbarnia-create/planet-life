'use client';

import type { AppLang } from '@/lib/app-settings';
import { getAskProductCopy } from '@/lib/ask-product';
import type { OfferNegotiationResultView } from '@/lib/ask-product';

/**
 * Negotiation-specific reading for car-offer-negotiation EVALUATE.
 *
 * Replaces the generic day-intelligence panel for this Decision Type so the
 * user does not receive both a specific and a generic reading of the same
 * evidence. Section labels reuse the shared localized product copy.
 */
export function OfferNegotiationResultPanel({
  lang,
  view,
}: {
  lang: AppLang;
  view: OfferNegotiationResultView;
}) {
  const copy = getAskProductCopy(lang);

  return (
    <section
      data-testid="offer-negotiation-result-panel"
      data-condition-quality={view.conditionQuality}
      data-strength={view.strength}
      data-evidence-grounded={view.evidenceGrounded ? 'true' : 'false'}
      dir={copy.dir}
      className="rounded-xl px-3 py-3 space-y-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <p
        className="fc text-sm text-white/90"
        data-testid="offer-negotiation-headline"
      >
        {view.headline}
      </p>

      <p
        className="fi text-sm text-white/70"
        data-testid="offer-negotiation-summary"
      >
        {view.summary}
      </p>

      {view.supports.length > 0 ? (
        <div data-testid="offer-negotiation-supports">
          <p className="fi text-[11px] uppercase tracking-[0.12em] text-white/45">
            {copy.evidenceSupportSection}
          </p>
          <ul className="fi text-sm text-white/85 list-disc ps-5 space-y-1 mt-1">
            {view.supports.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {view.watch.length > 0 ? (
        <div data-testid="offer-negotiation-watch">
          <p className="fi text-[11px] uppercase tracking-[0.12em] text-white/45">
            {copy.evidenceCautionSection}
          </p>
          <ul className="fi text-sm text-white/85 list-disc ps-5 space-y-1 mt-1">
            {view.watch.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div data-testid="offer-negotiation-next-step">
        <p className="fi text-[11px] uppercase tracking-[0.12em] text-white/45">
          {copy.nextStepsLabel}
        </p>
        <p className="fi text-sm text-white/85 mt-1">{view.nextStep}</p>
      </div>

      {view.contextNote ? (
        <p
          className="fi text-xs text-white/50"
          data-testid="offer-negotiation-context-note"
        >
          {view.contextNote}
        </p>
      ) : null}
    </section>
  );
}
