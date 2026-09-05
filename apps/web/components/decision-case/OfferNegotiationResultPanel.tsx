'use client';

import type { AppLang } from '@/lib/app-settings';
import { getAskProductCopy } from '@/lib/ask-product';
import type { OfferNegotiationResultView } from '@/lib/ask-product';

/**
 * Negotiation-specific reading for car-offer-negotiation EVALUATE.
 *
 * The combined timing/condition headline lives on the Evaluate chrome
 * verdict. This panel starts at the short summary so the same sentence
 * is not restated.
 */
export function OfferNegotiationResultPanel({
  lang,
  view,
}: {
  lang: AppLang;
  view: OfferNegotiationResultView;
}) {
  const copy = getAskProductCopy(lang);
  const showWatch = view.watch.length > 0 || Boolean(view.watchNotice);

  return (
    <section
      data-testid="offer-negotiation-result-panel"
      data-condition-quality={view.conditionQuality}
      data-strength={view.strength}
      data-evidence-grounded={view.evidenceGrounded ? 'true' : 'false'}
      dir={copy.dir}
      className="rounded-xl px-3 py-2.5 space-y-2.5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <p
        className="fi text-sm text-white/70"
        data-testid="offer-negotiation-summary"
      >
        {view.summary}
      </p>

      {view.supports.length > 0 ? (
        <div data-testid="offer-negotiation-supports">
          <p className="fi text-[12px] text-white/50">{view.supportHeading}</p>
          <ul className="fi text-sm text-white/85 list-disc ps-5 space-y-1 mt-1">
            {view.supports.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {showWatch ? (
        <div data-testid="offer-negotiation-watch">
          <p className="fi text-[12px] text-white/50">{view.watchHeading}</p>
          {view.watch.length > 0 ? (
            <ul className="fi text-sm text-white/85 list-disc ps-5 space-y-1 mt-1">
              {view.watch.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p
              className="fi text-sm text-white/75 mt-1"
              data-testid="offer-negotiation-watch-notice"
            >
              {view.watchNotice}
            </p>
          )}
        </div>
      ) : null}

      <div data-testid="offer-negotiation-next-step">
        <p className="fi text-[12px] text-white/50">{view.nextStepHeading}</p>
        <p className="fi text-sm text-white/85 mt-1">{view.nextStep}</p>
      </div>

      {view.contextNote ? (
        <p
          className="fi text-xs text-white/45"
          data-testid="offer-negotiation-context-note"
          data-visual-priority="secondary"
        >
          {view.contextNote}
        </p>
      ) : null}
    </section>
  );
}
