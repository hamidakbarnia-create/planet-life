'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  CINEMATIC_COLORS,
  CINEMATIC_DENSITY,
  clamp01,
  isLowPowerDevice,
  isMobileViewport,
  prefersReducedMotion,
} from '@/lib/cinematic-scenes';
import { COLORS_RGBA, primaryCtaStyle } from '@/lib/brand-theme';
import type { LandingHeroCopy } from '@/lib/landing-i18n';
import type { CinematicHeroEngine } from '@/components/cinematic-hero-webgl';

export type CinematicHeroProps = {
  copy: LandingHeroCopy;
};

function EditorialHeroContent({ copy }: { copy: LandingHeroCopy }) {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col px-5 py-14 md:max-w-4xl md:px-8 md:py-20 lg:py-24">
      <p
        className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-[#93B4FF] md:text-xs"
      >
        {copy.eyebrow}
      </p>
      <h1
        id="landing-hero-heading"
        className="mb-5 max-w-2xl text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-white sm:text-4xl md:text-[2.65rem] lg:text-5xl"
      >
        {copy.headline}
      </h1>
      <p className="mb-8 max-w-xl text-base leading-relaxed text-white/60 md:text-lg md:leading-relaxed">
        {copy.supporting}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/home"
          className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#305CDE]"
          style={primaryCtaStyle('royal')}
        >
          {copy.primaryCta}
        </Link>
        <a
          href="#how"
          className="inline-flex items-center justify-center rounded-lg border px-6 py-3 text-sm font-medium text-white/75 transition hover:border-white/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#305CDE]"
          style={{ borderColor: COLORS_RGBA.white10, background: COLORS_RGBA.white04 }}
        >
          {copy.secondaryCta}
        </a>
      </div>
    </div>
  );
}

export function CinematicHero({ copy }: CinematicHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CinematicHeroEngine | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const progressRef = useRef(0.52);

  const [useWebgl, setUseWebgl] = useState(
    () => !(prefersReducedMotion() || isLowPowerDevice()),
  );
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNearViewport(entry.isIntersecting || entry.intersectionRatio > 0);
      },
      { rootMargin: '120px 0px', threshold: [0, 0.01, 0.1] },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!useWebgl || !isNearViewport) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let engine: CinematicHeroEngine | null = null;

    const boot = async () => {
      try {
        const { createCinematicHeroEngine } = await import('@/components/cinematic-hero-webgl');
        if (cancelled) return;

        const density = isMobileViewport() ? CINEMATIC_DENSITY.mobile : CINEMATIC_DENSITY.desktop;
        engine = createCinematicHeroEngine(canvas, density);
        engineRef.current = engine;
        startTimeRef.current = performance.now();

        const tick = (now: number) => {
          if (!engine) return;
          const elapsed = (now - startTimeRef.current) / 1000;
          const ambient = 0.42 + Math.sin(elapsed * 0.12) * 0.06;
          progressRef.current = clamp01(ambient);
          engine.update(progressRef.current, elapsed);
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        setUseWebgl(false);
      }
    };

    void boot();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      engine?.dispose();
      engineRef.current = null;
    };
  }, [useWebgl, isNearViewport]);

  const onResize = useCallback(() => {
    engineRef.current?.resize();
  }, []);

  useEffect(() => {
    if (!useWebgl) return;
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [useWebgl, onResize]);

  const sectionStyle: CSSProperties = {
    background: CINEMATIC_COLORS.background,
  };

  if (!useWebgl) {
    return (
      <section
        ref={sectionRef}
        className="relative overflow-hidden min-h-[85svh] md:min-h-[88vh]"
        style={sectionStyle}
        aria-labelledby="landing-hero-heading"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 20% 30%, rgba(48,92,222,0.14), transparent 65%), radial-gradient(ellipse 50% 40% at 80% 70%, rgba(48,92,222,0.08), transparent 60%)',
          }}
          aria-hidden
        />
        <EditorialHeroContent copy={copy} />
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden min-h-[85svh] md:min-h-[88vh]"
      style={sectionStyle}
      aria-labelledby="landing-hero-heading"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-80" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(11,23,54,0.35) 0%, rgba(11,23,54,0.72) 55%, rgba(10,15,28,0.92) 100%)',
        }}
        aria-hidden
      />
      <EditorialHeroContent copy={copy} />
    </section>
  );
}

export default CinematicHero;
