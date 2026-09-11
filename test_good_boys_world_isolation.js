"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('night_hooks.js','utf8');
const menu=source.match(/function nmCarMenu\(\) \{[\s\S]*?\n\}/)[0];
const render=source.slice(source.indexOf('  // the Charger waits on Earth streets;'),source.indexOf('  // exit marker'));
let cars=0,labels=[];
const context={NM:{x:110,cam:0,_v736:{m:3}},NM_CAR_X:0,NM_FLOOR:430,now:0,Math,
  nmCar(){cars++;},ctx:{save(){},restore(){},fillText(text){labels.push(text);}}};
vm.createContext(context);vm.runInContext(menu,context);
assert.equal(context.nmCarMenu(),false,'Good Boys cannot leave prison via Earth district menu');
vm.runInContext(render,context);
assert.equal(cars,0);assert.deepEqual(labels,[],'Good Boys must not render DRIVE');
delete context.NM._v736;vm.runInContext(render,context);
assert.equal(cars,1,'ordinary Night retains Charger');assert.equal(labels.length,1);assert.match(labels[0],/DRIVE/);
context.NM.x=600;vm.runInContext(render,context);
assert.equal(cars,2);assert.equal(labels.length,1,'Night DRIVE prompt remains proximity gated');
console.log('Good Boys / Night world and Charger isolation: PASS');
