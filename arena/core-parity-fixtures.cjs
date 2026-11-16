'use strict';
// Portable control tapes and API operations only; all combat rules belong to the core.
function scenarios(){
 const wait=(count,a=0,b=0)=>({kind:'step',count,buttons:[a,b]});
 const checkpoint=label=>({kind:'checkpoint',label});
 const spawn={schemaVersion:1,rulesetId:'arena-138-v1'};
 const knockout=()=>[wait(180),wait(160,2,2),...Array.from({length:10},()=>[wait(1,8),wait(31)]).flat()];
 return [
  {name:'countdown-held-actions',config:{...spawn,matchId:'parity-held',characters:['iona','felicia']},operations:[wait(179,8),checkpoint('countdown-held'),wait(1,8),wait(6,8),checkpoint('attack-startup'),wait(30,8),checkpoint('held-after-recovery'),wait(1,null,null),wait(1,4|64|16|8),checkpoint('jump-dash-heavy'),wait(24),wait(1,4),wait(60,1|2)],expect:{phases:['fight'],rejections:0}},
  {name:'trades-blocks-and-stun',config:{...spawn,matchId:'parity-trades',characters:['mike','k']},operations:[wait(180),wait(160,2,2),wait(1),wait(1,8,8),wait(6),checkpoint('simultaneous-hit-stun'),wait(25),wait(1,16,32),wait(13,0,32),checkpoint('blocked-heavy'),wait(40)],expect:{contactsAtLeast:3,blockedAtLeast:1,tradeTicksAtLeast:1,phases:['fight'],rejections:0}},
  {name:'full-match-and-completed-disconnect',config:{...spawn,matchId:'parity-finish',characters:['k','iona']},operations:[...knockout(),checkpoint('round-over'),{kind:'next',expected:true},checkpoint('next-countdown'),...knockout(),checkpoint('finished'),{kind:'next',expected:false},wait(2),{kind:'disconnect',reason:'leave',winner:0,matchComplete:true},checkpoint('completed-disconnect'),wait(3),{kind:'next',expected:false}],expect:{contactsAtLeast:20,phases:['fight','round-over','finished'],rejections:0}},
  {name:'clock-draw-and-round-reset',config:{...spawn,matchId:'parity-draw',characters:['felicia','mike']},operations:[wait(180),wait(5400),checkpoint('draw-round-over'),{kind:'next',expected:true},wait(5),checkpoint('round-two-countdown')],expect:{phases:['fight','round-over'],rejections:0}},
  {name:'rejected-atomic-frames',config:{...spawn,matchId:'parity-invalid',characters:['mike','felicia']},operations:[wait(180),{kind:'reject',defect:'second-unknown-bits',code:'ERR_ARENA_SCHEMA'},{kind:'reject',defect:'second-wrong-tick',code:'ERR_ARENA_FRAME'},{kind:'reject',defect:'second-wrong-round',code:'ERR_ARENA_FRAME'},{kind:'reject',defect:'second-extra-field',code:'ERR_ARENA_SCHEMA'},{kind:'reject',defect:'missing-second',code:'ERR_ARENA_SCHEMA'},wait(1),checkpoint('after-rejections')],expect:{phases:['fight'],rejections:5}},
  {name:'disconnected-freeze',config:{...spawn,matchId:'parity-disconnect',characters:['iona','k']},operations:[wait(25,2,1),{kind:'disconnect',reason:'timeout',winner:null},checkpoint('disconnected-countdown'),wait(3,8,16),{kind:'reject',defect:'second-wrong-tick',code:'ERR_ARENA_FRAME'},{kind:'next',expected:false}],expect:{rejections:1}},
  {name:'rematch-namespace',config:{...spawn,matchId:'parity-rematch',characters:['mike','k']},operations:[wait(180),wait(160,2,2),wait(1),wait(1,8,8),wait(6),checkpoint('rematch-contact')],expect:{contactsAtLeast:2,tradeTicksAtLeast:1,phases:['fight'],rejections:0}}
 ];
}

