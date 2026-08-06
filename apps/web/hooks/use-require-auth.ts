'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { isAuthed } from '@/lib/auth';
import { useQueuedEffect } from '@/lib/use-queued-effect';

/** Redirects unauthenticated users; keeps auth logic out of form UI. */
export function useRequireAuth(loginPath = '/login'): boolean {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useQueuedEffect(() => {
    if (!isAuthed()) {
      router.replace(loginPath);
      return;
    }
    setReady(true);
  }, [router, loginPath]);

  return ready;
}
