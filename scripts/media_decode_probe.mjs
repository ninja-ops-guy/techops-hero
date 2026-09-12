// Diagnostic isolation: original MP4s in a plain page, without game scripts.
import fs from 'node:fs';
import {webkit,devices} from 'playwright';
const base=process.env.BOT_BASE_URL||'http://127.0.0.1:4173/';
const browser=await webkit.launch({headless:true}),results=[];
try{for(const clip of ['01_signal_beyond_earth_pixel.mp4','02_signal_pull_transition_pixel.mp4']){
 const page=await browser.newPage({...devices['iPhone 13']});
 try{
  await page.route('**/__media_probe__',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body style="margin:0;background:black"><video muted playsinline style="width:100vw;height:100vh"></video></body></html>'}));
  await page.goto(base+'__media_probe__');
  const result=await page.evaluate(async src=>{
   const v=document.querySelector('video'),events=[];let frames=0;
   v.muted=true;v.defaultMuted=true;v.volume=0;v.playsInline=true;v.preload='auto';
   for(const name of ['loadedmetadata','loadeddata','canplay','playing','waiting','stalled','error','timeupdate'])v.addEventListener(name,()=>{if(events.length<40)events.push({name,time:v.currentTime,ready:v.readyState});});
   const decoded=()=>{frames++;if(frames<100)v.requestVideoFrameCallback(decoded);};if(v.requestVideoFrameCallback)v.requestVideoFrameCallback(decoded);
   v.src=src;v.load();let playError=null;v.play().catch(e=>{playError=String(e);});
   await new Promise(resolve=>setTimeout(resolve,3500));
   return {src,time:v.currentTime,ready:v.readyState,paused:v.paused,frames,events,playError,error:v.error?{code:v.error.code,message:v.error.message}:null,buffered:Array.from({length:v.buffered.length},(_,i)=>[v.buffered.start(i),v.buffered.end(i)]),support:{h264:v.canPlayType('video/mp4; codecs="avc1.64001F"'),aac:v.canPlayType('audio/mp4; codecs="mp4a.40.2"')}};
  },new URL('assets/cutscenes/good_dogs/'+clip,base).href);
  result.pass=result.time>.2&&result.ready>=2&&result.frames>=3;results.push(result);console.log(JSON.stringify(result));
 }finally{await page.close();}
}}finally{await browser.close();fs.mkdirSync('runtime-bot-artifacts',{recursive:true});fs.writeFileSync('runtime-bot-artifacts/media-isolation.json',JSON.stringify(results,null,2));}
if(results.some(r=>!r.pass))process.exitCode=1;
