import type { Metadata } from 'next';
import { LegalPageShell } from '@/components/LegalPageShell';
import { disclaimerContent } from '@/lib/legal-content';
import { legalPageMetadata } from '@/lib/site-metadata';

export const metadata: Metadata = legalPageMetadata(
  'Disclaimer',
  'Important limitations on AI-generated insights, analytical outputs, and professional advice from METIORO.',
  '/disclaimer'
);

export default function DisclaimerPage() {
  return <LegalPageShell content={disclaimerContent} />;
}
