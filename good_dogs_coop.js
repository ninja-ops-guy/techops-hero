/* Local co-op input and pair mechanisms. Called by the existing pair step and
 * compositor; owns no game loop, combat resolver, or campaign transition. */
(function(root){
  'use strict';
  if(root.TechOpsGoodDogsCoop)return;
  var selected='solo',held={},pressed={},lastWorld=null,holdX=null;
  var bindings=['KeyA','KeyD','KeyW','KeyF','KeyR','KeyS','KeyV'];
  function state(){return root.NM&&root.NM._v736;}
  function meta(){return root.S&&root.S.meta&&root.S.meta._v736;}
  function mode(){return meta()&&meta().playMode||selected;}
  function active(){return !!state()&&mode()==='local';}
  function clear(){held={};pressed={};}
  function blocked(){var c=state();return !c||c.ending||c.resolving||root.S&&root.S.inDialog||root.document&&root.document.querySelector('#good-dogs-mode-select, #good-dogs-home-scene');}
  function configure(value){selected=value==='local'?'local':'solo';holdX=null;clear();if(meta())meta().playMode=selected;if(root.document&&root.document.body)root.document.body.dataset.goodDogsMode=selected;return selected;}
  function floor(){return typeof root.NM_FLOOR==='number'?root.NM_FLOOR:430;}
  function definition(n){var r=root.TechOpsLevelRegistry,row=r&&r.goodDogsMission(n._v736.m);return row&&row.pairPuzzle;}
  function progress(n){var c=n._v736;if(!c.pairPuzzle)c.pairPuzzle={charge:0,engaged:false,solved:false};return c.pairPuzzle;}
  function complete(m){var r=root.TechOpsLevelRegistry,row=r&&r.goodDogsMission(m),d=row&&row.pairPuzzle;if(!d)return true;var mt=meta();return !!(mt&&mt.pairPuzzles&&mt.pairPuzzles[d.id]);}
  function live(c,who){return !!(c.chars[who]&&!c.chars[who].downed&&!c.chars[who].out);}
  function partnerWho(c){return c.active==='katrin'?'manchez':'katrin';}
  function near(body,x){return Math.abs(body.x+(body.w||22)/2-x)<44&&Math.abs(body.y+(body.h||34)-floor())<20;}
  function say(n,text){n.msg=text;n.msgT=(root.performance?root.performance.now():Date.now())+2200;}
  function revive(player){
    var n=root.NM,c=state();if(!c||!active())return false;
    var from=player===2?partnerWho(c):c.active,to=player===2?c.active:partnerWho(c),a=player===2?c.partner:n,b=player===2?n:c.partner,ch=c.chars[to];
    if(!live(c,from)||!ch.downed||Math.abs(a.x-b.x)>90||Math.abs(a.y-b.y)>70)return false;
    ch.downed=false;ch.hp=Math.round(ch.maxHp*.4);ch.downT=0;b.hp=ch.hp;b.ifr=40;b.vx=0;b.vy=0;
    c.sync=Math.min(100,(c.sync||0)+25);say(n,to.toUpperCase()+' IS BACK · +25 SYNC');return true;
  }
  function interact(player){
    var n=root.NM,c=state();if(!n||blocked())return false;
    if(active()&&revive(player))return true;
    var who=player===2?partnerWho(c):c.active;if(!live(c,who))return true;
    var d=definition(n);if(!d||complete(c.m))return false;
    var body=player===2?c.partner:n,q=progress(n);
    if(!active()&&near(body,d.a)){
      holdX=holdX===null?d.a-(c.partner.w||22)/2:null;
      say(n,holdX===null?'PARTNER FOLLOWING':'PARTNER: HOLD THE FIRST PAD · TAKE THE OTHER SIDE');return true;
    }
    if(d.kind==='power-console'&&near(body,d.b)){q.engaged=true;say(n,'POWER LINK ARMED · KEEP BOTH CONTACTS OCCUPIED');return true;}
    return false;
  }
  function aiTarget(n){return holdX===null?n.x-n.face*70:holdX;}
  function aiHolding(){return holdX!==null;}
  function stepPuzzle(n,dt){
    if(lastWorld!==n._v736){lastWorld=n._v736;holdX=null;clear();}
    var c=n._v736,d=definition(n);if(!d)return;
    var q=progress(n);q.solved=complete(c.m);if(q.solved)return;
    var p=c.partner,allLive=live(c,c.active)&&live(c,partnerWho(c));
    q.a=allLive&&(near(n,d.a)||near(p,d.a));q.b=allLive&&(near(n,d.b)||near(p,d.b));
    var split=allLive&&(near(n,d.a)&&near(p,d.b)||near(p,d.a)&&near(n,d.b));
    var ready=split&&(d.kind!=='power-console'||q.engaged)&&(!d.requiresClear||n._gbShipRevealed);
    q.charge=ready?Math.min(d.seconds,q.charge+Math.min(dt,.05)):0;
    if(!split)q.engaged=false;
    if(q.charge>=d.seconds){var mt=meta();if(!mt)return;mt.pairPuzzles=mt.pairPuzzles||{};mt.pairPuzzles[d.id]=true;q.solved=true;holdX=null;say(n,d.success);try{if(root.save)root.save();}catch(_){} }
  }
  function stepPartner(n,dt,f,damage,worldWidth){
    var c=n._v736,p=c.partner,who=partnerWho(c);if(blocked()){clear();return;}
    if(!live(c,who)){pressed={};p.vx=0;return;}
    p.hp=c.chars[who].hp;p.cd=Math.max(0,(p.cd||0)-dt);p.anim=Math.max(0,(p.anim||0)-f);p.dashCD=Math.max(0,(p.dashCD||0)-dt);
    var dx=(held.KeyD?1:0)-(held.KeyA?1:0);p.block=!!held.KeyS&&p.onGround;
    if(dx&&!p.block){p.face=dx;p.vx=dx*3.4;}else p.vx*=Math.pow(.65,f);
    if(pressed.KeyW&&!p.block&&(p.onGround||(p.jumps||0)<3)){p.vy=-10.5;p.onGround=false;p.jumps=(p.jumps||0)+1;}
    if(pressed.KeyV&&!p.block&&!p.dashCD){p.dash=.13;p.dashCD=.7;}
    if(p.dash>0){p.dash-=dt;p.vx=p.face*9.5;}
    var oldFeet=p.y+p.h;p.vy=Math.min((p.vy||0)+.48*f,13.5);p.x=Math.max(0,Math.min((worldWidth||1800)-p.w,p.x+p.vx*f));p.y+=p.vy*f;p.onGround=false;
    var landing=floor();for(var pl of n.platforms||[])if(p.vy>=0&&oldFeet<=pl.y+2&&p.y+p.h>=pl.y&&p.x+p.w>pl.x&&p.x<pl.x+pl.w)landing=Math.min(landing,pl.y);
    if(p.y+p.h>=landing&&p.vy>=0){p.y=landing-p.h;p.vy=0;p.onGround=true;p.jumps=0;}
    p.hazardCD=Math.max(0,(p.hazardCD||0)-dt);
    if(p.onGround&&!p.hazardCD&&(n._goodBoysHazards||[]).some(function(h){return p.x+p.w/2>h.x&&p.x+p.w/2<h.x+h.w;})){c.chars[who].hp=Math.max(1,c.chars[who].hp-8);p.hp=c.chars[who].hp;p.vy=-8.5;p.vx=-p.face*4.5;p.onGround=false;p.hazardCD=.92;}
    if(pressed.KeyF&&!p.cd&&!p.block){
      p.cd=.27;p.anim=10;
      if(who==='katrin')c.shots.push({x:p.x+p.face*26,y:p.y+10,vx:p.face*8.5,life:1.4});
      else for(var e of n.enemies||[]){var front=(e.x+(e.w||24)/2)-(p.x+p.w/2);if(e.alive&&e.hp>0&&Math.abs(front)<76&&front*p.face>-10&&Math.abs(e.y-p.y)<48){e.kb=p.face*4;damage(e,11,who);}}
    }
    if(pressed.KeyR)interact(2);
    pressed={};
  }
  function beginStep(n){if(active())n._v736.coopPrevious={a:n.x,b:n._v736.partner.x};}
  function constrain(n,width){
    if(!active())return;var c=n._v736,p=c.partner,old=c.coopPrevious||{a:n.x,b:p.x},span=Math.max(270,Math.min(680,width-180)),delta=n.x-p.x,over=Math.abs(delta)-span;
    if(over<=0)return;var dir=Math.sign(delta),a=Math.max(0,(n.x-old.a)*dir),b=Math.max(0,(p.x-old.b)*-dir),total=a+b;
    if(!total)return;
    n.x-=dir*over*a/total;p.x+=dir*over*b/total;if(a)n.vx=0;if(b)p.vx=0;
  }
  function cameraTarget(n,width){if(!active())return n.x;return (n.x+n._v736.partner.x)/2+(width||960)*(1/2.4-.5);}
  function draw(ctx,n){
    var c=n&&n._v736;if(!c||c.ending)return;var d=definition(n),q=d&&progress(n),F=floor(),cam=n.cam||0;
    ctx.save();ctx.font='bold 10px monospace';ctx.textAlign='center';
    if(d){
      var solved=complete(c.m),col=solved?'#8de5ac':c.m===1?'#ffd18b':'#72dfff';
      ctx.strokeStyle=col;ctx.globalAlpha=.45;ctx.beginPath();ctx.moveTo(d.a-cam,F+7);ctx.lineTo(d.b-cam,F+7);ctx.stroke();ctx.globalAlpha=1;
      [d.a,d.b].forEach(function(x,i){var sx=x-cam,on=solved||(i?q.b:q.a);ctx.fillStyle=on?col:'#122029';ctx.fillRect(sx-33,F-4,66,7);ctx.strokeStyle=col;ctx.strokeRect(sx-33.5,F-4.5,67,8);ctx.fillStyle='#061018';ctx.fillRect(sx-43,F-72,86,17);ctx.fillStyle=col;ctx.fillText(i&&d.kind==='power-console'?'CONSOLE':'PAD '+(i+1),sx,F-60);});
      var mid=(d.a+d.b)/2-cam;ctx.fillStyle='#071018';ctx.fillRect(mid-115,F-154,230,29);ctx.fillStyle=col;ctx.fillText(solved?'LINK OPEN':d.label,mid,F-142);ctx.fillStyle='#27313b';ctx.fillRect(mid-101,F-134,202,3);ctx.fillStyle=col;ctx.fillRect(mid-101,F-134,202*(solved?1:q.charge/d.seconds),3);
      if(!solved){ctx.font='9px monospace';ctx.fillStyle='#f3e8ce';ctx.fillText(active()?(d.kind==='power-console'?'Hold PAD 1 + use CONSOLE (E / R)':'One dog on each pad · hold together'):'USE on PAD 1: partner stays · take the other side',Math.max(180,Math.min(ctx.canvas.width-180,mid)),F+32);}
    }
    if(active())[{body:n,id:'P1',color:'#72dfff'},{body:c.partner,id:'P2',color:'#ffc477'}].forEach(function(a){ctx.fillStyle='#041019';ctx.fillRect(a.body.x-cam-2,a.body.y-78,28,15);ctx.fillStyle=a.color;ctx.fillText(a.id,a.body.x-cam+12,a.body.y-67);});
    ctx.restore();
  }
  function onKey(e,down){
    if(!active()||bindings.indexOf(e.code)<0)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(blocked()){clear();return;}if(down&&!held[e.code])pressed[e.code]=true;held[e.code]=down;
  }
  if(root.addEventListener){root.addEventListener('keydown',function(e){onKey(e,true);},true);root.addEventListener('keyup',function(e){onKey(e,false);},true);root.addEventListener('blur',clear);if(root.document)root.document.addEventListener('visibilitychange',clear);}
  root.TechOpsGoodDogsCoop={VERSION:1,configure:configure,mode:mode,active:active,clear:clear,stepPartner:stepPartner,beginStep:beginStep,stepPuzzle:stepPuzzle,interact:interact,revive:revive,aiTarget:aiTarget,aiHolding:aiHolding,complete:complete,constrain:constrain,cameraTarget:cameraTarget,draw:draw,blocked:blocked};
})(typeof globalThis!=='undefined'?globalThis:this);
