/* TechOps Hero — production gameplay experience director v1.
 * Presentation-only AAA feedback/navigation layer. It observes canonical runtime
 * state and semantic combat events; it never owns damage, collision, progression,
 * saves, mission completion, or input.
 */
(function(root){
  'use strict';
  if(!root||root.TechOpsGameplayExperience)return;
  var VERSION=1,raf=0,lastEventId=0,lastMission='',lastLandmark='',styleReady=false;
  function doc(){return root.document||null;}
  function nm(){try{return root.NM||null;}catch(e){return null;}}
  function state(){try{return root.S||null;}catch(e){return null;}}
  function reduced(){try{return !!(root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(e){return false;}}
  function settings(){return root.V67SET||{};}
  function goodDogs(n){return !!(n&&n._v736);}
  function night(n){var s=state();return !!n&&!goodDogs(n)&&!n._sector04&&!!(s&&s.nightMode);}
  function mission(n){var r=root.TechOpsLevelRegistry,m=n&&n._v736&&Number(n._v736.m);return r&&m&&r.goodDogsMission?r.goodDogsMission(m):null;}
  function ensureStyle(){
    var d=doc();if(!d||styleReady)return;styleReady=true;
    var s=d.createElement('style');s.id='production-gameplay-experience-style';s.textContent=[
      '#px-objective{position:fixed;z-index:25;left:50%;top:max(76px,calc(env(safe-area-inset-top) + 62px));transform:translateX(-50%);width:min(720px,calc(100vw - 28px));pointer-events:none;font-family:monospace;color:#eaf5ff;text-shadow:0 2px 3px #000;transition:opacity .18s ease,transform .18s ease}',
      '#px-objective.hidden{opacity:0;transform:translate(-50%,-8px)}','#px-objective .px-shell{background:linear-gradient(90deg,rgba(5,12,20,.90),rgba(11,23,35,.82),rgba(5,12,20,.90));border:1px solid rgba(126,255,205,.25);box-shadow:0 8px 26px rgba(0,0,0,.35);padding:8px 12px;border-radius:8px}',
      '#px-objective .px-kicker{font-size:9px;letter-spacing:1.5px;color:#7effcd;margin-bottom:5px}','#px-objective .px-main{font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}','#px-objective .px-sub{font-size:10px;color:#a9c4d9;margin-top:5px;display:flex;justify-content:space-between;gap:12px}',
      '#px-objective .px-progress{height:3px;background:#1c2b3a;margin-top:7px;overflow:hidden;border-radius:3px}','#px-objective .px-progress>i{display:block;height:100%;background:#7effcd;transition:width .18s ease}',
      '#px-action{position:fixed;z-index:26;left:50%;bottom:max(24px,calc(env(safe-area-inset-bottom) + 18px));transform:translateX(-50%);pointer-events:none;font:700 11px monospace;color:#fff;background:rgba(5,10,16,.88);border:1px solid rgba(255,255,255,.2);padding:8px 12px;border-radius:999px;opacity:0;transition:opacity .12s ease,transform .12s ease}','#px-action.on{opacity:1;transform:translate(-50%,-3px)}',
      '#px-impact{position:fixed;inset:0;z-index:24;pointer-events:none;opacity:0;box-shadow:inset 0 0 70px rgba(255,220,150,.0)}','#px-impact.fire{animation:px-impact .16s ease-out}','#px-impact.heavy{animation:px-impact-heavy .22s ease-out}',
      '@keyframes px-impact{0%{opacity:.65;box-shadow:inset 0 0 55px rgba(255,235,190,.35)}100%{opacity:0;box-shadow:inset 0 0 100px rgba(255,235,190,0)}}','@keyframes px-impact-heavy{0%{opacity:.9;box-shadow:inset 0 0 75px rgba(255,188,90,.48)}100%{opacity:0;box-shadow:inset 0 0 120px rgba(255,188,90,0)}}',
      '@media(max-width:650px){#px-objective{top:max(66px,calc(env(safe-area-inset-top) + 54px));width:calc(100vw - 18px)}#px-objective .px-main{font-size:10px}#px-objective .px-sub{font-size:9px}#px-action{bottom:max(108px,calc(env(safe-area-inset-bottom) + 96px))}}','@media(prefers-reduced-motion:reduce){#px-objective,#px-action,#px-objective .px-progress>i{transition:none!important}#px-impact{display:none!important}}'
    ].join('\n');(d.head||d.documentElement).appendChild(s);
  }
  function ensureDom(){var d=doc();if(!d)return null;ensureStyle();var o=d.getElementById('px-objective');if(!o){o=d.createElement('div');o.id='px-objective';o.className='hidden';o.innerHTML='<div class="px-shell"><div class="px-kicker"></div><div class="px-main"></div><div class="px-sub"><span></span><b></b></div><div class="px-progress"><i></i></div></div>';d.body.appendChild(o);}var a=d.getElementById('px-action');if(!a){a=d.createElement('div');a.id='px-action';d.body.appendChild(a);}var i=d.getElementById('px-impact');if(!i){i=d.createElement('div');i.id='px-impact';d.body.appendChild(i);}return {objective:o,action:a,impact:i};}
  function setObjective(kicker,main,left,right,progress){var ui=ensureDom();if(!ui)return;var o=ui.objective;o.classList.remove('hidden');o.querySelector('.px-kicker').textContent=kicker;o.querySelector('.px-main').textContent=main;o.querySelector('.px-sub span').textContent=left||'';o.querySelector('.px-sub b').textContent=right||'';o.querySelector('.px-progress i').style.width=Math.max(0,Math.min(100,progress||0))+'%';}
  function hideObjective(){var d=doc(),o=d&&d.getElementById('px-objective');if(o)o.classList.add('hidden');}
  function action(text){var ui=ensureDom();if(!ui)return;ui.action.textContent=text||'';ui.action.classList.toggle('on',!!text);}
  function nearestLandmark(row,x){var marks=row&&row.stage&&row.stage.landmarks||[],best=null;for(var i=0;i<marks.length;i++){var m=marks[i],dist=Math.abs(Number(m.x)-x);if(!best||dist<best.dist)best={mark:m,dist:dist};}return best;}
  function nextLandmark(row,x){var marks=(row&&row.stage&&row.stage.landmarks||[]).slice().sort(function(a,b){return a.x-b.x;});for(var i=0;i<marks.length;i++)if(Number(marks[i].x)>=x-24)return marks[i];return marks[marks.length-1]||null;}
  function updateGoodDogs(n,row){var x=Number(n.x)||0,target=Math.max(1,Number(row.target)||1),next=nextLandmark(row,x),near=nearestLandmark(row,x),pct=Math.max(0,Math.min(100,x/target*100));setObjective('GOOD DOGS · M'+row.ordinal+' · '+row.name,row.objective,next?'NEXT · '+next.label:'',Math.max(0,Math.round((next?next.x:target)-x))+'m',pct);var prompt='';if(near&&near.dist<72){var kind=near.mark.kind||'';prompt=(kind==='door'||kind==='shuttle'||kind==='console'||kind==='cell118'||kind==='cell1984'||kind==='porch'||kind==='garage')?'A / E · '+near.mark.label:'';}action(prompt);var key=row.id+':'+(next&&next.label||'end');if(key!==lastLandmark){lastLandmark=key;if(lastMission&&typeof root.sfx==='function')try{root.sfx('click');}catch(e){}lastMission=row.id;}}
  function updateNight(n){var district=String(n.district||'').toUpperCase(),street=Number(n.street||1),alive=(n.enemies||[]).filter(function(e){return e&&e.alive&&e.hp>0;}).length;setObjective('NIGHT CRAWLER · '+district+' · STREET '+street,alive?'CLEAR THE STREET · CONTROL THE SPACE':'STREET CLEAR · FIND THE EXIT',alive?alive+' HOSTILE'+(alive===1?'':'S')+' REMAIN':'MOVE ON','',alive?Math.max(5,100-Math.min(95,alive*18)):100);action('');}
  function updateDay(){var s=state();if(!s||s.nightMode||s.inBattle||s.inDialog){hideObjective();action('');return;}var q=doc()&&doc().getElementById('quest-tracker');if(q&&String(q.textContent||'').trim()){hideObjective();return;}hideObjective();action('');}
  function impact(kind){var ui=ensureDom();if(!ui||reduced())return;var heavy=/throw|slam|wall|collision|ko|launcher/.test(kind);ui.impact.className=heavy?'heavy':'fire';void ui.impact.offsetWidth;ui.impact.className=heavy?'heavy':'fire';if(settings().shake!==false&&root.navigator&&typeof root.navigator.vibrate==='function')try{root.navigator.vibrate(heavy?18:8);}catch(e){} }
  function synth(kind){if(settings().volSfx===0)return;var heavy=/throw|slam|wall|collision|ko|launcher/.test(kind),guard=kind==='guard',whiff=kind==='whiff';try{var C=root.AudioContext||root.webkitAudioContext;if(!C)return;var ac=root.__techopsExperienceAudio||(root.__techopsExperienceAudio=new C());if(ac.state==='suspended')return;var t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type=heavy?'sawtooth':guard?'square':'triangle';o.frequency.setValueAtTime(whiff?260:heavy?95:guard?180:145,t);o.frequency.exponentialRampToValueAtTime(whiff?150:heavy?48:guard?120:85,t+.055);var v=.025*(settings().volSfx==null?1:Number(settings().volSfx));g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+(heavy?.11:.07));o.connect(g).connect(ac.destination);o.start(t);o.stop(t+(heavy?.12:.08));}catch(e){} }
  function consumeCombat(n){var c=n&&n._nightCombat,events=c&&c.events;if(!events||!events.length)return;for(var i=0;i<events.length;i++){var e=events[i];if(!e||Number(e.id)<=lastEventId)continue;lastEventId=Math.max(lastEventId,Number(e.id)||0);if(['jab','cross','launcher','air','throw','collision','slam','wall','ko','guard','whiff'].indexOf(e.type)>=0){impact(e.type);synth(e.type);}}}
  function frame(){try{var n=nm(),row=goodDogs(n)?mission(n):null;if(row)updateGoodDogs(n,row);else if(night(n))updateNight(n);else updateDay();consumeCombat(n);}catch(e){root.__gameplayExperienceError=String(e&&e.stack||e);}raf=(root.requestAnimationFrame||function(f){return root.setTimeout(f,100);})(frame);}
  function install(){if(raf)return true;ensureDom();frame();return true;}
  function stop(){if(!raf)return;try{if(root.cancelAnimationFrame)root.cancelAnimationFrame(raf);else root.clearTimeout(raf);}catch(e){}raf=0;}
  root.TechOpsGameplayExperience={VERSION:VERSION,install:install,stop:stop,mission:mission,nextLandmark:nextLandmark,nearestLandmark:nearestLandmark,consumeCombat:consumeCombat};
  install();
})(typeof globalThis!=='undefined'?globalThis:this);
