/* TechOps Hero — cinematic cohesion systems v1.
 *
 * Four passive services, one parser-loaded file:
 *   - immutable level registry
 *   - presentation ownership / blocker diagnostics
 *   - deterministic camera targets
 *   - semantic animation-frame selection
 *
 * This file deliberately owns no draw/step wrapper, timer, observer, campaign
 * transition, save write, collision, damage, or media retry. Existing runtime
 * authorities consume these services at their established seams.
 */
(function(root){
  "use strict";
  if(!root)return;

  function clone(value){
    if(value==null||typeof value!=="object")return value;
    if(Array.isArray(value))return value.map(clone);
    var out={};Object.keys(value).forEach(function(key){out[key]=clone(value[key]);});return out;
  }
  function freeze(value){
    if(value&&typeof value==="object"&&!Object.isFrozen(value)){
      Object.keys(value).forEach(function(key){freeze(value[key]);});Object.freeze(value);
    }
    return value;
  }
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}

  /* ---------------------------------------------------------------------- */
  /* LEVEL REGISTRY                                                         */
  /* ---------------------------------------------------------------------- */
  if(!root.TechOpsLevelRegistry){
    var GOOD_DOGS=[
      {
        id:"gooddogs.m1",mode:"gooddogs",kind:"mission",ordinal:1,
        displayName:"GOOD DOGS",name:"WALDO'S HOUSE",phaseId:"waldo_property",
        objective:"SEARCH THE PROPERTY · FOLLOW THE TRAIL THROUGH THE GARAGE · FIND THE HIDDEN BAY",
        zone:"WALDO'S PLACE — HOUSE / YARD / GARAGE",target:1460,gameplayVerb:"investigate",
        environment:{district:"goodboys_home",background:"goodboys_home",fallback:"waldo_loft",light:"home_gold",accent:"#ffd166",palette:"earth_night",assetClass:"physical_authored"},
        stage:{platforms:[],hazards:[],landmarks:[{x:520,label:"YARD",kind:"yard"},{x:790,label:"PORCH",kind:"porch"},{x:1120,label:"GARAGE",kind:"garage"},{x:1460,label:"HIDDEN BAY",kind:"door"}]},
        encounter:{waves:[]},
        districtConfig:{streets:1,danger:.1,sky:"#11131b",far:"#20232b",mid:"#28251f",signs:["WALDO'S HOUSE","HIDDEN BAY"],roster:[]},
        cameraProfile:"gooddogs.sideview",presentationProfile:"quiet_investigation",animationProfile:"gooddogs.pair",musicProfile:"home_missing",cinematicEntry:"GD_CUT_01",cinematicExit:"hidden-bay-found",saveCheckpoint:"gooddogs.m1.property",acceptanceTest:"m1-trail-to-hidden-bay",nextMission:"gooddogs.m2",completionContract:"trail-complete-and-hidden-bay-entered"
      },
      {
        id:"gooddogs.m2",mode:"gooddogs",kind:"mission",ordinal:2,
        displayName:"GOOD DOGS",name:"THE HIDDEN BAY",phaseId:"hidden_bay",
        objective:"CLEAR THE HANGAR · REACH THE SECRET SHIP · BOARD",
        zone:"WALDO'S CONCEALED LAUNCH BAY",target:1390,gameplayVerb:"secure",
        environment:{district:"goodboys_hangar",background:"goodboys_hangar",fallback:"waldo_garage",light:"launch_blue",accent:"#55dfff",palette:"hangar_cyan",assetClass:"physical_authored"},
        stage:{platforms:[[420,338,210],[760,300,180],[1060,338,220]],hazards:[],landmarks:[{x:620,label:"HANGAR SECURITY",kind:"console"},{x:1390,label:"SECRET SHIP",kind:"shuttle"}]},
        encounter:{waves:[["guard","guard"],["skimmer","guard","guard"]]},
        districtConfig:{streets:1,danger:.4,sky:"#070b12",far:"#0c1620",mid:"#111820",signs:["SECRET SHIP","LAUNCH"],roster:["guard"]},
        cameraProfile:"gooddogs.sideview",presentationProfile:"discovery_launch",animationProfile:"gooddogs.pair",musicProfile:"hidden_bay",cinematicEntry:null,cinematicExit:"GD_CUT_02",saveCheckpoint:"gooddogs.m2.hangar",acceptanceTest:"m2-board-flight-crash",nextMission:"gooddogs.m3",completionContract:"explicit-board-sequence-complete"
      },
      {
        id:"gooddogs.m3",mode:"gooddogs",kind:"mission",ordinal:3,
        displayName:"GOOD DOGS",name:"ORBITAL PRISON — BREACH",phaseId:"breach",
        objective:"SURVIVE IMPACT · CROSS THE BREACH · REACH CELL BLOCK 118",
        zone:"BLACKSITE MERIDIAN — MAINTENANCE HULL",target:1450,gameplayVerb:"survive",
        environment:{district:"goodboys_breach",background:"goodboys_breach",fallback:null,light:"impact_orange",accent:"#ff8a4c",palette:"breach_orange_cyan",assetClass:"physical_authored",primaryAsset:"assets/cinematic/m3_orbital_prison_breach.png",layers:["far","mid","gameplayBack","gameplay","foreground","fx"]},
        stage:{platforms:[[280,348,210],[590,320,190],[880,350,230],[1185,318,205],[1450,350,170]],hazards:[[505,55],[1090,55]],landmarks:[{x:330,label:"IMPACT BREACH",kind:"breach"},{x:900,label:"MAINTENANCE AIRLOCK",kind:"door"},{x:1450,label:"BLOCK 118",kind:"door"}]},
        encounter:{gravityFlux:true,waves:[["skimmer","skimmer"],["guard","hunter","skimmer"]]},
        districtConfig:{streets:1,danger:1.7,sky:"#05070b",far:"#0c1018",mid:"#11151c",signs:["HULL BREACH","LOCKDOWN"],roster:["guard","hunter"]},
        cameraProfile:"gooddogs.sideview",presentationProfile:"orbital_breach",animationProfile:"gooddogs.pair",musicProfile:"hull_breach",cinematicEntry:"authored-crash",cinematicExit:"block-118",saveCheckpoint:"gooddogs.m3.breach",acceptanceTest:"m3-prison-breach",nextMission:"gooddogs.m4",completionContract:"prison-breach-ops-complete"
      },
      {
        id:"gooddogs.m4",mode:"gooddogs",kind:"mission",ordinal:4,
        displayName:"GOOD DOGS",name:"CELL 118",phaseId:"cell118",
        objective:"INVESTIGATE THE PRISONER · VERIFY K · BREAK THE CELL LOCK",
        zone:"BLACKSITE MERIDIAN — BLOCK 118",target:1320,gameplayVerb:"rescue",
        environment:{district:"goodboys_cell118",background:"goodboys_cell118",fallback:null,light:"cell118_blue",accent:"#55dfff",palette:"detention_cyan",assetClass:"runtime_generated_fallback"},
        stage:{platforms:[[260,350,230],[560,315,210],[860,350,250],[1190,318,235],[1490,350,170]],hazards:[],landmarks:[{x:500,label:"EVIDENCE",kind:"console"},{x:800,label:"RESTRAINT CIPHER",kind:"console"},{x:1100,label:"REFLECTION",kind:"console"},{x:1320,label:"CELL 118",kind:"cell118"}]},
        encounter:{evidence:true,waves:[["guard","skimmer","guard"]]},
        districtConfig:{streets:1,danger:1.8,sky:"#05080e",far:"#09101a",mid:"#0b1118",signs:["CELL 118","VERIFY K"],roster:["guard","skimmer"]},
        cameraProfile:"gooddogs.sideview",presentationProfile:"intimate_rescue",animationProfile:"gooddogs.pair",musicProfile:"cell_118",cinematicEntry:"GD_CUT_04",cinematicExit:"GD_CUT_05",saveCheckpoint:"gooddogs.m4.cell118",acceptanceTest:"m4-k-reveal",nextMission:"gooddogs.m5",completionContract:"cell118-k-reveal-and-ambush-clear"
      },
      {
        id:"gooddogs.m5",mode:"gooddogs",kind:"mission",ordinal:5,
        displayName:"GOOD DOGS",name:"ACCESS CORE",phaseId:"core",
        objective:"ESCORT K · SEIZE THE ROUTE CONTROLS · OPEN THE PATH TO 1984",
        zone:"BLACKSITE MERIDIAN — ORPHEUS ACCESS CORE",target:1480,gameplayVerb:"control",
        environment:{district:"goodboys_core",background:"goodboys_core",fallback:null,light:"hack_green",accent:"#22c55e",palette:"access_green",assetClass:"runtime_generated_fallback"},
        stage:{platforms:[[250,345,240],[590,345,240],[930,310,230],[1260,345,260]],hazards:[[845,45]],landmarks:[{x:760,label:"K — ROUTE KEY",kind:"k"},{x:1070,label:"ACCESS NODE",kind:"console"},{x:1480,label:"ROUTE 1984",kind:"door"}]},
        encounter:{boss:"mikeindex",adds:[["droneop","thug"]]},
        districtConfig:{streets:1,danger:2,sky:"#05080e",far:"#09101a",mid:"#0b1118",signs:["ORPHEUS","CORE ACCESS"],roster:["guard","hunter"]},
        cameraProfile:"gooddogs.sideview",presentationProfile:"systems_control",animationProfile:"gooddogs.pair_with_k",musicProfile:"access_core",cinematicEntry:"GD_CUT_06",cinematicExit:"route-1984",saveCheckpoint:"gooddogs.m5.core",acceptanceTest:"m5-k-route-control",nextMission:"gooddogs.m6",completionContract:"access-node-seized"
      },
      {
        id:"gooddogs.m6",mode:"gooddogs",kind:"mission",ordinal:6,
        displayName:"GOOD DOGS",name:"CELL 1984",phaseId:"cell1984",
        objective:"DEFEND K'S DECRYPT · BREAK LOCKDOWN · FREE WALDO",
        zone:"BLACKSITE MERIDIAN — SURVEILLANCE BLOCK 1984",target:1360,gameplayVerb:"evade_observation",
        environment:{district:"goodboys_cell1984",background:"goodboys_cell1984",fallback:null,light:"emergency_red",accent:"#ff475d",palette:"surveillance_red",assetClass:"runtime_generated_fallback"},
        stage:{platforms:[[220,350,260],[565,315,220],[875,350,250],[1200,305,250],[1510,350,170]],hazards:[],landmarks:[{x:420,label:"K UPLINK",kind:"console"},{x:1010,label:"LOCKDOWN",kind:"warden"},{x:1360,label:"CELL 1984",kind:"cell1984"}]},
        encounter:{defend:true,waves:[["thug","skimmer"],["guard","thug","skimmer"],["hunter","guard","skimmer"]]},
        districtConfig:{streets:1,danger:2,sky:"#070509",far:"#10080d",mid:"#140b10",signs:["CELL 1984","WALDO"],roster:["hunter","guard"]},
        cameraProfile:"gooddogs.sideview",presentationProfile:"surveillance_pressure",animationProfile:"gooddogs.pair_with_k",musicProfile:"cell_1984",cinematicEntry:"GD_CUT_07",cinematicExit:"free-waldo",saveCheckpoint:"gooddogs.m6.cell1984",acceptanceTest:"m6-waldo-rescue",nextMission:"gooddogs.m7",completionContract:"decrypt-complete-uplink-safe-waldo-free"
      },
      {
        id:"gooddogs.m7",mode:"gooddogs",kind:"mission",ordinal:7,
        displayName:"GOOD DOGS",name:"ESCAPE VELOCITY",phaseId:"escape",
        objective:"BREAK THE WARDEN · REACH THE MAINTENANCE SHUTTLE",
        zone:"BLACKSITE MERIDIAN — WARDEN CORE / SHUTTLE BAY",target:1580,gameplayVerb:"boss_escape",
        environment:{district:"goodboys_escape",background:"goodboys_escape",fallback:null,light:"escape_purple",accent:"#f59e0b",palette:"warden_amber",assetClass:"runtime_generated_fallback"},
        stage:{platforms:[[210,340,180],[465,295,160],[700,255,155],[930,305,180],[1190,255,180],[1450,325,170]],hazards:[[400,45],[1378,45]],landmarks:[{x:900,label:"WARDEN CORE",kind:"warden"},{x:1580,label:"MAINTENANCE SHUTTLE",kind:"shuttle"}]},
        encounter:{boss:"warden1984"},
        districtConfig:{streets:1,danger:2.2,sky:"#04050a",far:"#090b12",mid:"#10131a",signs:["WARDEN NULL","MAINTENANCE SHUTTLE"],roster:["guard","hunter"]},
        cameraProfile:"gooddogs.sideview",presentationProfile:"warden_climax",animationProfile:"gooddogs.tandem",musicProfile:"escape_velocity",cinematicEntry:"GD_CUT_08",cinematicExit:"earthfall",saveCheckpoint:"gooddogs.m7.escape",acceptanceTest:"m7-actual-tandem-finisher",nextMission:"gooddogs.m8",completionContract:"warden-tandem-defeated-and-shuttle-reached"
      },
      {
        id:"gooddogs.m8",mode:"gooddogs",kind:"mission",ordinal:8,
        displayName:"GOOD DOGS",name:"EARTHFALL",phaseId:"earthfall",
        objective:"GET K · WALDO · KATRIN · MANCHEZ HOME",
        zone:"WALDO'S HOUSE — DAWN",target:820,gameplayVerb:"homecoming",
        environment:{district:"goodboys_earthfall",background:"goodboys_earthfall",fallback:"waldo_loft",light:"earthfall_gold",accent:"#ffd18b",palette:"dawn_gold",assetClass:"physical_authored"},
        stage:{platforms:[],hazards:[],landmarks:[{x:640,label:"WALDO'S PORCH",kind:"porch"},{x:930,label:"GARAGE",kind:"garage"},{x:1180,label:"SHUTTLE WRECK",kind:"shuttle"}]},
        encounter:{cinematic:true},
        districtConfig:{streets:1,danger:0,sky:"#25314b",far:"#704d50",mid:"#42574a",signs:["HOME","EARTHFALL"],roster:[]},
        cameraProfile:"gooddogs.sideview",presentationProfile:"quiet_homecoming",animationProfile:"gooddogs.pair_with_party",musicProfile:"earthfall",cinematicEntry:"earthfall-cards",cinematicExit:"campaign-complete",saveCheckpoint:"gooddogs.complete",acceptanceTest:"m8-home-state",nextMission:null,completionContract:"earthfall-owned"
      }
    ];
    freeze(GOOD_DOGS);

    function nightRecords(){
      var defs=root.TechOpsNightDistricts||{},order=root.TechOpsNightOrder||["downtown","longwharf","industrial","wooster","airport","suburbs"],out=[];
      order.forEach(function(id){var d=defs[id];if(!d)return;for(var street=1;street<=Number(d.streets||0);street++)out.push(freeze({id:"nightcrawler."+id+"."+street,mode:"nightcrawler",kind:"street",ordinal:out.length+1,district:id,street:street,name:d.name+" — STREET "+street,gameplayVerb:"street_combat",cameraProfile:"night.street",presentationProfile:"night_district",animationProfile:"nightcrawler",environment:{district:id,background:id,light:"night_neon",accent:d.accent,palette:"night_"+id,assetClass:"runtime_alias_pending"},saveCheckpoint:"nightcrawler."+id+"."+street}));});return out;
    }
    function ticketRecords(){
      return (root.TechOpsTicketTypes||[]).map(function(t,index){return freeze({id:"ticket."+t.id,mode:"day",kind:"ticket_world",ordinal:index+1,name:t.world,objective:t.label,gameplayVerb:"diagnose_root_cause",cameraProfile:"battle.dom",presentationProfile:"ticket_portal",animationProfile:"mike.day",environment:{district:"portal",background:t.id,light:"portal_"+t.stat,accent:t.wbg,palette:"ticket_"+t.id,assetClass:"procedural"},enemy:t.enemy,skill:t.stat,saveCheckpoint:null});});
    }
    var DAY_SPACES=freeze([
      {id:"day.factory",mode:"day",kind:"space",ordinal:1,name:"FACTORY FLOOR",cameraProfile:"day.grid",presentationProfile:"workday",animationProfile:"mike.day",environment:{light:"factory",palette:"day_industrial"}},
      {id:"day.office",mode:"day",kind:"space",ordinal:2,name:"OFFICE",cameraProfile:"day.grid",presentationProfile:"workday",animationProfile:"mike.day",environment:{light:"office",palette:"day_office"}},
      {id:"day.engineering",mode:"day",kind:"space",ordinal:3,name:"ENGINEERING",cameraProfile:"day.grid",presentationProfile:"workday",animationProfile:"mike.day",environment:{light:"engineering",palette:"day_engineering"}},
      {id:"day.it",mode:"day",kind:"space",ordinal:4,name:"IT ROOM",cameraProfile:"day.grid",presentationProfile:"workday",animationProfile:"mike.day",environment:{light:"it",palette:"day_it"}},
      {id:"day.sector04",mode:"sector04",kind:"set_piece",ordinal:5,name:"SECTOR 04",cameraProfile:"day.grid",presentationProfile:"sector04_investigation",animationProfile:"mike.day",environment:{light:"sector04",palette:"sector04",assetClass:"props_without_backplate"}}
    ]);
    var BY_ID={};GOOD_DOGS.concat(DAY_SPACES).forEach(function(row){BY_ID[row.id]=row;});
    function dynamic(){return nightRecords().concat(ticketRecords());}
    function get(id){if(BY_ID[id])return BY_ID[id];var rows=dynamic();for(var i=0;i<rows.length;i++)if(rows[i].id===id)return rows[i];return null;}
    function list(mode,kind){var rows=GOOD_DOGS.concat(DAY_SPACES,dynamic()).filter(function(row){return(!mode||row.mode===mode)&&(!kind||row.kind===kind);});return freeze(rows.slice());}
    function find(mode,ordinal){var rows=list(mode);for(var i=0;i<rows.length;i++)if(Number(rows[i].ordinal)===Number(ordinal))return rows[i];return null;}
    function mutableStage(id){var row=get(id);return row&&row.stage?clone(row.stage):null;}
    function goodDogsMission(m){return find("gooddogs",m);}
    function goodDogsEncounter(m){var row=goodDogsMission(m);return row&&row.encounter?clone(row.encounter):null;}
    function goodBoysRoute(){var out={};GOOD_DOGS.forEach(function(row){out[row.ordinal]={name:row.name,objective:row.objective,zone:row.zone,target:row.target,color:row.environment.accent};});return out;}
    function goodBoysStages(){var out={};GOOD_DOGS.forEach(function(row){out[row.ordinal]=clone(row.stage);});return out;}
    function goodBoysBackgroundMap(){var out={};GOOD_DOGS.forEach(function(row){out[row.ordinal]={key:row.environment.background,district:row.environment.district,scene:row.zone,fallback:row.environment.fallback};});return out;}
    function goodBoysSequence(){var out={};GOOD_DOGS.forEach(function(row){out[row.ordinal]={name:row.name,objective:row.objective,zone:row.zone,bg:row.environment.background,district:row.environment.district,light:row.environment.light};});return out;}
    function goodBoysPhases(){var out={};GOOD_DOGS.forEach(function(row){out[row.ordinal]={id:row.phaseId,label:row.name,objective:row.objective,accent:row.environment.accent,hazard:row.gameplayVerb,bg:row.environment.background};});return out;}
    function goodBoysDistricts(){var out={};GOOD_DOGS.forEach(function(row){out[row.environment.district]=clone(row.districtConfig);out[row.environment.district].name=row.zone;out[row.environment.district].accent=row.environment.accent;});return out;}
    function resolveRuntimeContext(state,world){
      if(world&&world._v736){var m=Number(world._v736.m||state&&state.meta&&state.meta._v736&&state.meta._v736.m||1),r=goodDogsMission(m);return r?{mode:"gooddogs",levelId:r.id,stageId:"m"+m,cameraProfile:r.cameraProfile,presentationProfile:r.presentationProfile,paletteProfile:r.environment.palette,assetProfile:r.environment.assetClass}:null;}
      if(world&&world._sector04)return{mode:"sector04",levelId:"day.sector04",stageId:"sector04",cameraProfile:"day.grid",presentationProfile:"sector04_investigation",paletteProfile:"sector04",assetProfile:"props_without_backplate"};
      if(state&&state.nightMode&&world){var id="nightcrawler."+(world.district||"downtown")+"."+(Number(world.street)||1),n=get(id);return n?{mode:"nightcrawler",levelId:id,stageId:String(n.street),cameraProfile:n.cameraProfile,presentationProfile:n.presentationProfile,paletteProfile:n.environment.palette,assetProfile:n.environment.assetClass}:null;}
      return{mode:"day",levelId:"day."+((state&&state.room)||"factory"),stageId:String(state&&state.day||1),cameraProfile:"day.grid",presentationProfile:"workday",paletteProfile:"day_default",assetProfile:"procedural"};
    }
    function validate(){var errors=[],seen={};GOOD_DOGS.forEach(function(row,index){if(row.ordinal!==index+1)errors.push(row.id+": ordinal");if(seen[row.id])errors.push(row.id+": duplicate");seen[row.id]=true;["cameraProfile","presentationProfile","animationProfile","saveCheckpoint","acceptanceTest","completionContract"].forEach(function(k){if(!row[k])errors.push(row.id+": missing "+k);});if(!row.environment||!row.environment.background||!row.stage)errors.push(row.id+": incomplete environment/stage");if(index<GOOD_DOGS.length-1&&row.nextMission!==GOOD_DOGS[index+1].id)errors.push(row.id+": invalid next mission");});return{valid:errors.length===0,errors:errors,goodDogs:GOOD_DOGS.length,nightCrawler:nightRecords().length,ticketWorlds:ticketRecords().length,daySpaces:DAY_SPACES.length,total:GOOD_DOGS.length+nightRecords().length+ticketRecords().length+DAY_SPACES.length};}
    var registry={VERSION:1,CAMPAIGN_DISPLAY_NAME:"GOOD DOGS",get:get,list:list,find:find,mutableStage:mutableStage,goodDogsMission:goodDogsMission,goodDogsEncounter:goodDogsEncounter,goodBoysRoute:goodBoysRoute,goodBoysStages:goodBoysStages,goodBoysBackgroundMap:goodBoysBackgroundMap,goodBoysSequence:goodBoysSequence,goodBoysPhases:goodBoysPhases,goodBoysDistricts:goodBoysDistricts,resolveRuntimeContext:resolveRuntimeContext,validate:validate,health:validate};
    root.TechOpsLevelRegistry=freeze(registry);
  }

  /* ---------------------------------------------------------------------- */
  /* PRESENTATION DIRECTOR                                                  */
  /* ---------------------------------------------------------------------- */
  if(!root.TechOpsPresentationDirector){
    var surfaces={},claims={},claimSerial=0,history=[];
    function visibleElement(spec){
      try{if(!root.document)return false;var el=root.document.getElementById(spec.elementId);if(!el)return false;if(spec.activeClass&&!(el.classList&&el.classList.contains(spec.activeClass)))return false;if(spec.hiddenClass&&el.classList&&el.classList.contains(spec.hiddenClass))return false;if(!spec.activeClass&&el.classList&&el.classList.contains("hidden"))return false;var st=root.getComputedStyle?root.getComputedStyle(el):el.style;return !st||st.display!=="none"&&st.visibility!=="hidden";}catch(e){return false;}
    }
    function registerSurface(spec){if(!spec||!spec.id||!spec.elementId||surfaces[spec.id])return false;surfaces[spec.id]=freeze(clone(spec));return true;}
    function begin(spec){spec=spec||{};var mode=spec.mode||"global",blocking=spec.blocking!==false;if(blocking&&isBlocking(mode))return null;var token="presentation:"+(++claimSerial)+":"+(spec.id||"scene");claims[token]={token:token,id:spec.id||"scene",owner:spec.owner||"unknown",mode:mode,kind:spec.kind||"scene",blocking:blocking,startedAt:Date.now(),active:true};history.push({event:"begin",token:token,id:claims[token].id,mode:mode,at:Date.now()});if(history.length>120)history.splice(0,history.length-120);return token;}
    function end(token,outcome){var c=claims[token];if(!c||!c.active)return false;c.active=false;c.outcome=outcome||"completed";c.endedAt=Date.now();history.push({event:"end",token:token,id:c.id,mode:c.mode,outcome:c.outcome,at:c.endedAt});if(history.length>120)history.splice(0,history.length-120);return true;}
    function activeClaims(mode){return Object.keys(claims).map(function(k){return claims[k];}).filter(function(c){return c.active&&(!mode||c.mode===mode||c.mode==="global");});}
    function visibleSurfaces(mode){return Object.keys(surfaces).filter(function(k){var s=surfaces[k];return(!mode||!s.mode||s.mode===mode||s.mode==="global")&&visibleElement(s);});}
    function isBlocking(mode){var cs=activeClaims(mode);if(cs.some(function(c){return c.blocking;}))return true;return visibleSurfaces(mode).some(function(id){return surfaces[id].blocking!==false;});}
    function current(mode){return{claims:activeClaims(mode).map(clone),surfaces:visibleSurfaces(mode),blocking:isBlocking(mode)};}
    function cancelOwner(owner,outcome){var n=0;Object.keys(claims).forEach(function(k){if(claims[k].active&&claims[k].owner===owner&&end(k,outcome||"cancelled"))n++;});return n;}
    [
      {id:"dialogue",elementId:"dialogue",mode:"global",hiddenClass:"hidden"},{id:"battle",elementId:"battle",mode:"day",hiddenClass:"hidden"},{id:"eod",elementId:"eod",mode:"day",hiddenClass:"hidden"},
      {id:"night-drive",elementId:"v722-cine",mode:"nightcrawler"},{id:"story-cine",elementId:"v725-cine",mode:"global"},{id:"good-dogs-movie",elementId:"good-dogs-cutscene-overlay",mode:"gooddogs",activeClass:"active"},
      {id:"good-dogs-intro",elementId:"good-boys-campaign-intro",mode:"gooddogs"},{id:"good-dogs-ship",elementId:"good-boys-ship-interlude",mode:"gooddogs"},{id:"good-dogs-prison",elementId:"gb-prison-cine",mode:"gooddogs"},
      {id:"good-dogs-earthfall",elementId:"good-boys-earthfall-cine",mode:"gooddogs"},{id:"good-dogs-recovery",elementId:"good-boys-mobile-recovery",mode:"gooddogs"},{id:"legacy-good-boys-story",elementId:"good-boys-story-cine",mode:"gooddogs"}
    ].forEach(registerSurface);
    root.TechOpsPresentationDirector={VERSION:1,registerSurface:registerSurface,begin:begin,end:end,cancelOwner:cancelOwner,isBlocking:isBlocking,current:current,visibleSurfaces:visibleSurfaces,history:function(){return history.map(clone);},health:function(){return{version:1,surfaces:Object.keys(surfaces).length,activeClaims:activeClaims().length,blocking:isBlocking(),pass:true};}};
  }

  /* ---------------------------------------------------------------------- */
  /* CAMERA DIRECTOR                                                        */
  /* ---------------------------------------------------------------------- */
  if(!root.TechOpsCameraDirector){
    var cameraState={};
    var CAMERA_PROFILES=freeze({
      "day.grid":{axes:"xy",anchorX:.5,anchorY:.5,lookAhead:.5,responseMs:170,maxLag:.6,snap:false},
      "night.street":{axes:"x",anchorX:1/2.4,anchorY:.5,lookAhead:12,responseMs:115,maxLag:20,snap:false},
      "gooddogs.sideview":{axes:"x",anchorX:1/2.4,anchorY:.5,lookAhead:18,responseMs:125,maxLag:28,snap:false}
    });
    function cameraProfile(id){return CAMERA_PROFILES[id]||null;}
    function cameraReset(channel){if(channel)delete cameraState[channel];else cameraState={};return true;}
    function cameraUpdate(channel,input){
      input=input||{};var p=cameraProfile(input.profile);if(!p)return null;var tx=Number(input.targetX),ty=Number(input.targetY||0),vw=Number(input.viewportW),vh=Number(input.viewportH||0),ww=Number(input.worldW),wh=Number(input.worldH||0);if(!isFinite(tx)||!isFinite(vw)||vw<=0||!isFinite(ww)||ww<=0)return null;
      var enabled=input.enabled!==false,reduced=!!input.reducedMotion,faceX=Number(input.facingX||0),faceY=Number(input.facingY||0),look=enabled&&!reduced?p.lookAhead:0,targetActorX=tx+clamp(faceX,-1,1)*look,targetActorY=ty+clamp(faceY,-1,1)*look;
      var prev=cameraState[channel],cut=!!input.cut||!prev||!enabled||p.snap,nowMs=Number(input.nowMs);if(!isFinite(nowMs))nowMs=Date.now();var dt=prev?clamp((nowMs-prev.nowMs)/1000,0,.08):0;
      var actorX=targetActorX,actorY=targetActorY;
      if(!cut&&p.responseMs>0){var k=1-Math.exp(-(dt*1000)/p.responseMs);actorX=prev.actorX+(targetActorX-prev.actorX)*k;actorY=prev.actorY+(targetActorY-prev.actorY)*k;actorX=tx+clamp(actorX-tx,-p.maxLag,p.maxLag);actorY=ty+clamp(actorY-ty,-p.maxLag,p.maxLag);}
      var x=clamp(actorX-vw*p.anchorX,0,Math.max(0,ww-vw)),y=0;if(p.axes==="xy"&&isFinite(vh)&&vh>0&&isFinite(wh)&&wh>0)y=clamp(actorY-vh*p.anchorY,0,Math.max(0,wh-vh));
      var result={x:x,y:y,actorX:actorX,actorY:actorY,profile:input.profile,nowMs:nowMs};cameraState[channel]=result;return clone(result);
    }
    function cameraOffset(channel,input){input=input||{};var r=cameraUpdate(channel,input);if(!r)return null;return{x:r.actorX-Number(input.targetX||0),y:r.actorY-Number(input.targetY||0),cameraX:r.x,cameraY:r.y};}
    root.TechOpsCameraDirector={VERSION:1,profile:cameraProfile,update:cameraUpdate,offset:cameraOffset,reset:cameraReset,get:function(channel){return cameraState[channel]?clone(cameraState[channel]):null;},health:function(){return{version:1,profiles:Object.keys(CAMERA_PROFILES),channels:Object.keys(cameraState),pass:true};}};
  }

  /* ---------------------------------------------------------------------- */
  /* ANIMATION CONTROLLER                                                   */
  /* ---------------------------------------------------------------------- */
  if(!root.TechOpsAnimationController){
    var actors={};
    function registerActor(id,definition){if(!id||!definition||actors[id])return false;actors[id]=freeze(clone(definition));return true;}
    function actorDefinition(id){return actors[id]||null;}
    function resolveAnimation(id,snapshot,nowMs,availableFrames){
      var d=actors[id];if(!d)return null;snapshot=snapshot||{};var state=typeof d.select==="function"?d.select(snapshot):d.fallbackState,def=d.states[state]||d.states[d.fallbackState];if(!def)return null;var frames=def.frames||[],approved=frames.filter(function(key){return !availableFrames||availableFrames[key];});if(!approved.length)return null;var ms=Math.max(1,Number(def.frameMs)||720),idx=Math.floor(Math.max(0,Number(nowMs)||0)/ms)%approved.length;return{actor:id,state:state,key:approved[idx],index:idx,flip:!!def.flip,fallback:!!def.fallback,semantic:def.semantic||state,coverage:def.coverage||"approved"};
    }
    function dogSelect(s){if(s.hp<=0||s.downed)return"down";if(s.hit)return"hit";if(s.attack)return"attack";if(s.block)return"block";if(s.dash)return"dash";if(!s.onGround)return"air";if(Math.abs(Number(s.vx)||0)>.45)return"locomotion_gap";return"idle";}
    function dogDefinition(prefix){return{atlas:"KATRIN_MANCHEZ",fallbackState:"idle",select:dogSelect,states:{idle:{frames:[prefix+"_idle0",prefix+"_idle1"],frameMs:720,semantic:"idle"},locomotion_gap:{frames:[prefix+"_idle0",prefix+"_idle1"],frameMs:145,semantic:"locomotion_hold",coverage:"source-art-required",fallback:true},air:{frames:[prefix+"_leap"],frameMs:720,semantic:"airborne"},dash:{frames:[prefix+"_roll"],frameMs:720,semantic:"dash_key_pose"},attack:{frames:[prefix+"_strike",prefix+"_pounce"],frameMs:90,semantic:"attack"},block:{frames:[prefix+"_shield"],frameMs:720,semantic:"block"},hit:{frames:[prefix+"_wall_hit"],frameMs:720,semantic:"hit"},down:{frames:[prefix+"_down"],frameMs:720,semantic:"down"}}};}
    registerActor("gooddogs.katrin",dogDefinition("kat"));registerActor("gooddogs.manchez",dogDefinition("man"));
    registerActor("mike.day",{atlas:"PLAYER_ATLAS",fallbackState:"idle_down",select:function(s){var d=s.facing||"down";return(s.moving?"walk_":"idle_")+d;},states:{idle_down:{frames:["down0"],frameMs:720},idle_up:{frames:["up0"],frameMs:720},idle_left:{frames:["left0"],frameMs:720},idle_right:{frames:["right0"],frameMs:720},walk_down:{frames:["down0","down1","down0","down2"],frameMs:135},walk_up:{frames:["up0","up1","up0","up2"],frameMs:135},walk_left:{frames:["left0","left1","left0","left2"],frameMs:135},walk_right:{frames:["right0","right1","right0","right2"],frameMs:135}}});
    registerActor("nightcrawler",{atlas:"NIGHT_WALKER_REFERENCE_V1",fallbackState:"idle",select:function(s){if(s.down)return"down";if(s.hit)return"hit";if(s.attack)return"attack";if(s.dash)return"dash_gap";if(!s.onGround)return"air_gap";if(Math.abs(Number(s.vx)||0)>.35)return"locomotion_gap";return"idle";},states:{idle:{frames:["idle0","idle1"],frameMs:560},locomotion_gap:{frames:["idle0","idle1"],frameMs:150,semantic:"locomotion_hold",coverage:"source-art-required",fallback:true},air_gap:{frames:[],frameMs:720,semantic:"unresolved_airborne",coverage:"source-art-required",fallback:true},dash_gap:{frames:[],frameMs:720,semantic:"unresolved_dash",coverage:"source-art-required",fallback:true},attack:{frames:["jab0","jab1"],frameMs:90},hit:{frames:["hit"],frameMs:720},down:{frames:["down"],frameMs:720}}});
    function dogFrame(who,runtime,nowMs,frames){var id=who==="manchez"?"gooddogs.manchez":"gooddogs.katrin",s=runtime||{};return resolveAnimation(id,{hp:Number(s.hp),downed:!!s.downed,hit:Number(s.ifr)>0,attack:Number(s.jabAnim)>0,block:!!s.block,dash:Number(s.dashT)>0,onGround:s.onGround!==false,vx:Number(s.vx)||0},nowMs,frames);}
    function coverage(){return{goodDogs:{idle:"approved",walk:"source-art-required",run:"handoff-run-loop",startStop:"source-art-required",jump:"key-pose-only",land:"source-art-required",dash:"key-pose-only",attack:"key-poses-only",partnerSync:"source-art-required"},nightCrawler:{locomotion:"run-integrated-walk-required",jumpLand:"handoff-key-poses",dash:"source-art-required"},mikeDay:{idle:"approved",walk:"approved",transitions:"source-art-required"}};}
    root.TechOpsAnimationController={VERSION:1,registerActor:registerActor,resolve:resolveAnimation,definition:actorDefinition,dogFrame:dogFrame,coverage:coverage,health:function(){return{version:1,actors:Object.keys(actors),coverage:coverage(),pass:true};}};
  }

  /* One authored mixed-media slice. It loads lazily when M3 asks for its
     background, then replaces only the old generated fallback image. */
  if(!root.TechOpsM3CinematicAsset){
    var m3Image=null,m3Status="idle",m3Error=null;
    function loadM3Image(){
      try{
        if(m3Image&&m3Image.complete&&m3Image.naturalWidth)return m3Image;
        if(m3Status==="loading")return null;
        if(typeof root.Image!=="function")return null;
        m3Status="loading";m3Image=new root.Image();
        m3Image.onload=function(){m3Status="ready";m3Error=null;try{root.NM_BG734=root.NM_BG734||{};root.NM_BG734.goodboys_breach=m3Image;root.__goodBoysM3VisualAuthority="authored-mixed-media";}catch(e){}};
        m3Image.onerror=function(){m3Status="error";m3Error="M3 cinematic backplate failed to load";};
        m3Image.src="assets/cinematic/m3_orbital_prison_breach.png?v=20260911-cinematic-cohesion-r1";
        return null;
      }catch(e){m3Status="error";m3Error=String(e&&e.stack||e);return null;}
    }
    root.TechOpsM3CinematicAsset={VERSION:1,src:"assets/cinematic/m3_orbital_prison_breach.png",gameplayHorizonRatio:.537,image:loadM3Image,health:function(){return{version:1,status:m3Status,ready:!!(m3Image&&m3Image.complete&&m3Image.naturalWidth),width:Number(m3Image&&m3Image.naturalWidth)||0,height:Number(m3Image&&m3Image.naturalHeight)||0,error:m3Error};}};
  }

  if(typeof module==="object"&&module.exports)module.exports={TechOpsLevelRegistry:root.TechOpsLevelRegistry,TechOpsPresentationDirector:root.TechOpsPresentationDirector,TechOpsCameraDirector:root.TechOpsCameraDirector,TechOpsAnimationController:root.TechOpsAnimationController};
})(typeof globalThis!=="undefined"?globalThis:this);

