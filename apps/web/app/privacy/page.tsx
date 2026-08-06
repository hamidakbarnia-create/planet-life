import type { Metadata } from 'next';
import { LegalPageShell } from '@/components/LegalPageShell';
import { privacyContent } from '@/lib/legal-content';
import { legalPageMetadata } from '@/lib/site-metadata';

export const metadata: Metadata = legalPageMetadata(
  'Privacy Policy',
  'How METIORO collects, uses, and protects your personal information.',
  '/privacy'
);

export default function PrivacyPage() {
  return <LegalPageShell content={privacyContent} />;
}
