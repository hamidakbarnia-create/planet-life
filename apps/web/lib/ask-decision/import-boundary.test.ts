/**
 * Architecture import-boundary: Ask must not use the Pathfinder workflow barrel
 * for Conversation client or timing.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = [
  join(process.cwd(), 'lib/ask-decision'),
  join(process.cwd(), 'components/ask'),
  join(process.cwd(), 'components/ftue/AskScreen.tsx'),
  join(process.cwd(), 'components/ftue/ResultScreen.tsx'),
];

function listFiles(path: string): string[] {
  try {
    const st = readdirSync(path, { withFileTypes: true });
    const out: string[] = [];
    for (const name of st) {
      const p = join(path, name.name);
      if (name.isDirectory()) out.push(...listFiles(p));
      else if (
        (name.name.endsWith('.ts') || name.name.endsWith('.tsx')) &&
        !name.name.endsWith('.test.ts') &&
        !name.name.endsWith('.test.tsx')
      ) {
        out.push(p);
      }
    }
    return out;
  } catch {
    // file path
    return [path];
  }
}

describe('Ask import boundary', () => {
  it('does not import the Pathfinder package barrel', () => {
    const files = ROOTS.flatMap(listFiles);
    const offenders: string[] = [];
    const barrel = /from\s+['"]@\/lib\/pathfinder-decision['"]/;
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      if (barrel.test(text)) {
        offenders.push(file.replace(process.cwd() + '/', ''));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('imports Conversation client from the neutral shared module', () => {
    const run = readFileSync(join(process.cwd(), 'lib/ask-decision/run.ts'), 'utf8');
    expect(run).toMatch(/from\s+['"]@\/lib\/conversation-client['"]/);
    // Timing loader may live in run or prompt-context collect seam.
    const timingImport = /from\s+['"]@\/lib\/pathfinder-decision\/timing['"]/;
    const collect = readFileSync(
      join(process.cwd(), 'lib/ask-decision/prompt-context/collect.ts'),
      'utf8'
    );
    expect(timingImport.test(run) || timingImport.test(collect)).toBe(true);
  });
});
