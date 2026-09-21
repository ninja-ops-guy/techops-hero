'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
function fixture(width=568,height=320) {
  let clock=1000, cooperative=false;
  const elements=new Map(), root=vm.createContext({ console, performance:{now:()=>clock}, setTimeout:()=>1, matchMedia:()=>({matches:false}) });
  for(const file of ['cinematic_systems.js','production_gameplay_experience.js','runtime_hud.js']) vm.runInContext(fs.readFileSync(file,'utf8'),root);
  root.document={hidden:false,getElementById:id=>elements.get(id)||null};
  root.getComputedStyle=el=>el.style;
  const n={district:'goodboys_home',x:180,y:396,w:22,h:34,cam:0,hp:87,enemies:[],msg:'UPLINK BREACHED · Regroup at the maintenance console, protect your partner, and hold the corridor while the route recovers.',msgT:4000,_goodBoysHudAuthority:'single_hud_v2',_v736:{m:6,active:'katrin',sync:64,chars:{katrin:{hp:92,maxHp:100},manchez:{hp:112,maxHp:120}},uplink:{hp:100},decrypt:31.4}};
  root.NM=n;root.S={nightMode:n,meta:{_v736:{m:6}}};
  root.TechOpsGoodDogsCoop={active:()=>cooperative};
  root.TechOpsGoodDogsProduction={};root.TechOpsGoodBoysGameplayLoop={};
  root.TechOpsGoodBoysCanon={SEQUENCE:{1:{name:'HOME'},4:{name:'CELL 118'},6:{name:'CELL 1984'},7:{name:'WARDEN'}}};
  root.TechOpsArtHandoff.surveillance=()=>({observed:true,sheltered:false});
  vm.runInContext(fs.readFileSync('good_boys_hud_lite.js','utf8'),root);
  const ops=[],stack=[];let sx=1,sy=1;
  const canvas={width:Math.round(width*540/height),height:540,getBoundingClientRect:()=>({width,height})};
  const ctx={canvas,font:'13px monospace',textAlign:'left',
    save(){stack.push({sx,sy,font:this.font,align:this.textAlign});}, restore(){const s=stack.pop();assert.ok(s,'restore must balance save');sx=s.sx;sy=s.sy;this.font=s.font;this.textAlign=s.align;},
    scale(x,y){sx*=x;sy*=y;}, measureText(t){return {width:Array.from(String(t)).length*parseFloat(this.font.replace('bold ',''))*.6};},
    fillText(t,x,y){ops.push({text:String(t),x:x*sx,y:y*sy,width:this.measureText(t).width*sx,font:parseFloat(this.font.replace('bold ',''))*sy,align:this.textAlign});},
    beginPath(){},roundRect(){},rect(){},fill(){},stroke(){},fillRect(){}
  };
  return {root,n,ctx,ops,stack,elements,api:root.TechOpsGoodBoysHudLite,width,height,coop:value=>{cooperative=value;},clock:value=>{clock=value;}};
}
const copy=value=>JSON.parse(JSON.stringify(value));
function draw(f){f.api.drawHud(f.ctx,f.n);assert.equal(f.api.acceptance().drawError,null,'runtime draw must not swallow a layout error');return f.api.layout();}
function textRects(f){const view=f.root.TechOpsRuntimeHud.viewport(f.ctx.canvas);return f.ops.map(o=>{const width=o.width/view.scaleX,x=o.x/view.scaleX;return {text:o.text,left:o.align==='center'?x-width/2:o.align==='right'?x-width:x,top:o.y/view.scaleY-o.font/view.scaleY,width,height:o.font/view.scaleY};});}
function separated(a,b){return a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y;}
for(const [width,height] of [[568,320],[844,390],[320,568],[390,844],[1280,800]]) {
  const f=fixture(width,height),before=JSON.stringify(f.n),guide=f.root.TechOpsGameplayExperience.objective(f.n),layout=draw(f);
  assert.equal(f.api.acceptance().installed,true,'single existing HUD callbacks own presentation');
  assert.equal(f.root.TechOpsGoodDogsProduction.drawReferenceHUD,f.api.drawHud);
  assert.equal(JSON.stringify(f.n),before,'HUD cannot mutate runtime health, mission or world coordinates');
  assert.equal(f.stack.length,0,'screen-space transform must be restored');
  const boxes=[...layout.cards,layout.objective,layout.message].filter(Boolean);
  boxes.forEach(b=>{assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=width&&b.y+b.height<=height,'every HUD panel stays in the CSS viewport');});
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)assert.ok(separated(boxes[i],boxes[j]),'health, sync, objective and message must reserve distinct rectangles');
  const rendered=textRects(f);
  rendered.forEach(t=>{assert.ok(t.height>=13-1e-8,`${width}: ${t.text} must remain13 CSS px`);assert.ok(t.left>=0&&t.left+t.width<=width+1e-8,`${width}: ${t.text} fits viewport`);assert.ok(t.top>=0&&t.top+t.height<=height,`${width}: ${t.text} fits height`);});
  for(let i=0;i<rendered.length;i++)for(let j=i+1;j<rendered.length;j++) {
    const a=rendered[i],b=rendered[j];assert.ok(separated({x:a.left,y:a.top,width:a.width,height:a.height},{x:b.left,y:b.top,width:b.width,height:b.height}),`${width}: essential text cannot overlap: ${a.text} / ${b.text}`);
  }
  assert.equal(layout.objective.lines.join(' '),guide.text,'complete objective is retained');
  assert.equal(layout.objective.details.join(' '),guide.detail,'complete detail is retained');
  assert.equal(layout.message.lines.join(' '),f.n.msg,'unique narrative/combat message remains complete');
  assert.deepEqual(copy(layout.players.map(p=>[p.who,p.role])),[['katrin','YOU'],['manchez','AI']]);
  const original=JSON.stringify(f.n);f.ctx.canvas.getBoundingClientRect=()=>({width:844,height:390});f.ops.length=0;
  const resized=draw(f);assert.equal(resized.width,844);assert.equal(resized.height,390);assert.equal(JSON.stringify(f.n),original,'rotation only changes presentation');assert.equal(f.stack.length,0);
}
{
  const f=fixture();let l=draw(f);assert.deepEqual(copy(l.players.map(p=>[p.hp,p.maxHp])),[[87,100],[112,120]],'current actor HP and stored partner HP come from their own authorities');
  f.coop(true);f.ops.length=0;l=draw(f);assert.deepEqual(copy(l.players.map(p=>[p.who,p.role])),[['katrin','P1'],['manchez','P2']]);
  f.n._v736.active='manchez';f.n.hp=62;f.ops.length=0;l=draw(f);assert.deepEqual(copy(l.players.map(p=>[p.who,p.role,p.hp])),[['katrin','P2',92],['manchez','P1',62]],'active swap updates roles and live health together');
  f.coop(false);f.ops.length=0;l=draw(f);assert.deepEqual(copy(l.players.map(p=>p.role)),['AI','YOU']);
  f.n._v736.chars.katrin.downed=true;f.n._v736.chars.manchez.out=true;f.ops.length=0;l=draw(f);assert.ok(f.ops.some(o=>o.text==='DOWN'));assert.ok(f.ops.some(o=>o.text==='OUT'));assert.equal(l.players[0].downed,true);assert.equal(l.players[1].out,true);
}
for(const [mission,message] of [[4,'VERIFY THE PRISONER IN CELL 118'],[6,'WALDO IS IN CELL 1984'],[7,'REACH THE MAINTENANCE SHUTTLE']]) {
  const f=fixture();f.n._v736.m=mission;f.root.S.meta._v736.m=mission;f.n.msg=message;const l=draw(f);assert.equal(l.message,null,'retired duplicate briefing does not create a second message strip');assert.equal(f.api.ownsMessage(f.n),true,'existing compositor can suppress the duplicate legacy copy');
  f.n.msg=f.root.TechOpsGameplayExperience.objective(f.n).text;f.ops.length=0;assert.equal(draw(f).message,null,'literal objective repetition also remains single');
  f.n.msg='PARTNER DOWN · RETURN TO REVIVE';f.ops.length=0;assert.ok(draw(f).message,'unique combat notification cannot disappear with the retired briefing');
}
{
  const f=fixture();f.n.msgT=1000;assert.equal(draw(f).message,null,'expired message is not revived');assert.equal(f.api.ownsMessage(f.n),false);
  f.n.msgT=4000;assert.equal(f.api.ownsMessage({...f.n}),false,'a stale/copied world cannot own current message presentation');
}
for(const blocker of ['dialog','paused','battle','hidden','director','owned-modal','hud-guard','title','dom-cinematic','drive','ending']) {
  const f=fixture();draw(f);f.ops.length=0;
  if(blocker==='dialog')f.root.S.inDialog=true;if(blocker==='paused')f.root.S.paused=true;if(blocker==='battle')f.root.S.inBattle=true;if(blocker==='hidden')f.root.document.hidden=true;if(blocker==='director')f.root.TechOpsPresentationDirector={isBlocking:()=>true};if(blocker==='owned-modal')f.root.TechOpsProductionWrapperGuard={hasBlockingModal:()=>true};if(blocker==='hud-guard')f.root.__goodBoysHideHud=true;if(blocker==='drive')f.n.drive={};if(blocker==='ending')f.n._v736.ending=true;
  if(blocker==='title'||blocker==='dom-cinematic')f.elements.set(blocker==='title'?'title-screen':'gb-prison-cine',{classList:{contains:()=>false},style:{display:'block',visibility:'visible',opacity:'1'}});
  assert.equal(draw(f),null,blocker+' clears stale layout');assert.equal(f.ops.length,0,blocker+' owns the screen');assert.equal(f.stack.length,0);assert.equal(f.api.ownsMessage(f.n),false);
}
for(const other of ['day','night','sector04','foreign-world']) {
  const f=fixture();if(other==='day')f.root.S.nightMode=null;if(other==='night')delete f.n._v736;if(other==='sector04'){delete f.n._v736;f.n._sector04={};}if(other==='foreign-world')f.root.S.nightMode={};assert.equal(draw(f),null);assert.equal(f.ops.length,0,'Good Dogs HUD cannot leak into '+other);
}
{
  const f=fixture(320,568),token='LONG_UNSPACED_RECOVERY_IDENTIFIER_'.repeat(4);f.n.msg=token;const l=draw(f);assert.equal(l.message.lines.join(''),token,'wrapping cannot lose long-token characters');assert.ok(l.message.lines.every(line=>{f.ctx.font='13px monospace';return f.ctx.measureText(line).width<=320-32;}));
}
console.log('Good Dogs HUD: CSS font/card bounds, solo/co-op roles, health states, complete objectives/messages, duplicate retirement, modal isolation and rotation PASS');
