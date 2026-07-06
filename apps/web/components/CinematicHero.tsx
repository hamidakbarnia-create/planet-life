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
  CINEMATIC_COPY,
  CINEMATIC_DENSITY,
  CINEMATIC_SCROLL_VH,
  TEXT_REVEALS,
  clamp01,
  fadeOutRange,
  fadeRange,
  isLowPowerDevice,
  isMobileViewport,
  prefersReducedMotion,
} from '@/lib/cinematic-scenes';
import { primaryCtaStyle } from '@/lib/brand-theme';
import type { CinematicHeroEngine } from '@/components/cinematic-hero-webgl';

type HeroMode = 'pending' | 'webgl' | 'static';

function StaticHeroCard({ showFullCopy = true }: { showFullCopy?: boolean }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 text-center">
      <p
        className="mb-4 text-xs font-medium uppercase tracking-[0.2em]"
        style={{ color: '#93B4FF' }}
      >
        {CINEMATIC_COPY.subheadline}
      </p>
      <h1 className="mb-4 text-2xl font-semibold leading-tight text-white sm:text-3xl md:text-[2rem]">
        {CINEMATIC_COPY.headline}
      </h1>
      {showFullCopy && (
        <>
          <p className="mb-8 max-w-md text-base text-white/55 sm:text-lg">
            {CINEMATIC_COPY.tagline}
          </p>
          <Link
            href={CINEMATIC_COPY.ctaHref}
            className="inline-flex rounded-lg px-6 py-3 text-sm font-medium transition hover:opacity-90"
            style={primaryCtaStyle('royal')}
          >
            {CINEMATIC_COPY.ctaLabel}
          </Link>
        </>
      )}
    </div>
  );
}

function DecisionCardOverlay({
  opacity,
  translateY,
}: {
  opacity: number;
  translateY: number;
}) {
  return (
    <div
      className="pointer-events-auto w-full max-w-[380px]"
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        visibility: opacity <= 0.01 ? 'hidden' : 'visible',
        transition: 'opacity 0.15s linear, transform 0.15s linear',
      }}
    >
      <div
        className="rounded-2xl border p-5 text-left shadow-2xl backdrop-blur-md"
        style={{
          borderColor: 'rgba(48,92,222,0.35)',
          background: 'linear-gradient(145deg, rgba(26,35,51,0.88), rgba(11,23,54,0.92))',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-widest text-white/45">
            Decision window
          </span>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: 'rgba(48,92,222,0.2)', color: '#93B4FF' }}
          >
            82
          </span>
        </div>
        <p className="mb-1 text-sm font-medium text-white">Contract signing</p>
        <p className="mb-4 text-xs text-white/45">Optimal timing · next 48 hours</p>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full"
            style={{
              width: '82%',
              background: `linear-gradient(90deg, ${CINEMATIC_COLORS.line}, ${CINEMATIC_COLORS.gold})`,
            }}
          />
        </div>
        <p className="mb-4 text-sm text-white/70">{CINEMATIC_COPY.tagline}</p>
        <Link
          href={CINEMATIC_COPY.ctaHref}
          className="inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition hover:opacity-90"
          style={primaryCtaStyle('royal')}
        >
          {CINEMATIC_COPY.ctaLabel}
        </Link>
      </div>
    </div>
  );
}

