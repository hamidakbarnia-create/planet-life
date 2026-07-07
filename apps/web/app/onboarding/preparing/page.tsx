'use client';

/**
 * FTUE Screen 4 placeholder — full orchestration ships in Sprint 1 priority 4.
 * Login routes here when a local birth profile already exists.
 */
export default function PreparingPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 fi"
      style={{ background: '#070B14', color: 'rgba(255,255,255,0.7)' }}
      role="status"
      aria-live="polite"
    >
      <p className="text-sm">Preparing your intelligence…</p>
      <p className="text-xs mt-2 text-white/40">This screen will load your first insight.</p>
    </div>
  );
}
