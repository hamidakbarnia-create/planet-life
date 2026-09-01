import { describe, expect, it } from 'vitest';

import { HOME_LANGS } from './home-i18n';
import { VAULT_HOME_LANGS } from './vault-home-i18n';
import { SECTION_LANGS } from './vault-section-i18n';

describe('Persian METIORO Vault product copy', () => {
  it('uses گنجینه on shell, home, and section chrome — not محرمانه or خزانه', () => {
    expect(HOME_LANGS.fa.nav['/vault']).toBe('گنجینه');
    expect(HOME_LANGS.fa.nav.openVault).toBe('باز کردن گنجینه');
    expect(VAULT_HOME_LANGS.fa.title).toBe('گنجینه');
    expect(VAULT_HOME_LANGS.fa.inside).toBe('داخل گنجینه');
    expect(SECTION_LANGS.fa.vaultHome).toBe('گنجینه');
    expect(SECTION_LANGS.fa.back).toBe('→ بازگشت به گنجینه');

    const shell = [
      HOME_LANGS.fa.nav['/vault'],
      HOME_LANGS.fa.nav.openVault,
      VAULT_HOME_LANGS.fa.title,
      VAULT_HOME_LANGS.fa.inside,
      SECTION_LANGS.fa.vaultHome,
      SECTION_LANGS.fa.back,
    ].join(' ');
    expect(shell).not.toContain('محرمانه');
    expect(shell).not.toContain('خزانه');
    expect(shell).not.toMatch(/nav\.|openVault|HOME_LANGS/);
  });

  it('keeps EN, AR, and RU Vault product labels unchanged', () => {
    expect(HOME_LANGS.en.nav['/vault']).toBe('Vault');
    expect(HOME_LANGS.en.nav.openVault).toBe('Open the Vault');
    expect(HOME_LANGS.ar.nav['/vault']).toBe('الخزانة');
    expect(HOME_LANGS.ar.nav.openVault).toBe('فتح الخزانة');
    expect(HOME_LANGS.ru.nav['/vault']).toBe('Хранилище');
    expect(HOME_LANGS.ru.nav.openVault).toBe('Открыть хранилище');
    expect(VAULT_HOME_LANGS.en.title).toBe('The Vault');
    expect(VAULT_HOME_LANGS.ar.title).toBe('الخزانة');
    expect(VAULT_HOME_LANGS.ru.title).toBe('Хранилище');
    expect(SECTION_LANGS.en.vaultHome).toBe('The Vault');
    expect(SECTION_LANGS.ar.vaultHome).toBe('الخزانة');
    expect(SECTION_LANGS.ru.vaultHome).toBe('Хранилище');
  });
});
