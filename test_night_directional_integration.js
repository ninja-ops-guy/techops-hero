'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const gamepad=fs.readFileSync('v730_hooks.js','utf8');
const end=gamepad.indexOf('  // ======================================================================\n  // Part 2');
assert.ok(end>0,'existing controller poll extraction anchor');
const prefix=gamepad.slice(0,end)+'})();';
function boot(owns=true){
 const calls=[],buttons=Array.from({length:16},()=>({pressed:false}));
 const pad={connected:true,index:0,id:'test standard pad',axes:[0,-1],buttons};
 const root={console,performance:{now:()=>1000},navigator:{getGamepads:()=>[pad]},S:{map:[[0]],nightMode:true},keys:{},step(){},loop(){},toast(){},interact(){calls.push('legacy-interact');},phonePanel(){calls.push('phone');},toggleTwin(){},TechOpsNightInput:{owns:()=>owns,ready:()=>true,dispatch:a=>calls.push(a)}};
 root.window=root;vm.runInNewContext(prefix,root);return {root,calls,pad,press(i){buttons[i].pressed=true;root.loop(0);root.loop(1);buttons[i].pressed=false;root.loop(2);}};
}
{
 const f=boot();for(const i of [0,3,4,5])f.press(i);
 assert.deepEqual(f.calls,['punch','kick','grab','jump'],'edge-only shared controller actions; Y cannot leak Teams');
 assert.equal(f.root.keys.arrowup,true,'up remains aim until the existing input frame bridge');
}
{
 const f=boot(false);f.press(0);f.press(3);assert.deepEqual(f.calls,['legacy-interact','phone'],'other modes retain their controller path');
}
{
 const f=boot();f.root.TechOpsNightInput.ready=()=>false;for(const i of [3,4,5])f.press(i);assert.deepEqual(f.calls,[],'blocked street controls are not dispatched');
}
const bootSource=fs.readFileSync('production_bootstrap.js','utf8'),v55=fs.readFileSync('v55_hooks.js','utf8'),runtime=fs.readFileSync('runtime_night.js','utf8');
assert.equal((bootSource.match(/"night_combat_input\.js"/g)||[]).length,1);
assert.ok(bootSource.indexOf('"night_combat.js"')<bootSource.indexOf('"night_combat_input.js"'));
assert.ok(v55.includes('TechOpsNightInput.runStep(__origStepNMV55'));
assert.ok(runtime.includes('TechOpsNightInput.sync()')&&runtime.includes('TechOpsNightInput.reset()'));
assert.ok(!fs.existsSync('night_session.js'),'do not reintroduce an alternative Night session');
const bot=fs.readFileSync('scripts/night_combat_bot.mjs','utf8');
const proofStart=bot.indexOf("  await setup(690);");
const proofEnd=bot.indexOf("  await shot('movement-dash-grab');",proofStart);
assert.ok(proofStart>=0&&proofEnd>proofStart,'browser dash-grab proof block exists');
const proof=bot.slice(proofStart,proofEnd);
const dashSeen=proof.indexOf("await page.waitForFunction(()=>NM._nightCombat?.events.some(e=>e.type==='dash'));");
const attack=proof.indexOf("await page.keyboard.press('KeyE');");
assert.ok(dashSeen>=0&&attack>dashSeen,'trusted punch follows the observed dash');
assert.doesNotMatch(proof.slice(dashSeen,attack),/page\.evaluate|keyboard\.down|waitForFunction\(\(\)=>\{const c=/,'post-dash round trips cannot consume the production dash-grab window');
console.log('Directional integration: controller edges, menu scope, single loader, consolidated lifecycle and dash dispatch PASS');
