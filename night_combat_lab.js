/* Offline practice on the production Night Walker simulation. No campaign rewards. */
(function(root){
'use strict';
let origin=null;
const ROSTER=Object.freeze({mike:{name:'Mike',speed:1,damage:1},k:{name:'K',speed:1,damage:1},iona:{name:'Iona',speed:1,damage:1.08},felicia:{name:'Felicia',speed:1.12,damage:1}});
const OPPONENTS=Object.freeze({guard:{name:'Guard',hp:90,spd:1,dmg:8,tint:'#ffb347',blocks:true},skimmer:{name:'Skimmer',hp:70,spd:1.55,dmg:9,tint:'#67e8f9',dashes:true},hunter:{name:'Hunter',hp:120,spd:1.2,dmg:12,tint:'#ff6b81',lunges:true}});
const game=()=>typeof S!=='undefined'?S:root.S;
const world=()=>game()?.nightMode;
const active=n=>!!(n&&n===world()&&n._combatLab);
const clone=n=>JSON.parse(JSON.stringify(n,(k,v)=>k==='_nightCombat'?undefined:v));
function checkpointNight(){return origin?clone(origin):null;}
function close(){if(root.closeDlg)root.closeDlg();}
function dialog(title,body,options){return root.dlg(title,body,options);}
function menu(back){
 if(active(world()))return sessionMenu();
 return dialog('COMBAT LAB · OFFLINE','Practice movement, combos and combat against the Night Walker AI. Choose a fighter next. These sessions do not grant rewards and return you to your street. Online PvP is not available yet.',[
  {t:'Training — stationary target',f:()=>chooseActor('training')},{t:'Arena — fight an AI opponent',f:()=>chooseActor('arena')},{t:'Back',f:back||close}]);
}
function chooseActor(mode){if(!['training','arena'].includes(mode))return false;return dialog('CHOOSE A FIGHTER','K and Mike use the shared combat kit. Iona has her aerial bicycle kick and slightly higher strike damage; Felicia moves faster. Route, stealth and security abilities are not available in this practice room yet. K and Felicia use provisional existing artwork.',Object.keys(ROSTER).map(id=>({t:ROSTER[id].name,f:()=>mode==='arena'?chooseOpponent(id):start(mode,id)})).concat({t:'Back',f:()=>menu()}));}
function chooseOpponent(actor){if(!Object.hasOwn(ROSTER,actor))return false;return dialog('CHOOSE AN OPPONENT','Fight one Night Walker AI opponent. Guard blocks some attacks; Skimmer dashes; Hunter lunges. Initial values are subject to playtesting.',Object.keys(OPPONENTS).map(id=>({t:OPPONENTS[id].name,f:()=>start('arena',actor,id)})).concat({t:'Back',f:()=>chooseActor('arena')}));}
function modifiers(n){const p=ROSTER[n?._combatLab?.actor]||ROSTER.mike;return {damage:p.damage,speed:p.speed,jumps:2,recovery:1,combo:0,dash:1,air:1};}
function makeEnemy(kind,opponent='guard'){const p=kind==='training'?{name:'Practice target',hp:100000,spd:0,dmg:0,tint:'#7edbcc'}:OPPONENTS[opponent];if(!p)throw Error('Unknown opponent');return {name:p.name,kind:kind==='training'?'guard':opponent,x:720,y:396,w:26,h:34,hp:p.hp,maxHp:p.hp,spd:p.spd,dmg:p.dmg,tint:p.tint,blocks:!!p.blocks,dashes:!!p.dashes,lunges:!!p.lunges,cash:[0,0],vx:0,windup:0,hitT:0,kb:0,launch:0,down:0,alive:true,cd:0,_labDummy:kind==='training'};}
function start(mode,actor='mike',opponent='guard'){
 const n=world();if(!n||n.drive||n._v736||n._sector04||n._nightwalker||n._livingWorld||n._combatLab||!['training','arena'].includes(mode)||!Object.hasOwn(ROSTER,actor)||!Object.hasOwn(OPPONENTS,opponent))return false;
 if((n.enemies||[]).some(e=>e.alive&&Math.abs(e.x-n.x)<260)||n._nightCombat?.attack||n._nightCombat?.grab){dialog('FIND A SAFE PLACE','Move away from nearby enemies and finish your current action before entering practice.',[{t:'Back',f:menu}]);return false;}
 try{origin=clone(n);}catch(_){dialog('PRACTICE UNAVAILABLE','The street could not be preserved. Nothing has changed.',[{t:'Back',f:menu}]);return false;}
 n._combatLab={mode,actor,opponent,done:false,damage:0,hits:0,targetHP:mode==='training'?100000:OPPONENTS[opponent].hp};n.district='industrial';n.street=1;n.x=500;n.y=396;n.vx=0;n.vy=0;n.w=22;n.h=34;n.face=1;n.onGround=true;n.jumps=0;n.hp=100;n.ifr=0;n.hitStop=0;n.dashT=0;n.dashCD=0;n.jHeld=false;n.block=false;n.cam=0;n.clear=false;n.platforms=[];n.enemies=[makeEnemy(mode,opponent)];delete n._nightCombat;
 n.msg=ROSTER[actor].name.toUpperCase()+' · '+(mode==='training'?'TRAINING · Practice combos':'ARENA · Defeat the '+OPPONENTS[opponent].name)+' · C for options';n.msgT=(root.performance?.now()||0)+5000;close();return true;
}
function restore(){const n=world();if(!active(n)||!origin)return false;const saved=origin;origin=null;Object.keys(n).forEach(k=>delete n[k]);Object.assign(n,saved);if(root.TechOpsNightInput)root.TechOpsNightInput.reset();return true;}
function leave(){if(!restore())return false;close();return true;}
function resetTraining(){const n=world();if(!active(n)||n._combatLab.mode!=='training')return false;if(root.TechOpsNightCombat)root.TechOpsNightCombat.cancel(n);n.enemies=[makeEnemy('training')];n.hp=100;n.hitStop=0;n.ifr=0;n._combatLab.damage=0;n._combatLab.hits=0;n._combatLab.targetHP=100000;delete n._nightCombat;n.msg='TRAINING · Target and health reset';n.msgT=(root.performance?.now()||0)+3000;close();return true;}
function sessionMenu(){if(!active(world()))return false;const lab=world()._combatLab,options=[{t:'Resume practice',f:close}];if(lab.mode==='training')options.push({t:'Reset target and health',f:resetTraining});options.push({t:'Return to the street',f:leave});return dialog('COMBAT LAB · '+lab.mode.toUpperCase(),ROSTER[lab.actor].name+' · '+(lab.mode==='training'?lab.damage+' damage · '+lab.hits+' contacts.<br><br>':'')+'Practice is offline. Press C to return here. Your street health, position and rewards will be restored when you leave.',options);}
function finish(won){if(!active(world())||world()._combatLab.done)return false;const n=world();n._combatLab.done=true;n.hp=Math.max(1,n.hp);return dialog(won?'ARENA · VICTORY':'ARENA · DEFEAT','The practice fight is over. No campaign rewards or penalties were applied.',[{t:'Return to the street',f:leave},{t:'Fight again',f:()=>{const actor=n._combatLab.actor,opponent=n._combatLab.opponent;if(restore())start('arena',actor,opponent);}}]);}
function afterStep(n){if(!active(n)||n._combatLab.done||game().inDialog||game().paused||root.document?.hidden)return;if(n._combatLab.mode==='arena'&&n.enemies.every(e=>!e.alive))finish(true);else if(n._combatLab.mode==='training'){const lab=n._combatLab,e=n.enemies[0];if(e&&e.hp<lab.targetHP){lab.damage+=lab.targetHP-e.hp;lab.hits++;lab.targetHP=e.hp;n.msg='TRAINING · '+lab.damage+' damage · '+lab.hits+' contacts · C for options';n.msgT=(root.performance?.now()||0)+5000;}}}
root.TechOpsCombatLab={ROSTER,OPPONENTS,active,checkpointNight,menu,chooseActor,chooseOpponent,modifiers,start,leave,sessionMenu,resetTraining,finish,afterStep,makeEnemy};
if(typeof module==='object')module.exports=root.TechOpsCombatLab;
})(typeof globalThis!=='undefined'?globalThis:this);
