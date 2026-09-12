// Isolated presentation fixtures. These do not certify campaign progression.
import fs from 'node:fs';
import path from 'node:path';
import {chromium,webkit,devices} from 'playwright';
const base=process.env.BOT_BASE_URL||'http://127.0.0.1:4173/',out=process.env.BOT_OUT_DIR||'runtime-bot-artifacts';
fs.mkdirSync(out,{recursive:true});
const enabled=new Set((process.env.BOT_BROWSERS||'chromium,webkit').split(',')),reports=[];
for(const [name,type,options] of [['chromium',chromium,{viewport:{width:1280,height:800}}],['webkit',webkit,{...devices['iPhone 13']}]] ){
 if(!enabled.has(name))continue;
 const browser=await type.launch({headless:true,...(name==='chromium'&&process.env.BOT_CHROMIUM_CHANNEL?{channel:process.env.BOT_CHROMIUM_CHANNEL}:{})});
 try{for(const scene of ['gooddogs.m3','sector04','night.industrial']){
  const context=await browser.newContext(options),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.TechOpsProductionModeRouter&&window.TechOpsNightReferenceVisuals&&window.__techopsWrapperGuardInstalled,null,{timeout:10000});
   await page.getByRole('button',{name:/NIGHT\s*CRAWLER/i}).click();
   const until=Date.now()+10000;
   while(Date.now()<until){
    if(await page.evaluate(()=>!!(window.NM&&window.S?.nightMode&&!window.S.inDialog)))break;
    for(const name of [/Standard/i,/BEGIN THE INCIDENT/i]){
     const button=page.getByRole('button',{name}).first();
     if(await button.isVisible().catch(()=>false))await button.click();
    }
    await page.evaluate(()=>{if(window.v722?.active?.())window.v722.skip();});
    await page.waitForTimeout(120);
   }
   await page.waitForFunction(()=>window.NM&&window.S?.nightMode&&!window.S.inDialog,null,{timeout:1000});
   await page.evaluate(id=>{
    if(id==='gooddogs.m3')window.v736.start({mission:3,directGameplay:true});
    else if(id==='sector04'){const api=window.TechOpsCampaign,c=api.createInitialState();
      api.assignTicket(c,'shipping_cannot_print','mike');api.assignTicket(c,'plating_workstation_down','amit');api.assignTicket(c,'impossible_access_event','mike');api.completeStandup(c);api.completeWorkstation(c,{redInTheMirrorHeard:true,feliciaVideoSeen:true});api.save(c,localStorage);window.TechOpsSector04Runtime.enterBrowser();}
    else window.nmLoadDistrict('industrial');
   },scene);
   if(scene==='gooddogs.m3'){
    await page.locator('#gb-prison-next').waitFor({state:'visible',timeout:5000});
    for(let i=0;i<3;i++)await page.locator('#gb-prison-next').click();
   }
   await page.waitForFunction(()=>!window.S.inDialog,null,{timeout:5000});
   await page.waitForFunction(id=>window.__techOpsLayerEvidence?.level===id,scene,{timeout:10000});
   await page.keyboard.down('ArrowRight');
   try{
    await page.waitForFunction(()=>window.__techOpsArtLastActor?.state==='run'&&window.TechOpsArtHandoff.health().atlases.some(a=>a.id==='prison'&&a.status==='ready'),null,{timeout:5000});
    await page.screenshot({path:path.join(out,'slice-'+name+'-'+scene+'.png')});
   }finally{await page.keyboard.up('ArrowRight');}
   const evidence=await page.evaluate(()=>new Promise(resolve=>{
    const deltas=[];let last=performance.now();
    function frame(now){deltas.push(now-last);last=now;if(deltas.length<120)return requestAnimationFrame(frame);deltas.sort((a,b)=>a-b);resolve({layer:window.__techOpsLayerEvidence,actor:window.__techOpsArtLastActor,art:window.TechOpsArtHandoff.health(),m3:window.TechOpsM3CinematicAsset.health(),frameMs:{median:deltas[60],p95:deltas[114],over50:deltas.filter(v=>v>50).length},memory:performance.memory?{usedJSHeapSize:performance.memory.usedJSHeapSize}:null});}requestAnimationFrame(frame);
   }));
   if(errors.length)throw Error(errors.join('\n'));
   if(scene==='gooddogs.m3'&&!evidence.m3.ready)throw Error('Authored M3 asset did not decode');
   reports.push({browser:name,scene,pass:true,fixture:true,evidence});
  }catch(e){reports.push({browser:name,scene,pass:false,error:String(e.stack||e),errors});await page.screenshot({path:path.join(out,'slice-'+name+'-'+scene+'-error.png')}).catch(()=>{});}
  finally{await context.close();}
 }}finally{await browser.close();}
}
fs.writeFileSync(path.join(out,'presentation-slices.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));if(!reports.length||reports.some(r=>!r.pass))process.exitCode=1;
