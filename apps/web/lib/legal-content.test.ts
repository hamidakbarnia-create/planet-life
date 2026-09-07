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

  it('omits unverified support and security service claims', () => {
    const copy = allLegalCopy();
    expect(copy).not.toContain('two (2) business days');
    expect(copy).not.toContain('prioritized handling');
    expect(copy).not.toContain('Support hours and response times may vary');
    expect(copy).toContain('support@metioro.com');
    expect(copy).toContain('security@metioro.com');
    expect(copy).toContain('Report security issues to security@metioro.com.');
  });
});

const UNRESOLVED_IDENTITY_TOKENS = [
  '[REGISTERED COMPANY NAME]',
  '[REGISTERED ADDRESS]',
  '[REGISTERED ADDRESS LINE 1]',
  '[CITY, POSTAL CODE, COUNTRY]',
  '[JURISDICTION]',
] as const;

const LEGAL_PAGES = [
  privacyContent,
  termsContent,
  cookiesContent,
  disclaimerContent,
  contactContent,
] as const;

function numberedHeadingValues(headings: string[]): number[] {
  return headings.flatMap((heading) => {
    const match = heading.match(/^(\d+)\./);
    return match ? [Number(match[1])] : [];
  });
}

describe('legal-content unresolved identity placeholders', () => {
  it('omits unresolved identity and jurisdiction tokens from public legal copy', () => {
    const copy = allLegalCopy();
    for (const token of UNRESOLVED_IDENTITY_TOKENS) {
      expect(copy).not.toContain(token);
    }
  });

  it('keeps current legal sections structurally complete after temporary suppression', () => {
    for (const page of LEGAL_PAGES) {
      for (const section of page.sections) {
        expect(section.heading.trim()).not.toBe('');
        expect(section.paragraphs.length).toBeGreaterThan(0);
        for (const paragraph of section.paragraphs) {
          expect(paragraph.trim()).not.toBe('');
        }
      }
    }

    const termsNumbers = numberedHeadingValues(
      termsContent.sections.map((section) => section.heading)
    );
    expect(termsNumbers).toEqual(termsNumbers.map((_, index) => index + 1));

    expect(
      privacyContent.sections.some((section) =>
        section.paragraphs.some((paragraph) => paragraph.includes('privacy@metioro.com'))
      )
    ).toBe(true);
    expect(
      termsContent.sections.some((section) =>
        section.paragraphs.some((paragraph) => paragraph.includes('legal@metioro.com'))
      )
    ).toBe(true);
    for (const email of APPROVED_PUBLIC_EMAILS) {
      expect(
        contactContent.sections.some((section) =>
          section.paragraphs.some((paragraph) => paragraph.includes(email))
        )
      ).toBe(true);
    }
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
