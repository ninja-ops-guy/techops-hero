'use strict';
// HTTP intent transitions -> server-owned tick frames. No client-supplied time,
// position, damage or campaign state enters the simulation.
const core=require('./advanced-simulation.js');
const {BUTTONS:B,ALL_BUTTONS_MASK:MASK}=require('./advanced-input.js');
const EDGE_MASK=B.light|B.heavy|B.jump|B.dash;
const MAX_QUEUE=32, MAX_BATCH=16;
function create(){return {seq:-1,queue:[],requested:0,held:0,awaitingRelease:0,lastInput:null};}
function mask(v){return Number.isSafeInteger(v)&&v>=0&&v<=MASK;}
function accept(channel,data,round,time,staleMs=250){
  if(data.protocol!==2||data.rulesetId!==core.RULESET_ID)return {status:409,error:'Arena protocol mismatch'};
  if(data.round!==round)return {status:409,error:'Arena round mismatch'};
  if(!Number.isSafeInteger(data.seq)||data.seq<=channel.seq)return {status:409,error:'Stale input'};
  if(!mask(data.buttons)||!Array.isArray(data.transitions)||data.transitions.length>MAX_BATCH||!data.transitions.every(mask))return {status:400,error:'Invalid input transitions'};
  if(data.transitions.length?data.transitions.at(-1)!==data.buttons:data.buttons!==channel.requested)return {status:400,error:'Input transition tail mismatch'};
  const expired=channel.lastInput!==null&&time-channel.lastInput>staleMs;
  if((expired?0:channel.queue.length)+data.transitions.length>MAX_QUEUE)return {status:429,error:'Input queue full'};
  // Validate the whole request before mutating sequence, freshness or queue.
  if(expired){channel.awaitingRelease|=(channel.held|channel.requested)&EDGE_MASK;channel.queue=[];channel.held=0;}
  channel.seq=data.seq;channel.requested=data.buttons;channel.queue.push(...data.transitions);channel.lastInput=time;
  if(!channel.queue.length){channel.awaitingRelease&=data.buttons;channel.held=data.buttons&~channel.awaitingRelease;}
  return null;
}
function clear(channel){channel.queue=[];channel.held=0;channel.requested=0;channel.awaitingRelease=0;channel.lastInput=null;}
function consume(channel,tick,round,time,staleMs){
  if(channel.lastInput===null||time-channel.lastInput>staleMs){
    channel.awaitingRelease|=(channel.held|channel.requested)&EDGE_MASK;channel.queue=[];channel.held=0;
  }else if(channel.queue.length){
    const intent=channel.queue.shift();
    channel.awaitingRelease&=intent; // only an explicitly received release rearms
    channel.held=intent&~channel.awaitingRelease;
  }
  return {tick,round,buttons:channel.held};
}
module.exports=Object.freeze({create,accept,clear,consume,MAX_QUEUE,MAX_BATCH});
