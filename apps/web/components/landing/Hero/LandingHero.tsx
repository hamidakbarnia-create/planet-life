'use client';

import dynamic from 'next/dynamic';
import type { LandingHeroCopy } from '@/lib/landing-i18n';

const CinematicHero = dynamic(
  () => import('@/components/CinematicHero').then((m) => m.CinematicHero),
  {
    ssr: false,
    loading: () => (
      <section
        className="flex min-h-[85svh] items-center justify-center md:min-h-[88vh]"
        style={{ background: '#0B1736' }}
        aria-hidden
      />
    ),
  },
);

type LandingHeroProps = {
  copy: LandingHeroCopy;
};

export function LandingHero({ copy }: LandingHeroProps) {
  return <CinematicHero copy={copy} />;
}
