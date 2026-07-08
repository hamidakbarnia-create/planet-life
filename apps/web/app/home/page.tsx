'use client';

import { Suspense } from 'react';
import { TodayPlaceholderScreen } from '@/components/ftue/TodayPlaceholderScreen';

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: '#070B14' }}
          aria-busy="true"
        />
      }
    >
      <TodayPlaceholderScreen />
    </Suspense>
  );
}
