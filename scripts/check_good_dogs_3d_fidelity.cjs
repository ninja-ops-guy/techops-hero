const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=root+'/docs/qa-good-dogs-fidelity';fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{const suffix=decodeURIComponent(req.url.split('?')[0]);const name=path.resolve(root,'.'+suffix+(suffix.endsWith('/')?'index.html':''));if(!name.startsWith(root+'/')){res.writeHead(403).end();return;}fs.readFile(name,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.glb':'model/gltf-binary','.png':'image/png','.json':'application/json'})[path.extname(name)]||'application/octet-stream');res.end(b);});});
 await new Promise(r=>server.listen(8081,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:960,height:640},deviceScaleFactor:1});const errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.log('pageerror',e.message)});page.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.log('ERROR',m.text().slice(0,800));}});
 await page.goto('http://127.0.0.1:8081/assets/good-dogs-3d/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__goodDogs3DReview?.ready,null,{timeout:90000});await page.locator('#begin').click({noWaitAfter:true});
 // Freeze only frame submission for software-GPU screenshots. These are real
 // rendered gameplay frames; no image editing or state progression shortcuts.
 await page.evaluate(()=>{const l=window.__goodDogs3DReview.level;window.__captureDraw=l.draw;l.draw=()=>true;});
 await page.locator('#pause').click({noWaitAfter:true});await page.addStyleTag({content:'#overlay{visibility:hidden}'});
 const snapshots=[];
 async function capture(name,view,quality){
  const s=await page.evaluate(async({view,quality})=>{const r=window.__goodDogs3DReview;await r.level.setQuality(quality);r.level.setView(view);window.__captureDraw(NM,innerWidth,innerHeight,performance.now());return r.level.stats();},{view,quality});
  await page.screenshot({path:out+'/'+name+'.png',timeout:90000});snapshots.push({name,view,...s});console.log(name,s);
 }
 await capture('01-escort-high','third','high');await capture('02-crew-high','crew','high');await capture('03-retro','retro','balanced');await capture('04-k-view','first','balanced');
 await page.addStyleTag({content:'#overlay{visibility:visible}'});await page.locator('#begin').click({noWaitAfter:true});
 const x=await page.evaluate(()=>NM.x);await page.keyboard.down('KeyW');await page.waitForFunction(old=>NM.x>old+20,x,{timeout:10000});await page.keyboard.up('KeyW');
 await page.locator('#pause').click({noWaitAfter:true});const before=await page.evaluate(()=>JSON.stringify(window.__goodDogs3DReview.state));
 await page.locator('#quality').selectOption('low');await page.waitForFunction(()=>window.__goodDogs3DReview.level.quality==='low');
 const after=await page.evaluate(()=>JSON.stringify(window.__goodDogs3DReview.state));assert.equal(after,before,'Quality switch must not mutate the paused session');
 await page.locator('#begin').click({noWaitAfter:true});await capture('05-performance','third','low');
 await page.setViewportSize({width:390,height:844});await capture('06-mobile-balanced','third','balanced');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.locator('#pause').click({noWaitAfter:true});await page.locator('#quality').selectOption('balanced');await page.waitForFunction(()=>window.__goodDogs3DReview.level.quality==='balanced');
 await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.__goodDogs3DReview?.ready,null,{timeout:90000});assert.equal(await page.locator('#quality').inputValue(),'balanced');
 const report={errors,snapshots,checks:{keyboardMovement:true,pausedQualityPreservesState:true,allViews:true,qualityPersistence:true,mobileOverflow:false},scope:'Chromium software WebGL; paused scene captures and input checks only; not device FPS certification or a full campaign release gate'};
 fs.writeFileSync(out+'/validation.json',JSON.stringify(report,null,2));await browser.close();server.close();assert.equal(errors.length,0,'WebGL and browser errors');
})().catch(e=>{console.error(e);process.exit(1)});
