/* Ordinary street session: clock, route journal and home handoff. Called by the
 * existing Night loop. Campaign encounters retain their own clock and exit authority. */
(function(root){
  'use strict';
  const MINUTE_SECONDS=4,HOME_X=1320;
  function active(n){return !!n&&typeof n.district==='string'&&!n._v736&&!n._sector04&&n.district!=='waldo';}
  function session(n){return n._nightSession||(n._nightSession={seconds:0,elapsedMinutes:0,transition:null,settled:false});}
  function game(){try{return typeof S!=='undefined'?S:root.S;}catch(e){return root.S;}}
  function world(){try{return typeof NM!=='undefined'?NM:root.NM;}catch(e){return root.NM;}}
  function clearInput(){try{const k=typeof keys!=='undefined'?keys:root.keys;Object.keys(k||{}).forEach(key=>k[key]=false);}catch(e){}const n=world();if(n){n.vx=0;n.jHeld=false;}}
  function visible(id){const el=root.document&&root.document.getElementById(id);if(!el||el.classList.contains('hidden'))return false;const style=root.getComputedStyle?root.getComputedStyle(el):el.style;return !style||(style.display!=='none'&&style.visibility!=='hidden');}
  function paused(s){s=s||game();return !!(root.document&&root.document.hidden)||!!(s&&(s.inDialog||s.inBattle))||['panel','v67-settings','eod','v722-cine','v725-cine'].some(visible);}
  function ui(n){if(root.document&&root.document.body)root.document.body.classList.toggle('techops-night-streets',active(n));}
  function tick(n,s,dt){
    if(!active(n)){ui(null);return false;}if(n._nightSession&&n._nightSession.settled)return false;ui(n);const c=session(n),raw=Number(dt),step=Number.isFinite(raw)&&raw>=0&&raw<=.25?raw:0;
    if(c.transition){
      if(!(root.document&&root.document.hidden)){c.transition.age+=step;const text=root.document&&root.document.getElementById('night-home-caption');if(text)text.textContent=c.transition.age<1.2?'The engine falls silent.':c.transition.age<2.5?'For tonight, the city can wait.':'A new shift is waiting.';if(c.transition.age>=3.6)finishHome(n);}
      return true;
    }
    if(paused(s)){clearInput();return true;}
    // An inactive tab or a long stall never charges hours or ages office tickets.
    c.seconds+=step;const minutes=Math.floor((c.seconds+1e-8)/MINUTE_SECONDS);
    if(minutes){c.seconds-=minutes*MINUTE_SECONDS;c.elapsedMinutes+=minutes;s.clock=Math.max(0,Math.floor(Number(s.clock)||0))+minutes;}
    return false;
  }
  function escape(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function objectives(n){
    if(!active(n))return [];
    const defs=root.TechOpsNightDistricts||{},order=root.TechOpsNightOrder||[],d=defs[n.district]||{},alive=(n.enemies||[]).filter(e=>e.alive&&e.hp>0).length;
    const rows=[n.district==='home'?"At Mike's house: approach the entrance and choose Rest until morning.":n.done&&n.done[n.district]?'District secure. Return left to the Charger and choose your next route.':alive?'Street '+n.street+'/'+(d.streets||2)+': '+alive+' opponent'+(alive===1?'':'s')+' remaining.': 'Street clear. Head right to continue.'];
    rows.push(order.filter(id=>n.done&&n.done[id]).length+'/'+order.length+' districts cleared tonight.');
    rows.push('Return left to the Charger at any time. Home is always available; completing every district is optional.');
    return rows;
  }
  function openJournal(){
    const n=world();if(!active(n)||!root.dlg)return false;clearInput();
    const defs=root.TechOpsNightDistricts||{},order=root.TechOpsNightOrder||[];
    let body=objectives(n).map(escape).join('<br><br>')+'<br><br><b>ROUTE</b><br>'+order.map(id=>escape((n.done&&n.done[id]?'✓ ':id===n.district?'→ ':'· ')+(defs[id]&&defs[id].name||id))).join('<br>');
    // Read only revealed campaign progress. A street run is not a shortcut past
    // the daytime evidence prerequisites and does not grant narrative flags.
    try{const C=root.TechOpsCampaign,c=C&&C.load(root.localStorage);if(c&&c.flags.day_work_unlocked){body+='<br><br><b>CAMPAIGN</b><br>'+escape(c.flags.tuesday_morning_reached?'Continue the current investigation from the office.':c.flags.sector04_completed?'The verified Sector 04 outcome is ready for the canonical morning handoff.':c.evidence.ghostIdentityEvidence.status==='established'?'The recorded access discrepancy can be investigated through the office south exit.':'Return to the office to document the unresolved access discrepancy before investigating its night manifestation.');}else body+='<br><br>Story missions follow the office investigations in CLOCK IN. This patrol does not skip their prerequisites.';}catch(e){body+='<br><br>Campaign record unavailable. Your patrol is unchanged.';}
    root.dlg('NIGHT // ROUTE JOURNAL',body,[{t:'Combat field guide',f:openGuide},{t:'Back to the street',f:()=>{root.closeDlg();clearInput();}}]);return true;
  }
  function openGuide(){if(!root.dlg)return false;root.dlg('NIGHT // COMBAT FIELD GUIDE','<b>READ THE CONTACT</b><br>Tap attack in reach. Wait for the gold beat, then tap again for cross → rising finish. A miss earns no combo.<br><br><b>BREAK A GUARD</b><br>Walk toward a grounded enemy and attack to grab. Release direction, then choose left/right to throw or up to launch.<br><br><b>AIR FOLLOW-UP</b><br>Jump after a launch and attack while in reach. Three air hits end with a slam; there is no infinite juggle.<br><br>Impacts, misses, guards and timed hits have distinct sound cues. Sound remains optional; the timing meter and hit reactions carry the same information.',[{t:'Back to route journal',f:openJournal},{t:'Return to the street',f:()=>{root.closeDlg();clearInput();}}]);return true;}
  function requestHome(n){
    n=n||world();const s=game();if(!active(n)||n.district!=='home'||n.drive||!s||session(n).settled||session(n).transition||s.inDialog)return false;
    if(root.TechOpsNightCombat)root.TechOpsNightCombat.cancel(n);clearInput();n.x=Math.min(n.x,1490);
    root.dlg("MIKE'S HOUSE // END OF PATROL",'The porch light is on. Leave the city behind, or head back out?<br><br>Rest settles tonight’s earnings once, then opens the normal shift recap before the next workday.',[
      {t:'Rest until morning',f:()=>{if(world()!==n||!active(n))return;root.closeDlg();beginHome(n);}},
      {t:'Stay out a little longer',f:()=>{root.closeDlg();clearInput();}}
    ]);return true;
  }
  function beginHome(n){
    const s=game();if(!active(n)||world()!==n||!s||session(n).settled||session(n).transition)return false;
    clearInput();session(n).transition={age:0};s.inDialog=true;
    if(root.document){const d=root.document,overlay=d.createElement('section');overlay.id='night-home-transition';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label','Returning home');overlay.innerHTML='<div class="night-home-frame"><small>HOME STREET // NIGHT ENDS</small><p id="night-home-caption" aria-live="polite">The engine falls silent.</p></div>';const skip=d.createElement('button');skip.type='button';skip.textContent='Skip to shift recap';skip.onclick=()=>finishHome(n);overlay.appendChild(skip);(d.body||d.documentElement).appendChild(overlay);skip.focus();}
    return true;
  }
  function finishHome(n){if(world()!==n||!active(n)||!session(n).transition||session(n).settled)return false;session(n).transition=null;cleanup();const s=game();if(s)s.inDialog=false;clearInput();if(typeof root.exitNight==='function')root.exitNight(true);return true;}
  function cleanup(){const el=root.document&&root.document.getElementById('night-home-transition');if(el)el.remove();ui(null);}
  function settle(n,s,homeSafe){
    if(!active(n)||!s||session(n).settled)return false;
    const c=session(n);c.settled=true;c.transition=null;
    s.meta=s.meta||{};s.meta.lastNight={day:s.day,cash:Number(n.cash)||0,kills:Number(n.kills)||0,districts:Object.keys(n.done||{}),elapsedMinutes:c.elapsedMinutes,homeSafe:!!homeSafe};
    if(root.TechOpsNightCombat)root.TechOpsNightCombat.cancel(n);cleanup();clearInput();
    const router=root.TechOpsProductionModeRouter;if(router&&router.returnToDay)router.returnToDay();return true;
  }
  function draw(ctx,n){if(!active(n)||n.district!=='home')return;const x=HOME_X-(n.cam||0);ctx.save();ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillStyle='#f0f7e7';ctx.fillText("MIKE'S HOUSE",x,310);ctx.fillStyle='#add8a8';ctx.fillText(n.x>HOME_X-90?'E / A · REST UNTIL MORNING':'HOME →',x,328);ctx.restore();}
  root.TechOpsNightSession={VERSION:1,MINUTE_SECONDS,HOME_X,active,session,tick,paused,ui,objectives,openJournal,openGuide,requestHome,beginHome,finishHome,settle,cleanup,draw};
})(typeof globalThis!=='undefined'?globalThis:this);
