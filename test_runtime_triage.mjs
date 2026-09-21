import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {EventEmitter} from 'node:events';
import {spawnSync} from 'node:child_process';
import {SUITES, buildTriage, inventory, renderTriage, writeBundle, run} from './scripts/runtime_triage.mjs';
import {beginRuntimeEvidence} from './scripts/runtime_evidence_capture.mjs';
const workflow = fs.readFileSync(new URL('./.github/workflows/runtime-bot.yml', import.meta.url), 'utf8');
const nightCombatWorkflow = fs.readFileSync(new URL('./.github/workflows/night-combat-validation.yml', import.meta.url), 'utf8');

function fixture(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-triage-test-'));
  t.after(() => fs.rmSync(base, {recursive: true, force: true}));
  const root = path.join(base, 'input'), out = path.join(base, 'bundle');
  fs.mkdirSync(root);
  const steps = {};
  for (const suite of SUITES) {
    fs.writeFileSync(path.join(root, suite.report), JSON.stringify({pass: true, findings: []}));
    steps[suite.id] = {outputs: {exit_code: '0'}};
  }
  return {base, root, out, steps};
}
function write(f, name, value) { fs.writeFileSync(path.join(f.root, name), typeof value === 'string' ? value : JSON.stringify(value)); }

test('all nine suites pass only with exit codes and valid reports', t => {
  const f = fixture(t), data = buildTriage(f);
  assert.equal(data.status, 'pass'); assert.equal(data.suites.length, 9); assert.deepEqual(data.findings, []);
});
for (const suite of SUITES) test(`${suite.id}-only exit failure is surfaced`, t => {
  const f = fixture(t); f.steps[suite.id].outputs.exit_code = '1';
  const data = buildTriage(f);
  assert.equal(data.status, 'fail'); assert.equal(data.findings[0].suite, suite.id);
  assert.deepEqual(data.findings[0].likelyCodeAreas, [suite.script]);
});
test('run 762 co-op evidence is isolated; broader traces do not masquerade as co-op coverage', t => {
  const f = fixture(t);
  write(f, 'coop.json', [{browser: 'chromium', mode: 'local', pass: false,
    error: 'P2 input moved P1 or failed to move P2: {"original":{"a":110,"b":50},"p2":{"a":110,"b":73.78640000000007}}',
    state: {x: 110, p: {x: 73.78640000000007}}}, {browser: 'webkit', mode: 'local', pass: true}]);
  write(f, 'coop-chromium-local-error.png', 'screenshot fixture');
  write(f, 'desktop-chromium-goodboys-trace.zip', 'not a co-op trace');
  write(f, 'coop-webkit-local-trace.zip', 'different browser');
  write(f, 'repl.txt', 'REPL fixture');
  const data = buildTriage(f), finding = data.findings[0];
  assert.equal(data.status, 'fail'); // A false exit-code zero cannot hide a failing report.
  assert.equal(finding.browser, 'chromium'); assert.equal(finding.mode, 'local');
  assert.equal(finding.runtimeEvidence.x, 110);
  assert.deepEqual(finding.screenshots, ['coop-chromium-local-error.png']);
  assert.deepEqual(finding.traces, []); assert.deepEqual(finding.runtime, ['repl.txt']);
  write(f, 'coop-chromium-local-trace.zip', 'correct trace');
  assert.deepEqual(buildTriage(f).findings[0].traces, ['coop-chromium-local-trace.zip']);
});
test('warnings survive without making a healthy suite fail', t => {
  const f = fixture(t); write(f, 'report.json', {pass: true, findings: [{severity: 'WARN', issue: 'console errors', consoleErrors: ['404']}]});
  const data = buildTriage(f); assert.equal(data.status, 'pass'); assert.equal(data.findings[0].severity, 'warning');
});
test('capture failures remain explicit even when gameplay passed', t => {
  const f = fixture(t); write(f, 'coop.json', [{pass: true, browser: 'webkit', mode: 'solo', artifacts: {captureErrors: ['Trace stop failed']}}]);
  const data = buildTriage(f); assert.equal(data.status, 'pass'); assert.match(data.findings[0].message, /capture incomplete/);
});
for (const bad of ['{broken', 'null', '[]', '{}']) test(`malformed/empty report is not green: ${bad}`, t => {
  const f = fixture(t); write(f, 'coop.json', bad); assert.equal(buildTriage(f).status, 'fail');
});
test('missing report, missing output, timeout, and absent directory fail closed', t => {
  const f = fixture(t); fs.unlinkSync(path.join(f.root, 'coop.json')); delete f.steps.intro; f.steps.bot.outputs.exit_code = '124';
  const data = buildTriage(f); assert.equal(data.suites.filter(s => s.status === 'fail').length, 3);
  assert.equal(buildTriage({root: path.join(f.base, 'missing')}).status, 'fail');
});
test('oversized report is rejected without parsing', t => {
  const f = fixture(t); write(f, 'coop.json', ' '.repeat(8 * 1024 * 1024 + 1));
  assert.match(buildTriage(f).suites.find(s => s.id === 'coop').reportError, /size limit/);
});
test('symlink evidence is never followed', t => {
  const f = fixture(t); fs.symlinkSync('/etc/passwd', path.join(f.root, 'escape.json'));
  const data = inventory(f.root); assert.ok(!data.files.some(file => file.path === 'escape.json')); assert.match(data.omitted[0], /symlink refused/);
});
test('compact bundle includes JSON, REPL and failure screenshot, not trace archives', t => {
  const f = fixture(t); write(f, 'repl.txt', 'session'); write(f, 'coop-chromium-local-error.png', 'image'); write(f, 'coop-chromium-local-trace.zip', 'trace');
  const data = buildTriage(f); writeBundle(data, f.root, f.out);
  assert.ok(fs.existsSync(path.join(f.out, 'triage.json')));
  assert.ok(fs.existsSync(path.join(f.out, 'evidence/coop-chromium-local-error.png')));
  assert.ok(!fs.existsSync(path.join(f.out, 'evidence/coop-chromium-local-trace.zip')));
  assert.ok(data.bundle.evidenceBytes <= data.bundle.evidenceBudgetBytes);
  assert.throws(() => writeBundle(data, f.root, f.out), /must be empty/);
  assert.throws(() => writeBundle(data, f.root, path.join(f.root, 'nested')), /disjoint/);
});
test('untrusted report markup and mentions are neutralized in summary', t => {
  const f = fixture(t); write(f, 'coop.json', [{pass: false, error: '<script>alert(1)</script> @owner `command` | cell'}]);
  const markdown = renderTriage(buildTriage(f));
  assert.ok(!markdown.includes('<script>')); assert.ok(!markdown.includes('@owner')); assert.match(markdown, /UNTRUSTED OBSERVATIONS/);
});
test('CLI binds PR head separately from tested merge SHA and preserves real artifact ID', t => {
  const f = fixture(t), event = path.join(f.base, 'event.json'), output = path.join(f.base, 'output'), summary = path.join(f.base, 'summary');
  fs.writeFileSync(event, JSON.stringify({pull_request: {number: 26, head: {sha: 'head-sha'}}}));
  const data = run({BOT_OUT_DIR: f.root, RUNTIME_TRIAGE_DIR: f.out, RUNTIME_STEP_RESULTS: JSON.stringify(f.steps),
    GITHUB_EVENT_PATH: event, GITHUB_EVENT_NAME: 'pull_request', GITHUB_REPOSITORY: 'ninja-ops-guy/techops-hero',
    GITHUB_RUN_ID: '34702513737', GITHUB_RUN_ATTEMPT: '2', GITHUB_SHA: 'tested-merge-sha',
    RUNTIME_ARTIFACT_ID: '10301235945', RUNTIME_ARTIFACT_DIGEST: 'sha256:example', GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: summary});
  assert.equal(data.source.headSha, 'head-sha'); assert.equal(data.source.testedSha, 'tested-merge-sha');
  assert.equal(data.artifact.name, 'runtime-bot-tested-merge-sha'); assert.equal(data.artifact.id, '10301235945');
  assert.equal(fs.readFileSync(output, 'utf8'), 'status=pass\n');
});

