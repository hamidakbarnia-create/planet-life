/**
 * Architecture import-boundary: Personal Intelligence Core must not depend on Pathfinder.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'lib/intelligence');

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...listTsFiles(p));
    else if (name.name.endsWith('.ts') && !name.name.endsWith('.test.ts')) {
      out.push(p);
    }
  }
  return out;
}

describe('Intelligence Core import boundary', () => {
  it('does not import Pathfinder modules', () => {
    const files = listTsFiles(ROOT);
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      if (
        text.includes("from '@/lib/pathfinder-decision") ||
        text.includes('from "@/lib/pathfinder-decision')
      ) {
        offenders.push(file.replace(process.cwd() + '/', ''));
      }
    }
    expect(offenders).toEqual([]);
  });
});
