import type { Metadata } from 'next';
import { LegalPageShell } from '@/components/LegalPageShell';
import { termsContent } from '@/lib/legal-content';
import { legalPageMetadata } from '@/lib/site-metadata';

export const metadata: Metadata = legalPageMetadata(
  'Terms of Service',
  'Terms governing your use of the METIORO personal decision intelligence platform.',
  '/terms'
);

export default function TermsPage() {
  return <LegalPageShell content={termsContent} />;
}
