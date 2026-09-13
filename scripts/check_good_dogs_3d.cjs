const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
(async()=>{
 const root=path.resolve(__dirname,'..');fs.mkdirSync(root+'/docs/qa-good-dogs-3d',{recursive:true});
 const server=http.createServer((req,res)=>{const suffix=decodeURIComponent(req.url.split('?')[0]);const name=path.resolve(root,'.'+suffix+(suffix.endsWith('/')?'index.html':''));if(!name.startsWith(root+'/')){res.writeHead(403).end();return;}fs.readFile(name,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.glb':'model/gltf-binary','.png':'image/png','.json':'application/json'})[path.extname(name)]||'application/octet-stream');res.end(b);});});
 await new Promise(r=>server.listen(8081,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:960,height:640},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:8081/assets/good-dogs-3d/',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__goodDogs3DReview?.ready,null,{timeout:45000});
 await page.screenshot({path:root+'/docs/qa-good-dogs-3d/01-intro.png'});
 await page.locator('#begin').click({noWaitAfter:true});
 await page.waitForTimeout(500);await page.screenshot({path:root+'/docs/qa-good-dogs-3d/02-escort.png'});
 const read=()=>page.evaluate(()=>window.__goodDogs3DReview.state);
 await page.keyboard.press('KeyE');if((await read()).nodeSeized)throw Error('early USE bypassed gate');
 let direction=null,iterations=0;
 async function move(next){if(direction===next)return;if(direction)await page.keyboard.up(direction);direction=next;if(direction)await page.keyboard.down(direction);}
 while(iterations++<360){
  const s=await read();if(s.chars[s.active].hp<=0)throw Error('playthrough player down');
  const enemies=s.enemies.filter(e=>e.alive!==false&&e.hp>0);if(!enemies.length)break;
  const enemy=enemies.sort((a,b)=>Math.abs(a.x-s.x)-Math.abs(b.x-s.x))[0];
  if(s.chars[s.active].hp<38&&s.chars[s.active==='katrin'?'manchez':'katrin'].hp>38)await page.keyboard.press('KeyQ');
  const dx=enemy.x-s.x;
  if(enemy.windup>0&&Math.abs((enemy.recordedTarget??enemy.x)-s.x)<85){await move(dx>0?'KeyS':'KeyW');await page.keyboard.press('ShiftLeft');}
  else{await move(Math.abs(dx)>75?(dx>0?'KeyW':'KeyS'):null);if(Math.abs(dx)<130){if(dx>0)await page.keyboard.press('KeyD');else await page.keyboard.press('KeyA');await page.keyboard.press('KeyF');}}
  if(iterations%30===0)console.log('combat',iterations,s.x,s.chars,enemies.map(e=>({kind:e.kind,hp:e.hp})));
  await page.waitForTimeout(250);
 }
 await move(null);let s=await read();if(s.enemies.some(e=>e.alive!==false&&e.hp>0))throw Error('combat timed out');
 console.log('combat cleared',iterations,s.facts);await page.screenshot({path:root+'/docs/qa-good-dogs-3d/03-security-cleared.png'});
 async function reach(x){for(let i=0;i<120;i++){let s=await read();if(Math.abs(s.x-x)<25){await move(null);return;}await move(s.x<x?'KeyW':'KeyS');await page.waitForTimeout(150);}throw Error('navigation timeout');}
 await reach(1070);await page.keyboard.press('KeyE');await page.waitForTimeout(100);if(!(await read()).nodeSeized)throw Error('node not seized through input');
 await page.screenshot({path:root+'/docs/qa-good-dogs-3d/04-node.png'});
 await page.locator('#camera').click({noWaitAfter:true});await page.waitForTimeout(250);await page.screenshot({path:root+'/docs/qa-good-dogs-3d/05-retro.png'});
 await page.locator('#camera').click({noWaitAfter:true});await page.waitForTimeout(250);await page.screenshot({path:root+'/docs/qa-good-dogs-3d/06-k-view.png'});
 await page.locator('#camera').click({noWaitAfter:true});
 await reach(1480);await page.waitForTimeout(800);await page.keyboard.press('KeyE');await page.waitForTimeout(300);s=await read();if(!s.complete)throw Error('door did not complete level');
 await page.screenshot({path:root+'/docs/qa-good-dogs-3d/07-route-open.png'});
 await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.__goodDogs3DReview?.ready);if(!(await read()).complete)throw Error('completed checkpoint not restored');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);await page.screenshot({path:root+'/docs/qa-good-dogs-3d/08-mobile.png'});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 const report={errors,overflow,completedThroughKeyboard:true,combatIterations:iterations,checkpointRestored:true,finalState:s,scope:'Chromium software WebGL desktop and narrow viewport; standalone review harness with real keyboard actions; integrated full campaign not executed'};
 fs.writeFileSync(root+'/docs/qa-good-dogs-3d/browser-validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 await browser.close();server.close();if(errors.length||overflow)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