/* Handoff art and shared staging: passive consumers, no gameplay timers/hooks. */
(function(root){
  'use strict';
  var manifest=null,loadState='idle',loadError=null,images={},tracks=new WeakMap(),effects=new WeakMap();
  function clock(){return root.performance&&root.performance.now?root.performance.now():Date.now();}
  function reduced(){return !!(root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches);}
  function load(){
    if(loadState!=='idle'||typeof root.fetch!=='function')return;
    loadState='loading';root.fetch('assets/handoff/atlas.json?v=1').then(function(r){if(!r.ok)throw Error('art manifest HTTP '+r.status);return r.json();}).then(function(m){
      if(m.version!==1||!m.atlases)throw Error('Unsupported art manifest');manifest=m;loadState='ready';
    }).catch(function(e){loadState='error';loadError=String(e);});
  }
  function image(id){load();var a=manifest&&manifest.atlases[id];if(!a||!root.Image)return null;
    var rec=images[id];if(!rec){var im=new root.Image();rec=images[id]={image:im,status:'loading'};im.onload=function(){rec.status='ready';};im.onerror=function(){rec.status='error';};im.src=a.src;}
    return rec.status==='ready'?rec.image:null;
  }
  function drawFrame(ctx,id,index,cx,base,height,flip,alpha){
    var im=image(id),a=manifest&&manifest.atlases[id],f=a&&a.frames[index];if(!im||!f||!ctx)return false;
    var r=f.rect,s=height/a.standingHeight;ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha*=alpha==null?1:alpha;
    ctx.translate(Math.round(cx),Math.round(base));if(flip)ctx.scale(-1,1);
    ctx.drawImage(im,r[0],r[1],r[2],r[3],-f.pivot[0]*s,-f.pivot[1]*s,r[2]*s,r[3]*s);ctx.restore();return true;
  }
  function select(id,n,at){
    if(!n)return null;var isDog=id==='kat'||id==='man',state='idle',seq=null,ms=100;
    if(n.hp<=0||n.downed||n.down>0||n.hitT>0||n.jabAnim>0||n.anim>0||n.block)return null;
    if(n.dashT>0&&isDog&&!n.onGround){state='airdash';seq=[13,14,15,16,17];ms=65;}
    else if(!n.onGround){state=n.vy<-2?'ascent':n.vy>2?'descent':'apex';if(!isDog)seq=[state==='ascent'?14:state==='apex'?15:16];}
    else if(Math.abs(n.vx||0)>=2.5){state='run';seq=[6,7,8,9,10,11];ms=Math.max(65,Math.min(130,400/Math.abs(n.vx)));}
    var prev=tracks.get(n);if(!prev||prev.id!==id||prev.state!==state){prev={id:id,state:state,at:at};tracks.set(n,prev);}
    if(!seq)return null;var elapsed=Math.max(0,at-prev.at),idx=state==='airdash'?Math.min(seq.length-1,Math.floor(elapsed/ms)):Math.floor(elapsed/ms)%seq.length;
    if(state==="run"&&prev.phase!==idx){prev.phase=idx;if(idx===0||idx===3)root.__techOpsFootContact={actor:id,phase:idx,at:at};}
    return{id:id,state:state,frame:seq[idx],phase:idx,source:'handoff-extracted',loop:state==='run'};
  }
  function drawActor(ctx,id,n,cx,base,height,at){var choice=select(id,n,at||0);if(!choice)return false;var ok=drawFrame(ctx,id,choice.frame,cx,base,height,(n.face||1)<0,n.ifr>0?.7:1);if(ok)root.__techOpsArtLastActor=choice;return ok;}
  function impact(n,e,kind,at){
    if(!n||!e)return false;var rows=effects.get(n)||[];rows.push({x:Number(e.x)+(Number(e.w)||24)/2,y:Number(e.y)+(Number(e.h)||36)/2,at:at==null?clock():at,kind:kind||'hit',face:Math.sign(Number(e.kb)||Number(n.face)||1)});if(rows.length>24)rows.splice(0,rows.length-24);effects.set(n,rows);return true;
  }
  function drawImpacts(ctx,n,at){
    var rows=effects.get(n)||[],calm=reduced();rows=rows.filter(function(e){return at-e.at<260&&at>=e.at;});effects.set(n,rows);
    if(!rows.length)return;ctx.save();ctx.beginPath();ctx.rect(0,112,ctx.canvas.width,Math.max(0,ctx.canvas.height-156));ctx.clip();
    rows.forEach(function(e){var age=(at-e.at)/260,s=1-age,cx=e.x-(n.cam||0),cy=e.y;ctx.globalAlpha=.7*s;ctx.strokeStyle=n._v736?(n._v736.active==='manchez'?'#ff9f1c':'#55dfff'):'#ffab4c';ctx.lineWidth=calm?1:2;
      ctx.beginPath();ctx.arc(cx,cy,4+(calm?4:23)*age,0,Math.PI*2);ctx.stroke();if(!calm)for(var i=0;i<5;i++){var a=(i/5*Math.PI*2)+e.face*.2,dist=6+age*30;ctx.fillStyle=ctx.strokeStyle;ctx.fillRect(Math.round(cx+Math.cos(a)*dist),Math.round(cy+Math.sin(a)*dist),3,2);}
    });ctx.restore();
  }
  // The same layer roles serve orbital prison, grounded Sector 04 and one street.
  // Source props decorate existing geometry. They never create collision surfaces.
  var layers={
    'gooddogs.m3':[{frame:2,x:330,height:182,role:'back',parallax:1},{frame:6,x:730,height:95,role:'mid',parallax:.55,y:-170},{frame:3,x:900,height:155,role:'back',parallax:1},{frame:9,x:1440,height:86,role:'back',parallax:1}],
    'gooddogs.m4':[{frame:0,x:1320,height:182,role:'back',parallax:1},{frame:8,x:500,height:80,role:'back',parallax:1},{frame:6,x:890,height:86,role:'mid',parallax:.55,y:-150}],
    'gooddogs.m5':[{frame:8,x:1070,height:100,role:'back',parallax:1},{frame:3,x:1480,height:180,role:'back',parallax:1},{frame:6,x:430,height:96,role:'mid',parallax:.55,y:-155}],
    'gooddogs.m6':[{frame:0,x:1360,height:180,role:'back',parallax:1},{frame:8,x:420,height:95,role:'back',parallax:1},{frame:11,x:1010,height:70,role:'back',parallax:1,y:-155}],
    'gooddogs.m7':[{frame:3,x:1580,height:176,role:'back',parallax:1},{frame:7,x:470,height:96,role:'mid',parallax:.55,y:-185},{frame:11,x:980,height:80,role:'back',parallax:1,y:-175}],
    'sector04':[{frame:6,x:550,height:105,role:'mid',parallax:.55,y:-178},{frame:10,x:280,height:65,role:'back',parallax:1},{frame:11,x:1100,height:72,role:'back',parallax:1,y:-173}],
    'night.industrial':[{frame:6,x:550,height:100,role:'mid',parallax:.55,y:-155},{frame:10,x:1050,height:67,role:'back',parallax:1}]
  };
  function level(n){return n&&n._v736?'gooddogs.m'+n._v736.m:n&&n._sector04?'sector04':n&&n.district==='industrial'?'night.industrial':null;}
  function drawEnvironment(ctx,n,pass,at){
    var id=level(n),spec=layers[id];if(!spec)return false;var floor=typeof root.NM_FLOOR==='number'?root.NM_FLOOR:430,W=ctx.canvas.width,calm=reduced();
    ctx.save();ctx.beginPath();ctx.rect(0,115,W,Math.max(0,ctx.canvas.height-155));ctx.clip();
    if(pass==='back'){
      spec.forEach(function(l){var sx=l.x-(n.cam||0)*l.parallax;if(sx<-230||sx>W+230)return;drawFrame(ctx,'prison',l.frame,sx,floor+(l.y||0),l.height,false,l.role==='mid'?.62:1);});
      if(n._v736&&n._v736.m===6){var beam=surveillance(n,at);ctx.globalAlpha=.09;ctx.fillStyle='#ff475d';ctx.beginPath();ctx.moveTo(1010-(n.cam||0),floor-250);ctx.lineTo(beam.center-(n.cam||0)-beam.radius,floor);ctx.lineTo(beam.center-(n.cam||0)+beam.radius,floor);ctx.closePath();ctx.fill();}
      if(n._v736&&n._v736.m===4){ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillStyle='#b5edff';ctx.fillText('118',1320-(n.cam||0),floor-165);}
      if(n._v736&&n._v736.m===6){ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillStyle='#ffadb4';ctx.fillText('1984',1360-(n.cam||0),floor-165);}
    }else{
      // Foreground atmosphere is bounded and never hides actor silhouettes.
      if(!calm){ctx.globalAlpha=.10;ctx.fillStyle=id==='night.industrial'?'#a5d9eb':'#8ac5d8';for(var i=0;i<12;i++){var px=((i*149-(n.cam||0)*1.18+at*.006)% (W+160)+W+160)%(W+160)-80;ctx.fillRect(px,floor+12+(i%3)*7,26,1);}}
      var c=n._v736,meta=root.S&&root.S.meta&&root.S.meta._v736;
      if(c&&Number(c.m)>=6&&Number(c.m)<=7&&meta&&meta.waldo){drawFrame(ctx,'waldo',12,n.x-(n.cam||0)-85,floor+2,85,false,.92);}
    }
    ctx.restore();root.__techOpsLayerEvidence={level:id,pass:pass,asset:'prison',collisionOwned:false};return true;
  }
  function surveillance(n,at){var center=1010+Math.sin(at/1900)*470,radius=88,x=Number(n.x)+(Number(n.w)||22)/2;var sheltered=(n.platforms||[]).some(function(p){return x>p.x&&x<p.x+p.w&&Number(n.y)>p.y+14;});return{center:center,radius:radius,observed:Math.abs(x-center)<radius&&!sheltered,sheltered:sheltered};}
  if(root.TechOpsAnimationController)root.TechOpsAnimationController.resolveHandoff=select;
  root.TechOpsArtHandoff={VERSION:1,load:load,image:image,drawFrame:drawFrame,drawActor:drawActor,select:select,impact:impact,drawImpacts:drawImpacts,drawEnvironment:drawEnvironment,surveillance:surveillance,layers:layers,health:function(){return{status:loadState,error:loadError,atlases:Object.keys(images).map(function(id){return{id:id,status:images[id].status};}),generatedThisPass:false};}};
})(typeof globalThis!=='undefined'?globalThis:this);
