#!/usr/bin/env node
/**
 * Sprint A Phase 0 — pixel diff report vs committed baseline.
 * Complements Playwright snapshot compare with explicit diff percentages.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import {
  captureCases,
  screenshotName,
  DIFF_FAIL_RATIO,
  DIFF_WARN_RATIO,
  EXPECTED_BASELINE_COUNT,
} from './config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baselineDir = path.join(__dirname, 'baseline');
const currentDir = path.join(__dirname, '.current');

function readPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function diffPercent(baselinePath, currentPath) {
  const img1 = readPng(baselinePath);
  const img2 = readPng(currentPath);

  if (img1.width !== img2.width || img1.height !== img2.height) {
    return { percent: 100, mismatched: img1.width * img1.height, total: img1.width * img1.height, sizeMismatch: true };
  }

  const diff = new PNG({ width: img1.width, height: img1.height });
  const mismatched = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, {
    threshold: 0.1,
    includeAA: true,
  });
  const total = img1.width * img1.height;
  return { percent: (mismatched / total) * 100, mismatched, total, sizeMismatch: false };
}

function main() {
  if (!fs.existsSync(baselineDir)) {
    console.error('Missing baseline directory:', baselineDir);
    console.error('Run: npm run visual:baseline');
    process.exit(1);
  }

  const cases = captureCases();
  if (cases.length !== EXPECTED_BASELINE_COUNT) {
    console.warn(`Warning: expected ${EXPECTED_BASELINE_COUNT} cases, config has ${cases.length}`);
  }

  const rows = [];
  let missing = 0;
  let fail = 0;
  let warn = 0;

  for (const { route, lang, viewport } of cases) {
    const name = screenshotName(route, lang, viewport.id);
    const baselinePath = path.join(baselineDir, name);
    const currentPath = path.join(currentDir, name);

    if (!fs.existsSync(baselinePath)) {
      missing += 1;
      rows.push({ name, percent: null, status: 'MISSING_BASELINE' });
      continue;
    }
    if (!fs.existsSync(currentPath)) {
      missing += 1;
      rows.push({ name, percent: null, status: 'MISSING_CURRENT' });
      continue;
    }

    const { percent, sizeMismatch } = diffPercent(baselinePath, currentPath);
    let status = 'PASS';
    if (sizeMismatch || percent / 100 > DIFF_FAIL_RATIO) {
      status = 'FAIL';
      fail += 1;
    } else if (percent / 100 > DIFF_WARN_RATIO) {
      status = 'WARN';
      warn += 1;
    }
    rows.push({ name, percent, status });
  }

  console.log('METIORO visual diff report');
  console.log('baseline:', baselineDir);
  console.log('current :', currentDir);
  console.log('---');
  for (const row of rows) {
    const pct = row.percent == null ? 'n/a' : `${row.percent.toFixed(4)}%`;
    console.log(`${row.status.padEnd(7)} ${pct.padStart(10)}  ${row.name}`);
  }
  console.log('---');
  console.log(`total=${rows.length} fail=${fail} warn=${warn} missing=${missing}`);

  if (missing > 0 || fail > 0) {
    process.exit(1);
  }
}

main();
