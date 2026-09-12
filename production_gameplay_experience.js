/* TechOps Hero — production gameplay experience director v1.
 * Presentation-only feedback/navigation layer: never owns damage, collision, progression,
 * saves, mission completion, or input. Combat owns audio through the shared sfx path;
 * this observer must not create another AudioContext or bypass mute/volSfx settings.
 */
(function(root){
  'use strict';
  if(!root||root.TechOpsGameplayExperience)return;
  var VERSION=1,raf=0,lastMission='',lastLandmark='',styleReady=false;
  // A street can replace combat state without replacing NM. Remember cursors per
  // combat object so both new streets and revisited modes behave correctly.
  var eventCursors=new WeakMap();
  function doc(){return root.document||null;}
  function nm(){try{return typeof NM!=='undefined'?NM:root.NM||null;}catch(e){return root.NM||null;}}
  function state(){try{return typeof S!=='undefined'?S:root.S||null;}catch(e){return root.S||null;}}
  function reduced(){try{return !!(root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(e){return false;}}
  function settings(){return root.V67SET||{};}
  function goodDogs(n){return !!(n&&n._v736);}
  function night(n){var s=state();return !!n&&!goodDogs(n)&&!n._sector04&&n.district!=='waldo'&&!!(s&&s.nightMode);}
  function blocked(){var s=state(),d=root.TechOpsPresentationDirector;return !!(s&&(s.inDialog||s.inBattle||s.paused||s.gameOver)||doc()&&doc().hidden||d&&d.isBlocking());}
  function mission(n){var r=root.TechOpsLevelRegistry,m=n&&n._v736&&Number(n._v736.m);return r&&m&&r.goodDogsMission?r.goodDogsMission(m):null;}
  function ensureStyle(){
    var d=doc();if(!d||styleReady)return;styleReady=true;
    var s=d.createElement('style');s.id='production-gameplay-experience-style';s.textContent=[
      '#px-objective{position:fixed;z-index:25;left:50%;top:max(140px,calc(env(safe-area-inset-top) + 126px));transform:translateX(-50%);width:min(720px,calc(100vw - 28px));pointer-events:none;font-family:monospace;color:#eaf5ff;text-shadow:0 2px 3px #000;transition:opacity .18s ease,transform .18s ease}',
      '#px-objective.hidden{opacity:0;transform:translate(-50%,-8px)}','#px-objective .px-shell{background:linear-gradient(90deg,rgba(5,12,20,.90),rgba(11,23,35,.82),rgba(5,12,20,.90));border:1px solid rgba(126,255,205,.25);box-shadow:0 8px 26px rgba(0,0,0,.35);padding:8px 12px;border-radius:8px}',
      '#px-objective .px-kicker{font-size:9px;letter-spacing:1.5px;color:#7effcd;margin-bottom:5px}','#px-objective .px-main{font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}','#px-objective .px-sub{font-size:10px;color:#a9c4d9;margin-top:5px;display:flex;justify-content:space-between;gap:12px}',
      '#px-objective .px-progress{height:3px;background:#1c2b3a;margin-top:7px;overflow:hidden;border-radius:3px}','#px-objective .px-progress>i{display:block;height:100%;background:#7effcd;transition:width .18s ease}',
      '#px-action{position:fixed;z-index:26;left:50%;bottom:max(24px,calc(env(safe-area-inset-bottom) + 18px));transform:translateX(-50%);pointer-events:none;font:700 11px monospace;color:#fff;background:rgba(5,10,16,.88);border:1px solid rgba(255,255,255,.2);padding:8px 12px;border-radius:999px;opacity:0;transition:opacity .12s ease,transform .12s ease}','#px-action.on{opacity:1;transform:translate(-50%,-3px)}',
      '#px-impact{position:fixed;inset:0;z-index:24;pointer-events:none;opacity:0;box-shadow:inset 0 0 70px rgba(255,220,150,.0)}','#px-impact.fire{animation:px-impact .16s ease-out}','#px-impact.heavy{animation:px-impact-heavy .22s ease-out}',
      '@keyframes px-impact{0%{opacity:.65;box-shadow:inset 0 0 55px rgba(255,235,190,.35)}100%{opacity:0;box-shadow:inset 0 0 100px rgba(255,235,190,0)}}','@keyframes px-impact-heavy{0%{opacity:.9;box-shadow:inset 0 0 75px rgba(255,188,90,.48)}100%{opacity:0;box-shadow:inset 0 0 120px rgba(255,188,90,0)}}',
      '@media(max-width:650px){#px-objective{width:calc(100vw - 18px)}#px-objective .px-main{font-size:10px}#px-objective .px-sub{font-size:9px}#px-action{bottom:max(108px,calc(env(safe-area-inset-bottom) + 96px))}}','@media(prefers-reduced-motion:reduce){#px-objective,#px-action,#px-objective .px-progress>i{transition:none!important}#px-impact{display:none!important}}'
    ].join('\n');(d.head||d.documentElement).appendChild(s);
  }
  function ensureDom(){var d=doc();if(!d||!d.body)return null;ensureStyle();var o=d.getElementById('px-objective');if(!o){o=d.createElement('div');o.id='px-objective';o.className='hidden';o.innerHTML='<div class="px-shell"><div class="px-kicker"></div><div class="px-main"></div><div class="px-sub"><span></span><b></b></div><div class="px-progress"><i></i></div></div>';d.body.appendChild(o);}var a=d.getElementById('px-action');if(!a){a=d.createElement('div');a.id='px-action';d.body.appendChild(a);}var i=d.getElementById('px-impact');if(!i){i=d.createElement('div');i.id='px-impact';d.body.appendChild(i);}return {objective:o,action:a,impact:i};}
  function setObjective(kicker,main,left,right,progress){var ui=ensureDom();if(!ui)return;var o=ui.objective;o.classList.remove('hidden');o.querySelector('.px-kicker').textContent=kicker;o.querySelector('.px-main').textContent=main;o.querySelector('.px-sub span').textContent=left||'';o.querySelector('.px-sub b').textContent=right||'';o.querySelector('.px-progress i').style.width=Math.max(0,Math.min(100,progress||0))+'%';}
  function hideObjective(){var d=doc(),o=d&&d.getElementById('px-objective');if(o)o.classList.add('hidden');}
  function action(text){var ui=ensureDom();if(!ui)return;ui.action.textContent=text||'';ui.action.classList.toggle('on',!!text);}
  function nearestLandmark(row,x){var marks=row&&row.stage&&row.stage.landmarks||[],best=null;for(var i=0;i<marks.length;i++){var m=marks[i],dist=Math.abs(Number(m.x)-x);if(!best||dist<best.dist)best={mark:m,dist:dist};}return best;}
  function nextLandmark(row,x){var marks=(row&&row.stage&&row.stage.landmarks||[]).slice().sort(function(a,b){return a.x-b.x;});for(var i=0;i<marks.length;i++)if(Number(marks[i].x)>=x-24)return marks[i];return marks[marks.length-1]||null;}
  function updateGoodDogs(n,row){var x=Number(n.x)||0,target=Math.max(1,Number(row.target)||1),next=nextLandmark(row,x),near=nearestLandmark(row,x),pct=Math.max(0,Math.min(100,x/target*100));setObjective('GOOD DOGS · M'+row.ordinal+' · '+row.name,row.objective,next?'NEXT · '+next.label:'',Math.max(0,Math.round((next?next.x:target)-x))+' units',pct);var prompt='';if(near&&near.dist<72){var kind=near.mark.kind||'';prompt=(kind==='door'||kind==='shuttle'||kind==='console'||kind==='cell118'||kind==='cell1984'||kind==='porch'||kind==='garage')?'A / E · '+near.mark.label:'';}action(prompt);lastLandmark=row.id+':'+(next&&next.label||'end');lastMission=row.id;}
  function updateNight(n){
    var district=String(n.district||'').toUpperCase(),street=Number(n.street||1),alive=(n.enemies||[]).filter(function(e){return e&&e.alive&&e.hp>0;}).length;
    var home=n.district==='home',main=home?"MIKE'S HOUSE · REST OR STAY OUT":alive?'CLEAR THE STREET · CONTROL THE SPACE':n.done&&n.done[n.district]?'DISTRICT CLEAR · RETURN TO THE CHARGER':'STREET CLEAR · CONTINUE RIGHT';
    setObjective('NIGHT CRAWLER · '+district+' · STREET '+street,main,home?'Approach the lit entrance':alive?alive+' HOSTILE'+(alive===1?'':'S')+' REMAIN':'Return left for the route menu','',alive?Math.max(5,100-Math.min(95,alive*18)):100);action('');
  }
  function impact(kind){
    if(reduced()||settings().shake===false)return;
    var ui=ensureDom();if(!ui)return;var heavy=/throw|slam|wall|collision|ko|launcher/.test(kind);
    ui.impact.className='';void ui.impact.offsetWidth;ui.impact.className=heavy?'heavy':'fire';
    if(root.navigator&&typeof root.navigator.vibrate==='function')try{root.navigator.vibrate(heavy?18:8);}catch(e){}
  }
  function consumeCombat(n){
    var c=n&&n._nightCombat;if(!c||typeof c!=='object'||!Array.isArray(c.events))return 0;
    var last=eventCursors.get(c)||0,count=0,show=night(n)&&!blocked();
    for(var i=0;i<c.events.length;i++){
      var e=c.events[i],id=Number(e&&e.id);if(!e||!Number.isSafeInteger(id)||id<=last)continue;
      last=id;
      if(show&&!e.guarded&&['jab','cross','launcher','uppercut','low','kick','rising-kick','sweep','air','air-kick','throw','throw-down','collision','slam','wall','ko','guard','whiff'].indexOf(e.type)>=0){impact(e.type);count++;}
    }
    eventCursors.set(c,last);return count;
  }
  function frame(){try{var n=nm(),row=goodDogs(n)?mission(n):null;if(blocked()){hideObjective();action('');}else if(row)updateGoodDogs(n,row);else if(night(n))updateNight(n);else{hideObjective();action('');}consumeCombat(n);}catch(e){root.__gameplayExperienceError=String(e&&e.stack||e);}raf=(root.requestAnimationFrame||function(f){return root.setTimeout(f,100);})(frame);}
  function install(){if(raf)return true;ensureDom();frame();return true;}
  function stop(){if(!raf)return;try{if(root.cancelAnimationFrame)root.cancelAnimationFrame(raf);else root.clearTimeout(raf);}catch(e){}raf=0;}
  root.TechOpsGameplayExperience={VERSION:VERSION,install:install,stop:stop,mission:mission,nextLandmark:nextLandmark,nearestLandmark:nearestLandmark,consumeCombat:consumeCombat};
  install();
})(typeof globalThis!=='undefined'?globalThis:this);
