import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { VAULT_PARTNER_SELECTION_COPY } from './vault-section-i18n';

describe('Vault page selected-partner wiring', () => {
  const pageSource = readFileSync(
    resolve(__dirname, '../app/vault/[section]/page.tsx'),
    'utf8',
  );

  it('depends on selectedVaultPartnerId, peopleRevision, and readiness', () => {
    expect(pageSource).toContain('selectedVaultPartnerId');
    expect(pageSource).toContain('peopleRevision');
    expect(pageSource).toContain('partnerSelectionReady');
    expect(pageSource).toMatch(/selectedVaultPartnerId,/);
    expect(pageSource).toMatch(/partnerSelectionReady,/);
    expect(pageSource).toContain('reconcileVaultPartnerSelection');
    expect(pageSource).toContain('setPartnerSelectionReady(true)');
  });

  it('blocks partner-dependent fetch before readiness and without selection', () => {
    expect(pageSource).toContain(
      'partnerDependent && !partnerSelectionReady',
    );
    expect(pageSource).toContain("setLiveError('choosePartner')");
    expect(pageSource).toContain("setLiveError('needPerson')");
    expect(pageSource).toContain("setLiveError('unsupportedRelationship')");
    expect(pageSource).toContain('toVaultRelationshipType');
    expect(pageSource).toContain('toVaultPartnerProfileGoal');
    expect(pageSource).toContain('apiKey === \'partner\' && !partnerGoal');
  });

  it('refetches on peopleRevision without depending on people array identity', () => {
    expect(pageSource).toContain('peopleRevision');
    expect(pageSource).toContain('const peopleNow = loadPeople()');
    expect(pageSource).not.toMatch(
      /partnerSelectionReady,\s*\n\s*people,/,
    );
  });

  it('does not call fetchers from selection or People listeners', () => {
    expect(pageSource).not.toMatch(
      /selectVaultPartner[\s\S]{0,200}fetchVault/,
    );
    expect(pageSource).not.toMatch(
      /PEOPLE_CHANGED_EVENT[\s\S]{0,500}fetchVault/,
    );
  });

  it('shows identity name and Choose Partner affordances', () => {
    expect(pageSource).toContain('data-vault-partner-identity');
    expect(pageSource).toContain('data-vault-partner-name');
    expect(pageSource).toContain('data-vault-choose-partner');
    expect(pageSource).toContain('partnerUi.readingFor');
    expect(pageSource).toContain('<select');
  });

  it('wires distinct partner UX states and CTAs', () => {
    expect(pageSource).toContain('data-vault-no-people');
    expect(pageSource).toContain('data-vault-unsupported-relationship');
    expect(pageSource).toContain('data-vault-partner-profile-note');
    expect(pageSource).toContain('partnerUi.noPeopleBody');
    expect(pageSource).toContain('partnerUi.addPersonCta');
    expect(pageSource).toContain('partnerUi.choosePartnerHint');
    expect(pageSource).toContain('partnerUi.changeRelationshipCta');
    expect(pageSource).toContain('partnerUi.partnerProfileVsCompatNote');
    expect(pageSource).toContain(
      'showPartnerIdentity ? partnerUi.loading : rui.loading',
    );
    expect(pageSource).toContain(
      'showPartnerIdentity ? partnerUi.apiError : rui.apiError',
    );
  });

  it('keeps one Choose Partner explanation and no inert pseudo-CTA', () => {
    expect(pageSource).toContain('data-vault-choose-partner');
    expect(pageSource).toContain('partnerUi.choosePartnerHint');
    expect(pageSource).not.toContain('choosePartnerBody');
    expect(pageSource).not.toContain('data-vault-choose-partner-error');
    expect(pageSource).not.toMatch(
      /liveError === 'choosePartner'[\s\S]{0,400}partnerUi\.choosePartner/,
    );
    expect(pageSource).toMatch(
      /<select[\s\S]*?onChange=\{[\s\S]*?selectVaultPartner/,
    );
  });

  it('reuses per-effect cancelled closure for selection refetch', () => {
    expect(pageSource).toContain('let cancelled = false');
    expect(pageSource).toContain('if (cancelled) return');
    expect(pageSource).toContain('if (!cancelled) setLiveLoading(false)');
  });

  it('handles cross-tab selection via storage key without People event mix', () => {
    expect(pageSource).toContain('VAULT_SELECTED_PARTNER_STORAGE_KEY');
    expect(pageSource).not.toMatch(
      /VAULT_SELECTED_PARTNER_STORAGE_KEY[\s\S]{0,200}PEOPLE_CHANGED_EVENT/,
    );
  });

  it('does not use first-eligible find predicates in the page', () => {
    expect(pageSource).not.toMatch(
      /people\.find\(\s*\(p\)\s*=>\s*p\.birth_date/,
    );
  });
});

describe('Vault partner selection i18n', () => {
  it('provides EN FA AR RU copy for unsupported and choose states', () => {
    for (const lang of ['en', 'fa', 'ar', 'ru'] as const) {
      const copy = VAULT_PARTNER_SELECTION_COPY[lang];
      expect(copy.readingFor.length).toBeGreaterThan(0);
      expect(copy.choosePartner.length).toBeGreaterThan(0);
      expect(copy.choosePartnerHint.length).toBeGreaterThan(0);
      expect(copy.noPeopleBody.length).toBeGreaterThan(0);
      expect(copy.addPersonCta.length).toBeGreaterThan(0);
      expect(copy.changeRelationshipCta.length).toBeGreaterThan(0);
      expect(copy.partnerProfileVsCompatNote.length).toBeGreaterThan(0);
      expect(copy.loading.length).toBeGreaterThan(0);
      expect(copy.apiError.length).toBeGreaterThan(0);
      expect(copy.choosePartnerHint).not.toBe(copy.noPeopleBody);
      expect(copy.unsupportedRelationship.toLowerCase()).toMatch(
        /romantic|عاطفی|романтическ|عاطفي|spouse|همسر|زوج|друг|friend|صديق|business|تجاری|делового|عمل/,
      );
      expect(copy.unsupportedRelationship.toLowerCase()).toMatch(
        /birth|تولد|ميلاد|рожден/,
      );
    }
  });

  it('keeps newly changed Arabic partner strings gender-neutral', () => {
    const ar = VAULT_PARTNER_SELECTION_COPY.ar;
    const gendered = /اختري|أضيفي|تحققي|افتحي|أكملي/;
    expect(ar.noPeopleBody).not.toMatch(gendered);
    expect(ar.apiError).not.toMatch(gendered);
    expect(ar.choosePartnerHint).not.toMatch(gendered);
    expect(ar.addPersonCta).not.toMatch(gendered);
    expect(ar.changeRelationshipCta).not.toMatch(gendered);
    expect(ar.partnerProfileVsCompatNote).not.toMatch(gendered);
    expect(ar.unsupportedRelationship).not.toMatch(gendered);
    expect(ar.loading).not.toMatch(gendered);
  });
});
