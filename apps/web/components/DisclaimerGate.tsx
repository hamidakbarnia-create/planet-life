'use client';

import { useEffect, useState } from 'react';
import { DisclaimerOnboarding } from './disclaimers/DisclaimerOnboarding';
import { isDisclaimerAccepted } from '@/lib/disclaimers';

export function DisclaimerGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setAccepted(isDisclaimerAccepted());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#070B14' }}
      />
    );
  }

  return (
    <>
      {!accepted && (
        <DisclaimerOnboarding onAccepted={() => setAccepted(true)} />
      )}
      <div
        style={{
          visibility: accepted ? 'visible' : 'hidden',
          pointerEvents: accepted ? 'auto' : 'none',
        }}
        className="flex flex-col flex-1 min-h-full"
      >
        {children}
      </div>
    </>
  );
}
