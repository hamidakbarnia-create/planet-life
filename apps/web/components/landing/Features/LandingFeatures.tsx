import type { LandingCopy } from '@/lib/landing-i18n';
import { COLORS_RGBA, COLORS } from '@/lib/brand-theme';

type LandingFeaturesProps = {
  copy: LandingCopy;
};

export function LandingFeatures({ copy }: LandingFeaturesProps) {
  return (
    <section id="features" className="px-8 py-12 max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold text-center mb-12">{copy.domainsTitle}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {copy.domains.map((f) => (
          <div
            key={f.title}
            className="rounded-xl p-6 transition border hover:border-[rgba(48,92,222,0.45)]"
            style={{
              borderColor: COLORS_RGBA.white10,
              background: COLORS.navy,
            }}
          >
            <div className="text-3xl mb-4">{f.icon}</div>
            <div className="font-medium mb-2">{f.title}</div>
            <div className="text-white/50 text-sm leading-relaxed">{f.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
