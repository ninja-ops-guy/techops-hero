'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sim=require('./simulation.cjs');
function start({port=4260,host='127.0.0.1'}={}){
 const rooms=new Map(),tokens=new Map();
 const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 function remove(code){const r=rooms.get(code);if(r)for(const seat of r.seats)if(seat)tokens.delete(seat.token);rooms.delete(code);}
 const server=http.createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,'http://localhost');
 if(req.method==='GET'&&['/','/client.js'].includes(url.pathname)){res.writeHead(200,{'Content-Type':url.pathname==='/'?'text/html':'text/javascript','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'",'Cache-Control':'no-store'});return res.end(fs.readFileSync(path.join(__dirname,url.pathname==='/'?'index.html':'client.js')));}
 if(req.method!=='POST'||url.pathname!=='/api')return json(res,404,{error:'Not found'});
 if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return json(res,403,{error:'Origin rejected'});
 let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>2048)return json(res,413,{error:'Request too large'});}const data=JSON.parse(raw);
 if(data.action==='create'||data.action==='join'){
 if(!sim.ROSTER.includes(data.character))return json(res,400,{error:'Choose a fighter'});
 let code=data.code,r=rooms.get(code);
 if(data.action==='create'){if(rooms.size>=32)return json(res,503,{error:'Room limit reached'});do{code=crypto.randomBytes(4).toString('hex').toUpperCase();}while(rooms.has(code));r={seats:[],state:null,updated:Date.now(),votes:new Set()};rooms.set(code,r);}
 if(!r||r.seats.length>=2||r.state)return json(res,409,{error:'Room unavailable'});
 const token=crypto.randomBytes(24).toString('hex'),slot=r.seats.length;r.seats.push({token,character:data.character,seen:Date.now(),seq:-1,lastInput:0});tokens.set(token,{code,slot});r.updated=Date.now();
 if(r.seats.length===2)r.state=sim.create(r.seats.map(s=>s.character));return json(res,200,{token,slot,code});
 }
 const auth=tokens.get(data.token),r=auth&&rooms.get(auth.code);if(!r)return json(res,401,{error:'Session expired. Create or join another room.'});const seat=r.seats[auth.slot];seat.seen=Date.now();r.updated=seat.seen;
 if(data.action==='leave'){if(r.state)r.state.phase='disconnected';tokens.delete(seat.token);return json(res,200,{ok:true});}
 if(data.action==='input'&&r.state){if(!Number.isSafeInteger(data.seq)||data.seq<=seat.seq)return json(res,409,{error:'Stale input'});seat.seq=data.seq;seat.lastInput=seat.seen;sim.input(r.state,auth.slot,data.keys);}
 if(data.action==='ready'&&r.state&&['round-over','finished'].includes(r.state.phase)){r.votes.add(auth.slot);if(r.votes.size===2){if(r.state.phase==='finished')r.state=sim.create(r.state.characters);else sim.next(r.state);r.votes.clear();}}
 return json(res,200,{slot:auth.slot,code:auth.code,waiting:!r.state,state:r.state?{tick:r.state.tick,phase:r.state.phase,remaining:r.state.remaining,roundTicks:r.state.roundTicks,round:r.state.round,scores:r.state.scores,winner:r.state.winner,players:r.state.players.map(({previous,input,...p})=>p)}:null,ready:r.votes.size});
 }catch(e){json(res,400,{error:'Invalid request'});}
 });
 const timer=setInterval(()=>{const now=Date.now();for(const [code,r]of rooms){if(now-r.updated>120000){remove(code);continue;}if(!r.state)continue;for(let i=0;i<2;i++){if(now-r.seats[i].lastInput>250)sim.input(r.state,i,{});if(now-r.seats[i].seen>10000)r.state.phase='disconnected';}sim.step(r.state);}},1000/sim.HZ);
 server.on('close',()=>clearInterval(timer));server.listen(port,host);return server;
}
if(require.main===module){const host=process.env.ARENA_HOST||'127.0.0.1',port=Number(process.env.PORT)||4260;start({port,host});console.log(`Arena prototype: http://${host}:${port}`);}
module.exports={start};
