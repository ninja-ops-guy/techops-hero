/* Night story adapter. Campaign facts remain in campaign_act1/act2/story.
 * Frame hooks provide spatial objectives; the journal never awards evidence. */
(function(root){
  'use strict';
  const STAIR_X=1560,FLOOR=430;
  const POINTS=[{id:'source',x:650,label:'VIOLIN SIGNAL'},{id:'relay',x:1330,label:'RELAY RETURN'}];
  const eligible=n=>!!n&&!n._v736&&!n._sector04&&!n.drive&&n.district!=='waldo';
  const load=()=>root.TechOpsCampaign?.load(root.localStorage);
  const save=c=>root.TechOpsCampaign.save(c,root.localStorage);
  function objective(c){
    if(!c)return {id:'unavailable',title:'Story data unavailable',detail:'Reopen the campaign journal once loading finishes.'};
    const f=c.flags||{},p=c.p1||{},facts=c.story?.facts||{};
    if(!f.day_work_unlocked)return {id:'opening',title:'Begin the Day 1 investigation',detail:'Night free roam is available. The story begins at the Day 1 standup and workstation: listen to Red in the Mirror and watch the company video.'};
    if(!f.tuesday_morning_reached){
      if(f.sector04_completed)return {id:'tuesday',title:'Return to Tuesday morning',detail:'Sector 04 is verified. Continue the investigation in daylight.'};
      if(c.evidence?.ghostIdentityEvidence?.status!=='established')return {id:'access',title:'Investigate Impossible Access',detail:'Return to Security Ops and corroborate the impossible badge event. Night combat cannot replace the evidence.'};
      return {id:'sector04',title:'After Hours — Sector 04',detail:'Observe the damage, reveal the identity dependency, sever the controller and verify the terminal.'};
    }
    if(!p.evidence?.badgeClonerVerified)return {id:'badge',title:'Ghost Frequency — Security Lab',detail:'Tuesday: compare the physical badge clone with the access audit in the Security Lab.'};
    if(!p.trust?.feliciaDaylightConversation)return {id:'daylight',title:'Meet Systems Integration in daylight',detail:'Return to the connector hall for the first daytime conversation. Evidence and trust are separate.'};
    if(!p.morningstar?.signatureFound)return {id:'trace',title:'Verify the Trace Bay signature',detail:'Return to Engineering and verify the telemetry signature before following its rooftop echo.'};
    if(!p.reveal?.violinistRevealed)return {id:'rooftop',title:'Rooftop signal — Downtown stairwell',detail:'Drive to Downtown. Walk to the far-right stairwell, clear the roof and hold position at two signal points to corroborate the echo. Identity stays unconfirmed until recognition.'};
    if(!p.duet?.protocolCompleted)return {id:'duet',title:'Parts in Motion — prepare Duet Protocol',detail:'The rooftop reveal is recorded. Continue the component ledger and the earned partnership in the day campaign; companion free play remains locked until Duet Protocol.'};
    if(!facts.mike_meets_k)return {id:'later',title:'Continue the rescue and identity investigation',detail:'Continue the Good Dogs rescue and Ghost Fork prerequisites through their existing campaign routes. The Night district brawler does not complete those chapters.'};
    return {id:'later',title:'Continue the main campaign',detail:'Return to the main campaign for the next eligible chapter. Watchdog, the ORPHEUS decision and the printer epilogue remain owned by the story director.'};
  }
  function summary(){try{return objective(load());}catch(_){return objective(null);}}
  function canRooftop(c){return objective(c).id==='rooftop';}
  function atPoint(n){
    if(!eligible(n)||!n.onGround)return null;const feet=n.y+(n.h||34),x=n.x+(n.w||22)/2;
    if(n._nightMission?.id==='rooftop'){
      if(Math.abs(x-90)<65&&Math.abs(feet-FLOOR)<35)return {id:'exit',x:90,label:'RETURN TO STREET'};
      return POINTS.find(p=>Math.abs(x-p.x)<65&&Math.abs(feet-FLOOR)<35)||null;
    }
    return n.district==='downtown'&&Math.abs(x-STAIR_X)<65&&Math.abs(feet-FLOOR)<35&&summary().id==='rooftop'?{id:'stairs',x:STAIR_X,label:'ROOFTOP ACCESS'}:null;
  }
  function tell(n,message){n.msg=message;n.msgT=(root.performance?.now()||0)+4500;}
  function reset(n,x){root.TechOpsNightCombat?.cancel(n);delete n._nightCombat;root.TechOpsNightInput?.reset();Object.assign(n,{x,y:FLOOR-n.h,vx:0,vy:0,onGround:true,jumps:0,dashT:0,hitStop:0,cam:0});}
  function enter(n){
    if(atPoint(n)?.id!=='stairs'||!canRooftop(load()))return false;
    const origin={};for(const k of ['district','street','x','y','platforms','enemies','clear','cam','location'])origin[k]=n[k];
    n._nightMission={id:'rooftop',origin,observed:{},scan:null,complete:false};n.location='rooftop';n.clear=false;
    n.platforms=[{x:320,y:344,w:150,h:14},{x:810,y:306,w:160,h:14},{x:1110,y:352,w:130,h:14}];
    n.enemies=root.nmSpawnEnemies?root.nmSpawnEnemies(1,'downtown'):[];reset(n,105);tell(n,'ROOFTOP SIGNAL — clear security, then inspect both signal points');return true;
  }
  function leave(n){const m=n?._nightMission;if(!m)return false;Object.assign(n,m.origin);delete n._nightMission;reset(n,STAIR_X-110);return true;}
  function recognition(n){
    const c=load(),a=root.TechOpsCampaignAct2;if(!c||!a||!c.p1?.evidence?.rooftopViolinVerified)return false;
    const available=a.violinistRevealEligible(c);
    root.dlg?.('ROOFTOP // CORROBORATED','The same timing appears in the instrument signal and the relay return. The connection is recorded. Recognition needs both the earlier badge evidence and the daytime meeting.',[
      ...(available&&!c.p1.reveal.violinistRevealed?[{t:'Recognize the violinist',f:()=>{const fresh=load();if(!a.violinistRevealEligible(fresh))return;a.revealViolinist(fresh);save(fresh);root.closeDlg?.();tell(n,'THE VIOLINIST — identity established · Parts in Motion');}}]:[]),
      {t:'Return to the street',f:()=>{root.closeDlg?.();leave(n);}},{t:'Stay on the roof',f:()=>root.closeDlg?.()}
    ]);return true;
  }
  function interact(n){
    const p=atPoint(n);if(!p)return false;if(p.id==='stairs')return enter(n);if(p.id==='exit')return leave(n);
    const m=n._nightMission;if(!m)return false;if(m.complete)return recognition(n);
    if(n.enemies.some(e=>e.alive)){tell(n,'Clear rooftop security before examining the signal');return true;}
    if(m.observed[p.id]){tell(n,'Signal recorded — inspect the other point');return true;}
    if(m.scan?.id!==p.id)m.scan={id:p.id,seconds:0};tell(n,'Keep still to record '+p.label.toLowerCase());return true;
  }
  function step(n,dt){
    const m=n?._nightMission;if(!m||m.complete||!m.scan||root.S?.inDialog||root.S?.paused)return;
    const p=atPoint(n);if(!p||p.id!==m.scan.id||n.enemies.some(e=>e.alive)){m.scan=null;return;}
    m.scan.seconds+=Math.min(.05,Math.max(0,Number(dt)||0));if(m.scan.seconds<1.5)return;
    m.observed[p.id]=true;m.scan=null;tell(n,'Signal recorded — inspect the other point');
    if(POINTS.every(p=>m.observed[p.id])){
      const c=load();if(!canRooftop(c))return;
      try{
        root.TechOpsCampaignAct2.recordRooftopViolinEvidence(c,{signalObserved:true,corroborated:true,perspective:'firsthand'});save(c);
      }catch(_){m.observed[p.id]=false;tell(n,'Could not save the signal — inspect this point to retry');return;}
      m.complete=true;tell(n,'Both signals corroborated — inspect to review the connection');recognition(n);
    }
  }
  function draw(x,n){
    if(!eligible(n))return;const m=n._nightMission,roof=m?.id==='rooftop';if(!roof&&!(n.district==='downtown'&&summary().id==='rooftop'))return;
    const points=roof?[{id:'exit',x:90,label:'STREET'},...POINTS]:[{id:'stairs',x:STAIR_X,label:'ROOFTOP / STORY'}];
    x.save();x.textAlign='center';x.font='12px monospace';
    if(roof){x.fillStyle='#172b36';x.fillRect(0,FLOOR,x.canvas.width,14);x.strokeStyle='#83a9ae';x.beginPath();x.moveTo(0,FLOOR);x.lineTo(x.canvas.width,FLOOR);x.stroke();}
    for(const p of points){const px=p.x-(n.cam||0);x.fillStyle=m?.observed[p.id]?'#7cecc0':'#ffc77f';x.fillRect(px-18,FLOOR-56,36,56);x.fillStyle='#122631';x.fillRect(px-13,FLOOR-50,26,20);x.fillStyle='#e7ffe8';x.fillText(p.label,px,FLOOR-76);if(atPoint(n)?.id===p.id)x.fillText(p.id==='exit'?'E / EXIT':p.id==='stairs'?'E / ENTER':'E / INSPECT',px,FLOOR-97);}
    if(m?.scan){const px=POINTS.find(p=>p.id===m.scan.id).x-(n.cam||0);x.fillStyle='#66edc0';x.fillRect(px-30,FLOOR-67,60*Math.min(1,m.scan.seconds/1.5),4);}
    x.restore();
  }
  function open(n,backToDay){
    const o=summary(),opts=[];if(n?._nightMission){opts.push({t:'Return to rooftop investigation',f:()=>root.closeDlg?.()});opts.push({t:'Leave the roof',f:()=>{root.closeDlg?.();leave(n);}});}
    else if(n?._sector04)opts.push({t:'Continue Sector 04 investigation',f:()=>root.closeDlg?.()});
    else if(o.id==='sector04')opts.push({t:'Enter Sector 04 — story campaign',f:()=>{root.closeDlg?.();root.TechOpsSector04Runtime?.enterBrowser();}});
    else if(o.id==='rooftop')opts.push({t:'Track Downtown rooftop stairwell',f:()=>{root.closeDlg?.();tell(n,'STORY — Downtown · far-right rooftop stairwell');}});
    opts.push({t:o.id==='opening'?'Resume the daytime opening':o.id==='tuesday'?'Continue to Tuesday morning':'Return to daytime investigation',f:backToDay});
    opts.push({t:'Back to Night Walker',f:()=>root.closeDlg?.()});
    root.dlg?.('NIGHT WALKER // CAMPAIGN','<b>'+o.title+'</b><br><br>'+o.detail,opts);return true;
  }
  root.TechOpsNightCampaign={VERSION:1,POINTS,STAIR_X,objective,summary,canRooftop,atPoint,enter,leave,interact,step,draw,open};
})(typeof globalThis!=='undefined'?globalThis:this);
