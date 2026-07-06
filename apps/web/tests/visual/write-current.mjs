#!/usr/bin/env node
/** Writes fresh captures to tests/visual/.current for diff-report.mjs */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const currentDir = path.join(__dirname, '.current');
const baselineDir = path.join(__dirname, 'baseline');

fs.rmSync(currentDir, { recursive: true, force: true });
fs.mkdirSync(currentDir, { recursive: true });

if (!fs.existsSync(baselineDir)) {
  console.error('Baseline folder missing. Run npm run visual:baseline first.');
  process.exit(1);
}

const result = spawnSync(
  'npx',
  [
    'playwright',
    'test',
    '--project=visual-current',
    'tests/visual/capture-current.spec.ts',
  ],
  { stdio: 'inherit', shell: true, cwd: path.join(__dirname, '..', '..') },
);

process.exit(result.status ?? 1);
