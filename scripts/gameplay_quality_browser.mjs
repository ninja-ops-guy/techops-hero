/* Offline Chromium renderer/audio fixtures using the real concern modules.
 * No navigation, campaign progression, real-device or cinematic acceptance claim.
 * Inputs are explicit mission fixtures; source atlases are the repo's exact bytes.
 * node scripts/gameplay_quality_browser.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const out=process.env.BOT_OUT_DIR||'runtime-bot-artifacts/quality';fs.mkdirSync(out,{recursive:true});
const manifest=JSON.parse(fs.readFileSync('assets/handoff/atlas.json','utf8'));
for(const a of Object.values(manifest.atlases))a.src='data:image/png;base64,'+fs.readFileSync(a.src).toString('base64');
const browser=await chromium.launch({headless:true,...(process.env.BOT_CHROMIUM_EXECUTABLE?{executablePath:process.env.BOT_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox']});
const reports=[];
try{for(const viewport of [{width:1280,height:800},{width:390,height:844}]){
 const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setContent('<!doctype html><title>TechOps concern-module fixture</title><style>html,body{margin:0;background:#02060a;color:#eee;font-family:monospace}canvas{display:block}#audio-test{position:fixed;bottom:12px;left:12px;padding:12px}</style><canvas id="game"></canvas><button id="audio-test">Test confirmed combat</button>');
 await page.evaluate(m=>{window.fetch=async()=>({ok:true,json:async()=>m});window.TechOpsM3CinematicAsset={image:()=>null};window.__productionSingleCompositor=true;},manifest);
 for(const file of ['cinematic_systems.js','orbital_tiles.source.js','orbital_tiles.atlas.js','good_boys_prison_cinematic_patch.js','production_gameplay_experience.js','orbital_scene_staging.js','good_boys_gameplay_loop.js','good_boys_hud_lite.js','runtime_combat_audio.js','runtime_hud.js','night_combat.js'])await page.addScriptTag({content:fs.readFileSync(file,'utf8')});
 await page.evaluate(()=>{clearInterval(TechOpsGoodBoysPrisonCinematicPatch.timer);TechOpsArtHandoff.load();});
 await page.waitForFunction(()=>TechOpsArtHandoff.health().status==='ready');
 await page.evaluate(()=>{TechOpsArtHandoff.image('prison');TechOpsArtHandoff.image('kat');TechOpsArtHandoff.image('man');TechOpsGoodBoysPrisonCinematicPatch.buildBackdrops();});
 await page.waitForFunction(()=>TechOpsArtHandoff.health().atlases.filter(a=>a.status==='ready').length===3&&NM_BG734.goodboys_cell118?.complete);
 await page.evaluate(v=>{
  const canvas=document.querySelector('canvas');canvas.width=v.width;canvas.height=v.height;window.ctx=canvas.getContext('2d');
  window.renderQualityFixture=m=>{
   const row=TechOpsLevelRegistry.goodDogsMission(m),x=m===4?1060:m===5?1050:m===6?1120:1480;
   const c={m,active:'katrin',chars:{katrin:{hp:90,maxHp:100},manchez:{hp:110,maxHp:120}},sync:65,evidence:[{x:500,found:true},{x:800,found:true},{x:1100,found:false},{x:1400,found:false}],uplink:m===6?{x:420,hp:100,maxHp:120}:null,decrypt:m===6?35:undefined};
   if(m===5){c._gbMikeIndexDefeated=true;}
   const n=window.NM={x,y:396,w:22,h:34,vx:3,onGround:true,face:1,hp:90,cam:Math.max(0,x-v.width*.52),enemies:[],district:row.environment.district,_v736:c,platforms:row.stage.platforms.map(p=>({x:p[0],y:p[1],w:p[2]}))};
   if(m===5)n._gbAccessCoreSecuritySeeded=true;
   window.S={nightMode:n,inDialog:false,meta:{_v736:{m,k:m>=5,waldo:false}}};
   window.TechOpsGoodBoysCanon={SEQUENCE:TechOpsLevelRegistry.goodBoysSequence()};
   const base=NM_BG734[row.environment.background];const ctx=window.ctx;ctx.imageSmoothingEnabled=false;ctx.globalAlpha=1;ctx.fillStyle='#03080e';ctx.fillRect(0,0,v.width,v.height);
   // Existing generated fallback stays visible. This is not new approved backplate art.
   const bh=430,bw=base.naturalWidth*(bh/base.naturalHeight);ctx.drawImage(base,(v.width-bw)/2,0,bw,bh);
   TechOpsOrbitalStaging.drawBackdrop(ctx,n);ctx.fillStyle='#0a1620';ctx.fillRect(0,430,v.width,v.height-430);
   TechOpsArtHandoff.drawEnvironment(ctx,n,'back',1000);
   for(const p of n.platforms){ctx.fillStyle='#19384c';ctx.fillRect(p.x-n.cam,p.y,p.w,12);ctx.fillStyle='#4d6b78';ctx.fillRect(p.x-n.cam,p.y,p.w,2);}
   TechOpsArtHandoff.drawActor(ctx,'kat',n,n.x-n.cam+11,430,90,1000);
   const partner={...n,x:n.x-75};TechOpsArtHandoff.drawActor(ctx,'man',partner,partner.x-n.cam+11,430,94,1000);
   TechOpsArtHandoff.drawEnvironment(ctx,n,'front',1000);
   TechOpsGoodBoysGameplayLoop.drawStageAccents(ctx);
   const words=[],old=ctx.fillText;ctx.fillText=function(...args){words.push(args[0]);return old.apply(this,args);};TechOpsGoodBoysHudLite.drawHud(ctx,n);ctx.fillText=old;
   const g=TechOpsGameplayExperience.objective(n);if(!g||!words.includes(g.text))throw Error('Native HUD did not draw current objective');
   return{mission:m,viewport:v,guide:g,words,staging:window.__orbitalStagingEvidence,art:TechOpsArtHandoff.health(),duplicateRibbon:document.querySelectorAll('#px-objective,#px-action,#px-impact').length};
  };
 },viewport);
 for(const m of [4,5,6,7]){
  const state=await page.evaluate(m=>renderQualityFixture(m),m);assert.equal(state.duplicateRibbon,0);assert.equal(state.staging.mission,m);assert.equal(state.art.error,null);
  await page.screenshot({path:path.join(out,`quality-${viewport.width}-m${m}.png`)});reports.push({type:'render',pass:true,fixture:true,...state});
 }
 // Actual trusted button click unlocks WebAudio; native combat time generates a hit.
 await page.evaluate(()=>{window.sfx=()=>{};window.V67SET={volSfx:.5,volMusic:.8};window.NM={district:'downtown',x:100,y:396,w:22,h:34,face:1,hp:100,onGround:true,enemies:[{x:150,y:396,w:24,h:34,hp:100,maxHp:100,alive:true,cash:[0,0]}]};window.S={nightMode:NM};document.querySelector('#audio-test').onclick=()=>{TechOpsCombatAudio.unlock();TechOpsNightCombat.attack(NM,{});for(let i=0;i<9;i++)TechOpsNightCombat.tick(NM,.01,{});};});
 await page.locator('#audio-test').click();
 const sound=await page.evaluate(()=>({stats:TechOpsCombatAudio.diagnostics(),hp:NM.enemies[0].hp,events:NM._nightCombat.events.map(e=>e.type),music:V67SET.volMusic}));
 assert.equal(sound.hp,86);assert.ok(sound.stats.played>=1);assert.equal(sound.stats.contextState,'running');assert.equal(sound.music,.8);
 const muted=await page.evaluate(()=>{V67SET.volSfx=0;const before=TechOpsCombatAudio.diagnostics().played;TechOpsNightCombat.hurt(NM);return{before,after:TechOpsCombatAudio.diagnostics().played,voices:TechOpsCombatAudio.diagnostics().voices};});assert.equal(muted.before,muted.after);assert.equal(muted.voices,0);
 const t=await page.evaluate(()=>{S.inDialog=true;return TechOpsGameplayExperience.objective(NM);});assert.equal(t,null);
 reports.push({type:'audio',pass:true,fixture:true,viewport,sound,muted});assert.deepEqual(errors,[]);await page.close();
}}finally{await browser.close();fs.writeFileSync(path.join(out,'quality-browser.json'),JSON.stringify(reports,null,2));}
console.log(JSON.stringify({pass:reports.length===10,checks:reports.length,rendererFixtures:8,audioFixtures:2,fullGameNavigation:false,physicalDevice:false,webKit:false,report:path.join(out,'quality-browser.json')}));
