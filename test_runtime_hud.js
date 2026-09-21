'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const source = fs.readFileSync('runtime_hud.js', 'utf8');
function fixture(width = 568, height = 320) {
  const n = { district:'industrial', hp:87, cash:1234, combo:6, perfectT:2000, street:2, enemies:[{ alive:true }], x:220, y:396, w:22, h:34, cam:0, msg:'INDUSTRIAL DISTRICT — STREET 2/2 · clear every enemy, → to push on, ← the Charger waits', msgT:3000 };
  const root = { S:{ nightMode:n }, document:{ hidden:false }, TechOpsGameplayExperience:{ streetStatus:() => '1 HOSTILES' }, TechOpsCombatAudio:{ caption:() => '[RISING FINISH]' } };
  root.globalThis = root; vm.runInNewContext(source, root);
  const ops = [], stack = []; let sx=1, sy=1;
  const canvas = { width:width * 540 / height, height:540, getBoundingClientRect:() => ({ width, height }) };
  const ctx = { canvas, font:'13px monospace', textAlign:'left',
    save() { stack.push({ sx, sy, font:this.font, textAlign:this.textAlign }); }, restore() { const s = stack.pop(); assert.ok(s, 'balanced restore'); sx=s.sx; sy=s.sy; this.font=s.font; this.textAlign=s.textAlign; },
    scale(x,y) { sx*=x; sy*=y; },
    measureText(text) { return { width:Array.from(String(text)).length * parseFloat(this.font.replace('bold ','')) * .6 }; },
    fillText(text,x,y) { ops.push({ type:'text', text:String(text), x:x*sx, y:y*sy, width:this.measureText(text).width*sx, font:parseFloat(this.font.replace('bold ',''))*sy, align:this.textAlign }); },
    fillRect(x,y,w,h) { ops.push({ type:'rect', x:x*sx,y:y*sy,width:w*sx,height:h*sy }); }, strokeRect() {}
  };
  const options = { now:1000, clock:'18:40', district:{ name:'INDUSTRIAL DISTRICT', accent:'#f59e0b', streets:2, danger:1.3 } };
  return { root,n,api:root.TechOpsRuntimeHud,ctx,ops,stack,options,width,height };
}
function draw(f) { return f.api.drawNight(f.ctx, f.n, f.options); }
function cssText(f) { return f.ops.filter(o => o.type === 'text').map(o => ({ ...o, x:o.x / f.ctx.canvas.width * f.width, y:o.y / f.ctx.canvas.height * f.height, width:o.width / f.ctx.canvas.width * f.width, font:o.font / f.ctx.canvas.height * f.height })); }
for (const [width,height] of [[568,320],[844,390],[320,568],[390,844],[1280,800]]) {
  const f=fixture(width,height), before=JSON.stringify(f.n);
  f.n._nightCombat={ time:330,lastInput:0,lastHit:50,hits:2,stunUntil:0,attack:{kind:'air'} };
  const current=JSON.stringify(f.n);
  assert.equal(draw(f),true);
  assert.equal(JSON.stringify(f.n),current,'HUD cannot change gameplay state');
  assert.equal(f.stack.length,0,'screen transform is restored');
  for (const t of cssText(f)) {
    assert.ok(t.font>=13-1e-8,`${width}: ${t.text} must have at least13 CSS pixels`);
    const left=t.align==='center'?t.x-t.width/2:t.align==='right'?t.x-t.width:t.x;
    assert.ok(left>=0&&left+t.width<=width+1e-8,`${width}: text stays on screen: ${t.text}`);
    assert.ok(t.y>=13&&t.y<=height,`${width}: text vertical bound: ${t.text}`);
  }
  const e=f.root.__techOpsNightHudEvidence;
  assert.ok(e.text.find(row=>row.role==='combat').lines.join(' ').includes('[RISING FINISH]'),'sound captions render without an audio ownership change');
  assert.equal(e.text.find(row=>row.role==='message').lines.join(' '),f.n.msg,'authored transient message remains complete');
  if(width>=568&&height<=390) assert.ok(e.bottom<190, 'stack stays above the grounded combat focal area');
  const panels=e.panels;
  for(let i=0;i<panels.length;i++)for(let j=i+1;j<panels.length;j++) {
    const a=panels[i],b=panels[j];
    assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y,'cards cannot overlap');
  }
  // A resize uses live presentation dimensions without changing actor/world geometry.
  f.ctx.canvas.getBoundingClientRect=()=>({width:844,height:390});
  draw(f);assert.equal(f.root.__techOpsNightHudEvidence.viewport.width,844);assert.equal(JSON.stringify(f.n),current);
  assert.notEqual(before,current); // Ensure the combat fixture is actually present.
}
for (const flag of ['inDialog','inBattle','paused','gameOver']) {
  const f=fixture();f.root.S[flag]=true;assert.equal(draw(f),true);assert.equal(f.ops.length,0,flag+' must suppress old and new HUDs');assert.equal(f.root.__techOpsNightHudEvidence.blocked,true);
}
for(const blocker of ['hidden','director','night-runtime']) {
  const f=fixture();if(blocker==='hidden')f.root.document.hidden=true;if(blocker==='director')f.root.TechOpsPresentationDirector={isBlocking:()=>true};if(blocker==='night-runtime')f.root.TechOpsNightRuntime={blocked:()=>true};assert.equal(draw(f),true);assert.equal(f.ops.length,0);
}
for (const mode of ['day','dogs','sector04','waldo','foreign-world']) {
  const f=fixture();if(mode==='day')f.root.S.nightMode=null;if(mode==='dogs')f.n._v736={};if(mode==='sector04')f.n._sector04={};if(mode==='waldo')f.n.district='waldo';if(mode==='foreign-world')f.root.S.nightMode={};assert.equal(draw(f),false);assert.equal(f.ops.length,0,'unrelated HUD owner stays untouched');
}
{
  const f=fixture(); f.n.drive={to:'home'};assert.equal(draw(f),true);assert.equal(f.ops.length,0);assert.equal(f.api.drawDrive(f.ctx,f.n,'HOME STREET'),true);assert.ok(cssText(f).some(t=>t.text==='DRIVING — HOME STREET'&&t.font>=14));
  f.root.S.inDialog=true;f.ops.length=0;assert.equal(f.api.drawDrive(f.ctx,f.n,'HOME STREET'),true);assert.equal(f.ops.length,0);
}
{
  const f=fixture();f.ctx.font='13px monospace';const token='SUPERCALIFRAGILISTICEXPIALIDOCIOUS'.repeat(4),lines=f.api.wrap(f.ctx,token,90);assert.equal(lines.join(''),token);assert.ok(lines.every(line=>f.ctx.measureText(line).width<=90));
  assert.deepEqual(JSON.parse(JSON.stringify(f.api.viewport({width:960,height:540}))),{width:960,height:540,scaleX:1,scaleY:1});
  const hidden=f.api.viewport({width:960,height:540,getBoundingClientRect:()=>({width:0,height:0}),style:{width:'480px',height:'270px'}});assert.equal(hidden.width,480);assert.equal(hidden.scaleX,2);
  assert.equal(f.api.viewport({width:960,height:540,style:{width:'100%',height:'auto'}}).width,960,'unresolved percentages cannot masquerade as pixels');
}
// Execute the real combat renderer: labels stay at world anchors, the screen
// rhythm bar is delegated once, and no extra screen rectangle survives below it.
{
  const f=fixture();f.root.performance={now:()=>1000};vm.runInNewContext(fs.readFileSync('night_combat.js','utf8'),f.root);
  const combat=f.root.TechOpsNightCombat;f.n._nightCombat={time:100,attack:{kind:'jab'},grab:null,hits:1,stunUntil:0,lastInput:0,lastHit:50,fx:[{type:'jab',time:90,damage:14,x:180,y:300}]};
  combat.draw(f.ctx,f.n);assert.equal(f.stack.length,0);assert.ok(f.ops.some(o=>o.type==='text'&&o.text==='14'));assert.equal(f.ops.filter(o=>o.type==='rect').length,0,'rhythm bar waits for the shared HUD owner');
  const damage=cssText(f).find(t=>t.text==='14');assert.ok(damage.font>=13-1e-8);assert.equal(damage.x,180/f.ctx.canvas.width*f.width,'damage retains its world anchor');
}
assert.doesNotMatch(source,/setInterval|setTimeout|requestAnimationFrame|addEventListener|drawNM\s*=|stepNM\s*=/,'passive presentation adds no loop or wrapper');
assert.match(fs.readFileSync('night_hooks.js','utf8'),/TechOpsRuntimeHud\.drawNight\(ctx, NM/,'existing renderer calls the passive owner');
console.log('Runtime HUD: CSS-pixel readability, complete copy, bounded cards, captions, resize, mode/modal isolation and world anchors PASS');
