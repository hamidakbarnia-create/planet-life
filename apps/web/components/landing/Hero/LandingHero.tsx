'use client';

import dynamic from 'next/dynamic';

const CinematicHero = dynamic(
  () => import('@/components/CinematicHero').then((m) => m.CinematicHero),
  {
    ssr: false,
    loading: () => (
      <section
        className="flex min-h-[62vh] items-center justify-center"
        style={{ background: '#0B1736' }}
        aria-hidden
      />
    ),
  },
);

export function LandingHero() {
  return <CinematicHero />;
}
