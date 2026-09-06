import { describe, expect, it } from 'vitest';
import {
  contactContent,
  cookiesContent,
  disclaimerContent,
  privacyContent,
  termsContent,
} from './legal-content';
import {
  APPROVED_PUBLIC_EMAILS,
  approvedPublicEmailsIn,
} from './legal-emails';

const REPLACED_PLACEHOLDERS = [
  '[PRIVACY@METIORO.COM]',
  '[LEGAL@METIORO.COM]',
  '[SUPPORT@METIORO.COM]',
  '[PARTNERS@METIORO.COM]',
  '[SECURITY@METIORO.COM]',
] as const;

function allLegalCopy(): string {
  const pages = [
    privacyContent,
    termsContent,
    cookiesContent,
    disclaimerContent,
    contactContent,
  ];
  return pages
    .flatMap((page) => [
      page.title,
      page.intro ?? '',
      ...page.sections.flatMap((section) => [
        section.heading,
        ...section.paragraphs,
      ]),
    ])
    .join('\n');
}

describe('legal-content public emails', () => {
  it('uses approved email values and drops the old bracket placeholders', () => {
    const copy = allLegalCopy();
    for (const placeholder of REPLACED_PLACEHOLDERS) {
      expect(copy).not.toContain(placeholder);
    }
    expect(privacyContent.sections.flatMap((s) => s.paragraphs).join('\n')).toContain(
      'privacy@metioro.com'
    );
    expect(termsContent.sections.flatMap((s) => s.paragraphs).join('\n')).toContain(
      'legal@metioro.com'
    );
    expect(cookiesContent.sections.flatMap((s) => s.paragraphs).join('\n')).toContain(
      'privacy@metioro.com'
    );
    expect(disclaimerContent.sections.flatMap((s) => s.paragraphs).join('\n')).toContain(
      'support@metioro.com'
    );
  });

  it('keeps General Enquiries and General Support as distinct Contact entries', () => {
    const headings = contactContent.sections.map((section) => section.heading);
    expect(headings).toContain('General Enquiries');
    expect(headings).toContain('General Support');
    const enquiry = contactContent.sections.find(
      (section) => section.heading === 'General Enquiries'
    );
    const support = contactContent.sections.find(
      (section) => section.heading === 'General Support'
    );
    expect(enquiry?.paragraphs).toEqual(['Email: contact@metioro.com']);
    expect(support?.paragraphs.join('\n')).toContain('support@metioro.com');
    expect(support?.paragraphs.join('\n')).not.toContain('contact@metioro.com');
    for (const email of APPROVED_PUBLIC_EMAILS) {
      expect(contactContent.sections.flatMap((s) => s.paragraphs).join('\n')).toContain(
        email
      );
    }
  });

  it('does not place hello@metioro.com in approved legal copy', () => {
    expect(allLegalCopy()).not.toContain('hello@metioro.com');
  });
});

describe('approved email token boundaries', () => {
  it('accepts approved addresses next to ordinary legal punctuation', () => {
    expect(approvedPublicEmailsIn('Email: contact@metioro.com')).toEqual([
      'contact@metioro.com',
    ]);
    expect(approvedPublicEmailsIn('(contact@metioro.com)')).toEqual([
      'contact@metioro.com',
    ]);
    expect(approvedPublicEmailsIn('contact@metioro.com.')).toEqual([
      'contact@metioro.com',
    ]);
    expect(approvedPublicEmailsIn('contact@metioro.com,')).toEqual([
      'contact@metioro.com',
    ]);
    expect(approvedPublicEmailsIn('contact@metioro.com —')).toEqual([
      'contact@metioro.com',
    ]);
    expect(approvedPublicEmailsIn('security@metioro.com receive')).toEqual([
      'security@metioro.com',
    ]);
  });

  it('rejects approved addresses embedded in a larger token', () => {
    expect(approvedPublicEmailsIn('xcontact@metioro.com')).toEqual([]);
    expect(approvedPublicEmailsIn('contact@metioro.com.evil')).toEqual([]);
    expect(approvedPublicEmailsIn('contact@metioro.comx')).toEqual([]);
    expect(approvedPublicEmailsIn('user+contact@metioro.com')).toEqual([]);
    expect(approvedPublicEmailsIn('x@contact@metioro.com')).toEqual([]);
    expect(approvedPublicEmailsIn('contact@metioro.com@evil.test')).toEqual([]);
  });
});
