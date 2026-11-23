'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('night_hooks.js','utf8');
const start=source.indexOf('let __nightReferenceEnemies = null'),end=source.indexOf('\nfunction drawNightEnemyAtlas',start);
assert(start>=0&&end>start,'Enemy art function is present');
const instances=[];
class ImageMock {constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;instances.push(this);}}
const draws=[],ctx={save(){},restore(){},translate(){},rotate(){},drawImage(...args){draws.push(args);}};
const sandbox={Image:ImageMock,NM:{},window:{matchMedia:()=>({matches:true})},Math};
vm.createContext(sandbox);vm.runInContext(source.slice(start,end),sandbox);
const draw=sandbox.drawNightReferenceEnemy;
const enemy=kind=>({kind,x:100,y:396,w:27,h:34,hp:90,hitT:0,down:0,kb:0});
assert.equal(draw(ctx,enemy('guard'),100,0),false,'Unloaded image falls back');
instances[0].complete=true;instances[0].naturalWidth=1536;instances[0].naturalHeight=1024;
for(const kind of ['guard','hunter']){const e=enemy(kind),before=JSON.stringify(e);assert.equal(draw(ctx,e,100,0),true);assert.equal(JSON.stringify(e),before,'Drawing cannot mutate combat');}
assert.equal(draw(ctx,enemy('thug'),100,0),false,'Unloaded second sheet falls back');
instances[1].complete=true;instances[1].naturalWidth=2172;instances[1].naturalHeight=724;
for(const kind of ['thug','skimmer','droneop']){const e=enemy(kind),before=JSON.stringify(e),count=draws.length;assert.equal(draw(ctx,e,100,0),true);assert.equal(JSON.stringify(e),before);assert.equal(draws.length-count,kind==='droneop'?2:1);}
assert.equal(draw(ctx,enemy('unknown'),100,0),false);
sandbox.NM._v736={};assert.equal(draw(ctx,enemy('guard'),100,0),false,'Good Dogs retains its renderer');delete sandbox.NM._v736;
sandbox.NM._sector04={active:true};assert.equal(draw(ctx,enemy('guard'),100,0),false,'Sector 04 retains its renderer');delete sandbox.NM._sector04;
sandbox.NM._nightwalker={};assert.equal(draw(ctx,enemy('guard'),100,0),false,'West Annex retains its renderer');
console.log('Night enemy candidate: five archetypes, asset failure fallback, mode boundaries and non-mutating render PASS.');
