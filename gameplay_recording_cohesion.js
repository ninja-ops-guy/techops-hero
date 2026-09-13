/* TechOps Hero — gameplay recording cohesion pass v2.
 * Evidence: 2026-09-12 physical-iPhone gameplay recording.
 * Owns presentation/state reconciliation only; does not change combat damage,
 * campaign facts, Good Dogs progression, or authored environment bindings.
 */
(function(root){
  'use strict';
  if(!root||root.TechOpsGameplayRecordingCohesion)return;
  const doc=root.document;let observer=null,lastNight=false,scheduled=false;
  const state=()=>{try{return root.S||null;}catch(_){return null;}};
  const campaign=()=>{try{return root.TechOpsCampaign&&root.TechOpsCampaign.load(root.localStorage);}catch(_){return null;}};
  const night=()=>{const s=state();return !!(s&&s.nightMode&&!s.nightMode._v736);};
  const coarse=()=>!!(root.matchMedia&&root.matchMedia('(pointer:coarse)').matches);
  function css(){
    if(!doc)return;
    let st=doc.getElementById('gameplay-recording-cohesion-style');if(!st){st=doc.createElement('style');st.id='gameplay-recording-cohesion-style';(doc.head||doc.documentElement).appendChild(st);}
    st.textContent=`
/* Night: one information hierarchy. Keep combat state, remove duplicate tutorial chrome. */
body.recording-night #quest-tracker,body.recording-night #chaos-banner{display:none!important}
body.recording-night #v63-card{display:none!important}
body.recording-night #night-campaign{max-width:112px!important;min-height:38px!important;padding:6px 9px!important;font-size:10px!important;opacity:.82}
body.recording-night #toast{top:auto!important;bottom:max(116px,calc(env(safe-area-inset-bottom) + 116px))!important;max-width:min(76vw,360px)!important;padding:7px 10px!important;font-size:10px!important;line-height:1.35!important;border-width:1px!important}
/* Day mobile: preserve the world as the primary surface. */
@media(pointer:coarse) and (max-width:640px){
 body.recording-day #hud-top{padding:5px 7px!important;gap:4px!important;background:linear-gradient(#050812e8,#05081266)!important}
 body.recording-day #hud-day{font-size:10px!important;white-space:nowrap}
 body.recording-day #hud-title{font-size:8px!important;max-width:125px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap}
 body.recording-day #hud-clock{font-size:9px!important}
 body.recording-day #hud-bars{max-width:125px!important}
 body.recording-day #hud-right{font-size:9px!important;gap:1px!important}
 body.recording-day #quest-tracker{margin:3px 7px!important;max-width:48vw!important;font-size:8px!important;line-height:1.3!important;background:#070b14c9!important;border:1px solid #52647a66!important;border-radius:5px!important;padding:5px 7px!important}
 body.recording-day #v64-panel{display:none!important}
 body.recording-day #dpad{left:max(8px,env(safe-area-inset-left))!important;bottom:max(10px,calc(env(safe-area-inset-bottom) + 10px))!important;grid-template-columns:repeat(3,44px)!important;grid-template-rows:repeat(3,44px)!important;gap:3px!important}
 body.recording-day .dbtn{font-size:16px!important;border-width:1px!important}
 body.recording-day #touch-buttons{right:max(10px,env(safe-area-inset-right))!important;bottom:max(12px,calc(env(safe-area-inset-bottom) + 12px))!important;gap:8px!important}
 body.recording-day #touch-buttons .tbtn{width:56px!important;height:56px!important;font-size:18px!important;border-width:1px!important;background:#102238d9!important}
 body.recording-day #touch-buttons .tbtn.small{width:40px!important;height:40px!important;font-size:13px!important}
 body.recording-day #minimap,body.recording-day #v70-minimap{bottom:max(162px,calc(env(safe-area-inset-bottom) + 162px))!important;right:8px!important;transform:scale(.82)!important;transform-origin:bottom right!important}
}
/* World interaction affordances: reduce opaque debug-tile feel where DOM prompts are used. */
body.recording-day [data-interact],body.recording-day .interact-prompt{border-radius:999px!important;background:#071019d9!important;box-shadow:0 2px 10px #0008!important}
`;
  }
  function reconcileDay(){
    const s=state(),c=campaign();if(!s||night())return false;
    const cd=Number(c&&c.campaign&&c.campaign.day)||0;
    /* Campaign day is authoritative once Tuesday has actually been committed. */
    if(c&&c.flags&&c.flags.tuesday_morning_reached&&cd>=2&&Number(s.day)!==cd){s.day=cd;if(Number(s.clock)<0||!Number.isFinite(Number(s.clock)))s.clock=540;root.__recordingDayReconciled={day:cd,at:Date.now()};}
    const day=doc&&doc.getElementById('hud-day');
    if(day){const names=['','MON','TUE','WED','THU','FRI','SAT','SUN'],d=Math.max(1,Number(s.day)||1),label='DAY '+d+' · '+(names[((d-1)%7)+1]||'');if(day.textContent!==label)day.textContent=label;}
    return true;
  }
  function simplifyText(){
    if(!doc)return;
    const s=state();
    if(night()){
      const t=doc.getElementById('toast'),hint='Double-tap ←/→: DASH · Then ATTACK: GRAB · ↑/↓ AIM · JUMP to follow';if(t&&/G\s*\/\s*GRAB|E punch|J kick|HIGH|LOW|JUMP|Double-tap/i.test(t.textContent||'')&&t.textContent!==hint)t.textContent=hint;
    }else{
      const t=doc.getElementById('toast');if(t&&/SHIFT PAUSED/i.test(t.textContent||''))t.textContent=(s&&Number(s.clock)<=540)?'SHIFT NOT STARTED · CLOCK IN AT THE WORKSTATION':'SHIFT PAUSED';
    }
  }
  function mode(){
    if(!doc||!doc.body)return;
    const n=night();doc.body.classList.toggle('recording-night',n);doc.body.classList.toggle('recording-day',!n);
    if(lastNight&&!n)reconcileDay();lastNight=n;
    if(!n)reconcileDay();simplifyText();
  }
  /* MutationObserver callbacks run in the microtask checkpoint. Calling mode()
     directly from that callback used to rewrite #hud-day with textContent on
     every pass, generating another mutation and starving click completion.
     Coalesce presentation updates to at most once per animation frame instead. */
  function scheduleMode(){
    if(scheduled)return;scheduled=true;
    const run=()=>{scheduled=false;mode();};
    if(typeof root.requestAnimationFrame==='function')root.requestAnimationFrame(run);
    else if(typeof root.setTimeout==='function')root.setTimeout(run,0);
    else run();
  }
  function install(){css();mode();if(doc&&root.MutationObserver){observer=new MutationObserver(scheduleMode);observer.observe(doc.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});}root.addEventListener&&root.addEventListener('techops:night-entered',mode);root.addEventListener&&root.addEventListener('techops:production-ready',mode);return true;}
  root.TechOpsGameplayRecordingCohesion={VERSION:2,install,mode,scheduleMode,reconcileDay,simplifyText,night,coarse};
  if(doc){if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',install,{once:true});else install();}
})(typeof globalThis!=='undefined'?globalThis:this);