export function CinematicHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CinematicHeroEngine | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const progressRef = useRef(0);

  const [mode, setMode] = useState<HeroMode>('pending');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isNearViewport, setIsNearViewport] = useState(false);

  const headlineReveal = fadeRange(
    scrollProgress,
    TEXT_REVEALS.headline.fadeInStart,
    TEXT_REVEALS.headline.fadeInEnd,
  );
  const subheadlineReveal = fadeRange(
    scrollProgress,
    TEXT_REVEALS.subheadline.fadeInStart,
    TEXT_REVEALS.subheadline.fadeInEnd,
  );
  const cardReveal = fadeRange(
    scrollProgress,
    TEXT_REVEALS.decisionCard.fadeInStart,
    TEXT_REVEALS.decisionCard.fadeInEnd,
  );

  const headlineOpacity =
    headlineReveal.opacity *
    fadeOutRange(
      scrollProgress,
      TEXT_REVEALS.headline.fadeOutStart,
      TEXT_REVEALS.headline.fadeOutEnd,
    );
  const subheadlineOpacity =
    subheadlineReveal.opacity *
    fadeOutRange(
      scrollProgress,
      TEXT_REVEALS.subheadline.fadeOutStart,
      TEXT_REVEALS.subheadline.fadeOutEnd,
    );
  const headlineLift = clamp01(cardReveal.opacity) * -56;

  const computeProgress = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return 0;
    const rect = section.getBoundingClientRect();
    const scrollable = section.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    const scrolled = -rect.top;
    return Math.min(1, Math.max(0, scrolled / scrollable));
  }, []);

  useEffect(() => {
    if (prefersReducedMotion() || isLowPowerDevice()) {
      setMode('static');
      return;
    }
    setMode('webgl');
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNearViewport(entry.isIntersecting || entry.intersectionRatio > 0);
      },
      { rootMargin: '200px 0px', threshold: [0, 0.01, 0.1] },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const next = computeProgress();
      progressRef.current = next;
      setScrollProgress(next);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [computeProgress]);

  useEffect(() => {
    if (mode !== 'webgl' || !isNearViewport) return;

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
          engine.update(progressRef.current, elapsed);
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        setMode('static');
      }
    };

    void boot();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      engine?.dispose();
      engineRef.current = null;
    };
  }, [mode, isNearViewport]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [mode, isNearViewport]);

  const sectionStyle: CSSProperties = {
    height: `${CINEMATIC_SCROLL_VH}vh`,
    background: CINEMATIC_COLORS.background,
  };

  if (mode === 'static') {
    return (
      <section
        ref={sectionRef}
        className="relative flex min-h-[62vh] items-center justify-center overflow-x-clip"
        style={{ background: CINEMATIC_COLORS.background }}
        aria-label="METIORO hero"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 40%, rgba(48,92,222,0.18), transparent 70%)`,
          }}
        />
        <StaticHeroCard />
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-x-clip"
      style={sectionStyle}
      aria-label="METIORO cinematic hero"
    >
      <div className="sticky top-0 grid h-screen w-full grid-rows-[minmax(0,38vh)_minmax(0,1fr)_minmax(0,42vh)] overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-hidden
        />

        <div className="pointer-events-none relative z-10 row-start-1 flex max-h-[38vh] flex-col items-center justify-end px-6 pb-3 text-center">
          <h1
            className="max-w-3xl text-2xl font-semibold leading-snug text-white sm:text-[1.65rem] md:text-3xl lg:text-[2.35rem]"
            style={{
              opacity: headlineOpacity,
              transform: `translateY(${headlineReveal.translateY + headlineLift}px)`,
            }}
          >
            {CINEMATIC_COPY.headline}
          </h1>
          <p
            className="mt-3 max-w-lg text-sm text-white/60 sm:text-base"
            style={{
              opacity: subheadlineOpacity,
              transform: `translateY(${subheadlineReveal.translateY + headlineLift * 0.5}px)`,
            }}
          >
            {CINEMATIC_COPY.subheadline}
          </p>
        </div>

        <div className="pointer-events-none relative z-20 row-start-3 flex items-end justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <DecisionCardOverlay
            opacity={cardReveal.opacity}
            translateY={cardReveal.translateY}
          />
        </div>

        {scrollProgress < 0.12 && (
          <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-[11px] uppercase tracking-[0.25em] text-white/35">
            Scroll to navigate
          </div>
        )}
      </div>
    </section>
  );
}

export default CinematicHero;
