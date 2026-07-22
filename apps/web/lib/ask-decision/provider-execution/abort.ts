/**
 * Combine caller AbortSignal with a boundary timeout.
 * Client await is aborted (fetch signal). Server may still finish — document as
 * client-side hard abort of the wait, not proven server cancellation.
 */

export type BoundaryAbort = {
  signal: AbortSignal;
  /** True when the boundary timeout fired (vs external cancel). */
  didTimeout: () => boolean;
  cleanup: () => void;
};

export function createBoundaryAbortSignal(
  timeoutMs: number,
  external?: AbortSignal | null
): BoundaryAbort {
  const controller = new AbortController();
  let timedOut = false;
  const onExternalAbort = () => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  };

  if (external) {
    if (external.aborted) {
      controller.abort();
    } else {
      external.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  const timer = setTimeout(() => {
    timedOut = true;
    if (!controller.signal.aborted) {
      controller.abort();
    }
  }, timeoutMs);

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timer);
      if (external) {
        external.removeEventListener('abort', onExternalAbort);
      }
    },
  };
}
