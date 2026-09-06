import type { ReactNode } from 'react';
import { createElement } from 'react';

/** User-facing METIORO addresses approved for this package. hello@ is excluded. */
export const APPROVED_PUBLIC_EMAILS = [
  'contact@metioro.com',
  'support@metioro.com',
  'privacy@metioro.com',
  'legal@metioro.com',
  'partners@metioro.com',
  'security@metioro.com',
] as const;

export type ApprovedPublicEmail = (typeof APPROVED_PUBLIC_EMAILS)[number];

const APPROVED_EMAIL_SET = new Set<string>(APPROVED_PUBLIC_EMAILS);

const APPROVED_EMAIL_ALTERNATION = APPROVED_PUBLIC_EMAILS.map((email) =>
  email.replace(/\./g, '\\.')
).join('|');

/**
 * Exact approved addresses only. Rejects prefix/suffix/local-part embedding.
 * Allows ordinary legal punctuation after the address, including a sentence
 * period that is not the start of another domain label.
 */
function approvedEmailPattern(): RegExp {
  return new RegExp(
    `(?<![A-Za-z0-9._%+-])(?<!@)(${APPROVED_EMAIL_ALTERNATION})(?![A-Za-z0-9_%+-])(?!\\.[A-Za-z0-9])(?!@)`,
    'g'
  );
}

export function isApprovedPublicEmail(
  value: string
): value is ApprovedPublicEmail {
  return APPROVED_EMAIL_SET.has(value);
}

export function mailtoForApprovedEmail(email: ApprovedPublicEmail): string {
  return `mailto:${email}`;
}

export function approvedPublicEmailsIn(text: string): ApprovedPublicEmail[] {
  return [...text.matchAll(approvedEmailPattern())].flatMap((match) => {
    const email = match[1];
    return isApprovedPublicEmail(email) ? [email] : [];
  });
}

/**
 * Wrap only the exact approved addresses in mailto anchors.
 * Does not interpret arbitrary email-shaped text.
 */
export function renderLegalTextWithApprovedMailto(text: string): ReactNode {
  const parts = text.split(approvedEmailPattern());
  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    if (!isApprovedPublicEmail(part)) return part;
    return createElement(
      'a',
      {
        key: `${part}-${index}`,
        href: mailtoForApprovedEmail(part),
        className: 'legal-email',
      },
      part
    );
  });
}
