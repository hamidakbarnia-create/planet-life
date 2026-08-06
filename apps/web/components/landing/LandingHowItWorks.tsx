import type { LandingHowCopy } from '@/lib/landing-i18n';
import { COLORS_RGBA } from '@/lib/brand-theme';

type LandingHowItWorksProps = {
  copy: LandingHowCopy;
};

export function LandingHowItWorks({ copy }: LandingHowItWorksProps) {
  return (
    <section
      id="how"
      aria-labelledby="landing-how-heading"
      className="px-5 py-14 md:px-8 md:py-20"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 id="landing-how-heading" className="mb-10 text-2xl font-semibold md:mb-12">
          {copy.title}
        </h2>

        <div className="mb-10 flex flex-col items-center gap-3 md:mb-12">
          {copy.steps.map((step, index) => (
            <div key={step} className="flex flex-col items-center gap-3">
              <div
                className="rounded-full border px-5 py-2 text-sm font-medium"
                style={{
                  borderColor: COLORS_RGBA.royalBlue45,
                  background: COLORS_RGBA.royalBlue12,
                  color: '#93B4FF',
                }}
              >
                {step}
              </div>
              {index < copy.steps.length - 1 && (
                <span className="text-white/25" aria-hidden>
                  ↓
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mx-auto mb-8 max-w-lg space-y-2 text-sm leading-relaxed text-white/55 md:text-base">
          {copy.philosophy.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <p className="text-sm text-white/55">{copy.note}</p>
      </div>
    </section>
  );
}
