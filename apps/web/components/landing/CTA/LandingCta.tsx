import Link from 'next/link';
import type { LandingCtaCopy } from '@/lib/landing-i18n';
import { primaryCtaStyle } from '@/lib/brand-theme';

type LandingCtaProps = {
  copy: LandingCtaCopy;
};

export function LandingCta({ copy }: LandingCtaProps) {
  return (
    <section
      aria-labelledby="landing-cta-heading"
      className="px-5 py-16 text-center md:px-8 md:py-20"
    >
      <h2 id="landing-cta-heading" className="mb-4 text-3xl font-semibold md:text-4xl">
        {copy.title}
      </h2>
      <p className="mx-auto mb-8 max-w-md text-white/50">{copy.subtitle}</p>
      <Link
        href="/home"
        className="inline-flex rounded-lg px-8 py-3 font-medium transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#305CDE]"
        style={primaryCtaStyle('royal')}
      >
        {copy.btn}
      </Link>
    </section>
  );
}
