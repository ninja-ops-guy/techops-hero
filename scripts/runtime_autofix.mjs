import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { mediaFailureSources, repositoryMediaPath } from './runtime_autofix_evidence.mjs';

const root = process.cwd();
const artifactDir = process.env.RUNTIME_ARTIFACT_DIR || 'runtime-fixer-input';
const resultPath = process.env.RUNTIME_AUTOFIX_RESULT || 'runtime-autofix-result.json';
const summaryPath = process.env.RUNTIME_AUTOFIX_SUMMARY || 'runtime-autofix-summary.md';

const result = {
  matched: [],
  changed: [],
  notes: [],
  evidenceFiles: [],
  screenshotFiles: [],
  traceFiles: [],
  diagnostics: [],
};

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const artifactFiles = walk(artifactDir);
result.screenshotFiles = artifactFiles.filter((p) => /\.(png|jpe?g|webp)$/i.test(p)).map((p) => path.relative(artifactDir, p));
result.traceFiles = artifactFiles.filter((p) => /trace.*\.zip$/i.test(p)).map((p) => path.relative(artifactDir, p));

const evidenceFiles = artifactFiles.filter((p) => {
  if (!/\.(md|txt|json|log)$/i.test(p)) return false;
  try { return fs.statSync(p).size <= 6 * 1024 * 1024; } catch { return false; }
});
result.evidenceFiles = evidenceFiles.map((p) => path.relative(artifactDir, p));
const evidence = evidenceFiles.map((p) => {
  try { return '\n### ' + path.relative(artifactDir, p) + '\n' + fs.readFileSync(p, 'utf8'); }
  catch { return ''; }
}).join('\n');

function read(rel) {
  const p = path.join(root, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

function write(rel, next) {
  const p = path.join(root, rel);
  const prev = read(rel);
  if (prev == null || prev === next) return false;
  fs.writeFileSync(p, next);
  if (!result.changed.includes(rel)) result.changed.push(rel);
  return true;
}

function run(cmd, args, options = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...options });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '', error: r.error ? String(r.error) : '' };
}

function ensureStableCompositorLoadsFirst() {
  const rel = 'production_bootstrap.js';
  const src = read(rel);
  if (!src) return false;
  const filesMatch = src.match(/var FILES=\[([\s\S]*?)\];/);
  if (!filesMatch) return false;
  const entries = [...filesMatch[1].matchAll(/"([^"]+\.js)"/g)].map((m) => m[1]);
  const guard = 'production_wrapper_guard.js';
  const wrappers = ['good_dogs_production_runtime.js','good_boys_canon_runtime.js','good_boys_gameplay_loop.js'];
  if (!entries.includes(guard)) return false;
  const wrapperIndexes = wrappers.filter((x) => entries.includes(x)).map((x) => entries.indexOf(x));
  if (!wrapperIndexes.length) return false;
  const guardIndex = entries.indexOf(guard);
  const firstWrapper = Math.min(...wrapperIndexes);
  if (guardIndex < firstWrapper) {
    result.notes.push('Stable compositor already loads before Good Boys/Good Dogs wrappers.');
    return false;
  }
  const reordered = entries.filter((x) => x !== guard);
  const insertAt = Math.min(...wrappers.filter((x) => reordered.includes(x)).map((x) => reordered.indexOf(x)));
  reordered.splice(insertAt, 0, guard);
  const body = '\n' + reordered.map((x) => '    "' + x + '"').join(',\n') + '\n  ';
  const next = src.replace(/var FILES=\[([\s\S]*?)\];/, 'var FILES=[' + body + '];');
  if (write(rel, next)) {
    result.notes.push('Moved production_wrapper_guard.js before mutable renderer wrappers.');
    return true;
  }
  return false;
}

