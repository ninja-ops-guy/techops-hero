'use strict';
// Serializable declared fixtures: no production input or match-state test API.
const core=require('./advanced-simulation.js'),{BUTTONS:B}=require('./advanced-input.js');
function cases(){
  const base=()=>{const m=core.createMatch({schemaVersion:2,rulesetId:core.RULESET_ID,matchId:'replay',characters:['mike','k']});for(let i=0;i<180;i++)core.stepMatch(m,[null,null]);m.state.players[0].x=400;m.state.players[1].x=450;return m;};
  const out=[];
  for(const air of [false,true])for(const action of ['light','heavy'])for(const dir of [0,B.up,B.down]){
    const m=base();if(air)m.state.players.forEach(p=>{p.y=300;p.jumps=1;});
    out.push({name:`${air?'air':'ground'}-${action}-${dir}`,initial:m,frames:Array.from({length:80},(_,i)=>[i===0?B[action]|dir:0,0])});
  }
  out.push({name:'confirmed-chain',initial:base(),frames:Array.from({length:100},(_,i)=>[[0,16,32].includes(i)?B.light:0,0])});
  const queued=base();queued.state.players[1].x=650;
  out.push({name:'buffer-facing',initial:queued,frames:Array.from({length:90},(_,i)=>[i===0?B.heavy:i===14?B.left|B.light:0,0])});
  out.push({name:'launcher-follow',initial:base(),frames:Array.from({length:100},(_,i)=>[i===0?B.light|B.up:i===5?B.jump:[12,28,44,60].includes(i)?B.light:0,0])});
  const trade=base();out.push({name:'trade',initial:trade,frames:Array.from({length:100},(_,i)=>[i%19===0?B.light:0,i%19===0?B.light:0])});
  const cap=base();cap.state.players.forEach(p=>{p.y=300;p.jumps=1;});cap.state.players[1].airHits=2;
  out.push({name:'air-cap',initial:cap,frames:Array.from({length:100},(_,i)=>[i===0?B.light:0,0])});
  let seed=0x109137;const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
  out.push({name:'long-tape',initial:base(),frames:Array.from({length:2400},()=>[random()&511,random()&511])});
  return out.map((c,i)=>({...c,initial:{...c.initial,matchId:`tape-${i}`}}));
}
// This exact function also executes in each browser against the served UMD core.
function replay({scenario,simulation}){
  const engine=simulation||globalThis.ArenaAdvancedSimulation;
  let match=engine.restore(scenario.initial);const trace=[];
  scenario.frames.forEach((buttons,i)=>{
    if(match.state.phase==='round-over')engine.nextRound(match);
    const frames=buttons.map(b=>({tick:match.state.tick+1,round:match.state.round,buttons:b}));
    const events=engine.stepMatch(match,frames);if(i%11===0)match=engine.restore(JSON.parse(JSON.stringify(match)));
    trace.push({checkpoint:engine.snapshot(match),events});
  });
  return trace;
}
module.exports={cases,replay};
