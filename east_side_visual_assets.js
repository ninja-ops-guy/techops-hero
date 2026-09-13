/* TechOps Hero — EAST SIDE approved visual handoff v1.
 * Generated from the user-approved TechOps Hero EAST SIDE concept sheet.
 * Runtime code may crop only the source rectangles declared here; the full
 * concept sheet itself is not a gameplay surface.
 */
(function(root,factory){var api=factory(root||{});if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.TechOpsEastSideVisualAssets=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
var VERSION=1,BASE='assets/eastside/';
var FILES=Object.freeze({environment:BASE+'east_side_environment.png',porch:BASE+'east_side_porch_sequence.png'});
var ENV=Object.freeze([
 {id:'bus_stop',screen:0,src:[0,28,256,162]},
 {id:'convenience_store',screen:1,src:[256,28,256,162]},
 {id:'underpass',screen:2,src:[512,28,256,162]},
 {id:'dog_park',screen:3,src:[768,28,256,162]},
 {id:'gas_station',screen:4,src:[1024,28,256,162]},
 {id:'waldo_street',screen:5,src:[1280,28,256,162]}
]);
var PORCH=Object.freeze([
 {id:'approach',src:[0,0,116,132]},
 {id:'hover_hand',src:[116,0,116,132]},
 {id:'knock',src:[232,0,116,132]},
 {id:'door_opens',src:[348,0,116,132]},
 {id:'waldo',src:[464,0,116,132]},
 {id:'headphones_off',src:[580,0,116,132]},
 {id:'enter',src:[696,0,119,132]}
]);
var cache={};
function image(key){if(!root.Image)return null;if(cache[key])return cache[key];var im=new root.Image();im.decoding='async';im.src=FILES[key];cache[key]=im;return im;}
function preload(){return {environment:image('environment'),porch:image('porch')};}
function environment(screen){screen=Math.max(0,Math.min(5,screen|0));return ENV[screen];}
function porch(id){for(var i=0;i<PORCH.length;i++)if(PORCH[i].id===id)return PORCH[i];return null;}
function drawCrop(ctx,key,rect,dx,dy,dw,dh){var im=image(key);if(!ctx||!im||!rect||!im.complete||!im.naturalWidth)return false;ctx.drawImage(im,rect[0],rect[1],rect[2],rect[3],dx,dy,dw,dh);return true;}
return Object.freeze({VERSION:VERSION,FILES:FILES,ENV:ENV,PORCH:PORCH,preload:preload,environment:environment,porch:porch,drawCrop:drawCrop});
});
