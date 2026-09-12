'use client';

import { useEffect, useRef, useState } from 'react';

import { nextRelationChangeAt, type WindowBoundary } from './vault-window-when';

const MAX_TIMEOUT_MS = 2_147_483_647;

/** Live clock for window labels. An explicit `now` stays frozen for tests. */
export function useVaultWindowClock(
  frozenNow: Date | undefined,
  boundaries: WindowBoundary[],
): Date {
  const [liveNow, setLiveNow] = useState(() => new Date());
  const boundaryKey = boundaries.map((boundary) => `${boundary.start}:${boundary.end}`).join(',');
  const boundariesRef = useRef(boundaries);

  useEffect(() => {
    boundariesRef.current = boundaries;
  }, [boundaries]);

  useEffect(() => {
    if (frozenNow) return undefined;

    const refresh = () => setLiveNow(new Date());
    // Catch up when a new reading arrives or the frozen clock is removed.
    refresh();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      if (timeoutId != null) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      const next = nextRelationChangeAt(Date.now(), boundariesRef.current);
      if (next == null) return;
      const delay = Math.min(Math.max(0, next - Date.now()), MAX_TIMEOUT_MS);
      timeoutId = setTimeout(() => {
        refresh();
        arm();
      }, delay);
    };
    arm();

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [frozenNow, boundaryKey]);

  return frozenNow ?? liveNow;
}
