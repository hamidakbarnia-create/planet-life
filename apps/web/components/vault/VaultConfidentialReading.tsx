'use client';

import type { CSSProperties } from 'react';
import type { AppLang } from '@/lib/app-settings';
import type { VaultReadingLayer } from '@/lib/vault-reading';
import {
  presentVaultReading,
  type VaultReadingPresentationCopy,
} from '@/lib/vault-reading-presentation';

type Props = {
  lang: AppLang;
  reading: VaultReadingLayer;
  labels: VaultReadingPresentationCopy;
  /** Optional advisory confidence line already localized by the caller. */
  confidenceLabel?: string | null;
  className?: string;
  style?: CSSProperties;
};

/**
 * Confidential reading presentation: decision-language sections only.
 * Never renders technical layer, producer keys, or engine vocabulary.
 */
export function VaultConfidentialReading({
  lang,
  reading,
  labels,
  confidenceLabel,
  className,
  style,
}: Props) {
  const presented = presentVaultReading(reading, lang);

  return (
    <div
      className={className}
      style={style}
      data-testid="vault-confidential-reading"
      data-vault-reading-presented="true"
    >
      {confidenceLabel ? (
        <p
          className="fi text-[10px] tracking-[0.16em] uppercase mb-3"
          style={{ color: 'rgba(212,175,55,0.75)' }}
          data-vault-power-confidence="true"
        >
          {confidenceLabel}
        </p>
      ) : null}
      <ol className="m-0 p-0 list-none space-y-3">
        {presented.sections.map((section) => (
          <li
            key={section.key}
            data-testid={`vault-reading-section-${section.key}`}
            data-section-key={section.key}
          >
            <div
              className="fi text-[10px] uppercase tracking-[0.16em] mb-1"
              style={{ color: 'rgba(212,175,55,0.8)' }}
            >
              {labels[section.key] ?? section.title}
            </div>
            <p
              className="fi text-xs leading-relaxed m-0"
              style={{ color: 'rgba(255,255,255,0.82)' }}
            >
              {section.body}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
