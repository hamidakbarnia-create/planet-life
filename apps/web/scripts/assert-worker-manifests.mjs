/**
 * OpenNext Worker manifest guard.
 *
 * `readFileSync` is unavailable in workerd, so OpenNext rewrites Next's
 * `loadManifest` at build time into a chain of inlined manifests and throws
 * `Unexpected loadManifest(...)` for anything it did not inline. Next 16.4
 * loads `server/preview-props.json` without `handleMissing`, so an OpenNext
 * release that does not inline that file produces a Worker which builds and
 * uploads cleanly, then fails every request with Cloudflare error 1101.
 *
 * That shipped once: the lockfile pinned @opennextjs/cloudflare 1.20.2, whose
 * inlining glob (`**\/{*-manifest,required-server-files,prefetch-hints}.json`)
 * does not match `preview-props.json`. Support landed in 1.20.13.
 *
 * Runs after `opennextjs-cloudflare build` and before any deploy.
 * Does not deploy. Never prints manifest values — preview keys are secrets,
 * so failures report field names only.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WEB_ROOT = join(__dirname, '..');

export const PREVIEW_PROPS_PATH = 'server/preview-props.json';
export const UNHANDLED_MANIFEST_THROW = 'Unexpected loadManifest(';

/** Next's `__ApiPreviewProps` (next/dist/server/api-utils/index.d.ts). */
export const REQUIRED_PREVIEW_PROPS_FIELDS = Object.freeze([
  'previewModeId',
  'previewModeEncryptionKey',
  'previewModeSigningKey',
]);

export const PATCH_SOURCE = join(
  WEB_ROOT,
  'node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/load-manifest.js'
);

export const BUILT_HANDLER = join(
  WEB_ROOT,
  '.open-next/server-functions/default/handler.mjs'
);

/** The manifest OpenNext inlined from, emitted by `next build`. */
export const GENERATED_MANIFEST = join(
  WEB_ROOT,
  '.open-next/server-functions/default/.next',
  PREVIEW_PROPS_PATH
);

function fail(message) {
  console.error(`[worker-manifest-guard] ${message}`);
  process.exit(1);
}

/** The installed OpenNext release must know to inline preview-props.json. */
export function assertPatchSupportsPreviewProps(source) {
  if (typeof source !== 'string' || source.trim() === '') {
    throw new Error('OpenNext load-manifest patch source is missing or empty');
  }
  if (!source.includes(PREVIEW_PROPS_PATH)) {
    throw new Error(
      `Installed @opennextjs/cloudflare does not inline ${PREVIEW_PROPS_PATH}. ` +
        'Upgrade to >=1.20.13; 1.20.2 and earlier produce a Worker that throws error 1101.'
    );
  }
}

/**
 * Validate the manifest body itself.
 *
 * Reports field names only — the values are preview-mode signing and
 * encryption keys and must never reach logs.
 */
export function assertPreviewPropsManifest(raw, { label = 'Inlined' } = {}) {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new Error(`${label} preview-props manifest is empty`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${label} preview-props manifest is not valid JSON`);
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} preview-props manifest is not a JSON object`);
  }

  const missing = REQUIRED_PREVIEW_PROPS_FIELDS.filter(
    (field) => !Object.prototype.hasOwnProperty.call(parsed, field)
  );
  if (missing.length > 0) {
    throw new Error(
      `${label} preview-props manifest is missing required field(s): ${missing.join(', ')}`
    );
  }

  const unusable = REQUIRED_PREVIEW_PROPS_FIELDS.filter(
    (field) => typeof parsed[field] !== 'string' || parsed[field].trim() === ''
  );
  if (unusable.length > 0) {
    throw new Error(
      `${label} preview-props manifest has empty or non-string field(s): ${unusable.join(', ')}`
    );
  }

  return parsed;
}

/** Pull the manifest body out of the generated `loadManifest` branch. */
export function extractInlinedPreviewProps(handlerSource) {
  if (typeof handlerSource !== 'string' || handlerSource.trim() === '') {
    throw new Error(
      'Built Worker handler is missing or empty — run `opennextjs-cloudflare build` first'
    );
  }

  const marker = `.endsWith("/${PREVIEW_PROPS_PATH}")`;
  const branch = handlerSource.indexOf(marker);
  if (branch === -1) {
    throw new Error(
      `Built Worker has no inlined branch for ${PREVIEW_PROPS_PATH}; ` +
        'it would throw Unexpected loadManifest(...) at runtime (error 1101)'
    );
  }

  // The branch must return a string literal directly. Anything else — an empty
  // body, a nested lookup — lets control reach the unhandled-manifest throw.
  const afterBranch = handlerSource.slice(branch + marker.length);
  const returned = /^\)\s*(?:\{\s*)?return\s*(['"`])((?:\\.|[^\\])*?)\1/.exec(
    afterBranch
  );
  if (!returned) {
    throw new Error(
      `Inlined branch for ${PREVIEW_PROPS_PATH} does not return the manifest body; ` +
        `it falls through to ${UNHANDLED_MANIFEST_THROW}...) at runtime (error 1101)`
    );
  }

  // Undo JS string escaping of the embedded quote character only; manifest
  // values are hex strings, so no other escapes occur in practice.
  return returned[2].replaceAll(`\\${returned[1]}`, returned[1]);
}

export function assertWorkerInlinesPreviewProps(handlerSource) {
  return assertPreviewPropsManifest(extractInlinedPreviewProps(handlerSource));
}

/**
 * The inlined copy must match the manifest `next build` actually emitted,
 * otherwise the Worker serves preview keys that no longer correspond to the
 * build. Compared by field, never by logged value.
 */
export function assertInlinedMatchesGenerated(inlined, generated) {
  const mismatched = REQUIRED_PREVIEW_PROPS_FIELDS.filter(
    (field) => inlined[field] !== generated[field]
  );
  if (mismatched.length > 0) {
    throw new Error(
      'Inlined preview-props manifest does not match the generated manifest ' +
        `for field(s): ${mismatched.join(', ')}`
    );
  }
}

export function runWorkerManifestGuard({
  patchPath = PATCH_SOURCE,
  handlerPath = BUILT_HANDLER,
  generatedPath = GENERATED_MANIFEST,
} = {}) {
  if (!existsSync(patchPath)) {
    throw new Error(`Missing OpenNext load-manifest patch: ${patchPath}`);
  }
  assertPatchSupportsPreviewProps(readFileSync(patchPath, 'utf8'));

  if (!existsSync(handlerPath)) {
    throw new Error(
      `Missing built Worker handler: ${handlerPath} — run \`opennextjs-cloudflare build\` first`
    );
  }
  const inlined = assertWorkerInlinesPreviewProps(
    readFileSync(handlerPath, 'utf8')
  );

  if (!existsSync(generatedPath)) {
    throw new Error(`Missing generated preview-props manifest: ${generatedPath}`);
  }
  const generated = assertPreviewPropsManifest(
    readFileSync(generatedPath, 'utf8'),
    { label: 'Generated' }
  );
  assertInlinedMatchesGenerated(inlined, generated);

  return { fields: [...REQUIRED_PREVIEW_PROPS_FIELDS] };
}

function main() {
  try {
    const result = runWorkerManifestGuard();
    console.log(
      `[worker-manifest-guard] OK — ${PREVIEW_PROPS_PATH} inlined and matches ` +
        `the generated manifest (fields: ${result.fields.join(', ')})`
    );
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main();
}
