import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LegalPageShell } from './LegalPageShell';
import {
  contactContent,
  cookiesContent,
  disclaimerContent,
  privacyContent,
  termsContent,
  type LegalPageContent,
} from '@/lib/legal-content';

afterEach(() => cleanup());

function emailLink(email: string) {
  return screen.getByRole('link', { name: email });
}

function probe(paragraphs: string[]): LegalPageContent {
  return {
    title: 'Probe',
    lastUpdated: '2 July 2026',
    sections: [{ heading: 'Probe', paragraphs }],
  };
}

describe('LegalPageShell approved mailto links', () => {
  it('renders privacy@ on Privacy with a matching mailto', () => {
    render(<LegalPageShell content={privacyContent} />);
    const link = emailLink('privacy@metioro.com');
    expect(link.getAttribute('href')).toBe('mailto:privacy@metioro.com');
    expect(link.textContent).toBe('privacy@metioro.com');
  });

  it('renders legal@ on Terms with a matching mailto', () => {
    render(<LegalPageShell content={termsContent} />);
    const link = emailLink('legal@metioro.com');
    expect(link.getAttribute('href')).toBe('mailto:legal@metioro.com');
    expect(link.textContent).toBe('legal@metioro.com');
  });

  it('renders privacy@ on Cookies with a matching mailto', () => {
    render(<LegalPageShell content={cookiesContent} />);
    const link = emailLink('privacy@metioro.com');
    expect(link.getAttribute('href')).toBe('mailto:privacy@metioro.com');
  });

  it('renders support@ on Disclaimer with a matching mailto', () => {
    render(<LegalPageShell content={disclaimerContent} />);
    const link = emailLink('support@metioro.com');
    expect(link.getAttribute('href')).toBe('mailto:support@metioro.com');
  });

  it('renders current legal pages without unresolved tokens or empty sections', () => {
    const unresolvedTokens = [
      '[REGISTERED COMPANY NAME]',
      '[REGISTERED ADDRESS]',
      '[REGISTERED ADDRESS LINE 1]',
      '[CITY, POSTAL CODE, COUNTRY]',
      '[JURISDICTION]',
    ] as const;
    const pages = [
      privacyContent,
      termsContent,
      cookiesContent,
      disclaimerContent,
      contactContent,
    ];

    for (const content of pages) {
      render(<LegalPageShell content={content} />);
      const rendered = document.body.textContent ?? '';
      for (const token of unresolvedTokens) {
        expect(rendered).not.toContain(token);
      }
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings).toHaveLength(content.sections.length);
      for (const heading of sectionHeadings) {
        expect(heading.textContent?.trim()).toBeTruthy();
      }
      for (const paragraph of document.querySelectorAll('main p')) {
        expect(paragraph.textContent?.trim()).toBeTruthy();
      }
      cleanup();
    }
  });

  it('renders every approved Contact address with a matching mailto', () => {
    render(<LegalPageShell content={contactContent} />);
    const expected = [
      'contact@metioro.com',
      'support@metioro.com',
      'privacy@metioro.com',
      'legal@metioro.com',
      'partners@metioro.com',
      'security@metioro.com',
    ];
    for (const email of expected) {
      const link = emailLink(email);
      expect(link.getAttribute('href')).toBe(`mailto:${email}`);
      expect(link.textContent).toBe(email);
    }
    expect(screen.getByRole('heading', { name: 'General Enquiries' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'General Support' })).toBeTruthy();
    expect(screen.queryByText('hello@metioro.com')).toBeNull();
  });

  it('does not link arbitrary, unapproved, or embedded email-shaped text', () => {
    render(
      <LegalPageShell
        content={probe([
          'User field you@email.com and hello@metioro.com stay plain text.',
          'xcontact@metioro.com',
          'contact@metioro.com.evil',
          'contact@metioro.comx',
          'user+contact@metioro.com',
          'x@contact@metioro.com',
          'contact@metioro.com@evil.test',
        ])}
      />
    );
    expect(screen.queryByRole('link', { name: 'you@email.com' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'hello@metioro.com' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'contact@metioro.com' })).toBeNull();
    expect(screen.getByText(/you@email.com/)).toBeTruthy();
    expect(screen.getByText(/hello@metioro.com/)).toBeTruthy();
  });

  it('links approved addresses next to ordinary legal punctuation', () => {
    render(
      <LegalPageShell
        content={probe([
          'Email: contact@metioro.com',
          '(support@metioro.com)',
          'privacy@metioro.com.',
          'legal@metioro.com,',
          'partners@metioro.com —',
          'security@metioro.com receive',
        ])}
      />
    );
    expect(emailLink('contact@metioro.com').getAttribute('href')).toBe(
      'mailto:contact@metioro.com'
    );
    expect(emailLink('support@metioro.com').getAttribute('href')).toBe(
      'mailto:support@metioro.com'
    );
    expect(emailLink('privacy@metioro.com').getAttribute('href')).toBe(
      'mailto:privacy@metioro.com'
    );
    expect(emailLink('legal@metioro.com').getAttribute('href')).toBe(
      'mailto:legal@metioro.com'
    );
    expect(emailLink('partners@metioro.com').getAttribute('href')).toBe(
      'mailto:partners@metioro.com'
    );
    expect(emailLink('security@metioro.com').getAttribute('href')).toBe(
      'mailto:security@metioro.com'
    );
  });
});
