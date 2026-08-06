import { useEffect, type DependencyList, type EffectCallback } from 'react';

/**
 * Schedules an effect after the current commit flush so setState inside `effect`
 * is not synchronous with the useEffect invocation (react-hooks/set-state-in-effect).
 */
export function useQueuedEffect(effect: EffectCallback, deps?: DependencyList): void {
  useEffect(() => {
    let cancelled = false;
    let cleanup: void | (() => void);

    queueMicrotask(() => {
      if (cancelled) return;
      cleanup = effect();
    });

    return () => {
      cancelled = true;
      if (typeof cleanup === 'function') cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller-owned dependency list
  }, deps);
}
