import { describe, expect, it } from 'vitest';

import { VAULT_UX_COPY, partnerRequirementHint } from './vault-reading-ux';

describe('Vault partner requirement hints', () => {
  it('keeps Partner Profile distinct from Friend-capable tools', () => {
    expect(partnerRequirementHint('partner', 'en')).toMatch(/not Friend/i);
    expect(partnerRequirementHint('compatibility', 'en')).toMatch(/friend/i);
    expect(partnerRequirementHint('radar', 'en')).toMatch(/friend/i);
    expect(partnerRequirementHint('trust', 'en')).toMatch(/friend/i);
    expect(partnerRequirementHint('communication', 'en')).toMatch(/friend/i);
    expect(partnerRequirementHint('color', 'en')).toBeNull();
    expect(partnerRequirementHint('ghost', 'en')).toBeNull();
    expect(partnerRequirementHint(undefined, 'en')).toBeNull();
  });

  it('does not invent a Friend path for Partner Profile in any locale', () => {
    expect(VAULT_UX_COPY.en.partnerProfileNeeds).toMatch(/not Friend/);
    expect(VAULT_UX_COPY.ru.partnerProfileNeeds).toMatch(/не друг/);
    expect(VAULT_UX_COPY.fa.partnerProfileNeeds).toMatch(/نه دوست/);
    expect(VAULT_UX_COPY.ar.partnerProfileNeeds).toMatch(/وليس صديقاً/);
    for (const lang of ['en', 'ru', 'fa', 'ar'] as const) {
      expect(VAULT_UX_COPY[lang].partnerNeeds).toMatch(/friend|друг|دوست|صديق/i);
    }
  });
});
