import type { LandingTrustCopy } from '@/lib/landing-i18n';
import { COLORS_RGBA } from '@/lib/brand-theme';

type LandingTrustProps = {
  copy: LandingTrustCopy;
};

export function LandingTrust({ copy }: LandingTrustProps) {
  return (
    <section
      id="trust"
      aria-labelledby="landing-trust-heading"
      className="border-t px-5 py-14 md:px-8 md:py-16"
      style={{ borderColor: COLORS_RGBA.white08 }}
    >
      <div className="mx-auto max-w-5xl">
        <h2
          id="landing-trust-heading"
          className="mb-8 text-center text-sm font-medium uppercase tracking-[0.18em] text-white/45 md:mb-10"
        >
          {copy.title}
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {copy.pillars.map((pillar) => (
            <li
              key={pillar.title}
              className="rounded-xl border p-5"
              style={{
                borderColor: COLORS_RGBA.white08,
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <h3 className="mb-2 text-sm font-medium text-white/90">{pillar.title}</h3>
              <p className="text-sm leading-relaxed text-white/55">{pillar.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