test('trace capture stops once before cleanup and retains runtime failures', async t => {
  const f = fixture(t), page = new EventEmitter(); let starts = 0, stops = 0;
  const context = {tracing: {start: async opts => {starts++; assert.equal(opts.snapshots, true);},
    stop: async opts => {stops++; fs.writeFileSync(opts.path, 'trace fixture');}}};
  const capture = await beginRuntimeEvidence(context, page, {out: f.root, prefix: 'coop-chromium-local'});
  page.emit('pageerror', new Error('runtime error'));
  page.emit('response', {status: () => 404, url: () => 'https://user:password@example.test/asset.png?token=secret#fragment'});
  for (let i = 0; i < 600; i++) page.emit('console', {type: () => 'error', text: () => 'console error'});
  const first = await capture.finish(), second = await capture.finish();
  assert.deepEqual(first, second); assert.equal(starts, 1); assert.equal(stops, 1);
  const log = JSON.parse(fs.readFileSync(path.join(f.root, first.runtime)));
  assert.equal(log.console.length, 500); assert.match(log.pageErrors[0], /runtime error/);
  assert.equal(log.requests[0].url, 'https://example.test/asset.png'); assert.equal(page.listenerCount('console'), 0);
});
for (const phase of ['start', 'stop']) test(`trace ${phase} failure cannot invent a trace`, async t => {
  const f = fixture(t), context = {tracing: {start: async () => {}, stop: async () => {}}};
  context.tracing[phase] = async () => {throw new Error('closed context');};
  const capture = await beginRuntimeEvidence(context, new EventEmitter(), {out: f.root, prefix: 'coop-webkit-solo'});
  const result = await capture.finish(); assert.equal(result.trace, null); assert.match(result.captureErrors[0], /closed context/);
  assert.ok(fs.existsSync(path.join(f.root, result.runtime)));
});

