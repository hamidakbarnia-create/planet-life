import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  assertInlinedMatchesGenerated,
  assertPatchSupportsPreviewProps,
  assertPreviewPropsManifest,
  assertWorkerInlinesPreviewProps,
  extractInlinedPreviewProps,
  runWorkerManifestGuard,
  BUILT_HANDLER,
  GENERATED_MANIFEST,
  PATCH_SOURCE,
  REQUIRED_PREVIEW_PROPS_FIELDS,
} from '../scripts/assert-worker-manifests.mjs';

/**
 * Regression cover for Cloudflare error 1101
 * (`Unexpected loadManifest(./.next/server/preview-props.json) call!`).
 *
 * The guard logic is asserted against fixtures so it runs identically whether
 * or not a build output exists, and the real artifacts are asserted on top of
 * that whenever they are present.
 */

// Non-secret stand-ins shaped like Next's real output (32/64/64 hex chars).
const ID = 'a'.repeat(32);
const SIGNING = 'b'.repeat(64);
const ENCRYPTION = 'c'.repeat(64);

const VALID_MANIFEST = JSON.stringify({
  previewModeId: ID,
  previewModeSigningKey: SIGNING,
  previewModeEncryptionKey: ENCRYPTION,
});

/** Shape of the code OpenNext generates, reduced to what the guard inspects. */
const handlerReturning = (literal: string) =>
  `function loadManifest(path3,...args){` +
  `if(path3.endsWith(".next/BUILD_ID"))return process.env.NEXT_BUILD_ID;` +
  `if(path3.endsWith("/server/preview-props.json"))return'${literal}';` +
  'throw new Error(`Unexpected loadManifest(${path3}) call!`);}';

const INLINED_HANDLER = handlerReturning(VALID_MANIFEST);

const UNINLINED_HANDLER =
  `function loadManifest(path3,...args){` +
  `if(path3.endsWith(".next/BUILD_ID"))return process.env.NEXT_BUILD_ID;` +
  'throw new Error(`Unexpected loadManifest(${path3}) call!`);}';

const FALLTHROUGH_HANDLER =
  `function loadManifest(path3,...args){` +
  `if(path3.endsWith("/server/preview-props.json")){}` +
  'throw new Error(`Unexpected loadManifest(${path3}) call!`);}';

describe('OpenNext patch support for preview-props.json', () => {
  it('accepts a patch that inlines preview-props.json', () => {
    expect(() =>
      assertPatchSupportsPreviewProps('join(dotNextDir, "server/preview-props.json"),')
    ).not.toThrow();
  });

  it('rejects a patch without preview-props support (the 1.20.2 regression)', () => {
    const glob = '**/{*-manifest,required-server-files,prefetch-hints}.json';
    expect(() => assertPatchSupportsPreviewProps(glob)).toThrow(/1\.20\.13/);
  });

  it('rejects a missing or empty patch source', () => {
    expect(() => assertPatchSupportsPreviewProps('')).toThrow(/missing or empty/);
    expect(() => assertPatchSupportsPreviewProps(null)).toThrow(/missing or empty/);
    expect(() =>
      runWorkerManifestGuard({ patchPath: '/nonexistent/load-manifest.js' })
    ).toThrow(/Missing OpenNext load-manifest patch/);
  });

  it('holds for the installed OpenNext release', () => {
    // Asserts whatever `npm ci` resolved, so a lockfile that drops back to a
    // release without preview-props support fails here rather than in prod.
    expect(existsSync(PATCH_SOURCE)).toBe(true);
    expect(() =>
      assertPatchSupportsPreviewProps(readFileSync(PATCH_SOURCE, 'utf8'))
    ).not.toThrow();
  });
});

describe('preview-props manifest validation', () => {
  it('accepts a manifest with every required field', () => {
    const parsed = assertPreviewPropsManifest(VALID_MANIFEST);
    expect(Object.keys(parsed).sort()).toEqual(
      [...REQUIRED_PREVIEW_PROPS_FIELDS].sort()
    );
  });

  it('rejects invalid JSON', () => {
    expect(() => assertPreviewPropsManifest('{"previewModeId":')).toThrow(
      /not valid JSON/
    );
  });

  it('rejects an empty manifest', () => {
    expect(() => assertPreviewPropsManifest('')).toThrow(/is empty/);
    expect(() => assertPreviewPropsManifest('   ')).toThrow(/is empty/);
  });

  it('rejects JSON that is not an object', () => {
    expect(() => assertPreviewPropsManifest('[]')).toThrow(/not a JSON object/);
    expect(() => assertPreviewPropsManifest('null')).toThrow(/not a JSON object/);
    expect(() => assertPreviewPropsManifest('"text"')).toThrow(/not a JSON object/);
  });

  it('rejects each individually missing required field', () => {
    for (const field of REQUIRED_PREVIEW_PROPS_FIELDS) {
      const partial = JSON.parse(VALID_MANIFEST) as Record<string, string>;
      delete partial[field];
      expect(() => assertPreviewPropsManifest(JSON.stringify(partial))).toThrow(
        new RegExp(`missing required field\\(s\\): ${field}`)
      );
    }
  });

  it('rejects empty or non-string field values', () => {
    expect(() =>
      assertPreviewPropsManifest(
        JSON.stringify({ ...JSON.parse(VALID_MANIFEST), previewModeId: '' })
      )
    ).toThrow(/empty or non-string field\(s\): previewModeId/);

    expect(() =>
      assertPreviewPropsManifest(
        JSON.stringify({ ...JSON.parse(VALID_MANIFEST), previewModeSigningKey: 123 })
      )
    ).toThrow(/empty or non-string field\(s\): previewModeSigningKey/);
  });

  it('never puts manifest values in the error message', () => {
    const leaky = JSON.stringify({ previewModeId: SIGNING });
    try {
      assertPreviewPropsManifest(leaky);
      throw new Error('expected a validation failure');
    } catch (err) {
      const message = (err as Error).message;
      expect(message).not.toContain(SIGNING);
      expect(message).toContain('previewModeEncryptionKey');
    }
  });
});

