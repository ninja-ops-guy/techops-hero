const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=root+'/docs/qa-good-dogs-video';fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{const suffix=decodeURIComponent(req.url.split('?')[0]);const name=path.resolve(root,'.'+suffix+(suffix.endsWith('/')?'index.html':''));if(!name.startsWith(root+'/')){res.writeHead(403).end();return;}fs.readFile(name,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'})[path.extname(name)]||'application/octet-stream');res.end(b);});});
 await new Promise(r=>server.listen(8081,'127.0.0.1',r));const launch={headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']};if(process.env.CHROMIUM_EXECUTABLE)launch.executablePath=process.env.CHROMIUM_EXECUTABLE;
 let browser=await chromium.launch(launch);
 const page=await browser.newPage({viewport:{width:960,height:640},deviceScaleFactor:1});const errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.log('pageerror',e.message)});page.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.log('ERROR',m.text().slice(0,800));}});
 await page.goto('http://127.0.0.1:8081/assets/good-dogs-3d/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__goodDogs3DReview?.ready,null,{timeout:90000});await page.locator('#begin').click({noWaitAfter:true});
 // Freeze only frame submission for software-GPU screenshots. These are real
 // rendered gameplay frames; no image editing or state progression shortcuts.
 await page.evaluate(()=>{const l=window.__goodDogs3DReview.level;window.__captureDraw=l.draw;l.draw=()=>true;});
 await page.locator('#pause').click({noWaitAfter:true});await page.addStyleTag({content:'#overlay{visibility:hidden}'});
 const snapshots=[],controls=[];
 async function capture(name,view,quality){
  await page.addStyleTag({content:'#overlay{visibility:hidden}'});
  while(await page.evaluate(()=>__goodDogs3DReview.level.view)!==view)await page.locator('#camera').click();
  const stats=await page.evaluate(async q=>{const r=__goodDogs3DReview;await r.level.setQuality(q);__captureDraw(NM,innerWidth,innerHeight,performance.now());return r.level.stats();},quality);
  await page.screenshot({path:out+'/'+name+'.png',timeout:90000});snapshots.push({name,view,...stats});
 }
 await capture('01-escort-high','third','high');await capture('02-crew-high','crew','high');await capture('03-retro','retro','balanced');await capture('04-k-view','first','balanced');
 await page.addStyleTag({content:'#overlay{visibility:visible}'});
 for(const view of ['third','retro','first','crew']){
  await page.locator('#restart').click({noWaitAfter:true});
  while(await page.evaluate(()=>__goodDogs3DReview.level.view)!==view)await page.locator('#camera').click();
  const sign=view==='crew'?-1:1;
  for(const [key,direction,axis] of [['KeyW',sign,'x'],['KeyS',-sign,'x'],['ArrowRight',view==='retro'?sign:-sign,view==='retro'?'x':'_gdLane'],['ArrowLeft',view==='retro'?-sign:sign,view==='retro'?'x':'_gdLane']]){
   const before=await page.evaluate(axis=>NM[axis],axis);await page.keyboard.down(key);
   try{await page.waitForFunction(({before,direction,axis})=>(NM[axis]-before)*direction>(axis==='x'?8:.12),{before,direction,axis},{timeout:5000});}finally{await page.keyboard.up(key);}
   controls.push({view,key,direction,axis,pass:true});
  }
  await page.locator('#pause').click({noWaitAfter:true});
 }
 assert.equal(await page.locator('[data-action=jump]').count(),0);assert.equal(await page.evaluate(()=>NM.platforms.length),0);assert.equal(await page.evaluate(()=>NM.y+NM.h),430);
 const before=await page.evaluate(()=>JSON.stringify(__goodDogs3DReview.state));await page.locator('#quality').selectOption('low');await page.waitForFunction(()=>__goodDogs3DReview.level.quality==='low');assert.equal(await page.evaluate(()=>JSON.stringify(__goodDogs3DReview.state)),before);
 await capture('05-performance','third','low');await page.addStyleTag({content:'#overlay{visibility:visible}'});await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>__goodDogs3DReview?.ready,null,{timeout:90000});assert.equal(await page.locator('#quality').inputValue(),'low');await page.close();
 await browser.close();browser=await chromium.launch(launch);
 const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});mobile.on('pageerror',e=>errors.push(e.message));
 await mobile.goto('http://127.0.0.1:8081/assets/good-dogs-3d/',{waitUntil:'networkidle'});await mobile.waitForFunction(()=>__goodDogs3DReview?.ready,null,{timeout:90000});assert.equal(await mobile.locator('#quality').inputValue(),'balanced');
 assert.equal(await mobile.locator('[data-hold=forward]').evaluate(e=>getComputedStyle(e).userSelect),'none');
 await mobile.locator('#begin').tap({noWaitAfter:true});await mobile.evaluate(()=>{__captureDraw=__goodDogs3DReview.level.draw;__goodDogs3DReview.level.draw=()=>true;});
 const cdp=await mobile.context().newCDPSession(mobile);
 for(const [hold,direction,axis] of [['forward',1,'x'],['back',-1,'x'],['right',-1,'_gdLane'],['left',1,'_gdLane']]){
  const b=await mobile.locator('[data-hold='+hold+']').boundingBox(),before=await mobile.evaluate(axis=>NM[axis],axis);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});
  try{await mobile.waitForFunction(({before,direction,axis})=>(NM[axis]-before)*direction>(axis==='x'?8:.12),{before,direction,axis},{timeout:5000});}finally{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  controls.push({view:'third',touch:hold,direction,axis,pass:true});
 }
 await mobile.locator('#pause').tap({noWaitAfter:true});await mobile.addStyleTag({content:'#overlay{visibility:hidden}'});await mobile.evaluate(()=>__captureDraw(NM,innerWidth,innerHeight,performance.now()));await mobile.screenshot({path:out+'/06-mobile-balanced.png',timeout:90000});assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const report={errors,snapshots,controls,checks:{continuousGround:true,noJumpControl:true,pausedQualityPreservesState:true,qualityPersistence:true,mobileDefaultsBalanced:true,mobileOverflow:false},scope:'Real keyboard and emulated touch input in Chromium software WebGL. Captures pause the simulation and submit one actual WebGL frame; no image edits. Not physical-device FPS certification.'};fs.writeFileSync(out+'/validation.json',JSON.stringify(report,null,2));assert.equal(errors.length,0);console.log(JSON.stringify(report));await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
