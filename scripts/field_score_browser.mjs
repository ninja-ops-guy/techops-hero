// Real Web Audio qualification with generated test tones; no artist assets.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const runtime=fs.readFileSync('runtime_field_score.js','utf8');
const catalog=JSON.parse(fs.readFileSync('assets/music/field-score.json','utf8'));
const wav=Buffer.alloc(44+96000*2*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(48000,24);wav.writeUInt32LE(192000,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);
for(let i=0;i<96000;i++){const v=Math.round(Math.sin(i*2*Math.PI*220/48000)*300);wav.writeInt16LE(v,44+i*4);wav.writeInt16LE(v,46+i*4);}
const fixture=structuredClone(catalog);fixture.source='artist-stems';fixture.tracks.agamemnon.status='ready';fixture.tracks.agamemnon.pack={approved:true,bpm:120,bars:1,meter:[4,4],phraseBars:1,percussionLayer:'pulse',layers:Object.fromEntries(['bed','pulse','threat','quiet'].map(k=>[k,'assets/music/fixture_'+k+'.wav']))};
const requests=[];let ready=false,failAudio=false;
const server=http.createServer((req,res)=>{
 requests.push(req.url);if(req.url==='/runtime_field_score.js'){res.setHeader('Content-Type','application/javascript');res.end(runtime);}
 else if(req.url==='/assets/music/field-score.json'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(ready?fixture:catalog));}
 else if(/^\/assets\/music\/fixture_\w+\.wav$/.test(req.url)){if(failAudio){res.writeHead(404);res.end();}else{res.setHeader('Content-Type','audio/wav');res.end(wav);}}
 else {res.setHeader('Content-Type','text/html');res.end('<button id="start">Start score</button><script src="/runtime_field_score.js"></script><script>window.cue={episode:"iona_world_left_running",actor:"iona",moment:"depot-heist"};window.starts=[];const original=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(at){starts.push(at);return original.call(this,at)};document.getElementById("start").onclick=async()=>{try{await TechOpsFieldScore.start();await TechOpsFieldScore.loadConfiguredPack(cue);TechOpsFieldScore.update(cue);window.started=true}catch(e){window.failure=e.message}};</script>');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const executablePath=process.env.CHROMIUM_EXECUTABLE||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
const browser=await chromium.launch({headless:true,executablePath});const reports=[];
try{
 for(const [profile,viewport,touch] of [['desktop',{width:1280,height:800},false],['portrait-touch',{width:390,height:844},true]]){
  const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  ready=false;failAudio=false;requests.length=0;await page.goto(`http://127.0.0.1:${server.address().port}`);
  assert(!requests.some(x=>x.includes('/assets/music/')));await (touch?page.locator('#start').tap():page.locator('#start').click());await page.waitForFunction(()=>window.started||window.failure);
  let d=await page.evaluate(()=>TechOpsFieldScore.diagnostics());assert.equal(d.source,'reference-arrangement');assert.equal(d.availability,'pending');assert(!requests.some(x=>x.endsWith('.wav')));
  ready=true;await page.reload();await (touch?page.locator('#start').tap():page.locator('#start').click());await page.waitForFunction(()=>window.started||window.failure);
  const result=await page.evaluate(()=>({d:TechOpsFieldScore.diagnostics(),starts,failure:window.failure}));assert.equal(result.failure,undefined);assert.equal(result.d.source,'artist-stems');assert.equal(result.d.voices,4);assert.equal(new Set(result.starts).size,1);assert(result.d.decodedBytes>0&&result.d.decodedBytes<64*1024*1024);
  for(const action of ['pause','mute','rehearsal','blur']){
   const r=await page.evaluate(action=>{const s=TechOpsFieldScore;if(action==='pause')s.update({blocked:true});if(action==='mute')s.setMuted(true);if(action==='rehearsal')s.tap(0);if(action==='blur')window.dispatchEvent(new Event('blur'));const d=s.diagnostics();s.setMuted(false);s.update(cue);return d;},action);
   assert.equal(r.voices,action==='rehearsal'?1:0);
  }
  await page.evaluate(()=>TechOpsFieldScore.stop());d=await page.evaluate(()=>TechOpsFieldScore.diagnostics());assert.equal(d.decodedBytes,0);assert.equal(d.voices,0);assert.deepEqual(errors,[]);
  failAudio=true;await page.reload();await (touch?page.locator('#start').tap():page.locator('#start').click());await page.waitForFunction(()=>window.started||window.failure);
  const fallback=await page.evaluate(()=>TechOpsFieldScore.diagnostics());assert.equal(fallback.source,'reference-arrangement');assert.equal(fallback.availability,'error');assert.equal(fallback.enabled,true);assert.equal(await page.evaluate(()=>window.failure),undefined);
  reports.push({profile,pass:true,sharedClock:true,layers:4,decodedBytes:result.d.decodedBytes,checks:'gesture gate, pending fallback, real WAV decode, synchronized starts, pause, mute, rehearsal, blur, buffer release, initial missing-file fallback'});await context.close();
 }
 console.log(JSON.stringify({browser:browser.version(),scope:'Synthetic Web Audio fixtures; not artist listening acceptance or physical iPhone qualification',reports},null,2));
}finally{await browser.close();server.close();}
