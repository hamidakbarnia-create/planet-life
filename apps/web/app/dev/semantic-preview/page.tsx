import { notFound } from 'next/navigation';
import { SemanticPreviewClient } from './SemanticPreviewClient';
import { isDecisionSemanticsPreviewEnabled } from '@/lib/decision-intelligence/preview-flag';

/** Internal Decision Intelligence preview. Hidden unless the debug flag is on. */
export default function SemanticPreviewPage() {
  const allow =
    process.env.NODE_ENV === 'development' ||
    isDecisionSemanticsPreviewEnabled();
  if (!allow) {
    notFound();
  }
  return <SemanticPreviewClient />;
}
