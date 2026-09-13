// Guidance reads the same encounter and interaction state as the review session.
export const living=n=>(n.enemies||[]).filter(e=>e.alive!==false&&e.hp>0);
export const distance=(a,b)=>Math.hypot((a.x-b.x)/60,(a._gdLane||0)-(b._gdLane||0));
export function nearest(n,body=n){return living(n).sort((a,b)=>distance(body,a)-distance(body,b))[0]||null;}
export function strikeTarget(n,body=n){const e=nearest(n,body);return e&&distance(body,e)<=2.15&&Math.abs((body._gdLane||0)-(e._gdLane||0))<=1.1?e:null;}
export function guidance(n,{nearNode=false,localCoop=false}={}){
 const c=n._v736,p=c.partner,other=c.active==='katrin'?'manchez':'katrin';
 const enemy=nearest(n),step=!n._gbMikeIndexDefeated?1:enemy?2:!c._gbAccessNodeSeized?3:4;
 let target=enemy||{x:step===3?1070:1480,_gdLane:step===3?-2.25:0};
 let title=['','Defeat the white projection','Defeat the remaining guards','Unlock the route to Waldo','Reach the Route 1984 door'][step];
 let hint=step<=2?(strikeTarget(n)?'Hold STRIKE to attack. Move out of orange circles.':'Move toward the marked enemy. Hold STRIKE when close.'):step===3?'Follow the marker to the wall console.':'Follow the corridor to the marked door. K follows you.';
 let useLabel='USE',canUse=false;
 if(step===3&&nearNode){hint='You are beside the console. Tap UNLOCK ROUTE.';useLabel='UNLOCK ROUTE';canUse=true;}
 if(step===4&&n.x>=1400){hint=p.x>=1320?'Tap NEXT BLOCK to continue toward Waldo.':localCoop?'Wait for Player 2 at the door.':'Wait here for your partner to catch up.';canUse=p.x>=1320;useLabel=canUse?'NEXT BLOCK':'WAIT FOR PARTNER';}
 if(c.chars?.[other]?.hp<=0){target=p;title='Help your partner';canUse=distance(n,p)<=1.8;useLabel=canUse?'REVIVE':'REACH PARTNER';hint=canUse?'Tap REVIVE to help your partner up.':'Follow the marker back to your partner.';}
 if(c.chars?.[c.active]?.hp<=0){canUse=false;hint=localCoop?'Player 2: approach your partner and press U to revive.':'Stay here. Your partner is coming to revive you.';}
 const d=distance(n,target),dz=(target.x-n.x)/60,dx=(target._gdLane||0)-(n._gdLane||0);
 const direction=d<1.3?'HERE':Math.abs(dx)>Math.abs(dz)?dx<0?'RIGHT →':'← LEFT':dz>0?'FORWARD ↑':'↓ TURN BACK';
 return {step,title,hint,target,enemy,useLabel,canUse,direction,metres:Math.ceil(d),attackReady:!!strikeTarget(n)};
}
