'use client';

import { SemanticDebugPreview } from '@/components/decision-intelligence/SemanticDebugPreview';
import {
  PREVIEW_MATRIX,
  TRADEOFF_LABELS,
} from '@/lib/decision-intelligence/preview-fixtures';

const CASES: { id: string; title: string; key: keyof typeof PREVIEW_MATRIX }[] = [
  { id: '80-action', title: '80 action', key: 'strongAction' },
  { id: '81-selective', title: '81 selective', key: 'strongSelective' },
  { id: '40-defensive', title: '40 defensive', key: 'weakDefensive' },
  { id: 'review', title: 'review', key: 'review' },
  { id: 'mixed', title: 'mixed', key: 'mixed' },
  { id: 'insufficient', title: 'insufficient', key: 'insufficient' },
  { id: 'tradeoff', title: '81 selective vs 70 action', key: 'tradeoff' },
  { id: 'near-tie', title: '71 selective vs 70 action', key: 'nearTie' },
  { id: 'clean-window', title: 'clean Find window', key: 'cleanWindow' },
  { id: 'mixed-window', title: 'mixed-posture Find window', key: 'mixedWindow' },
  { id: 'elevated', title: 'elevated interview', key: 'elevatedInterview' },
  { id: 'high-stakes', title: 'explicit high_stakes', key: 'highStakes' },
];

export function SemanticPreviewClient() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6 text-white">
      <header>
        <p className="fi text-xs uppercase tracking-[0.14em] text-amber-300">
          EXPERIMENTAL / SHADOW
        </p>
        <h1 className="fc text-2xl mt-1">Decision Intelligence preview</h1>
        <p className="fi text-sm text-white/55 mt-2">
          Internal only. Not used for ranking. Timing strength is not
          probability of success.
        </p>
      </header>
      {CASES.map((item) => (
        <section
          key={item.id}
          data-testid={`preview-case-${item.id}`}
          className="rounded-xl border border-white/10 p-4"
        >
          <h2 className="fc text-lg mb-2">{item.title}</h2>
          <SemanticDebugPreview
            forceEnabled
            explanation={PREVIEW_MATRIX[item.key]}
            displayContext={
              item.key === 'tradeoff' || item.key === 'nearTie'
                ? TRADEOFF_LABELS
                : undefined
            }
            extra={
              item.key === 'mixedWindow'
                ? {
                    windowKind: 'mixed_posture_window',
                    daySequence: ['action', 'selective'],
                  }
                : item.key === 'cleanWindow'
                  ? { windowKind: 'clean_forward_window', daySequence: ['action'] }
                  : undefined
            }
          />
        </section>
      ))}
    </main>
  );
}
