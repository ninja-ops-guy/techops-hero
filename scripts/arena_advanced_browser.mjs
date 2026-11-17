// Local-only qualification of the proposed directional Arena ruleset.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url),pw=require('playwright');
const core=require('../arena/advanced-simulation.js'),{cases,replay}=require('../arena/advanced-replay.cjs');
const out=path.resolve(process.env.ARENA_ADVANCED_EVIDENCE||'/tmp/arena-advanced-evidence');fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const sourceNames=['arena/advanced-input.js','arena/advanced-moves.js','arena/advanced-simulation.js','arena/advanced-transport.cjs','arena/server.cjs','arena/advanced-client.js','arena/advanced.html','arena/advanced-replay.cjs','scripts/arena_advanced_browser.mjs'];
const hashes=Object.fromEntries(sourceNames.map(n=>[n,hash(fs.readFileSync(path.join(root,n)))]));
const scenarios=cases(),nodeRuns=scenarios.map(scenario=>({scenario,trace:replay({scenario,simulation:core})}));
const summary={sourceHashes:hashes,node:process.version,playwright:require('playwright/package.json').version,nodeReplay:{cases:nodeRuns.length,steps:nodeRuns.reduce((n,r)=>n+r.trace.length,0),hashes:nodeRuns.map(r=>({name:r.scenario.name,sha256:hash(JSON.stringify(r.trace))}))},browsers:{},environment:{webkitExecutableOverride:!!process.env.ARENA_WEBKIT_EXECUTABLE},limits:['Local HTTP only; no internet impairment, physical-device or balance qualification.','Declared initial combat positions/postures are used only for replay fixtures. Browser matches use normal lobby and controls.','Portrait taps are browser automation, not physical iPhone acceptance.']};
const {start}=require('../arena/server.cjs');const server=start({port:0,advancedCombat:true});await new Promise((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject);});
const origin=`http://127.0.0.1:${server.address().port}`;
try{
 for(const name of ['chromium','webkit']){
  let browser;const result=summary.browsers[name]={status:'running',flows:[]};
  try{
   browser=await pw[name].launch({headless:true,...(name==='webkit'&&process.env.ARENA_WEBKIT_EXECUTABLE?{executablePath:process.env.ARENA_WEBKIT_EXECUTABLE}:{})});result.version=browser.version();const page=await browser.newPage();await page.goto(origin);await page.addScriptTag({url:origin+'/advanced-simulation.js'});
   for(const n of ['advanced-input.js','advanced-moves.js','advanced-simulation.js']){const response=await page.request.get(origin+'/'+n);assert.equal(hash(await response.body()),hashes['arena/'+n]);}
   for(const r of nodeRuns){const trace=await page.evaluate(replay,{scenario:r.scenario});assert.equal(hash(JSON.stringify(trace)),hash(JSON.stringify(r.trace)),`${name}/${r.scenario.name} diverged`);}
   result.replay={cases:nodeRuns.length,steps:summary.nodeReplay.steps,status:'passed'};await page.close();
   for(const portrait of [false,true]){
    const flow={profile:portrait?'portrait':'desktop'};result.flows.push(flow);
    const options=portrait?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:900}};
    const contexts=await Promise.all([browser.newContext(options),browser.newContext(options)]),pages=await Promise.all(contexts.map(c=>c.newPage()));
    const errors=[],states=[null,null],seenMoves=new Set();
    for(let i=0;i<2;i++){
     pages[i].on('pageerror',e=>errors.push(String(e)));
     pages[i].on('response',async r=>{if(r.url()===origin+'/api'){try{const b=await r.json();if(b.state){states[i]=b.state;for(const p of b.state.players)if(p.attack)seenMoves.add(p.attack.moveId);}}catch{}}});
     await pages[i].goto(origin);await pages[i].evaluate(()=>{localStorage.setItem('techops_hero_campaign_v1_2','{"sentinel":"unchanged","level":999}');sessionStorage.setItem('arena-sentinel','unchanged');});
    }
    await pages[0].locator('#create').click();await pages[0].waitForFunction(()=>/Room [A-F0-9]{8}/.test(document.querySelector('#status').textContent));
    const code=(await pages[0].locator('#status').textContent()).match(/Room ([A-F0-9]{8})/)[1];await pages[1].locator('#code').fill(code);await pages[1].locator('#join').click();
    const until=async(check,ms=6000)=>{const end=Date.now()+ms;while(!check()){if(Date.now()>end)throw Error('Browser condition timeout');await new Promise(r=>setTimeout(r,15));}};
    await until(()=>states.every(s=>s?.phase==='fight'));
    await Promise.all([pages[0].keyboard.down('d'),pages[1].keyboard.down('a')]);await until(()=>states[0].players[1].x-states[0].players[0].x<65);await Promise.all([pages[0].keyboard.up('d'),pages[1].keyboard.up('a')]);
    if(portrait){await pages[0].locator('[data-key="light"]').tap();await until(()=>states[0].players[1].hp===86);assert.ok(seenMoves.has('jab'));}
    else{await pages[0].keyboard.down('w');await pages[0].keyboard.press('e');await pages[0].keyboard.up('w');await until(()=>states[0].players[1].hp===80);assert.ok(seenMoves.has('uppercut'));}
    flow.confirmedHp=states[0].players[1].hp;flow.sameHpOnBothClients=false;
    await until(()=>states[1].players[1].hp===flow.confirmedHp);flow.sameHpOnBothClients=true;
    // Clear recovery, then a genuine UI jump followed by an aerial light.
    await new Promise(r=>setTimeout(r,450));
    if(portrait)await pages[0].locator('[data-key="jump"]').tap();else await pages[0].keyboard.press('Space');
    await until(()=>states[0].players[0].y<350);
    if(portrait)await pages[0].locator('[data-key="light"]').tap();else await pages[0].keyboard.press('e');
    await until(()=>seenMoves.has('air'));flow.aerialMove=true;
    for(const p of pages){assert.deepEqual(await p.evaluate(()=>[localStorage.getItem('techops_hero_campaign_v1_2'),sessionStorage.getItem('arena-sentinel')]),['{"sentinel":"unchanged","level":999}','unchanged']);}
    flow.storageUnchanged=true;assert.deepEqual(errors,[]);flow.pageErrors=0;
    // Screenshot stays local for visual inspection; it is not a user deliverable.
    await pages[0].screenshot({path:path.join(out,`${name}-${flow.profile}.png`)});
    await pages[0].locator('#leave').click();await until(()=>states[1]?.phase==='disconnected');flow.leave=true;flow.status='passed';
    await Promise.all(contexts.map(c=>c.close()));
   }
   result.status='passed';
  }catch(e){result.status='failed';result.error=String(e.stack||e);}
  finally{if(browser)await browser.close();}
 }
 for(const n of sourceNames)assert.equal(hash(fs.readFileSync(path.join(root,n))),hashes[n]);
 summary.status=Object.values(summary.browsers).every(r=>r.status==='passed')?'passed':'failed';
}finally{server.closeAllConnections();await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'browser-summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));}
if(summary.status!=='passed')process.exitCode=1;
