'use client';

import {
  useCallback,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
} from 'react';
import type { AppLang } from '@/lib/app-settings';
import {
  resolveCategoryLabel,
  type QuestionCategory,
  type QuestionCategoryId,
} from '@/lib/question-library';
import styles from './QuestionTopics.module.css';

type UpdateReason = 'select' | 'scroll' | 'resize' | 'lang' | 'layout';

type QuestionTopicsProps = {
  categories: readonly QuestionCategory[];
  selectedCategoryId: QuestionCategoryId;
  onSelect: (categoryId: QuestionCategoryId) => void;
  lang: AppLang;
  label: string;
};

export function QuestionTopics({
  categories,
  selectedCategoryId,
  onSelect,
  lang,
  label,
}: QuestionTopicsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<QuestionCategoryId, HTMLButtonElement>());
  const rafRef = useRef<number | null>(null);
  const readyRef = useRef(false);
  const scrollIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setTabRef = useCallback(
    (id: QuestionCategoryId, node: HTMLButtonElement | null) => {
      if (node) tabRefs.current.set(id, node);
      else tabRefs.current.delete(id);
    },
    []
  );

  const applyIndicator = useCallback(
    (reason: UpdateReason) => {
      const scrollEl = scrollRef.current;
      const indicator = indicatorRef.current;
      const tab = tabRefs.current.get(selectedCategoryId);
      if (!scrollEl || !indicator || !tab) return;

      const scrollRect = scrollEl.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      const trackWidth = scrollRect.width;

      // Viewport-relative geometry stays correct for LTR/RTL and scrollLeft quirks.
      let x = tabRect.left - scrollRect.left;
      let width = tabRect.width;

      // Keep the bar inside the visible track — never under clipped chips.
      if (x < 0) {
        width += x;
        x = 0;
      }
      if (x + width > trackWidth) {
        width = trackWidth - x;
      }
      if (width < 0.5) {
        width = 0;
      }

      const scrolling = reason === 'scroll';
      indicator.classList.toggle(styles.indicatorScrolling, scrolling);
      if (scrolling) {
        // Instant follow while the row scrolls — CSS transition causes jitter.
        indicator.style.transition = 'none';
      } else if (readyRef.current) {
        indicator.style.transition = '';
        indicator.classList.add(styles.indicatorReady);
      }

      // Base width is 1px; scaleX sets the visual width. Animate transform only.
      indicator.style.transform = `translateX(${x}px) scaleX(${Math.max(width, 0)})`;

      if (!readyRef.current && width > 0) {
        readyRef.current = true;
        // Enable smooth moves on the next non-scroll update.
        requestAnimationFrame(() => {
          indicator.classList.add(styles.indicatorReady);
        });
      }
    },
    [selectedCategoryId]
  );

  const scheduleUpdate = useCallback(
    (reason: UpdateReason) => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        applyIndicator(reason);
      });
    },
    [applyIndicator]
  );

  useLayoutEffect(() => {
    scheduleUpdate(readyRef.current ? 'select' : 'layout');

    const selectedTab = tabRefs.current.get(selectedCategoryId);
    if (typeof selectedTab?.scrollIntoView === 'function') {
      selectedTab.scrollIntoView({
        behavior: readyRef.current ? 'smooth' : 'auto',
        inline: 'nearest',
        block: 'nearest',
      });
    }
  }, [selectedCategoryId, scheduleUpdate]);

  useLayoutEffect(() => {
    // Category label widths change with language.
    scheduleUpdate('lang');
  }, [lang, categories, scheduleUpdate]);

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const onScroll = () => {
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
      scrollIdleTimerRef.current = setTimeout(() => {
        const indicator = indicatorRef.current;
        if (indicator) {
          indicator.classList.remove(styles.indicatorScrolling);
          indicator.style.transition = '';
        }
        scrollIdleTimerRef.current = null;
      }, 120);
      scheduleUpdate('scroll');
    };

    const onResize = () => scheduleUpdate('resize');

    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => scheduleUpdate('resize'));
      resizeObserver.observe(scrollEl);
      for (const tab of tabRefs.current.values()) {
        resizeObserver.observe(tab);
      }
    }

    let cancelled = false;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        if (!cancelled) scheduleUpdate('layout');
      });
    }

    return () => {
      cancelled = true;
      scrollEl.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      resizeObserver?.disconnect();
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleUpdate, categories]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = categories.findIndex((c) => c.id === selectedCategoryId);
    if (currentIndex < 0) return;

    const isRtl =
      (scrollRef.current &&
        getComputedStyle(scrollRef.current).direction === 'rtl') ||
      false;

    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') {
      nextIndex = isRtl
        ? Math.max(0, currentIndex - 1)
        : Math.min(categories.length - 1, currentIndex + 1);
    } else if (event.key === 'ArrowLeft') {
      nextIndex = isRtl
        ? Math.min(categories.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = categories.length - 1;
    } else {
      return;
    }

    if (nextIndex === currentIndex) return;
    event.preventDefault();
    const next = categories[nextIndex];
    if (!next) return;
    onSelect(next.id);
    tabRefs.current.get(next.id)?.focus();
  };

  return (
    <div className={styles.root} data-testid="question-topics">
      <div
        ref={scrollRef}
        className={styles.scroll}
        role="tablist"
        aria-label={label}
        onKeyDown={handleKeyDown}
      >
        {categories.map((category) => {
          const selected = category.id === selectedCategoryId;
          return (
            <button
              key={category.id}
              ref={(node) => setTabRef(category.id, node)}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(category.id)}
              className={`${styles.tab} fi${selected ? ` ${styles.tabActive}` : ''}`}
            >
              {resolveCategoryLabel(category, lang)}
            </button>
          );
        })}
      </div>

      <div
        className={styles.track}
        aria-hidden="true"
        data-testid="question-topics-track"
      >
        <div
          ref={indicatorRef}
          className={styles.indicator}
          data-testid="question-topics-indicator"
        />
      </div>
    </div>
  );
}
