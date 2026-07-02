import type { Metadata } from 'next';
import { LegalPageShell } from '@/components/LegalPageShell';
import { contactContent } from '@/lib/legal-content';
import { legalPageMetadata } from '@/lib/site-metadata';

export const metadata: Metadata = legalPageMetadata(
  'Contact',
  'Contact METIORO for support, privacy, legal, and partnership inquiries.',
  '/contact'
);

export default function ContactPage() {
  return <LegalPageShell content={contactContent} />;
}
