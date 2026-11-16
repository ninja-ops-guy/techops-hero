/* Offline practice on the production Night Walker simulation. No campaign rewards. */
(function(root){
'use strict';
let origin=null;
const game=()=>typeof S!=='undefined'?S:root.S;
const world=()=>game()?.nightMode;
const active=n=>!!(n&&n===world()&&n._combatLab);
const clone=n=>JSON.parse(JSON.stringify(n,(k,v)=>k==='_nightCombat'?undefined:v));
function checkpointNight(){return origin?clone(origin):null;}
function close(){if(root.closeDlg)root.closeDlg();}
function dialog(title,body,options){return root.dlg(title,body,options);}
function menu(back){
 if(active(world()))return sessionMenu();
 return dialog('COMBAT LAB · OFFLINE','Practice movement, combos and combat against the Night Walker AI. These sessions use Mike, do not grant rewards, and return you to your street. Online PvP and other characters are not available here yet.',[
  {t:'Training — stationary target',f:()=>start('training')},{t:'Arena — fight a guard',f:()=>start('arena')},{t:'Back',f:back||close}]);
}
function makeEnemy(kind){return {name:kind==='training'?'Practice target':'Arena guard',kind:'guard',x:720,y:396,w:26,h:34,hp:kind==='training'?100000:90,maxHp:kind==='training'?100000:90,spd:kind==='training'?0:1,dmg:kind==='training'?0:8,tint:kind==='training'?'#7edbcc':'#ffb347',cash:[0,0],vx:0,windup:0,hitT:0,kb:0,launch:0,down:0,alive:true,cd:0,_labDummy:kind==='training'};}
function start(mode){
 const n=world();if(!n||n.drive||n._v736||n._sector04||n._nightwalker||n._livingWorld||n._combatLab||!['training','arena'].includes(mode))return false;
 if((n.enemies||[]).some(e=>e.alive&&Math.abs(e.x-n.x)<260)||n._nightCombat?.attack||n._nightCombat?.grab){dialog('FIND A SAFE PLACE','Move away from nearby enemies and finish your current action before entering practice.',[{t:'Back',f:menu}]);return false;}
 try{origin=clone(n);}catch(_){dialog('PRACTICE UNAVAILABLE','The street could not be preserved. Nothing has changed.',[{t:'Back',f:menu}]);return false;}
 n._combatLab={mode,done:false};n.district='industrial';n.street=1;n.x=500;n.y=396;n.vx=0;n.vy=0;n.w=22;n.h=34;n.face=1;n.onGround=true;n.jumps=0;n.hp=100;n.ifr=0;n.hitStop=0;n.dashT=0;n.dashCD=0;n.jHeld=false;n.block=false;n.cam=0;n.clear=false;n.platforms=[];n.enemies=[makeEnemy(mode)];delete n._nightCombat;
 n.msg=mode==='training'?'TRAINING · Practice combos · C for options':'ARENA · Defeat the guard · C for options';n.msgT=(root.performance?.now()||0)+5000;close();return true;
}
function restore(){const n=world();if(!active(n)||!origin)return false;const saved=origin;origin=null;Object.keys(n).forEach(k=>delete n[k]);Object.assign(n,saved);if(root.TechOpsNightInput)root.TechOpsNightInput.reset();return true;}
function leave(){if(!restore())return false;close();return true;}
function sessionMenu(){if(!active(world()))return false;return dialog('COMBAT LAB · '+world()._combatLab.mode.toUpperCase(),'Practice is offline. Press C to return here. Your street health, position and rewards will be restored when you leave.',[{t:'Resume practice',f:close},{t:'Return to the street',f:leave}]);}
function finish(won){if(!active(world())||world()._combatLab.done)return false;const n=world();n._combatLab.done=true;n.hp=Math.max(1,n.hp);return dialog(won?'ARENA · VICTORY':'ARENA · DEFEAT','The practice fight is over. No campaign rewards or penalties were applied.',[{t:'Return to the street',f:leave},{t:'Fight again',f:()=>{if(restore())start('arena');}}]);}
function afterStep(n){if(!active(n)||n._combatLab.done||game().inDialog||game().paused||root.document?.hidden)return;if(n._combatLab.mode==='arena'&&n.enemies.every(e=>!e.alive))finish(true);}
root.TechOpsCombatLab={active,checkpointNight,menu,start,leave,sessionMenu,finish,afterStep,makeEnemy};
if(typeof module==='object')module.exports=root.TechOpsCombatLab;
})(typeof globalThis!=='undefined'?globalThis:this);
