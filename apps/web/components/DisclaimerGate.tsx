'use client';

import { useState } from 'react';
import { useQueuedEffect } from '@/lib/use-queued-effect';
import { usePathname } from 'next/navigation';
import { DisclaimerOnboarding } from './disclaimers/DisclaimerOnboarding';
import { isDisclaimerAccepted } from '@/lib/disclaimers';

const PUBLIC_LEGAL_PATHS = new Set([
  '/privacy',
  '/terms',
  '/cookies',
  '/disclaimer',
  '/contact',
]);

export function DisclaimerGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicLegalPage = PUBLIC_LEGAL_PATHS.has(pathname);
  const [ready, setReady] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useQueuedEffect(() => {
    setAccepted(isDisclaimerAccepted());
    setReady(true);
  }, []);

  if (isPublicLegalPage) {
    return <div className="flex flex-col flex-1 min-h-full">{children}</div>;
  }

  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#070B14' }}
      />
    );
  }

  // Children are mounted ONLY after the disclaimer is accepted. Mounting them
  // earlier (hidden) made each page read `planet-life-lang` before the user
  // picked a language in onboarding, so pages stayed in English even after
  // choosing Russian (a same-document localStorage write never fires the
  // `storage` event, so they never re-read). Deferring the mount guarantees
  // every page reads the chosen language on first render.
  if (!accepted) {
    return <DisclaimerOnboarding onAccepted={() => setAccepted(true)} />;
  }

  return <div className="flex flex-col flex-1 min-h-full">{children}</div>;
}
