'use client';

import { TimingStrengthText } from '@/components/ui/TimingStrengthText';
import { DAY_INTELLIGENCE_CHROME } from '@/lib/decision-intelligence/product-copy';
import type { DayIntelligenceView } from '@/lib/decision-intelligence/day-intelligence-view';

export function DayIntelligencePanel({
  view,
  hideScore = false,
}: {
  view: DayIntelligenceView;
  hideScore?: boolean;
}) {
  const chrome = DAY_INTELLIGENCE_CHROME[view.locale];
  const showWhy =
    view.whyItems.length > 0 &&
    !view.insufficient &&
    view.whyItems.join('|') !== [...view.supports, ...view.cautions].join('|');
  const showScore = !hideScore && Boolean(view.timingStrengthValue);

  return (
    <section
      data-testid="day-intelligence-panel"
      data-title-kind={view.titleKind}
      data-insufficient={view.insufficient ? 'true' : 'false'}
      data-mixed={view.mixed ? 'true' : 'false'}
      data-conditions-kind={view.conditionsKind ?? ''}
      dir={view.textDirection}
      className="rounded-xl px-3 py-3 space-y-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <p
        className="fi text-[10px] uppercase tracking-[0.12em] text-white/45"
        data-testid="day-intelligence-beta"
      >
        {view.title}
      </p>

      {showScore ? (
        <div data-testid="day-intelligence-score">
          <p className="fi text-[11px] text-white/40">{view.timingStrengthLabel}</p>
          <p className="fc text-lg text-white/90">
            <TimingStrengthText formatted={view.timingStrengthValue} />
          </p>
        </div>
      ) : null}

      {view.conditionsLabel ? (
        <div data-testid="day-intelligence-conditions">
          <p className="fi text-[11px] text-white/40">{chrome.conditions}</p>
          <p className="fi text-sm text-white/90">{view.conditionsLabel}</p>
        </div>
      ) : null}

      <p
        className="fi text-sm text-white/85"
        data-testid="day-intelligence-headline"
      >
        {view.headline}
      </p>

      {view.bridge ? (
        <p
          className="fi text-[13px] text-white/60"
          data-testid="day-intelligence-bridge"
        >
          {view.bridge}
        </p>
      ) : view.interpretation ? (
        <p
          className="fi text-[13px] text-white/65"
          data-testid="day-intelligence-interpretation"
        >
          {view.interpretation}
        </p>
      ) : null}

      {view.supports.length ? (
        <div>
          <p className="fi text-[11px] uppercase tracking-[0.1em] text-white/40 mb-1">
            {chrome.supports}
          </p>
          <ul
            className="fi text-[13px] text-white/75 list-disc ps-4 space-y-1"
            data-testid="day-intelligence-supports"
          >
            {view.supports.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {view.cautions.length ? (
        <div>
          <p className="fi text-[11px] uppercase tracking-[0.1em] text-white/40 mb-1">
            {chrome.watch}
          </p>
          <ul
            className="fi text-[13px] text-white/70 list-disc ps-4 space-y-1"
            data-testid="day-intelligence-watch"
          >
            {view.cautions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {showWhy ? (
        <details data-testid="day-intelligence-why" className="fi text-[12px] text-white/55">
          <summary className="cursor-pointer select-none">{chrome.why}</summary>
          <ul className="list-disc ps-4 mt-2 space-y-1">
            {view.whyItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      ) : null}

      {view.safety.length ? (
        <div>
          <p className="fi text-[11px] uppercase tracking-[0.1em] text-white/40 mb-1">
            {chrome.safety}
          </p>
          <ul
            className="fi text-[12px] text-white/70 space-y-1"
            data-testid="day-intelligence-safety"
          >
            {view.safety.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
