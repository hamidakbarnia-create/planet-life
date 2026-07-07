import type { LandingCopy } from '@/lib/landing-i18n';
import { COLORS } from '@/lib/brand-theme';

type LandingHowItWorksProps = {
  copy: LandingCopy;
};

export function LandingHowItWorks({ copy }: LandingHowItWorksProps) {
  return (
    <section id="how" className="px-8 py-12 max-w-3xl mx-auto text-center">
      <h2 className="text-2xl font-semibold mb-12">{copy.howTitle}</h2>
      <div className="flex flex-col gap-8">
        {copy.steps.map((s) => (
          <div key={s.step} className="flex items-start gap-6 text-left">
            <div
              className="font-semibold text-lg min-w-[2rem]"
              style={{ color: COLORS.royalBlue }}
            >
              {s.step}
            </div>
            <div>
              <div className="font-medium mb-1">{s.title}</div>
              <div className="text-white/50 text-sm">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