// This function is also passed directly to Playwright page.evaluate. Keep it
// self-contained: the only physics implementation is the supplied/UMD core.
function replay({scenario,core,inputContract,expected}){
 core=core||globalThis.ArenaSimulation;inputContract=inputContract||globalThis.ArenaInputContract;
 let match,index=0,opIndex=-1,substep=-1;
 const trace=[],summary={name:scenario.name,records:0,steps:0,contacts:0,blocked:0,tradeTicks:0,rejections:0,checkpoints:[],phases:[],eventIds:[]};
 function fail(message,detail){const error=Error(message);error.detail=detail;throw error;}
 function check(ok,message,detail){if(!ok)fail(message,detail);}
 function clone(value){return JSON.parse(JSON.stringify(value));}
 function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';return JSON.stringify(value);}
 function same(a,b){return canonical(a)===canonical(b);}
 function freeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}
 function record(kind,frames=null,events=[],result=null){
  const actual={kind,opIndex,substep,frames:clone(frames),state:core.snapshot(match),events:clone(events),result};
  if(expected){const wanted=expected[index];check(wanted&&same(actual,wanted),'Node/browser replay mismatch',{record:index,operation:opIndex,substep,frames:clone(frames),expected:wanted||null,actual});}
  else trace.push(actual);
  index++;summary.records=index;
 }
 function makeFrames(buttons){return buttons.map(buttons=>buttons===null?null:{tick:match.state.tick+1,round:match.state.round,buttons});}
 function framesFor(buttons){return expected?clone(expected[index].frames):makeFrames(buttons);}
 try{
  check(core&&inputContract,'Core/input UMD exports are unavailable');
  for(const name of ['createMatch','stepMatch','snapshot','restore','nextRound'])check(typeof core[name]==='function','Missing strict core API: '+name);
  match=core.createMatch(clone(scenario.config));record('create');
  for(opIndex=0;opIndex<scenario.operations.length;opIndex++){
   const operation=scenario.operations[opIndex];substep=-1;
   if(operation.kind==='step'){
    for(substep=0;substep<operation.count;substep++){
     const frames=framesFor(operation.buttons),unchanged=clone(frames),before=core.snapshot(match);
     // The normalizer takes CURRENT tick/round, exactly as the frozen contract requires.
     const normalized=inputContract.normalizeFramePair(frames,match.state.tick,match.state.round);
     check(normalized.length===2&&normalized.every(map=>inputContract.KEYS.every(key=>typeof map[key]==='boolean')),'Normalizer omitted boolean controls');
     const events=core.stepMatch(match,frames);check(same(frames,unchanged),'Core mutated caller frames');
     if(before.state.phase==='disconnected')check(same(before,core.snapshot(match))&&events.length===0,'Disconnected strict state advanced');
     check(Array.isArray(events)&&events.length<=3,'Event count outside frozen contract');
     const contacts=events.filter(event=>event.type==='contact');summary.contacts+=contacts.length;summary.blocked+=contacts.filter(event=>event.blocked).length;if(contacts.length===2)summary.tradeTicks++;
     for(const event of events){check(event.matchId===scenario.config.matchId,'Event used wrong match namespace');summary.eventIds.push(event.id);if(event.type==='phase'&&!summary.phases.includes(event.phase))summary.phases.push(event.phase);}
     summary.steps++;record('step',frames,events);
    }
   }else if(operation.kind==='checkpoint'){
    const before=core.snapshot(match),frozen=freeze(core.snapshot(match)),restored=core.restore(frozen);
    check(same(before,core.snapshot(restored)),'Frozen checkpoint restore changed state');
    const copy=core.snapshot(restored);copy.state.players[0].x=copy.state.players[0].x===20?21:20;copy.state.players[0].previous.left=!copy.state.players[0].previous.left;
    check(same(before,core.snapshot(restored))&&same(before,core.snapshot(match)),'Checkpoint aliases mutable state');
    match=restored;summary.checkpoints.push(operation.label);record('checkpoint',null,[],operation.label);
   }else if(operation.kind==='next'){
    const before=core.snapshot(match),result=core.nextRound(match);check(result===operation.expected,'Unexpected nextRound result',{expected:operation.expected,actual:result});if(!result)check(same(before,core.snapshot(match)),'Rejected nextRound mutated state');record('next',null,[],result);
   }else if(operation.kind==='disconnect'){
    const detached=core.snapshot(match);detached.state.phase='disconnected';detached.state.winner=operation.winner;detached.state.outcome={reason:operation.reason,winner:operation.winner};if(operation.matchComplete)detached.state.outcome.matchComplete=true;
    match=core.restore(detached);record('disconnect');
   }else if(operation.kind==='reject'){
    let frames=makeFrames([2,0]);
    if(operation.defect==='second-unknown-bits')frames[1].buttons=128;
    else if(operation.defect==='second-wrong-tick')frames[1].tick++;
    else if(operation.defect==='second-wrong-round')frames[1].round++;
    else if(operation.defect==='second-extra-field')frames[1].damage=100;
    else if(operation.defect==='missing-second')frames.pop();
    else fail('Unknown rejection fixture');
    if(expected)frames=clone(expected[index].frames);
    const before=core.snapshot(match),caller=clone(frames);let rejection=null;
    try{core.stepMatch(match,frames);}catch(error){rejection={name:error.name,code:error.code};}
    check(rejection&&rejection.code===operation.code,'Invalid frame did not reject with expected code',{expected:operation.code,actual:rejection,frames});
    check(same(before,core.snapshot(match))&&same(caller,frames),'Rejected frame was not atomic',{frames,before,after:core.snapshot(match)});
    summary.rejections++;record('reject',frames,[],rejection);
   }else fail('Unknown operation');
  }
  const required=scenario.expect;
  for(const key of ['contacts','blocked','tradeTicks'])if(required[key+'AtLeast']!==undefined)check(summary[key]>=required[key+'AtLeast'],'Fixture failed to reach '+key,{required:required[key+'AtLeast'],actual:summary[key]});
  check(summary.rejections===required.rejections,'Rejection coverage missing');
  for(const phase of required.phases||[])check(summary.phases.includes(phase),'Fixture failed to reach '+phase);
  check(new Set(summary.eventIds).size===summary.eventIds.length,'Duplicate event ID within replay');
  if(expected)check(index===expected.length,'Browser omitted expected records');
  return {passed:true,summary,...(expected?{}:{trace})};
 }catch(error){return {passed:false,summary,failure:{message:error.message,record:index,operation:opIndex,substep,detail:error.detail||null}};}
}

function validateFixtures(){
 const cases=scenarios(),names=new Set(),ids=new Set();let steps=0;
 for(const scenario of cases){
  if(names.has(scenario.name)||ids.has(scenario.config.matchId))throw Error('Duplicate fixture identity');names.add(scenario.name);ids.add(scenario.config.matchId);
  for(const op of scenario.operations){if(op.kind==='step'){if(!Number.isSafeInteger(op.count)||op.count<1||op.buttons.length!==2||op.buttons.some(mask=>mask!==null&&(!Number.isSafeInteger(mask)||mask<0||mask>127)))throw Error('Malformed input tape');steps+=op.count;}}
 }
 return {scenarios:cases.length,steps,portable:JSON.stringify(JSON.parse(JSON.stringify(cases)))===JSON.stringify(cases)};
}
module.exports={scenarios,replay,validateFixtures};
if(require.main===module)console.log(JSON.stringify(validateFixtures()));
