import Link from 'next/link';
import type { LandingCopy } from '@/lib/landing-i18n';
import { primaryCtaStyle } from '@/lib/brand-theme';

type LandingCtaProps = {
  copy: LandingCopy;
};

export function LandingCta({ copy }: LandingCtaProps) {
  return (
    <section className="text-center py-12 px-6">
      <h2 className="text-3xl font-semibold mb-4">{copy.ctaTitle}</h2>
      <p className="text-white/50 mb-8">{copy.ctaSub}</p>
      <Link
        href="/home"
        className="px-8 py-3 rounded-lg font-medium transition hover:opacity-90 inline-block"
        style={primaryCtaStyle('royal')}
      >
        {copy.ctaBtn}
      </Link>
    </section>
  );
}