describe('built Worker manifest inlining', () => {
  it('accepts a handler that resolves the manifest inline', () => {
    expect(() => assertWorkerInlinesPreviewProps(INLINED_HANDLER)).not.toThrow();
    expect(extractInlinedPreviewProps(INLINED_HANDLER)).toBe(VALID_MANIFEST);
  });

  it('rejects a handler with no inlined branch', () => {
    expect(() => assertWorkerInlinesPreviewProps(UNINLINED_HANDLER)).toThrow(
      /no inlined branch/
    );
  });

  it('rejects a branch that falls through to the unhandled-manifest throw', () => {
    expect(() => assertWorkerInlinesPreviewProps(FALLTHROUGH_HANDLER)).toThrow(
      /does not return the manifest body/
    );
  });

  it('rejects a branch returning a wrong or malformed value', () => {
    expect(() => assertWorkerInlinesPreviewProps(handlerReturning('{}'))).toThrow(
      /missing required field/
    );
    expect(() =>
      assertWorkerInlinesPreviewProps(handlerReturning('not-json'))
    ).toThrow(/not valid JSON/);
  });

  it('treats a missing build artifact as a failure, never a pass', () => {
    expect(() => assertWorkerInlinesPreviewProps('')).toThrow(/missing or empty/);
    expect(() => assertWorkerInlinesPreviewProps(null)).toThrow(/missing or empty/);
    expect(() =>
      runWorkerManifestGuard({ handlerPath: '/nonexistent/handler.mjs' })
    ).toThrow(/Missing built Worker handler/);
  });
});

describe('inlined manifest matches the generated manifest', () => {
  const generated = JSON.parse(VALID_MANIFEST) as Record<string, string>;

  it('accepts an exact match', () => {
    expect(() =>
      assertInlinedMatchesGenerated(JSON.parse(VALID_MANIFEST), generated)
    ).not.toThrow();
  });

  it('rejects a stale inlined copy without logging values', () => {
    const stale = { ...generated, previewModeId: 'd'.repeat(32) };
    try {
      assertInlinedMatchesGenerated(stale, generated);
      throw new Error('expected a mismatch failure');
    } catch (err) {
      const message = (err as Error).message;
      expect(message).toContain('previewModeId');
      expect(message).not.toContain(stale.previewModeId);
      expect(message).not.toContain(generated.previewModeId);
    }
  });

  it('fails closed when the generated manifest is absent', () => {
    expect(() =>
      runWorkerManifestGuard({ generatedPath: '/nonexistent/preview-props.json' })
    ).toThrow(/Missing generated preview-props manifest|Missing built Worker handler/);
  });
});

describe('guard against the real build output', () => {
  it('passes end to end when a build is present, and fails closed when not', () => {
    // `npm test` runs before `opennextjs-cloudflare build` in CI, so the
    // artifact is absent there. The build pipeline enforces the same guard via
    // scripts/assert-worker-manifests.mjs, which hard-fails when it is missing.
    if (!existsSync(BUILT_HANDLER)) {
      expect(() => runWorkerManifestGuard()).toThrow(/Missing built Worker handler/);
      return;
    }

    expect(existsSync(GENERATED_MANIFEST)).toBe(true);
    const result = runWorkerManifestGuard();
    expect(result.fields).toEqual([...REQUIRED_PREVIEW_PROPS_FIELDS]);
  });

  it('matches the field set Next actually generated', () => {
    if (!existsSync(GENERATED_MANIFEST)) return;
    const generated = JSON.parse(readFileSync(GENERATED_MANIFEST, 'utf8'));
    for (const field of REQUIRED_PREVIEW_PROPS_FIELDS) {
      expect(typeof generated[field]).toBe('string');
      expect(generated[field].length).toBeGreaterThan(0);
    }
  });
});
