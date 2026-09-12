import fs from 'node:fs';
import path from 'node:path';
import {chromium,webkit,devices} from 'playwright';
const out=process.env.BOT_OUT_DIR||'runtime-bot-artifacts',base=process.env.BOT_BASE_URL||'http://127.0.0.1:4173/';fs.mkdirSync(out,{recursive:true});
const reports=[],enabled=new Set((process.env.BOT_BROWSERS||'chromium,webkit').split(','));
for(const [name,type,options] of [['chromium',chromium,{viewport:{width:1280,height:900}}],['webkit',webkit,{...devices['iPhone 13']}]] ){
 if(!enabled.has(name))continue;
 let browser,page;
 try{
  browser=await type.launch({headless:true,...(name==='chromium'&&process.env.BOT_CHROMIUM_CHANNEL?{channel:process.env.BOT_CHROMIUM_CHANNEL}:{})});const context=await browser.newContext(options),newPage=await context.newPage();page=newPage;const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base+'scripts/art_handoff_review.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:12000});await page.getByRole('button',{name:'Pause playback'}).click();
  await page.screenshot({path:path.join(out,'art-handoff-'+name+'.png'),fullPage:true});
  const health=await page.evaluate(()=>window.TechOpsArtHandoff.health());if(errors.length||health.error)throw Error(JSON.stringify({errors,health}));
  reports.push({browser:name,channel:process.env.BOT_CHROMIUM_CHANNEL||'bundled',pass:true,health});
  await context.close();
 }catch(e){reports.push({browser:name,pass:false,error:String(e),state:await page?.evaluate(()=>({night:!!window.S?.nightMode,mission:window.NM?._v736?.m,meta:window.S?.meta?._v736,layer:window.__techOpsLayerEvidence,art:window.TechOpsArtHandoff?.health(),errors:[window.__productionGoodBoysDrawError,window.__productionGoodDogsDrawError,window.__goodBoysProgressionError],surfaces:[...document.querySelectorAll('button')].filter(e=>e.offsetParent).map(e=>e.textContent).slice(0,15)})).catch(()=>null)});await page?.screenshot({path:path.join(out,'art-stage-'+name+'-error.png'),fullPage:true}).catch(()=>{});}finally{await browser?.close();}
}
fs.writeFileSync(path.join(out,'art-handoff.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));if(!reports.length||reports.some(r=>!r.pass))process.exitCode=1;