test('workflow gate parity and privilege boundaries', () => {
  const gates = [...workflow.matchAll(/test "\$\{\{ steps\.([\w_]+)\.outputs\.exit_code \}\}" = "0"/g)].map(match => match[1]).sort();
  assert.deepEqual(gates, SUITES.map(s => s.id).sort());
  const pr = workflow.split('  pr-triage:')[1].split('  report-failure:')[0];
  const reporter = workflow.split('  report-failure:')[1];
  assert.match(pr, /github\.event_name == 'pull_request'/); assert.doesNotMatch(pr, /: write|GH_TOKEN|uses: actions\/checkout/);
  assert.match(reporter, /github\.event_name != 'pull_request'/); assert.match(reporter, /github\.ref == 'refs\/heads\/main'/);
  assert.match(reporter, /needs\.browser-runtime\.result == 'failure'/); assert.match(reporter, /needs\.media-isolation\.result == 'failure'/);
  assert.doesNotMatch(reporter, /uses: actions\/checkout|contents: write|pull-requests: write/);
  assert.equal((workflow.match(/issues: write/g) || []).length, 1);
  assert.match(workflow, /name: runtime-triage-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/);
});
test('runtime Night combat timeout matches the authoritative integration budget', () => {
  const runtimeMatch = workflow.match(/^\s*timeout\s+(\d+)s\s+node scripts\/night_combat_bot\.mjs\s*$/m);
  const integrationMatch = nightCombatWorkflow.match(/^\s*timeout\s+(\d+)s\s+node scripts\/night_combat_bot\.mjs\s*$/m);
  assert.ok(runtimeMatch, 'Runtime bot must retain an explicit Night combat timeout');
  assert.ok(integrationMatch, 'Night Combat Integration must retain an explicit timeout');
  assert.equal(Number(runtimeMatch[1]), Number(integrationMatch[1]), 'Runtime bot cannot kill Night combat earlier than its authoritative integration gate');
  assert.ok(Number(runtimeMatch[1]) >= 300, 'three-profile Night combat needs the qualified 300-second budget');
});
test('co-op instrumentation does not relax original movement or isolation assertions', () => {
  const source = fs.readFileSync(new URL('./scripts/good_dogs_coop_bot.mjs', import.meta.url), 'utf8');
  assert.match(source, /Math\.abs\(original\.a-p2\.a\)>5\|\|p2\.b-original\.b<25/);
  assert.match(source, /p1\.a-p2\.a<25\|\|Math\.abs\(p1\.b-p2\.b\)>10/);
  assert.ok(source.indexOf('await capture.finish()') < source.indexOf('await context.close()'));
});

