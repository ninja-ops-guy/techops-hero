/* Read-only rescue board. Mission evidence comes from authored adapters, never UI toggles. */
(function(root){
  'use strict';
  if(!root||root.TechOpsLowQuarterRuntime)return;
  function isolated(){var meta=root.S&&root.S.meta||{};return !!meta._standaloneMode||!!(meta._v736&&meta._v736.campaignOrigin==='standalone');}
  function escape(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function load(){return root.TechOpsCampaign.load(root.localStorage);}
  function snapshot(){if(isolated())return {phase:'blocked',message:'Return to the main campaign to inspect district rescue.'};return root.TechOpsLowQuarter.status(load());}
  function open(){
    if(!root.dlg||isolated())return false;
    try{
      var s=snapshot(),r=s.result,body=s.message?escape(s.message):'Orpheus decision and district rescue are separate outcomes.';
      if(r)body+='<br><br><b>'+escape(r.outcome.replace(/_/g,' '))+'</b><br>Verified safe: '+r.safe.length+'<br>Unresolved: '+r.unresolved.length+'<br>Retained sectors: '+r.retainedSectors.length;
      if(r&&root.TechOpsChorusSiege&&load().lowQuarter.siege){
        var siege=root.TechOpsChorusSiege.status(load());
        body+='<br><br><b>Chorus siege</b><br>Phase: '+escape(siege.phase.replace(/_/g,' '))+'<br>Sudo relay: '+(siege.relayConnected?'Connected':'Interrupted')+'<br>Arrivals resolved: '+siege.resolvedWaves.length+' / '+siege.arrivedWaves.length+'<br>Observed adaptive orders: '+Object.keys(siege.orders).length;
      }
      var missing=r?r.missing:null;
      var requirements=(s.requirements||[]).filter(function(k){return !missing||missing.indexOf(k.id)>=0;});
      if(requirements.length)body+='<br><br>'+requirements.map(function(k){return escape(k.label);}).join('<br>');
      body+='<br><br>Holding the district requires coordinated military defense. Robots require a verified command arrangement. Iona’s AeroTech campaign and the wider Chorus threat continue. Deep space requires its own mission, vessel and crew preparation.';
      var options=[{t:'Close',f:root.closeDlg},{t:'Play opening prototype in a separate review tab',f:function(){root.open('low-quarter-review.html','_blank','noopener');}}];
      if(s.phase==='active')options.unshift({t:'Review irreversible closeout',f:confirmCloseout});
      root.dlg('LOW QUARTER // DEFENSE AND RESCUE',body,options);return true;
    }catch(e){root.__lowQuarterError=e.message;return false;}
  }
  function confirmCloseout(){
    var state=load(),lq=state.lowQuarter;if(!lq||lq.phase!=='active')return false;
    var count=lq.siege?{rescue:lq.events.length,siege:lq.siege.events.length}:lq.events.length,r=root.TechOpsLowQuarter.evaluate(state);
    root.dlg('LOW QUARTER // CLOSEOUT','This closes the rescue operation for this run.<br><br>Outcome: '+escape(r.outcome.replace(/_/g,' '))+'<br>Unresolved people: '+escape(r.unresolved.join(', ')||'None')+'<br>Missing defense requirements: '+escape(r.missing.join(', ')||'None'),[
      {t:'Keep working',f:open},
      {t:'Confirm permanent closeout',f:function(){try{
        var latest=load();root.TechOpsLowQuarter.transact(latest,function(s){return root.TechOpsLowQuarter.closeout(s,count,true);},function(s){return root.TechOpsCampaign.save(s,root.localStorage);});open();
      }catch(e){root.dlg('RESCUE NOT SAVED',escape(e.message),[{t:'Return to rescue board',f:open}]);}}}
    ]);return true;
  }
  function install(){
    if(!root.document||isolated())return false;
    var host=root.document.getElementById('hud-right'),state;
    if(!host)return false;try{state=load();}catch(e){return false;}
    if(!state.story||!state.story.ending)return false;
    if(!root.document.getElementById('btn-low-quarter')){
      var b=root.document.createElement('button');b.id='btn-low-quarter';b.className='hud-btn';b.textContent='LQ';b.title='Low Quarter defense and rescue';b.setAttribute('aria-label','Open Low Quarter defense and rescue');b.addEventListener('click',function(e){e.preventDefault();open();});host.appendChild(b);
    }
    return true;
  }
  root.TechOpsLowQuarterRuntime={install:install,open:open,snapshot:snapshot};
})(typeof globalThis!=='undefined'?globalThis:this);
