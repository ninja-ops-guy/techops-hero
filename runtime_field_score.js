/* Optional local instrumental score. Existing game frames schedule audio;
 * no polling loop, network request, autoplay or SoundCloud duplication.
 * The small reference arrangement is original, not a stem of Mike's songs. */
(function(root){
  'use strict';
  let ac=null,bus=null,enabled=false,muted=false,paused=true,next=0,beat=0,mode='quiet',wanted='quiet',volume=.25;
  let pack=null,loadGeneration=0,lastError=null,noise=null;
  const voices=new Set(),stemVoices=new Map(),MAX_VOICES=24;
  const midi=n=>440*Math.pow(2,(n-69)/12);
  const arrangements={quiet:[50,57,60,57],explore:[50,57,62,60],threat:[38,45,48,49],care:[50,60,57,62]};
  const mixes={quiet:{bed:.5,pulse:0,threat:0,quiet:.8},explore:{bed:.7,pulse:.6,threat:0,quiet:0},threat:{bed:.6,pulse:.9,threat:.8,quiet:0},care:{bed:.6,pulse:.25,threat:0,quiet:.7}};
  function dispose(v){try{v.source.stop();}catch(_){}try{v.source.disconnect();v.gain.disconnect();if(v.filter)v.filter.disconnect();}catch(_){}voices.delete(v);}
  function silence(keepAuditions=false){for(const v of [...voices])if(!keepAuditions||!v.audition)dispose(v);stemVoices.clear();next=0;paused=true;}
  function stop(){silence();enabled=false;loadGeneration++;}
  function acquire(){if(!ac||ac.state==='closed'){const C=root.AudioContext||root.webkitAudioContext;if(!C)throw Error('Audio is unavailable in this browser.');ac=new C();noise=null;bus=ac.createGain();bus.connect(ac.destination);}return ac;}
  async function start(value=.25){
    const generation=++loadGeneration;lastError=null;
    try{const ctx=acquire();await ctx.resume();if(generation!==loadGeneration)return false;if(ctx.state!=='running')throw Error('Tap again to enable audio.');volume=Math.max(0,Math.min(.6,value));enabled=true;muted=false;paused=true;next=0;beat=0;bus.gain.value=volume;return true;}
    catch(e){lastError=e.message;enabled=false;silence();return false;}
  }
  function setMuted(value){muted=!!value;if(muted)silence();}
  function setVolume(value){volume=Math.max(0,Math.min(.6,Number(value)||0));if(bus)bus.gain.setTargetAtTime(volume,ac.currentTime,.08);}
  function note(pitch,at,length,gain,type='sine',audition=false){
    if(!ac||voices.size>=MAX_VOICES)return;
    const source=ac.createOscillator(),envelope=ac.createGain(),v={source,gain:envelope,audition};voices.add(v);
    source.type=type;source.frequency.setValueAtTime(midi(pitch),at);
    envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(gain,at+.012);envelope.gain.exponentialRampToValueAtTime(.0001,at+length);
    source.connect(envelope);envelope.connect(bus);source.onended=()=>dispose(v);source.start(at);source.stop(at+length+.02);
  }
  function referenceBeat(at){const phrase=arrangements[mode],n=phrase[Math.floor(beat/4)%4];
    if(beat%4===0){note(n,at,1.8,.12,'triangle');note(n+7,at,1.8,.055);}
    if(mode!=='quiet'||beat%2===0)note(n+12+(beat%4===3?7:0),at,.25,mode==='threat'?.10:.055);
    if(mode==='threat')note(26,at,.11,.10,'triangle');
  }
  function beginStems(at){if(!pack)return;for(const [name,buffer] of Object.entries(pack.layers)){
    const source=ac.createBufferSource(),gain=ac.createGain(),v={source,gain};source.buffer=buffer;source.loop=true;source.loopEnd=pack.duration;gain.gain.value=(mixes[mode][name]||0)*.6;source.connect(gain);gain.connect(bus);voices.add(v);stemVoices.set(name,v);source.onended=()=>dispose(v);source.start(at);
  }}
  function update(context){
    if(!enabled)return;
    if(!context||muted||root.document&&root.document.hidden){silence();return;}
    if(context.blocked){silence(!!context.rehearsal);return;}
    if(!ac||ac.state!=='running'){silence();return;}
    wanted=context.threat?'threat':context.escort?'care':context.quiet?'quiet':'explore';
    if(paused){paused=false;next=ac.currentTime+.035;beat=0;mode=wanted;if(pack)beginStems(next);}
    // A stalled frame never schedules a burst of missed notes.
    if(next<ac.currentTime-.1){silence();return;}
    const interval=60/(pack?pack.bpm:96);
    while(next<ac.currentTime+.15){
      if(beat%4===0){mode=wanted;if(pack)for(const [name,v] of stemVoices)v.gain.gain.setTargetAtTime((mixes[mode][name]||0)*.6,next,.3);}
      if(!pack)referenceBeat(next);
      next+=interval;beat++;
    }
  }
  function drum(index,at){
    if(voices.size>=MAX_VOICES)return;
    const gain=ac.createGain(),noisy=index===1||index===3,length=index===3?.07:index===1?.16:.21;
    let source,filter=null;
    if(noisy){
      if(!noise){noise=ac.createBuffer(1,Math.ceil(ac.sampleRate*.22),ac.sampleRate);const samples=noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;}
      source=ac.createBufferSource();source.buffer=noise;filter=ac.createBiquadFilter();filter.type=index===3?'highpass':'bandpass';filter.frequency.value=index===3?5500:1800;filter.Q.value=.7;source.connect(filter);filter.connect(gain);
    }else{source=ac.createOscillator();source.type='sine';source.frequency.setValueAtTime(index===0?120:180,at);source.frequency.exponentialRampToValueAtTime(index===0?44:85,at+length);source.connect(gain);}
    const v={source,gain,filter,audition:true};voices.add(v);gain.connect(bus);gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(index===3?.18:.32,at+.003);gain.gain.exponentialRampToValueAtTime(.0001,at+length);source.onended=()=>dispose(v);source.start(at);source.stop(at+length+.01);
  }
  function tap(index){if(!enabled||muted||!ac||ac.state!=='running'||!Number.isInteger(index)||index<0||index>3)return false;drum(index,ac.currentTime);return true;}
  function playPattern(pattern){if(!enabled||muted||!ac||ac.state!=='running'||!Array.isArray(pattern)||pattern.length>16||!pattern.every(n=>Number.isInteger(n)&&n>=0&&n<4))return false;for(const v of [...voices])if(v.audition)dispose(v);pattern.forEach((n,i)=>drum(n,ac.currentTime+.03+i*.3125));return true;}
  /* Artist handoff: load only reviewed, same-origin files. All stems start at
   * the same audio time; matching duration prevents drift and accidental cuts. */
  async function loadPack(spec){
    if(!enabled)throw Error('Enable audio before loading a score.');
    if(!spec||!Number.isFinite(spec.bpm)||spec.bpm<40||spec.bpm>200||!Number.isInteger(spec.bars)||spec.bars<1||spec.bars>64)throw Error('Invalid score tempo or loop length');
    const entries=Object.entries(spec.layers||{});if(!entries.length||entries.length>4||entries.some(([k,v])=>!['bed','pulse','threat','quiet'].includes(k)||!/^assets\/music\/[a-zA-Z0-9_-]+\.(wav|mp3|ogg)$/.test(v)))throw Error('Use approved local music stems.');
    const generation=++loadGeneration,ctx=acquire(),duration=spec.bars*4*60/spec.bpm,layers={};let decodedBytes=0;
    for(const [name,path] of entries){const response=await root.fetch(path);if(!response.ok)throw Error('Music stem unavailable: '+name);const bytes=await response.arrayBuffer();if(bytes.byteLength>32*1024*1024)throw Error('Music stem exceeds the audio budget');const decoded=await ctx.decodeAudioData(bytes);if(Math.abs(decoded.duration-duration)>.05)throw Error('Music stems must share the declared loop length');decodedBytes+=(decoded.length||decoded.duration*48000)*(decoded.numberOfChannels||2)*4;if(decodedBytes>64*1024*1024)throw Error('Decoded music stems exceed the mobile audio budget');layers[name]=decoded;}
    if(generation!==loadGeneration||!enabled)return false;silence();pack={bpm:spec.bpm,duration,layers};return true;
  }
  async function loadConfiguredPack(){
    const generation=loadGeneration,response=await root.fetch('assets/music/field-score.json');
    if(!response.ok)throw Error('Field ambience could not be loaded.');
    const spec=await response.json();if(generation!==loadGeneration||!enabled)return false;
    if(spec.source==='reference-arrangement'){silence();pack=null;return true;}
    if(spec.source!=='artist-stems')throw Error('Unrecognized field ambience source.');
    return loadPack(spec);
  }
  if(root.document)root.document.addEventListener('visibilitychange',()=>{if(root.document.hidden)silence();});
  if(root.addEventListener){root.addEventListener('blur',()=>silence());root.addEventListener('pagehide',stop);}
  root.TechOpsFieldScore={start,stop,silence,update,tap,playPattern,setMuted,setVolume,loadPack,loadConfiguredPack,engaged:()=>enabled,isMuted:()=>muted,diagnostics:()=>({enabled,muted,paused,mode,wanted,voices:voices.size,auditions:[...voices].filter(v=>v.audition).length,source:pack?'artist-stems':'reference-arrangement',error:lastError})};
})(typeof globalThis!=='undefined'?globalThis:this);