const reporterCode = [...workflow.matchAll(/node --input-type=module <<'JS'\n([\s\S]*?)\n {10}JS/g)].at(-1)[1].replace(/^ {10}/gm, '');
function simulateReporter(t, {issues = [], comments = '', report = null} = {}) {
  const f = fixture(t), bin = path.join(f.base, 'bin'); fs.mkdirSync(bin);
  fs.mkdirSync(path.join(f.base, 'runtime-triage'));
  if (report !== null) fs.writeFileSync(path.join(f.base, 'runtime-triage/triage.md'), report);
  const stub = `#!/usr/bin/env node\nconst fs=require('fs');const args=process.argv.slice(2);fs.appendFileSync(process.env.CALLS,JSON.stringify(args)+'\\n');if(args[0]==='issue'&&args[1]==='list')console.log(process.env.ISSUES);else if(args[0]==='api')console.log(process.env.COMMENTS);`;
  fs.writeFileSync(path.join(bin, 'gh'), stub, {mode: 0o755});
  const calls = path.join(f.base, 'calls');
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', reporterCode], {cwd: f.base, encoding: 'utf8',
    env: {...process.env, PATH: bin + path.delimiter + process.env.PATH, CALLS: calls, ISSUES: JSON.stringify(issues), COMMENTS: comments,
      GITHUB_REPOSITORY: 'ninja-ops-guy/techops-hero', GITHUB_RUN_ID: '762', GITHUB_RUN_ATTEMPT: '1', GITHUB_SHA: 'test-sha',
      BROWSER_RESULT: 'failure', MEDIA_RESULT: 'success', CONTRACT_RESULT: 'success', GITHUB_STEP_SUMMARY: path.join(f.base, 'summary')}});
  assert.equal(result.status, 0, result.stderr);
  return fs.readFileSync(calls, 'utf8').trim().split('\n').map(line => JSON.parse(line));
}
test('reporter creates an issue even when triage artifact is missing', t => {
  const calls = simulateReporter(t); assert.ok(calls.some(args => args[0] === 'issue' && args[1] === 'create'));
});
test('reporter appends evidence to existing issue without executing artifact text', t => {
  const calls = simulateReporter(t, {issues: [{number: 9, title: 'Runtime Bot: playable-mode regression', body: ''}], report: 'literal $(exit 99) evidence'});
  assert.ok(calls.some(args => args[0] === 'issue' && args[1] === 'comment' && args[2] === '9'));
});
test('same run attempt is not posted twice', t => {
  const calls = simulateReporter(t, {issues: [{number: 9, title: 'Runtime Bot: playable-mode regression', body: ''}], comments: '<!-- runtime-triage:762:1 -->'});
  assert.ok(!calls.some(args => args[0] === 'issue' && ['create', 'comment'].includes(args[1])));
});
