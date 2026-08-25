import fs from 'node:fs';
import path from 'node:path';
import { chromium, webkit, devices } from 'playwright';

const BASE = process.env.BOT_BASE_URL || 'http://127.0.0.1:4173/';
const OUT = process.env.BOT_OUT_DIR || 'runtime-bot-artifacts';
fs.mkdirSync(OUT, { recursive: true });
const transcript = [];
const findings = [];
const started = Date.now();

function repl(label, value) {
  const line = `[${new Date().toISOString()}] > ${label}${value === undefined ? '' : `\n${JSON.stringify(value, null, 2)}`}`;
  transcript.push(line);
  console.log(line);
}
function fail(mode, issue, detail = {}) {
  findings.push({ severity: 'FAIL', mode, issue, ...detail });
  repl(`FAIL ${mode}: ${issue}`, detail);
}
function warn(mode, issue, detail = {}) {
  findings.push({ severity: 'WARN', mode, issue, ...detail });
  repl(`WARN ${mode}: ${issue}`, detail);
}

async function snapshotRuntime(page) {
  return page.evaluate(() => {
    const text = (id) => document.getElementById(id)?.textContent?.trim() || '';
    const vis = (id) => {
      const e = document.getElementById(id);
      if (!e) return false;
      const s = getComputedStyle(e);
      return !e.classList.contains('hidden') && s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity || 1) !== 0;
    };
    let runtime = {};
    try {
      runtime = window.eval(`(function(){
        var s = (typeof S !== 'undefined' && S) ? S : null;
        var n = (typeof NM !== 'undefined' && NM) ? NM : null;
        var c = n && n._v736;
        return {
          hasS: !!s,
          nightMode: !!(s && s.nightMode),
          clock: s && s.clock,
          char: s && s.meta && s.meta._char,
          hasNM: !!n,
          nm: n ? {x:n.x,y:n.y,district:n.district,street:n.street,hp:n.hp,cam:n.cam} : null,
          pair: !!(c && c.chars && c.chars.katrin && c.chars.manchez && c.partner),
          activeDog: c && c.active,
          mission: c && c.m
        };
      })()`);
    } catch (e) { runtime = { evalError: String(e && e.stack || e) }; }
    let canvas = { ok:false };
    try {
      const cv = document.getElementById('game');
      const ctx = cv && cv.getContext('2d', { willReadFrequently: true });
      if (cv && ctx && cv.width && cv.height) {
        const sx = Math.max(0, Math.floor(cv.width * .1));
        const sy = Math.max(0, Math.floor(cv.height * .1));
        const sw = Math.max(1, Math.floor(cv.width * .8));
        const sh = Math.max(1, Math.floor(cv.height * .8));
        const d = ctx.getImageData(sx, sy, sw, sh).data;
        let nonBlack=0, alpha=0, min=255, max=0;
        for (let i=0;i<d.length;i+=16) {
          const r=d[i], g=d[i+1], b=d[i+2], a=d[i+3];
          if (a>0) alpha++;
          if (r+g+b>24) nonBlack++;
          min=Math.min(min,r,g,b); max=Math.max(max,r,g,b);
        }
        canvas={ok:true,width:cv.width,height:cv.height,nonBlack,alpha,range:max-min};
      }
    } catch (e) { canvas={ok:false,error:String(e)}; }
    return {
      url: location.href,
      title: document.title,
      buttons: Array.from(document.querySelectorAll('button')).filter(b=>getComputedStyle(b).display!=='none').map(b=>b.textContent.trim()).filter(Boolean),
      titleVisible: vis('title-screen'),
      hudVisible: vis('hud'),
      touchVisible: vis('touch-ui'),
      recoveryVisible: !!document.getElementById('good-boys-mobile-recovery'),
      toast: text('toast'),
      bodyText: document.body.innerText.slice(0, 3500),
      runtime,
      canvas,
      mode: window.__productionActiveMode || window.__productionDesiredMode || null,
      routerError: window.__productionModeRouterError || null,
      safetyError: window.__techOpsLastRuntimeError || null,
      goodBoysError: window.__goodBoysCoreBroken || null
    };
  });
}

async function clickByRegex(page, regex, timeout=2500) {
  const buttons = page.locator('button');
  const n = await buttons.count();
  for (let i=0;i<n;i++) {
    const b = buttons.nth(i);
    let txt='';
    try { txt=(await b.innerText()).trim(); } catch {}
    if (regex.test(txt)) {
      try { await b.click({ timeout }); return txt; } catch {}
    }
  }
  return null;
}

async function settle(page, ms=5000) {
  const until = Date.now()+ms;
  while (Date.now()<until) {
    await page.waitForTimeout(250);
    const txt = await page.locator('body').innerText().catch(()=> '');
    if (/SELECT SHIFT DIFFICULTY/i.test(txt)) await clickByRegex(page,/Standard/i,500).catch(()=>{});
    if (/BEGIN THE INCIDENT/i.test(txt)) await clickByRegex(page,/BEGIN THE INCIDENT/i,500).catch(()=>{});
  }
}

