"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");

// The parser filter must remove both legacy status systems while retaining
// world drawing and the shared center mission message.
{
  const calls=[];
  const ctx={canvas:{width:640,height:720},fillRect(...a){calls.push(["rect",...a]);},strokeRect(...a){calls.push(["stroke",...a]);},fillText(...a){calls.push(["text",...a]);},drawImage(...a){calls.push(["image",...a]);}};
  const context={console,ctx,NM:{_v736:{}},__goodBoysHudLiteInstalled:true};
  context.__techopsFinalParserDrawNM=function(){
    ctx.fillRect(10,10,250,76);ctx.fillRect(18,18,160,10);ctx.fillText("HP",184,27);ctx.fillText("FOCUS",18,46);
    ctx.fillRect(378,10,252,62);ctx.fillText("DANGER",480,48);ctx.fillText("DOWNTOWN · ST 1/3",620,30);
    ctx.fillRect(10,92,250,66);ctx.fillText("KATRIN",20,110);
    ctx.fillRect(300,300,24,24);ctx.fillText("CLEAR THE HANGAR",320,118);
  };
  context.globalThis=context;vm.createContext(context);vm.runInContext(fs.readFileSync("good_boys_legacy_hud_filter.js","utf8"),context,{filename:"good_boys_legacy_hud_filter.js"});
  context.__techopsFinalParserDrawNM();
  assert.ok(context.TechOpsGoodBoysLegacyHudFilter.VERSION>=2,"single-HUD filter must include shared Night status bars");
  assert.ok(!calls.some(c=>c[0]==="rect"&&c[1]===10&&c[2]===10),"generic Night left HUD must be suppressed");
  assert.ok(!calls.some(c=>c[0]==="rect"&&c[1]===378&&c[2]===10),"generic Night right HUD must be suppressed");
  assert.ok(!calls.some(c=>c[0]==="rect"&&c[1]===10&&c[2]===92),"legacy duo HUD must be suppressed");
  assert.ok(calls.some(c=>c[0]==="rect"&&c[1]===300&&c[2]===300),"world rendering must remain intact");
  assert.ok(calls.some(c=>c[0]==="text"&&c[1]==="CLEAR THE HANGAR"),"center objective message must remain intact");
}

// Night Crawler keeps the tutorial toast and objective, so its redundant v6.3
// title card is suppressed before it can overlap the mobile tutorial.
{
  let baseCards=0;
  const context={console,S:{meta:{_char:"nightcrawler"}},v63Card(){baseCards++;},document:{getElementById(){return null;}},setInterval(){return 1;}};
  context.globalThis=context;vm.createContext(context);vm.runInContext(fs.readFileSync("production_presentation_guard.js","utf8"),context,{filename:"production_presentation_guard.js"});
  context.v63Card("DAY 1","MONDAY · SHIFT 09:00");
  context.v63Card("🌃 NIGHT CRAWL","NEW HAVEN STREETS");
  assert.strictEqual(baseCards,0,"Night tutorial cannot overlap generic day or title cards");
}

// Good Boys owns all campaign cards, while the generic Night tutorial toast
// is actively removed if it was already mounted before mode convergence.
{
  const card={style:{},innerHTML:"DAY 1",textContent:"DAY 1"},toast={textContent:"NEW HAVEN AFTER DARK",classList:{added:false,add(){this.added=true;}}};
  let baseCards=0;
  const context={console,NM:{_v736:{}},v63Card(){baseCards++;},document:{getElementById(id){return id==="v63-card"?card:id==="toast"?toast:null;}},setInterval(){return 1;}};
  context.globalThis=context;vm.createContext(context);vm.runInContext(fs.readFileSync("production_presentation_guard.js","utf8"),context,{filename:"production_presentation_guard.js"});
  context.v63Card("DAY 1","MONDAY SHIFT 09:00");
  assert.strictEqual(baseCards,0,"generic day card cannot render during Good Boys");
  assert.strictEqual(card.innerHTML,"","an already-mounted generic card must be cleared");
  assert.strictEqual(toast.textContent,"","Night Crawler tutorial toast must be cleared");
  assert.strictEqual(toast.classList.added,true);
}

const layout=fs.readFileSync("good_boys_mobile_controls_layout.js","utf8"),html=fs.readFileSync("index.html","utf8"),game=fs.readFileSync("game.js","utf8");
assert.ok(/var VERSION=7/.test(layout));
assert.ok(layout.includes('classList.toggle("good-boys-controls",active())'),"controls must own their active body class");
assert.ok(layout.includes("border-radius:11px"),"action controls must use compact rounded rectangles");
assert.ok(layout.includes("#v55-nmbtns{display:none!important"),"legacy Night action buttons cannot overlap Good Boys controls");
assert.ok(html.includes('id="sc-widget" title="Optional soundtrack" src="about:blank" data-src='),"SoundCloud iframe must be lazy");
assert.ok(game.includes("initMusic(true)"),"soundtrack must load from explicit user input");
assert.ok(game.includes("if (!userInitiated"),"run initialization cannot eagerly mount the SoundCloud widget");
assert.ok(fs.readFileSync("style.css","utf8").includes("bottom:max(190px"),"Night BLOCK/DASH controls must clear the primary touch buttons");

console.log("Good Boys UI ownership and lazy media regression: PASS");
