"use strict";
const assert=require("assert");
const fs=require("fs");
const source=fs.readFileSync("good_boys_ship_approach.js","utf8");
const flight=fs.readFileSync("good_boys_ship_flight.js","utf8");
new Function(source);
new Function(flight);
function crc32(bytes){
  let c=~0>>>0;
  for(const x of bytes){c^=x;for(let k=0;k<8;k++)c=(c>>>1)^((-(c&1))&0xedb88320);}
  return (~c)>>>0;
}
function pngInfo(path){
  const bytes=fs.readFileSync(path),sig="89504e470d0a1a0a";
  assert.strictEqual(bytes.subarray(0,8).toString("hex"),sig,"Good Ship atlas must be a valid PNG");
  let pos=8,info=null,ended=false;
  while(pos+12<=bytes.length){
    const len=bytes.readUInt32BE(pos),type=bytes.subarray(pos+4,pos+8).toString("ascii"),data=bytes.subarray(pos+8,pos+8+len),stored=bytes.readUInt32BE(pos+8+len);
    assert.strictEqual(stored,crc32(Buffer.concat([Buffer.from(type),data])),`PNG chunk ${type} has an invalid CRC`);
    if(type==="IHDR")info={width:data.readUInt32BE(0),height:data.readUInt32BE(4)};
    pos+=12+len;
    if(type==="IEND"){ended=true;break;}
  }
  assert.ok(ended,"Good Ship atlas must terminate with IEND");
  return info;
}
assert.ok(source.includes("GOOD_BOYS_SHIP_ARCADE"),"ship approach must expose the supplied-asset atlas contract");
assert.ok(source.includes('assets/good_boys/good_ship_arcade.atlas.png'),"ship approach must load the extracted supplied artwork");
assert.ok(source.includes("20260903-good-ship-gameplay-assets-r2"),"ship approach must bypass the corrupt mobile-cached atlas");
assert.ok(flight.includes("VERSION=5"),"canonical ship flight must require the gameplay-integration atlas loader");
assert.ok(flight.includes("20260903-good-ship-gameplay-assets-r2"),"canonical ship flight must bypass the corrupt mobile-cached atlas");
assert.ok(flight.includes("space_bg:[0,0,552,220]"),"canonical flight must use the tall gameplay backdrop frame, not a repeated UI strip");
assert.deepStrictEqual(pngInfo("assets/good_boys/good_ship_arcade.atlas.png"),{width:768,height:620});
for(const key of ["ship_player","asteroid_1","asteroid_2","asteroid_3","asteroid_4","asteroid_5","prison_station","lead_1","lead_2","lead_3","lead_4"]){assert.ok(source.includes(key),`missing supplied asset frame ${key}`);}
assert.ok(source.includes('id==="GD_CUT_02"'),"ship gameplay hook must preserve the picked cockpit takeover clip contract");
assert.ok(source.includes('p.phase==="clip2"'),"ship gameplay must only intercept the authored opening transition");
assert.ok(source.includes('AVOID ASTEROIDS'),"ship gameplay must present the asteroid-avoidance objective");
assert.ok(source.includes('PRISON VECTOR'),"ship gameplay must visually advance toward the prison");
assert.ok(source.includes('runApproachCutscene'),"ship gameplay must end in an in-engine prison approach cutscene using supplied frames");
assert.ok(source.includes('DURATION_MS=4200'),"opening flight beat must remain bounded for runtime automation and mobile pacing");
assert.ok(source.includes('root.__goodBoysShipApproach'),"ship approach must expose runtime diagnostics");
console.log("Good Boys supplied-asset ship approach contract: PASS");