function hardenDrawInstall(rel, marker) {
  const src = read(rel);
  if (!src) return false;
  const markerCheck = 'root.drawNM.' + marker;
  if (!src.includes(markerCheck)) return false;
  const needle = 'if(typeof root.drawNM!=="function"||' + markerCheck + ')return false;';
  const replacement = 'if(typeof root.drawNM!=="function"||root.drawNM.__productionStableCompositor||' + markerCheck + ')return false;';
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

function probeVideo(rel) {
  const r = run('ffprobe', ['-v','error','-select_streams','v:0','-show_entries','stream=codec_name,pix_fmt,width,height','-of','json', rel]);
  let parsed = null;
  try { parsed = JSON.parse(r.stdout); } catch {}
  return { ...r, parsed };
}

function applyChromiumMediaFix() {
  if (!/DEMUXER_ERROR_NO_SUPPORTED_STREAMS|FFmpegDemuxer:\s*no supported streams/i.test(evidence)) return false;
  const sources = mediaFailureSources(evidenceFiles.map(p => fs.readFileSync(p, 'utf8')));
  const paths = [...new Set(sources.map(repositoryMediaPath).filter(Boolean))];
  result.matched.push('chromium-mp4-demux');
  if (!paths.length) {
    result.notes.push('Chromium demux failure matched without an exact media source in the failing record; refusing proximity-based repair.');
    return false;
  }
  let changed = false;
  for (const rel of paths) changed = repairMedia(rel) || changed;
  return changed;
}

function repairMedia(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs) || !fs.realpathSync(abs).startsWith(fs.realpathSync(root) + path.sep)) {
    result.notes.push('Reported media is unavailable in this checkout: ' + rel);
    return false;
  }
  const head = fs.readFileSync(abs, { encoding: null }).subarray(0, 160).toString('utf8');
  if (/git-lfs\.github\.com\/spec\/v1/i.test(head)) {
    result.notes.push('Referenced MP4 is still a Git LFS pointer; checkout must enable LFS before repair.');
    return false;
  }
  const before = probeVideo(rel);
  const original = before.parsed?.streams?.[0];
  if (before.status !== 0 || !original) {
    result.notes.push('Unable to verify source video streams for ' + rel + '; no automatic transcode.');
    return false;
  }
  if (original.codec_name === 'h264' && original.pix_fmt === 'yuv420p') {
    result.diagnostics.push({ rule:'media-already-compatible', file:rel, before:before.parsed });
    result.notes.push(rel + ' already uses H.264/yuv420p. Investigate browser decoding/loading; repeated lossy encoding is not a verified repair.');
    return false;
  }
  const tmp = abs + '.runtime-fixer.mp4';
  const ff = run('ffmpeg', [
    '-hide_banner','-loglevel','error','-y','-i',abs,
    '-map','0:v:0?','-map','0:a:0?',
    '-c:v','libx264','-profile:v','high','-pix_fmt','yuv420p',
    '-movflags','+faststart','-c:a','aac','-b:a','160k',tmp,
  ]);
  if (ff.status !== 0 || !fs.existsSync(tmp)) {
    try { fs.rmSync(tmp, { force: true }); } catch {}
    result.notes.push('ffmpeg could not safely transcode ' + rel + ': ' + (ff.stderr || ff.error).slice(-1200));
    return false;
  }
  const afterProbe = probeVideo(path.relative(root, tmp));
  const stream = afterProbe.parsed?.streams?.[0];
  if (afterProbe.status !== 0 || !stream || stream.codec_name !== 'h264' || stream.pix_fmt !== 'yuv420p' || stream.width !== original.width || stream.height !== original.height) {
    fs.rmSync(tmp, { force: true });
    result.notes.push('Transcoded MP4 failed Chromium-safe validation for ' + rel + '.');
    return false;
  }
  fs.renameSync(tmp, abs);
  result.changed.push(rel);
  result.diagnostics.push({ rule:'chromium-mp4-demux', file:rel, before:before.parsed, after:afterProbe.parsed });
  result.notes.push('Re-encoded ' + rel + ' to H.264/yuv420p with faststart for Chromium compatibility.');
  return true;
}

