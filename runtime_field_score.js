/* Optional local instrumental score. Existing game frames schedule audio;
 * no extra frame loop, startup audio fetch, autoplay or SoundCloud duplication.
 * The small reference arrangement is original, not a stem of Mike's songs. */
(function(root){
  'use strict';
  let ac=null,bus=null,enabled=false,muted=false,paused=true,next=0,beat=0,mode='quiet',wanted='quiet',volume=.25;
  let pack=null,loadGeneration=0,lastError=null,noise=null,catalog=null,routeKey=null,selectedTrack=null,availability='reference',loading=false;
  let loadQueue=Promise.resolve(),controller=null,epoch=0,pendingRoute=null;
  const voices=new Set(),stemVoices=new Map(),MAX_VOICES=24;
  const midi=n=>440*Math.pow(2,(n-69)/12);
  const arrangements={quiet:[50,57,60,57],explore:[50,57,62,60],threat:[38,45,48,49],care:[50,60,57,62]};
  arrangements.danger=arrangements.explore;arrangements.recovery=arrangements.care;
  const mixes={danger:{bed:.7,pulse:.65,threat:.35,quiet:0},recovery:{bed:.6,pulse:.15,threat:0,quiet:.7},quiet:{bed:.5,pulse:0,threat:0,quiet:.8},explore:{bed:.7,pulse:.6,threat:0,quiet:0},threat:{bed:.6,pulse:.9,threat:.8,quiet:0},care:{bed:.6,pulse:.25,threat:0,quiet:.7}};
  function dispose(v){try{v.source.stop();}catch(_){}try{v.source.onended=null;if('buffer' in v.source)v.source.buffer=null;v.source.disconnect();v.gain.disconnect();if(v.filter)v.filter.disconnect();}catch(_){}voices.delete(v);}
  function silence(keepAuditions=false){for(const v of [...voices])if(!keepAuditions||!v.audition)dispose(v);stemVoices.clear();next=0;paused=true;}
  function cancelLoad(){loadGeneration++;if(controller)controller.abort();controller=null;loading=false;}
  function stop(){silence();enabled=false;cancelLoad();pack=null;catalog=null;routeKey=null;selectedTrack=null;availability='reference';pendingRoute=null;}
  function acquire(){if(!ac||ac.state==='closed'){const C=root.AudioContext||root.webkitAudioContext;if(!C)throw Error('Audio is unavailable in this browser.');ac=new C();noise=null;bus=ac.createGain();bus.connect(ac.destination);}return ac;}
  async function start(value=.25){
    stop();const generation=loadGeneration;lastError=null;
    try{const ctx=acquire();await ctx.resume();if(generation!==loadGeneration)return false;if(ctx.state!=='running')throw Error('Tap again to enable audio.');volume=Math.max(0,Math.min(.6,value));enabled=true;muted=false;paused=true;next=0;beat=0;bus.gain.value=volume;return true;}
    catch(e){if(generation!==loadGeneration)return false;lastError=e.message;enabled=false;silence();return false;}
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
    wanted=context.combat||context.threat?'threat':context.danger?'danger':context.recovery?'recovery':context.escort?'care':context.quiet?'quiet':'explore';
    const selection=selectCue(context);
    // Song changes wait for the audible phrase clock, not the scheduler's lookahead.
    if(selection.key!==routeKey){
      const phraseSeconds=(pack?pack.phraseBeats:4)*60/(pack?pack.bpm:96);
      if(!pendingRoute||pendingRoute.key!==selection.key)pendingRoute={...selection,at:paused?ac.currentTime:epoch+Math.ceil(Math.max(0,ac.currentTime-epoch)/phraseSeconds)*phraseSeconds};
      if(paused||ac.currentTime>=pendingRoute.at){route(selection);pendingRoute=null;}
    }else pendingRoute=null;
    if(loading)return;
    if(paused){paused=false;next=ac.currentTime+.035;epoch=next;beat=0;mode=wanted;if(pack)beginStems(next);}
    // A stalled frame never schedules a burst of missed notes.
    if(next<ac.currentTime-.1){silence();return;}
    const interval=60/(pack?pack.bpm:96);
    while(next<ac.currentTime+.15){
      if(beat%(pack?pack.phraseBeats:4)===0){mode=wanted;if(pack)for(const [name,v] of stemVoices)v.gain.gain.setTargetAtTime((mixes[mode][name]||0)*.6,next,.3);}
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
  function tap(index){if(!enabled||muted||!ac||ac.state!=='running'||!Number.isInteger(index)||index<0||index>3)return false;silence(true);drum(index,ac.currentTime);return true;}
  function playPattern(pattern){if(!enabled||muted||!ac||ac.state!=='running'||!Array.isArray(pattern)||pattern.length>16||!pattern.every(n=>Number.isInteger(n)&&n>=0&&n<4))return false;silence();pattern.forEach((n,i)=>drum(n,ac.currentTime+.03+i*.3125));return true;}
  const LAYERS=['bed','pulse','threat','quiet'],MAX_DECODED=64*1024*1024;
  function validatePack(spec,strict=false){
    if(!spec||!Number.isFinite(spec.bpm)||spec.bpm<40||spec.bpm>200||!Number.isInteger(spec.bars)||spec.bars<1||spec.bars>64)throw Error('Invalid score tempo or loop length');
    if(spec.meter!==undefined&&(!Array.isArray(spec.meter)||spec.meter[0]!==4||spec.meter[1]!==4||spec.meter.length!==2))throw Error('Only reviewed 4/4 arrangements are supported.');
    const phraseBars=spec.phraseBars===undefined?1:spec.phraseBars;
    if(!Number.isInteger(phraseBars)||phraseBars<1||spec.bars%phraseBars)throw Error('Phrase bars must divide the loop.');
    const entries=Object.entries(spec.layers||{});
    if(!entries.length||entries.length>4||entries.some(([k,v])=>!LAYERS.includes(k)||typeof v!=='string'||!/^assets\/music\/[a-zA-Z0-9_-]+\.(wav|mp3|ogg)$/.test(v))||new Set(entries.map(x=>x[1])).size!==entries.length)throw Error('Use approved local music stems.');
    if(strict){
      if(spec.approved!==true||!spec.meter||!spec.phraseBars||!Object.hasOwn(spec,'percussionLayer'))throw Error('Artist approval, meter, phrase bars and percussion owner are required.');
      if(spec.percussionLayer!==null&&!Object.hasOwn(spec.layers,spec.percussionLayer))throw Error('Choose one delivered percussion layer or null.');
    }
    return {entries,duration:spec.bars*4*60/spec.bpm,phraseBeats:phraseBars*4};
  }
  function validateCatalog(spec){
    if(!spec||!['reference-arrangement','artist-stems'].includes(spec.source))throw Error('Unrecognized field ambience source.');
    if(spec.schemaVersion===undefined){if(spec.source==='artist-stems')validatePack(spec);return spec;}
    if(spec.schemaVersion!==2||!spec.tracks||Array.isArray(spec.tracks)||!Array.isArray(spec.cues))throw Error('Invalid score catalog.');
    for(const [id,track] of Object.entries(spec.tracks)){
      if(!/^[a-z0-9-]+$/.test(id)||!track||!['pending','ready','reserved'].includes(track.status))throw Error('Invalid artist track.');
      if(track.status==='ready')validatePack(track.pack,true);
      else if(track.pack!==null)throw Error('Unavailable tracks must not declare audio exports.');
    }
    const ids=new Set(),routes=new Set();
    for(const cue of spec.cues){
      const key=cue.episode+':'+cue.moment;
      if(!cue.id||ids.has(cue.id)||routes.has(key)||!cue.episode||!cue.moment||!Array.isArray(cue.actors)||!cue.actors.length||!Object.hasOwn(spec.tracks,cue.track)||spec.tracks[cue.track].status==='reserved')throw Error('Invalid or ambiguous music cue.');
      ids.add(cue.id);routes.add(key);
    }
    return spec;
  }
  function selectCue(context){
    if(!catalog||catalog.schemaVersion!==2)return {key:routeKey};
    const cue=catalog.cues.find(c=>c.episode===context.episode&&c.moment===context.moment&&c.actors.includes(context.actor));
    return {key:cue?cue.id:'reference',track:cue?cue.track:null};
  }
  function route(selection){
    routeKey=selection.key;selectedTrack=selection.track||null;lastError=null;
    const track=selectedTrack&&catalog.tracks[selectedTrack];
    if(track&&track.status==='ready'&&catalog.source==='artist-stems'){
      availability='loading';
      // The queue serializes decode work. Old packs and voices are released first.
      loadPack(track.pack).then(ok=>{if(ok&&routeKey===selection.key)availability='ready';}).catch(error=>{if(routeKey===selection.key&&enabled){lastError=error.message;availability='error';}});
    }else{
      cancelLoad();silence();pack=null;
      availability=track?(track.status==='ready'?'disabled':track.status):'reference';
    }
  }
  function loadPack(spec){
    if(!enabled)return Promise.reject(Error('Enable audio before loading a score.'));
    let checked;try{checked=validatePack(spec);}catch(error){return Promise.reject(error);}
    cancelLoad();const generation=loadGeneration;loading=true;silence();pack=null;
    const live=()=>generation===loadGeneration&&enabled;
    const task=loadQueue.catch(()=>{}).then(async()=>{
      if(!live())return false;
      const ctx=acquire(),layers={};let decodedBytes=0,first=null;
      const abort=typeof root.AbortController==='function'?new root.AbortController():null;controller=abort;
      try{
        for(const [name,path] of checked.entries){
          if(!live())return false;
          const response=await root.fetch(path,{signal:abort?.signal,redirect:'error'});if(!live())return false;
          if(!response.ok)throw Error('Music stem unavailable: '+name);
          if(Number(response.headers?.get('content-length'))>32*1024*1024)throw Error('Music stem exceeds the audio budget');
          const bytes=await response.arrayBuffer();if(!live())return false;
          if(bytes.byteLength>32*1024*1024)throw Error('Music stem exceeds the audio budget');
          // Predict one stereo decode before allocating it. Final size is checked too.
          if(decodedBytes+checked.duration*ctx.sampleRate*2*4>MAX_DECODED)throw Error('Decoded music stems exceed the mobile audio budget');
          const decoded=await ctx.decodeAudioData(bytes);if(!live())return false;
          if(!Number.isFinite(decoded.duration)||Math.abs(decoded.duration-checked.duration)>.05)throw Error('Music stems must share the declared loop length');
          const rate=decoded.sampleRate||ctx.sampleRate,frames=decoded.length||Math.round(decoded.duration*rate),channels=decoded.numberOfChannels||2;
          if(!Number.isFinite(rate)||rate<=0||!Number.isInteger(frames)||frames<=0||![1,2].includes(channels))throw Error('Invalid decoded audio format.');
          if(first&&(frames!==first.frames||rate!==first.rate))throw Error('Artist layers must be sample-aligned.');
          if(spec.approved===true&&Math.abs(frames-Math.round(checked.duration*rate))>1)throw Error('Approved artist exports must match the declared loop length to one sample.');
          first={frames,rate};decodedBytes+=frames*channels*4;
          if(decodedBytes>MAX_DECODED)throw Error('Decoded music stems exceed the mobile audio budget');
          layers[name]=decoded;
        }
        if(!live())return false;
        pack={bpm:spec.bpm,duration:checked.duration,phraseBeats:checked.phraseBeats,layers,decodedBytes};return true;
      }catch(error){if(!live())return false;lastError=error.message;throw error;}
      finally{if(live()){loading=false;controller=null;}}
    });
    loadQueue=task;return task;
  }
  async function loadConfiguredPack(context={}){
    if(!enabled)throw Error('Enable audio before loading a score.');
    const generation=loadGeneration,response=await root.fetch('assets/music/field-score.json',{redirect:'error'});
    if(!response.ok)throw Error('Field ambience could not be loaded.');
    const spec=await response.json();if(generation!==loadGeneration||!enabled)return false;
    catalog=validateCatalog(spec);routeKey=null;
    if(spec.schemaVersion===2){route(selectCue(context));const configured=loadGeneration;await loadQueue.catch(()=>{});return enabled&&configured===loadGeneration;}
    if(spec.source==='reference-arrangement'){silence();pack=null;return true;}
    return loadPack(spec);
  }
  if(root.document)root.document.addEventListener('visibilitychange',()=>{if(root.document.hidden)silence();});
  if(root.addEventListener){root.addEventListener('blur',()=>silence());root.addEventListener('pagehide',stop);}
  root.TechOpsFieldScore={start,stop,silence,update,tap,playPattern,setMuted,setVolume,loadPack,loadConfiguredPack,validatePack,validateCatalog,engaged:()=>enabled,isMuted:()=>muted,diagnostics:()=>({enabled,muted,paused,mode,wanted,voices:voices.size,auditions:[...voices].filter(v=>v.audition).length,source:pack?'artist-stems':'reference-arrangement',selectedTrack,availability,loading,title:pack&&catalog?.tracks?.[selectedTrack]?.title||'Reference instrumental',decodedBytes:pack?pack.decodedBytes:0,error:lastError})};
})(typeof globalThis!=='undefined'?globalThis:this);