async function runMode(browserType, profileName, contextOptions, mode) {
  repl(`launch ${profileName} :: ${mode}`);
  const browser = await browserType.launch({ headless:true });
  const context = await browser.newContext(contextOptions);
  await context.tracing.start({ screenshots:true, snapshots:true, sources:true });
  const page = await context.newPage();
  const consoleErrors=[];
  const pageErrors=[];
  page.on('console', m => { if (m.type()==='error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => pageErrors.push(String(e && e.stack || e)));
  try {
    await page.goto(BASE, { waitUntil:'domcontentloaded', timeout:30000 });
    await page.waitForTimeout(1800);
    let clicked;
    if (mode==='nightcrawler') clicked = await clickByRegex(page,/NIGHT\s*CRAWLER/i);
    else clicked = await clickByRegex(page,/(118\/1984|BREAKOUT|GOOD\s*BOYS)/i);
    if (!clicked) {
      const s=await snapshotRuntime(page);
      fail(mode,'launch button not found',{profileName,buttons:s.buttons});
      await page.screenshot({path:path.join(OUT,`${profileName}-${mode}-missing-button.png`),fullPage:true});
      return;
    }
    repl(`${profileName} clicked`, clicked);
    await settle(page, mode==='goodboys'?8000:6000);

    // Retry a surfaced Good Boys recovery exactly once, then measure again.
    if (mode==='goodboys' && await page.locator('#gb-mobile-retry').count()) {
      warn(mode,'recovery surfaced; bot executing one retry',{profileName});
      await page.locator('#gb-mobile-retry').click().catch(()=>{});
      await settle(page,5000);
    }

    const s1=await snapshotRuntime(page);
    await page.screenshot({path:path.join(OUT,`${profileName}-${mode}.png`),fullPage:true});
    repl(`${profileName} ${mode} state`,s1);
    if (pageErrors.length) fail(mode,'uncaught page errors',{profileName,pageErrors});
    if (consoleErrors.length) warn(mode,'console errors',{profileName,consoleErrors:consoleErrors.slice(0,20)});
    if (s1.safetyError) fail(mode,'runtime safety captured exception',{profileName,error:s1.safetyError});
    if (s1.canvas.ok && (s1.canvas.nonBlack < 20 || s1.canvas.range < 8)) fail(mode,'canvas appears blank/stalled',{profileName,canvas:s1.canvas});
    if (!s1.canvas.ok) warn(mode,'canvas probe unavailable',{profileName,canvas:s1.canvas});

    if (mode==='nightcrawler') {
      if (!s1.runtime.nightMode || !s1.runtime.hasNM) fail(mode,'Night runtime did not attach',{profileName,runtime:s1.runtime,routerError:s1.routerError});
      if (s1.runtime.char !== 'nightcrawler') fail(mode,'Night Crawler identity not active',{profileName,runtime:s1.runtime});
      if (s1.recoveryVisible) fail(mode,'unexpected Good Boys recovery on Night Crawler',{profileName});
    } else {
      if (s1.recoveryVisible || s1.goodBoysError) fail(mode,'Good Boys recovery remains active',{profileName,error:s1.goodBoysError});
      if (!s1.runtime.nightMode || !s1.runtime.hasNM) fail(mode,'Good Boys has no Night world',{profileName,runtime:s1.runtime,routerError:s1.routerError});
      if (!s1.runtime.pair) fail(mode,'Katrin/Manchez pair not attached',{profileName,runtime:s1.runtime});
      if (!['katrin','manchez'].includes(s1.runtime.activeDog)) fail(mode,'active playable dog invalid',{profileName,runtime:s1.runtime});
      if (!/KATRIN/i.test(s1.bodyText) || !/MANCHEZ/i.test(s1.bodyText)) warn(mode,'pair HUD names not both visible',{profileName});
    }

    // Frame-liveness: snapshot twice. x/cam/canvas should remain valid and errors must not appear.
    await page.waitForTimeout(1600);
    const s2=await snapshotRuntime(page);
    repl(`${profileName} ${mode} liveness`,s2);
    if (s2.safetyError) fail(mode,'runtime errored during liveness window',{profileName,error:s2.safetyError});
    if (!s2.canvas.ok || (s2.canvas.nonBlack < 20 || s2.canvas.range < 8)) fail(mode,'canvas failed liveness window',{profileName,canvas:s2.canvas});
  } catch (e) {
    fail(mode,'bot exception',{profileName,error:String(e&&e.stack||e)});
    await page.screenshot({path:path.join(OUT,`${profileName}-${mode}-exception.png`),fullPage:true}).catch(()=>{});
  } finally {
    await context.tracing.stop({path:path.join(OUT,`${profileName}-${mode}-trace.zip`)}).catch(()=>{});
    await browser.close();
  }
}

const profiles = [
  {name:'iphone-webkit', browser:webkit, options:{...devices['iPhone 15 Pro'], viewport:{width:393,height:852}}},
  {name:'desktop-chromium', browser:chromium, options:{viewport:{width:1440,height:900}}}
];
for (const p of profiles) {
  for (const mode of ['nightcrawler','goodboys']) await runMode(p.browser,p.name,p.options,mode);
}

const report = {
  timestamp:new Date().toISOString(),
  baseUrl:BASE,
  durationMs:Date.now()-started,
  pass:!findings.some(f=>f.severity==='FAIL'),
  failures:findings.filter(f=>f.severity==='FAIL').length,
  warnings:findings.filter(f=>f.severity==='WARN').length,
  findings
};
fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(OUT,'repl.txt'),transcript.join('\n\n')+'\n');
const md=[
  '# TechOps Hero Runtime Bot',
  '',`- Result: **${report.pass?'PASS':'FAIL'}**`,`- Target: \`${BASE}\``,`- Failures: ${report.failures}`,`- Warnings: ${report.warnings}`,`- Duration: ${(report.durationMs/1000).toFixed(1)}s`,'',
  '## Findings','',
  findings.length ? findings.map((f,i)=>`${i+1}. **${f.severity} / ${f.mode}** — ${f.issue}\n\n   \`${JSON.stringify(f)}\``).join('\n') : 'No findings.',
  '', '## REPL transcript', '', 'See `repl.txt` and Playwright trace ZIPs in the workflow artifact.'
].join('\n');
fs.writeFileSync(path.join(OUT,'report.md'),md);
console.log('\n'+md);
if (!report.pass) process.exitCode=1;
