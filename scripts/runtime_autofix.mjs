import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const artifactDir = process.env.RUNTIME_ARTIFACT_DIR || 'runtime-fixer-input';
const reportPaths = [
  path.join(artifactDir, 'report.md'),
  path.join(artifactDir, 'repl.txt'),
];

const evidence = reportPaths
  .filter((p) => fs.existsSync(p))
  .map((p) => fs.readFileSync(p, 'utf8'))
  .join('\n\n');

const result = {
  matched: [],
  changed: [],
  notes: [],
};

function read(rel) {
  const p = path.join(root, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

function write(rel, next) {
  const p = path.join(root, rel);
  const prev = read(rel);
  if (prev == null || prev === next) return false;
  fs.writeFileSync(p, next);
  result.changed.push(rel);
  return true;
}

function ensureStableCompositorLoadsFirst() {
  const rel = 'production_bootstrap.js';
  const src = read(rel);
  if (!src) return false;

  const filesMatch = src.match(/var FILES=\[([\s\S]*?)\];/);
  if (!filesMatch) return false;

  const entries = [...filesMatch[1].matchAll(/"([^"]+\.js)"/g)].map((m) => m[1]);
  const guard = 'production_wrapper_guard.js';
  const wrappers = [
    'good_dogs_production_runtime.js',
    'good_boys_canon_runtime.js',
    'good_boys_gameplay_loop.js',
  ];

  if (!entries.includes(guard)) return false;
  const guardIndex = entries.indexOf(guard);
  const firstWrapper = Math.min(...wrappers.filter((x) => entries.includes(x)).map((x) => entries.indexOf(x)));
  if (guardIndex < firstWrapper) {
    result.notes.push('Stable compositor already loads before Good Boys/Good Dogs wrappers.');
    return false;
  }

  const reordered = entries.filter((x) => x !== guard);
  const insertAt = Math.min(...wrappers.filter((x) => reordered.includes(x)).map((x) => reordered.indexOf(x)));
  reordered.splice(insertAt, 0, guard);

  const indent = '    ';
  const body = '\n' + reordered.map((x) => `${indent}"${x}"`).join(',\n') + '\n  ';
  const next = src.replace(/var FILES=\[([\s\S]*?)\];/, `var FILES=[${body}];`);
  if (write(rel, next)) {
    result.notes.push('Moved production_wrapper_guard.js before mutable renderer wrappers.');
    return true;
  }
  return false;
}

function hardenDrawInstall(rel, marker) {
  const src = read(rel);
  if (!src) return false;

  const markerCheck = `root.drawNM.${marker}`;
  if (!src.includes(markerCheck)) return false;

  // If the shared stable compositor is active, feature runtimes must not wrap it.
  // They remain free to draw through their exported overlay methods when routed.
  const needle = `if(typeof root.drawNM!=="function"||${markerCheck})return false;`;
  const replacement = `if(typeof root.drawNM!=="function"||root.drawNM.__productionStableCompositor||${markerCheck})return false;`;
  if (!src.includes(needle)) return false;
  return write(rel, src.replace(needle, replacement));
}

function applyDrawNmRecursionFix() {
  const signature = /Maximum call stack size exceeded|RangeError:[^\n]*call stack/i.test(evidence)
    && /drawNM|good_boys_gameplay_loop|good_boys_canon_runtime|good_dogs_production_runtime|campaign_sector04_runtime/i.test(evidence);
  if (!signature) return false;

  result.matched.push('drawNM-recursion');
  let changed = false;
  changed = ensureStableCompositorLoadsFirst() || changed;
  changed = hardenDrawInstall('good_boys_gameplay_loop.js', '__goodBoysGameplayLoop') || changed;
  changed = hardenDrawInstall('good_boys_canon_runtime.js', '__goodBoysCanon') || changed;

  if (!changed) result.notes.push('drawNM recursion matched, but repository already contains the known compositor safeguards.');
  return changed;
}

function applyMalformedAssetUrlFix() {
  const signature = /malformed|data url|data:image|sprite atlas/i.test(evidence)
    && /failed|error|invalid/i.test(evidence);
  if (!signature) return false;
  result.matched.push('asset-url');
  result.notes.push('Asset URL failure recognized; no generic mutation is safe without a concrete asset path.');
  return false;
}

applyDrawNmRecursionFix();
applyMalformedAssetUrlFix();

if (!evidence.trim()) {
  result.notes.push('No report.md or repl.txt was present in the Runtime bot artifact.');
}
if (!result.matched.length) {
  result.notes.push('No known-safe autofix signature matched.');
}

fs.writeFileSync('runtime-autofix-result.json', JSON.stringify(result, null, 2) + '\n');
fs.writeFileSync(
  'runtime-autofix-summary.md',
  [
    '# Runtime Autofix',
    '',
    `Matched: ${result.matched.length ? result.matched.join(', ') : 'none'}`,
    `Changed: ${result.changed.length ? result.changed.join(', ') : 'none'}`,
    '',
    ...result.notes.map((x) => `- ${x}`),
    '',
  ].join('\n'),
);

console.log(JSON.stringify(result, null, 2));
process.exit(0);
