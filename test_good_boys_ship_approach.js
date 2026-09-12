"use strict";
const assert=require("assert");
const fs=require("fs");
const source=fs.readFileSync("good_boys_ship_approach.js","utf8");
new Function(source);
assert.ok(/compatibility shim/i.test(source),"legacy approach module must be explicitly compatibility-only");
assert.ok(source.includes("TechOpsGoodBoysShipFlight"),"legacy approach module must delegate to canonical ship flight");
assert.ok(source.includes("compatibilityOnly:true"),"compatibility status must be observable");
assert.ok(!source.includes('id==="GD_CUT_02"'),"legacy approach must not intercept authored cutscenes");
assert.ok(!source.includes("GoodDogsCutscenes.play"),"legacy approach must not wrap the Good Dogs cutscene player");
assert.ok(!source.includes("asteroid_1"),"supplied ship artwork must have one production authority, not a duplicate shim copy");
console.log("Good Boys legacy ship approach compatibility guard: PASS");

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

assert.deepStrictEqual(pngInfo("assets/good_boys/good_ship_arcade.atlas.png"),{width:768,height:620});
