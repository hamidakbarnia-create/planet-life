import type { Metadata } from 'next';
import { LegalPageShell } from '@/components/LegalPageShell';
import { cookiesContent } from '@/lib/legal-content';
import { legalPageMetadata } from '@/lib/site-metadata';

export const metadata: Metadata = legalPageMetadata(
  'Cookie Policy',
  'How METIORO uses cookies and similar technologies.',
  '/cookies'
);

export default function CookiesPage() {
  return <LegalPageShell content={cookiesContent} />;
}
