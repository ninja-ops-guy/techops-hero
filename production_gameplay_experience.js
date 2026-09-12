/* Current-objective read model. The existing HUD/compositor owns presentation.
 * No polling, input, audio, save writes, completion inference or duplicate HUD. */
(function(root){
  'use strict';
  if(!root)return;
  var prior=root.TechOpsGameplayExperience;
  if(prior&&prior.VERSION>=2)return;
  if(prior&&typeof prior.stop==='function')prior.stop();
  function world(){try{return typeof NM!=='undefined'?NM:root.NM||null;}catch(e){return root.NM||null;}}
  function state(){try{return typeof S!=='undefined'?S:root.S||null;}catch(e){return root.S||null;}}
  function active(n){var s=state();return !!(n&&s&&(s.nightMode===n||s.nightMode===true)&&!s.gameOver);}
  function blocked(n){
    var s=state(),d=root.TechOpsPresentationDirector,w=root.TechOpsProductionWrapperGuard;
    if(!active(n)||s.inDialog||s.inBattle||s.paused||n.drive||n._v736&&(n._v736.ending||n._v736.resolving)||root.__goodBoysHideHud||root.document&&root.document.hidden)return true;
    var title=root.document&&root.document.getElementById&&root.document.getElementById('title-screen');
    if(title&&title.classList&&!title.classList.contains('hidden')){var css=root.getComputedStyle?root.getComputedStyle(title):title.style;if(css&&css.display!=='none'&&css.visibility!=='hidden')return true;}
    if(d&&typeof d.isBlocking==='function'&&d.isBlocking())return true;
    return !!(w&&typeof w.hasBlockingModal==='function'&&w.hasBlockingModal());
  }
  function mission(n){
    n=n||world();var c=n&&n._v736,s=state(),m=c&&Number(c.m),saved=s&&s.meta&&s.meta._v736,r=root.TechOpsLevelRegistry;
    if(!active(n)||!Number.isInteger(m)||m<1||m>8||saved&&Number(saved.m)!==m)return null;
    return r&&typeof r.goodDogsMission==='function'?r.goodDogsMission(m):null;
  }
  function living(n){return (Array.isArray(n.enemies)?n.enemies:[]).filter(function(e){return e&&e.alive!==false&&Number(e.hp)>0;}).length;}
  function pending(n){var c=n._v736||{};return !!(c.pendingSpawn||Number(c.spawnT)>0||Number(n.spawnT)>0||c.wavePending===true||n.wavePending===true);}
  function nearestLandmark(row,x){var best=null;(row&&row.stage&&row.stage.landmarks||[]).forEach(function(mark){if(!Number.isFinite(mark.x))return;var dist=Math.abs(mark.x-x);if(!best||dist<best.dist)best={mark:mark,dist:dist};});return best;}
  function nextLandmark(row,x){var marks=(row&&row.stage&&row.stage.landmarks||[]).filter(function(m){return Number.isFinite(m.x);}).slice().sort(function(a,b){return a.x-b.x;});return marks.find(function(m){return m.x>=x;})||null;}
  function find(row,kind){return (row.stage&&row.stage.landmarks||[]).find(function(l){return l.kind===kind;})||null;}
  function target(guide,n,x,label){
    if(!Number.isFinite(x)||!Number.isFinite(n.x))return guide;
    guide.targetX=x;guide.targetLabel=label||'';
    var delta=x-(n.x+(Number(n.w)||22)/2);
    var direction=Math.abs(delta)<65?'NEARBY':delta<0?'LEFT':'RIGHT';
    guide.detail=(guide.detail?guide.detail+' · ':'')+direction+(label?' · '+label:'');return guide;
  }
  function objective(n){
    n=n||world();if(blocked(n))return null;var row=mission(n);if(!row)return null;
    var c=n._v736,m=Number(c.m),alive=living(n),queued=pending(n),g={mission:m,id:row.id,text:row.objective||'',detail:'',targetX:null,targetLabel:'',phase:'objective'},mark;
    if(m===1){
      if(n._gbWaldoTrailComplete){g.text='REGROUP AT THE HIDDEN BAY';mark=find(row,'door');if(mark)target(g,n,mark.x,mark.label);}
      else {g.text='SEARCH THE PROPERTY · FOLLOW THE TRAIL';g.detail='Explore the yard, porch and garage';}
    }else if(m===2){
      if(alive||queued){g.text=alive?'CLEAR HANGAR SECURITY':'REINFORCEMENTS INBOUND';g.detail=alive+' HOSTILES';g.phase='security';}
      else if(c.pairPuzzle&&!c.pairPuzzle.solved){g.text='LINK THE BAY POWER INTERLOCK';g.detail='Work with your partner';g.phase='interlock';}
      else {g.text='REACH THE SECRET SHIP';g.detail='Boarding remains an explicit interaction';mark=find(row,'shuttle');if(mark)target(g,n,mark.x,mark.label);}
    }else if(m===3){
      var o=c.prisonOpsV2;g.phase=o&&o.phase||'breach';
      if(g.phase==='terminal'){g.text='OVERRIDE THE SECURITY RELAY';var a=root.TechOpsGoodBoysPrisonGameplayV2;if(a)target(g,n,a.RELAY_X,'RELAY');}
      else if(g.phase==='exfil'){g.text='REACH CELL BLOCK 118';var p=root.TechOpsGoodBoysPrisonGameplayV2;if(p)target(g,n,p.EXIT_X,'CELL BLOCK');}
      else if(g.phase==='complete')g.text='CELL 118 ACCESS SECURED';
      else {g.text=g.phase==='counterattack'?'SURVIVE THE COUNTERATTACK':'CLEAR THE FIRST SECURITY TEAM';g.detail=alive+' HOSTILES'+(queued?' · REINFORCEMENTS INBOUND':'');}
    }else if(m===4){
      var evidence=Array.isArray(c.evidence)?c.evidence:[],found=evidence.filter(function(e){return e&&e.found;}).length;
      if(!c.cellOpened&&found<3){g.phase='investigate';g.text='VERIFY THE PRISONER';g.detail=found+' / 3 REQUIRED CLUES';var clue=evidence.filter(function(e){return e&&!e.found&&Number.isFinite(e.x);}).sort(function(a,b){return Math.abs(a.x-n.x)-Math.abs(b.x-n.x);})[0];if(clue)target(g,n,clue.x,'EVIDENCE');}
      else if(!c.cellOpened){g.phase='release';g.text='OPEN CELL 118';mark=find(row,'cell118');if(mark)target(g,n,mark.x,'CELL 118');}
      else if(!c._gbCell118AmbushCleared){g.phase='ambush';g.text='PROTECT THE FREED PRISONER';g.detail=alive+' HOSTILES · EXPECT THE AMBUSH';}
      else {g.phase='secured';g.text='CELL 118 SECURED';g.detail='Regroup for the next route';}
    }else if(m===5){
      if(!c._gbMikeIndexDefeated&&!n._gbMikeIndexDefeated){g.phase='index';g.text='BREAK THE MIKE INDEX';g.detail='Vary your approach · it models past behaviour';}
      else if(alive||queued||!n._gbAccessCoreSecuritySeeded){g.phase='security';g.text='CLEAR ROUTE-CONTROL SECURITY';g.detail=alive+' HOSTILES'+(queued||!n._gbAccessCoreSecuritySeeded?' · REINFORCEMENTS INBOUND':'');}
      else if(!c._gbAccessNodeSeized){g.phase='node';g.text='SEIZE THE ACCESS NODE';mark=find(row,'console');if(mark)target(g,n,mark.x,'ACCESS NODE');}
      else {g.phase='secured';g.text='ROUTE TO 1984 OPEN';g.detail='Access controls secured';}
    }else if(m===6){
      if(c.uplink&&Number(c.uplink.hp)<=0){g.phase='failed';g.text='UPLINK LOST';g.detail='Recovery is required';}
      else if(!c.uplink||!Number.isFinite(c.decrypt)){g.phase='initializing';g.text='ESTABLISH THE DECRYPT UPLINK';}
      else if(c.decrypt>0){g.phase='decrypt';g.text='DEFEND THE UPLINK';g.detail=Math.ceil(c.decrypt)+'s DECRYPT REMAINING';var art=root.TechOpsArtHandoff;var time=root.performance&&root.performance.now?root.performance.now():0;var view=art&&art.surveillance&&art.surveillance(n,time);if(view)g.detail+=' · '+(view.observed?'IN SCAN · SLOWED':view.sheltered?'CATWALK COVER':'OUTSIDE SCAN');}
      else if(alive||queued||!c._gbFinalWaveComplete){g.phase='final-wave';g.text='CLEAR THE FINAL SECURITY WAVE';g.detail=alive+' HOSTILES'+(queued?' · REINFORCEMENTS INBOUND':'');}
      else if(!c._gbWaldoFreed){g.phase='release';g.text='SECURE CELL 1984';mark=find(row,'cell1984');if(mark)target(g,n,mark.x,'CELL 1984');}
      else {g.phase='secured';g.text='CELL 1984 SECURED';}
    }else if(m===7){
      if(!c._gbWardenTandemDefeated){g.phase='warden';g.text=c.finisherReady?'FINISH THE WARDEN TOGETHER':'BREAK THE WARDEN';g.detail=Number(c.sync)>=100?'SYNC READY · TANDEM FINISHER':'BUILD SYNC · ALTERNATE ATTACKERS';}
      else {g.phase='escape';g.text='REACH THE MAINTENANCE SHUTTLE';mark=find(row,'shuttle');if(mark)target(g,n,mark.x,'SHUTTLE');}
    }else {g.phase='home';g.text='HOME TOGETHER';g.detail='The homecoming owns campaign completion';}
    return g;
  }
  function streetStatus(n){if(blocked(n)||n._v736||n._sector04||n.district==='waldo')return '';var count=living(n);return count?count+' HOSTILES':pending(n)?'REINFORCEMENTS INBOUND':n.clear===true?'STREET SECURED · CONTINUE OR RETURN TO CHARGER':'CHECK THE STREET';}
  function install(){
    // Retire v1's competing DOM ribbon and impact/audio poller on a live reload.
    var d=root.document;if(d&&d.getElementById)['px-objective','px-action','px-impact','production-gameplay-experience-style'].forEach(function(id){var e=d.getElementById(id);if(e&&e.remove)e.remove();});return true;
  }
  root.TechOpsGameplayExperience={VERSION:2,active:active,blocked:blocked,mission:mission,objective:objective,streetStatus:streetStatus,nearestLandmark:nearestLandmark,nextLandmark:nextLandmark,install:install,stop:function(){}};
  install();
})(typeof globalThis!=='undefined'?globalThis:this);
