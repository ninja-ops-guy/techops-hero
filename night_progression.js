/* Night training is player progression, not a character's autobiographical memory.
 * No timers, campaign grants, or replacement physics loop. */
(function(root){
'use strict';
const CAP=20, STATS=['strength','speed','jumps','dexterity','intelligence'];
const SKILLS={
 heavyHands:{name:'Heavy hands',level:3,stat:'strength',rank:2,description:'+15% direct attack damage.'},
 fleetFoot:{name:'Fleet foot',level:3,stat:'speed',rank:2,description:'Dash cooldown reduced by 20%.'},
 airControl:{name:'Air control',level:5,stat:'jumps',rank:1,description:'+15% airborne acceleration.'},
 flow:{name:'Flow state',level:5,stat:'dexterity',rank:3,description:'Attack recovery reduced by a further 10%.'},
 insight:{name:'Combat insight',level:5,stat:'intelligence',rank:3,description:'An extra 100 ms to land the next timed combo input.'}
};
const descriptions={strength:'+6% direct attack damage per rank.',speed:'+3% running speed and acceleration per rank.',jumps:'One extra jump per rank. Ranks require levels 5 / 10 and cost 3 stat points each.',dexterity:'Attack recovery reduced by 2% per rank.',intelligence:'Timed combo input window widened by 20 ms per rank.'};
const fresh=()=>({version:1,xp:0,stats:Object.fromEntries(STATS.map(k=>[k,0])),skills:[],awards:[]});
const cost=l=>100+25*(l-1);
function level(p){let l=1,left=p.xp;while(l<CAP&&left>=cost(l)){left-=cost(l);l++;}return {level:l,progress:left,next:l===CAP?0:cost(l)};}
const MAX_XP=Array.from({length:CAP-1},(_,i)=>cost(i+1)).reduce((a,b)=>a+b,0);
function points(p){const l=level(p).level;return {stat:2*(l-1)-STATS.reduce((n,k)=>n+p.stats[k]*(k==='jumps'?3:1),0),skill:Math.floor(l/2)-p.skills.length};}
function validate(p){
 const ok=p&&p.version===1&&Number.isInteger(p.xp)&&p.xp>=0&&p.xp<=MAX_XP&&p.stats&&STATS.every(k=>Number.isInteger(p.stats[k])&&p.stats[k]>=0&&p.stats[k]<=(k==='jumps'?2:10))&&Array.isArray(p.skills)&&p.skills.every(k=>Object.hasOwn(SKILLS,k))&&new Set(p.skills).size===p.skills.length&&Array.isArray(p.awards)&&p.awards.length<=4096&&p.awards.every(k=>typeof k==='string'&&k.length<=180)&&new Set(p.awards).size===p.awards.length;
 if(!ok)throw Error('Training record needs recovery; it has not been overwritten.');
 const l=level(p).level,q=points(p);if(q.stat<0||q.skill<0||p.stats.jumps>0&&l<5||p.stats.jumps>1&&l<10||p.skills.some(k=>l<SKILLS[k].level||p.stats[SKILLS[k].stat]<SKILLS[k].rank))throw Error('Training allocations exceed earned points.');return p;
}
function award(p,key,amount){validate(p);if(typeof key!=='string'||key.length>180||!Number.isInteger(amount)||amount<=0||amount>200)throw Error('Invalid training reward');if(p.awards.includes(key)||p.xp>=MAX_XP)return false;if(p.awards.length>=4096)throw Error('Training reward history is full.');p.awards.push(key);p.xp=Math.min(MAX_XP,p.xp+amount);return true;}
function upgrade(p,k){validate(p);if(!STATS.includes(k))throw Error('Unknown stat');const q=points(p),l=level(p).level,c=k==='jumps'?3:1;if(p.stats[k]>=(k==='jumps'?2:10))throw Error('Maximum rank reached');if(q.stat<c)throw Error('Not enough stat points');if(k==='jumps'&&l<(p.stats.jumps?10:5))throw Error('Requires level '+(p.stats.jumps?10:5));p.stats[k]++;return true;}
function learn(p,k){validate(p);const s=SKILLS[k];if(!s)throw Error('Unknown skill');if(p.skills.includes(k))throw Error('Already learned');if(points(p).skill<1||level(p).level<s.level||p.stats[s.stat]<s.rank)throw Error('Requires level '+s.level+', '+s.stat+' rank '+s.rank+' and 1 skill point');p.skills.push(k);return true;}
function bonuses(p){validate(p);return {damage:1+.06*p.stats.strength+(p.skills.includes('heavyHands')?.15:0),speed:1+.03*p.stats.speed,jumps:2+p.stats.jumps,recovery:1-.02*p.stats.dexterity-(p.skills.includes('flow')?.1:0),combo:20*p.stats.intelligence+(p.skills.includes('insight')?100:0),dash:p.skills.includes('fleetFoot')?.8:1,air:p.skills.includes('airControl')?1.15:1};}
const game=()=>typeof S!=='undefined'?S:root.S;
function eligible(n){const s=game();return !!(s&&s.nightMode===n&&n&&!n.drive&&!n._combatLab&&!n._v736&&!n._sector04&&n.district!=='waldo'&&(!n._livingWorld||['mike','k','iona','felicia'].includes(root.TechOpsLivingWorldRuntime?.viewpoint(n))));}
function record(){const s=game();if(!s)throw Error('Start a Night run first');s.meta=s.meta||{};if(!s.meta.nightTraining)s.meta.nightTraining=fresh();return validate(s.meta.nightTraining);}
function modifiers(n){try{return eligible(n)?bonuses(record()):bonuses(fresh());}catch(_){return bonuses(fresh());}}
function persist(){const f=typeof save==='function'?save:root.save;if(!f||!f())throw Error('Training could not be saved. No points were spent; retry when storage is available.');}
function transact(fn){const p=record(),before=JSON.stringify(p);try{const result=fn(p);if(result)persist();return result;}catch(e){game().meta.nightTraining=JSON.parse(before);throw e;}}
function notify(text){if(root.toast)root.toast(text,3500);}
function reward(key,amount){try{const before=level(record()).level;const changed=transact(p=>award(p,key,amount));if(changed)notify(level(record()).level>before?'LEVEL '+level(record()).level+' · Open Stats & skills to train.':'+'+amount+' Night XP');return changed;}catch(e){notify(e.message);return false;}}
function defeat(n,e){if(!eligible(n))return false;const s=game(),a=s.meta?.livingWorld?.active;const scope=n._livingWorld&&a?'chapter:'+a.id+':'+a.room+':'+a.step+':'+(a.task||''):'street:'+String(s.day||1)+':'+n.district+':'+n.street;const mission=n._nightwalker?':report:'+String(n._nightwalker.runtimeId||'westAnnex'):'';const i=n.enemies.indexOf(e);if(i<0)return false;return reward(scope+mission+':enemy:'+i,20);}
function chapter(id){const a=root.TechOpsLivingWorld,e=a?.episode(id);if(!e||!e.danger||!game()?.meta?.livingWorld?.done?.includes(id))return false;return reward('chapter-clear:'+id,200);}
function clear(n){if(!eligible(n)||n._livingWorld||n._nightwalker||!n.enemies?.length||n.enemies.some(e=>e.alive))return false;return reward('street-clear:'+String(game().day||1)+':'+n.district+':'+n.street,100);}
function dialog(title,body,options){root.dlg(title,body,options);}
function open(back){const n=game()?.nightMode;if(!eligible(n))return false;back=typeof back==='function'?back:root.closeDlg;try{
 const p=record(),l=level(p),q=points(p),b=bonuses(p);
 const options=STATS.map(k=>({t:(k==='jumps'?'Jump count':k[0].toUpperCase()+k.slice(1))+' — '+(k==='jumps'?b.jumps:p.stats[k])+' · Train',f:()=>detail(k,back)}));
 options.push({t:'Learn skills',f:()=>skills(back)},{t:'Reset allocations — free',f:()=>dialog('RESET TRAINING','Return all spent stat and skill points? Your level and XP stay the same.',[{t:'Reset stat and skill allocations',f:()=>act(p=>{p.stats=fresh().stats;p.skills=[];return true;},()=>open(back))},{t:'Keep this build',f:()=>open(back)}])},{t:'Back',f:back});
 dialog('NIGHT WALKER · LEVEL '+l.level,(l.next?l.progress+' / '+l.next+' XP to next level':'Maximum level reached')+'<br><b>'+q.stat+' stat points · '+q.skill+' skill points</b><br><br>First defeat +20 XP · Street clear +100 · Dangerous chapter +200.<br>Rewards are counted once per encounter; street rewards renew on a new game day. Quiet scenes give no XP.<br><br>Shared training for this Night save. Base moves and double jump stay unlocked.<br><br>Damage ×'+b.damage.toFixed(2)+' · Run speed ×'+b.speed.toFixed(2)+' · '+b.jumps+' jumps',options);return true;
 }catch(e){dialog('TRAINING UNAVAILABLE',e.message,[{t:'Back',f:back}]);return false;}}
function act(fn,next){try{transact(fn);next();}catch(e){dialog('TRAINING UNCHANGED',e.message,[{t:'Back to training',f:next}]);}}
function detail(k,back){const p=record(),rank=p.stats[k],need=k==='jumps'?3:1;dialog(k.toUpperCase()+' · RANK '+rank,descriptions[k]+'<br><br>'+points(p).stat+' stat points available. Maximum rank '+(k==='jumps'?2:10)+'.', [{t:'Increase '+k+' — '+need+' point'+(need>1?'s':''),f:()=>act(p=>upgrade(p,k),()=>open(back))},{t:'Back to training',f:()=>open(back)}]);}
function skills(back){const p=record();dialog('LEARN SKILLS',points(p).skill+' skill points available. Earn one every two levels. Learned skills are passive and always active in eligible Night combat.',Object.entries(SKILLS).map(([k,s])=>({t:s.name+(p.skills.includes(k)?' · Learned':' · Level '+s.level),f:()=>dialog(s.name,s.description+'<br><br>Requires level '+s.level+' and '+s.stat+' rank '+s.rank+'.',[{t:p.skills.includes(k)?'Already learned':'Learn — 1 skill point',f:()=>act(p=>learn(p,k),()=>skills(back))},{t:'Back to skills',f:()=>skills(back)}])})).concat({t:'Back to training',f:()=>open(back)}));}
const api={CAP,STATS,SKILLS,MAX_XP,fresh,cost,level,points,validate,award,upgrade,learn,bonuses,eligible,record,modifiers,transact,defeat,chapter,clear,open};root.TechOpsNightProgression=api;if(typeof module==='object')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
