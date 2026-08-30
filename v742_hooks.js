/* ==========================================================================
   v7.42 - CONCEPT CUTSCENE STYLE PASS
   Uses the integrated approved mission asset pack as runtime cutscene backdrops
   while preserving the shared v7.25 cinematic engine, choices, cues and rewards.
   v7.42.1: contain-safe composition keeps authored panels readable on portrait.
   ========================================================================== */
(function () {
  const VER = "7.42.1";
  if (window.v742) return;
  if (!window.v725 || !v725.defs || !v725.h) return;

  const H = v725.h, LW = H.LW, LH = H.LH, BAR = H.BAR;
  const SCENE_H = LH - BAR * 2;
  const BASE = "assets/v742/cutscenes/";
  const PANEL_SRC = {
    waldo_house: BASE + "waldo_house.png", waldo_garage: BASE + "waldo_garage.png", hidden_bay: BASE + "hidden_bay.png",
    secret_ship_interior: BASE + "secret_ship_interior.png", orbital_approach: BASE + "orbital_approach.png", cell_118: BASE + "cell_118.png",
    access_core: BASE + "access_core.png", warden_shuttle_bay: BASE + "warden_shuttle_bay.png", earthfall: BASE + "earthfall.png",
    crash_site: BASE + "crash_site.png", cell_1984: BASE + "cell_1984.png", waldo_dialogue: BASE + "waldo_dialogue.png"
  };
  const PANEL_LABEL = {waldo_house:"WALDO'S HOUSE",waldo_garage:"WALDO'S GARAGE",hidden_bay:"HIDDEN BAY",secret_ship_interior:"SECRET SHIP",orbital_approach:"ORBITAL APPROACH",cell_118:"CELL 118",access_core:"ACCESS CORE",warden_shuttle_bay:"SHUTTLE BAY",earthfall:"EARTHFALL",crash_site:"CRASH SITE",cell_1984:"CELL 1984",waldo_dialogue:"WALDO LINK"};
  const SCENE_PANELS = {
    coffee:["waldo_garage","waldo_garage","access_core","access_core","waldo_garage","waldo_garage","waldo_garage"],mentor:["access_core","access_core","waldo_dialogue","access_core","access_core","access_core","access_core"],betrayal:["access_core","secret_ship_interior","secret_ship_interior","warden_shuttle_bay","access_core","warden_shuttle_bay","secret_ship_interior","secret_ship_interior","access_core"],city:["hidden_bay","access_core","secret_ship_interior","access_core","access_core","secret_ship_interior","orbital_approach","warden_shuttle_bay","hidden_bay"],racks:["access_core","access_core","access_core","access_core","access_core"],citylife:["hidden_bay","hidden_bay","waldo_dialogue","hidden_bay","hidden_bay"],promotion:["access_core","access_core","access_core","access_core"],krun:["hidden_bay","hidden_bay","hidden_bay","hidden_bay","hidden_bay","hidden_bay"],wires:["access_core","access_core","hidden_bay","access_core","access_core"],signal:["hidden_bay","hidden_bay","orbital_approach","hidden_bay","waldo_dialogue"],orpheus:["access_core","access_core","secret_ship_interior","orbital_approach","access_core","warden_shuttle_bay"],badge:["access_core","secret_ship_interior","warden_shuttle_bay","access_core","access_core"],emerald:["access_core","secret_ship_interior","waldo_dialogue","hidden_bay","access_core","hidden_bay"],gs1:["waldo_garage","waldo_garage","access_core","access_core"],waldo_meet:["waldo_house","waldo_house","waldo_house","orbital_approach","waldo_house"],waldo_grass:["waldo_house","waldo_house","waldo_house","orbital_approach"],waldo_smoke:["waldo_house","waldo_dialogue","orbital_approach","waldo_house","waldo_house"],waldo_tracker:["waldo_garage","waldo_garage","waldo_garage","waldo_garage","waldo_dialogue","waldo_garage"],w_parts:["hidden_bay","hidden_bay","hidden_bay","waldo_garage"],w_nowhere:["hidden_bay","hidden_bay","hidden_bay","waldo_house"],w_party:["waldo_house","waldo_dialogue","waldo_house","waldo_dialogue","waldo_house"],w_brothers:["waldo_house","waldo_dialogue","access_core","warden_shuttle_bay"],w_housecall:["waldo_house","waldo_dialogue","waldo_house","waldo_house"],w_family:["waldo_house","hidden_bay","waldo_dialogue","orbital_approach"],w_bird:["orbital_approach","orbital_approach","earthfall","crash_site"],gk1:["cell_118","cell_118","cell_118","cell_118","cell_118"],gk2:["cell_118","cell_118","cell_118","cell_118","cell_118"],gk3:["access_core","access_core","access_core","access_core","access_core"],gk4:["cell_1984","cell_1984","cell_1984","cell_1984"],gk5:["access_core","access_core","access_core","access_core","warden_shuttle_bay"],gk6:["warden_shuttle_bay","access_core","secret_ship_interior","cell_1984","secret_ship_interior"],b736m1:["waldo_house","waldo_garage","hidden_bay","orbital_approach"],b736m2:["hidden_bay","secret_ship_interior","orbital_approach"],b736m3:["orbital_approach","cell_118","cell_118"],b736m4:["cell_118","cell_118","cell_118","cell_118"],b736m5:["access_core","access_core"],b736m6:["cell_1984","cell_1984","cell_1984"],b736m7:["warden_shuttle_bay","warden_shuttle_bay","secret_ship_interior"],b736m8:["earthfall","crash_site","waldo_dialogue","cell_118","access_core"]
  };
  const HUD_CAST={waldo:["WALDO","MIKE"],w_:["WALDO","MIKE"],gk:["KATRIN","MANCHEZ"],b736m1:["KATRIN","MANCHEZ"],b736m2:["KATRIN","MANCHEZ"],b736m3:["KATRIN","MANCHEZ"],b736m4:["K","KATRIN + MANCHEZ"],b736m5:["K","KATRIN + MANCHEZ"],b736m6:["WALDO","K"],b736m7:["K","WALDO"],b736m8:["K","WALDO"],signal:["FELICIA","K"],krun:["K","MIKE"],emerald:["K","MIKE"],orpheus:["ORPHEUS","K"],betrayal:["MIKE","FELICIA"]};
  const IMG={};
  function im(key){if(IMG[key]!==undefined)return IMG[key];let out=null;try{out=new Image();out.src=PANEL_SRC[key];}catch(e){}IMG[key]=out;return out;}
  function ready(img){return !!(img&&img.complete&&img.naturalWidth);}
  function rawBg(x,tint){const g=x.createLinearGradient(0,BAR,0,LH-BAR);g.addColorStop(0,tint||"#071323");g.addColorStop(.55,"#070a18");g.addColorStop(1,"#050713");x.fillStyle=g;x.fillRect(0,BAR,LW,SCENE_H);}
  function drawConceptBackdrop(x,key,tm,tint){
    rawBg(x,tint);const img=im(key);
    if(ready(img)){
      /* Contain, never cover: concept panels often contain authored framing/text
         near their edges. Cropping those panels was the source of the portrait
         ORBITAL APPROACH failure. Motion stays inside the available matte. */
      const pad=18,availW=LW-pad*2,availH=SCENE_H-pad*2;
      const scale=Math.min(availW/img.naturalWidth,availH/img.naturalHeight);
      const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
      const drift=Math.round(Math.sin((tm||0)/3200)*3),bob=Math.round(Math.cos((tm||0)/3800)*2);
      const dx=Math.round((LW-w)/2+drift),dy=Math.round(BAR+(SCENE_H-h)/2+bob);
      x.save();x.imageSmoothingEnabled=false;x.fillStyle="#02050b";x.fillRect(0,BAR,LW,SCENE_H);x.drawImage(img,dx,dy,w,h);
      /* Soft matte instead of stretching/cropping to fill widescreen. */
      x.fillStyle="rgba(3,8,16,.72)";if(dx>0){x.fillRect(0,BAR,dx,SCENE_H);x.fillRect(dx+w,BAR,LW-(dx+w),SCENE_H);}if(dy>BAR){x.fillRect(0,BAR,LW,dy-BAR);x.fillRect(0,dy+h,LW,LH-BAR-(dy+h));}x.restore();
    }else{for(let i=0;i<34;i++){x.fillStyle=i%3?"rgba(57,211,255,.08)":"rgba(255,68,85,.06)";x.fillRect((i*149)%LW,BAR+30+(i*61)%(SCENE_H-80),26+(i%4)*14,2+(i%2)*10);}}
  }
  function castFor(id){if(HUD_CAST[id])return HUD_CAST[id];for(const p in HUD_CAST)if(id.indexOf(p)===0)return HUD_CAST[p];return["TECHOPS","LINK"]}
  function techPlate(x,text,a,b,w,h,fill,edge){x.save();x.fillStyle=fill||"rgba(4,12,26,.84)";H.rr(x,a,b,w,h,4);x.fill();x.strokeStyle=edge||"rgba(57,211,255,.8)";x.lineWidth=2;H.rr(x,a,b,w,h,4);x.stroke();x.fillStyle="#dff8ff";x.font="bold 12px 'Courier New',monospace";x.textAlign="center";x.textBaseline="middle";x.fillText(text,a+w/2,b+h/2,w-18);x.restore();}
  function statusCard(x,name,a,b,col,pct){techPlate(x,name,a,b,190,42,"rgba(2,9,20,.82)",col);x.fillStyle="rgba(255,68,85,.82)";H.rr(x,a+14,b+28,130,6,2);x.fill();x.fillStyle=col;H.rr(x,a+14,b+28,130*(pct||.8),6,2);x.fill();x.fillStyle="rgba(232,236,255,.7)";x.fillRect(a+154,b+28,18,6);}
  function drawFrameGrade(x,key,tm,id){const grd=x.createRadialGradient(LW/2,BAR+SCENE_H/2,60,LW/2,BAR+SCENE_H/2,760);grd.addColorStop(0,"rgba(0,0,0,0)");grd.addColorStop(.78,"rgba(0,0,0,.10)");grd.addColorStop(1,"rgba(0,0,0,.42)");x.fillStyle=grd;x.fillRect(0,BAR,LW,SCENE_H);x.save();x.strokeStyle="rgba(57,211,255,.7)";x.lineWidth=2;H.rr(x,18,BAR+16,LW-36,SCENE_H-32,4);x.stroke();x.restore();const label=PANEL_LABEL[key]||key;techPlate(x,label,LW/2-145,BAR+20,290,34,"rgba(2,10,20,.78)",H.CYAN);const cast=castFor(id);statusCard(x,cast[0],34,BAR+20,H.CYAN,.92);statusCard(x,cast[1],LW-224,BAR+20,H.AMBER,.84);}
  function techPanel(x,a,b,w,h,fill){x.save();x.fillStyle=fill||"rgba(4,13,28,.86)";H.rr(x,a,b,w,h,6);x.fill();x.strokeStyle="rgba(57,211,255,.85)";x.lineWidth=2;H.rr(x,a,b,w,h,6);x.stroke();x.restore();}
  function techBubble(x,s,a,b,w){const h=48;x.save();x.fillStyle="rgba(4,13,28,.9)";H.rr(x,a,b,w,h,6);x.fill();x.strokeStyle="rgba(57,211,255,.75)";x.lineWidth=2;H.rr(x,a,b,w,h,6);x.stroke();x.fillStyle="#e8ecff";x.font="bold 16px 'Courier New',monospace";x.textAlign="center";x.textBaseline="middle";x.fillText(s,a+w/2,b+h/2,w-18);x.restore();}
  function patchShot(id,sh,i){if(!sh||typeof sh.draw!=="function"||sh._v742ConceptWrapped)return false;const original=sh.draw;const key=(SCENE_PANELS[id]&&SCENE_PANELS[id][i])||SCENE_PANELS[id][SCENE_PANELS[id].length-1];sh.draw=function(x,tm,local){const oldBg=H.bg,oldPanel=H.panel,oldBubble=H.bubble;H.bg=function(ctx,tint){drawConceptBackdrop(ctx,key,tm,tint);};H.panel=techPanel;H.bubble=techBubble;try{drawConceptBackdrop(x,key,tm);original.call(this,x,tm,local);}catch(e){try{window.__err742=String(e&&e.stack||e);}catch(_){}}finally{H.bg=oldBg;H.panel=oldPanel;H.bubble=oldBubble;}drawFrameGrade(x,key,tm,id);};sh._v742ConceptWrapped=true;return true;}
  function patchScene(id){const defs=v725.defs();const def=defs&&defs[id];if(!def||!Array.isArray(def.shots)||!SCENE_PANELS[id])return 0;let n=0;def.shots.forEach((sh,i)=>{if(patchShot(id,sh,i))n++;});def._v742ConceptStyle=true;return n;}
  Object.keys(PANEL_SRC).forEach(im);const PATCHED={};Object.keys(SCENE_PANELS).forEach(id=>{PATCHED[id]=patchScene(id);});window.GOOD_BOYS_CUTSCENE_PLATES=Object.assign({},PANEL_SRC);
  window.v742={version:VER,panels:()=>Object.keys(PANEL_SRC),scenes:()=>Object.keys(SCENE_PANELS),patched:()=>Object.assign({},PATCHED),ready:()=>Object.keys(PANEL_SRC).filter(k=>ready(IMG[k])),drawConceptBackdrop};
  console.log("[v7.42.1] Concept cutscene style loaded - contain-safe approved mission art");
})();