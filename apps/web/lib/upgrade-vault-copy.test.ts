import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const UPGRADE_PAGE = resolve(__dirname, '../app/upgrade/page.tsx');

function faUpgradeBlock(source: string): string {
  const start = source.indexOf('\n  fa: {');
  const ar = source.indexOf('\n  ar: {', start + 1);
  expect(start).toBeGreaterThan(-1);
  expect(ar).toBeGreaterThan(start);
  return source.slice(start, ar);
}

describe('Persian /upgrade Vault product copy', () => {
  const source = readFileSync(UPGRADE_PAGE, 'utf8');
  const fa = faUpgradeBlock(source);

  it('uses گنجینه for every METIORO Vault surface on /upgrade', () => {
    expect(fa).toContain('Premium: گنجینه باز می‌شه');
    expect(fa).toContain("vaultUnlocks: 'گنجینه رو باز می‌کنه'");
    expect(fa).toContain("tagline: 'گنجینه باز می‌شه.'");
    expect(fa).toContain("cta: 'باز کردن گنجینه'");
    expect(fa).toContain("'گنجینه — جذابیت · بدن · حامی'");
    expect(fa).toContain("'گنجینه — اتاق سایه · تقویم قدرت'");
    expect(fa).toContain('داخل گنجینه');
  });

  it('does not leave محرمانه or خزانه as the Vault noun', () => {
    expect(fa).not.toContain('محرمانه');
    expect(fa).not.toContain('خزانه');
    expect(fa).not.toContain('باز کردن محرمانه');
    expect(fa).not.toMatch(/nav\.|insight\.|{range}/);
  });

  it('keeps EN, AR, and RU Vault upgrade nouns unchanged', () => {
    expect(source).toContain('Premium opens the Vault');
    expect(source).toContain("vaultUnlocks: 'Unlocks the Vault'");
    expect(source).toContain("tagline: 'The Vault opens.'");
    expect(source).toContain("cta: 'Open the Vault'");
    expect(source).toContain('يفتح الخزانة');
    expect(source).toContain('تنفتح الخزانة');
    expect(source).toContain('Открывает Хранилище');
    expect(source).toContain('Хранилище открывается');
  });
});

describe('Love Lines upgrade claim matches the text-list feature', () => {
  const source = readFileSync(UPGRADE_PAGE, 'utf8');

  it('does not sell Love Lines as a world map in EN/RU/FA/AR', () => {
    expect(source).not.toMatch(/love-line astrocartography/i);
    expect(source).not.toContain('линии любви на карте мира');
    expect(source).not.toContain('خط عشق روی نقشه دنیا');
    expect(source).not.toContain('خطوط الحب على خريطة العالم');
    expect(source).toContain('Love Lines compare a candidate-city shortlist as text, not a world map');
    expect(source).toContain('«Линии любви» сравнивают короткий список городов текстом, а не на карте мира');
    expect(source).toContain('خط‌های عشق فهرست کوتاه شهرهای نامزد را به‌صورت متن مقایسه می‌کنند، نه روی نقشه دنیا');
    expect(source).toContain('خطوط الحب تقارنان قائمة المدن المرشحة كنص، وليستا خريطة للعالم');
  });
});