function applyGoodBoysInitializationAssertionFix() {
  const signature = /good-boys-authority-mutated/i.test(evidence)
    && /beforeGb["']?\s*[:=]\s*null/i.test(evidence)
    && /afterGb/i.test(evidence)
    && /"m"\s*:\s*1/i.test(evidence)
    && /"evidence"\s*:\s*\[\]/i.test(evidence);
  if (!signature) return false;
  result.matched.push('good-boys-default-bootstrap');
  const rel = 'scripts/late_game_mobile_bot.mjs';
  const src = read(rel);
  if (!src) return false;
  if (src.includes('gbInitializationOnly')) {
    result.notes.push('Good Boys bootstrap assertion is already semantic and allows canonical lazy initialization.');
    return false;
  }
  const old = [
    '  const beforeGb=seeded.goodBoys;',
    '  const afterGb=a.goodBoys==null?null:JSON.stringify(a.goodBoys);',
    "  if(beforeGb!==afterGb)fail('good-boys-authority-mutated',{beforeGb,afterGb});",
  ].join('\n');
  const next = [
    '  const beforeGb=seeded.goodBoys;',
    '  const afterGb=a.goodBoys==null?null:JSON.stringify(a.goodBoys);',
    '  const canonicalDefaultGb=JSON.stringify({m:1,evidence:[],k:false,waldo:false,done:false});',
    '  const gbInitializationOnly=beforeGb==null&&afterGb===canonicalDefaultGb;',
    "  if(beforeGb!==afterGb&&!gbInitializationOnly)fail('good-boys-authority-mutated',{beforeGb,afterGb});",
    "  if(gbInitializationOnly)log('good-boys-authority-default-initialized',{beforeGb,afterGb});",
  ].join('\n');
  if (!src.includes(old)) {
    result.notes.push('Good Boys bootstrap signature matched, but the assertion shape changed; refusing generic mutation.');
    return false;
  }
  if (write(rel, src.replace(old, next))) {
    result.notes.push('Changed late-game authority check to ignore canonical default-state lazy initialization.');
    return true;
  }
  return false;
}

function classifyUnfixedEvidence() {
  if (/MORNINGSTAR[\s\S]{0,1200}(hidden=false|visible=true)[\s\S]{0,500}inDialog=false/i.test(evidence)) {
    result.diagnostics.push({ rule:'morningstar-modal-ownership', likelyArea:'MORNINGSTAR/swarm panel show-hide lifecycle and S.inDialog ownership' });
    result.notes.push('Detected MORNINGSTAR panel/modal ownership mismatch; no generic mutation is applied because modal intent must be preserved.');
  }
  if (/net::ERR_ABORTED/i.test(evidence) && /\.mp4/i.test(evidence)) {
    result.diagnostics.push({ rule:'media-request-abort', likelyArea:'Good Boys cutscene media loader or referenced MP4 encoding' });
  }
}

applyDrawNmRecursionFix();
applyChromiumMediaFix();
applyGoodBoysInitializationAssertionFix();
classifyUnfixedEvidence();

if (!evidence.trim()) result.notes.push('No readable report/repl/json/log evidence was present in the Runtime bot artifact.');
if (!result.matched.length) result.notes.push('No known-safe autofix signature matched.');

fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + '\n');
fs.writeFileSync(summaryPath, [
  '# Runtime Autofix',
  '',
  'Matched: ' + (result.matched.length ? result.matched.join(', ') : 'none'),
  'Changed: ' + (result.changed.length ? result.changed.join(', ') : 'none'),
  'Evidence files: ' + result.evidenceFiles.length,
  'Screenshots: ' + result.screenshotFiles.length,
  'Playwright traces: ' + result.traceFiles.length,
  '',
  ...result.notes.map((x) => '- ' + x),
  '',
].join('\n'));

console.log(JSON.stringify(result, null, 2));
process.exit(0);
