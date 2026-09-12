/* Semantic combat sound design. Uses the game's shared AudioContext; owns no
 * music player, timer, input listener or combat authority. Audio failure is cosmetic. */
(function(root){
  'use strict';
  const SPECS=Object.freeze({
    jab:      [135,55,.11,.11,1800,.075],
    cross:    [165,45,.15,.15,1400,.095],
    launcher: [95,210,.20,.17,2200,.11],
    air:      [180,65,.13,.10,2400,.085],
    throw:    [140,38,.23,.15,850,.11],
    collision:[90,32,.23,.19,1000,.12],
    wall:     [110,35,.25,.17,2800,.13],
    slam:     [100,28,.30,.20,650,.14],
    guard:    [600,210,.10,.075,4100,.065],
    block:    [520,160,.10,.075,3400,.065],
    parry:    [980,480,.18,.075,5200,.035],
    grab:     [120,75,.09,.065,1200,.055],
    escape:   [240,90,.09,.035,1800,.04],
    whiff:    [220,90,.09,0,3200,.035],
    hurt:     [145,48,.20,.12,1700,.10],
    ko:       [150,32,.34,.13,750,.08],
    beat:     [720,1080,.065,.022,0,0],
    jump:     [170,350,.13,.045,1800,.015],
    dash:     [240,65,.15,.03,3000,.055]
  });
  const contexts=new WeakMap();
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function bank(ctx){
    let b=contexts.get(ctx);if(b)return b;
    const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.4),ctx.sampleRate),data=buffer.getChannelData(0);
    // Fixed noise keeps timbre reproducible without touching gameplay randomness.
    let seed=74921;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}
    b={buffer,voices:[],last:Object.create(null),played:0,dropped:0};contexts.set(ctx,b);return b;
  }
  function play(id,options){
    const name=String(id).replace(/^combat_/,''),spec=SPECS[name];if(!spec)return false;
    options=options||{};const ctx=options.context,raw=options.volume==null?1:Number(options.volume),volume=Number.isFinite(raw)?clamp(raw,0,1):0;
    // Do not build up deferred sounds behind autoplay policy or a zero-volume slider.
    if(!ctx||ctx.state!=='running'||!volume)return true;
    const nodes=[],sources=[];
    try{
      const b=bank(ctx),time=ctx.currentTime;
      b.voices=b.voices.filter(v=>v.until>time);
      if(b.voices.length>=14||time-(b.last[name]??-10)<.025){b.dropped++;return true;}
      b.last[name]=time;
      const [start,end,duration,body,cutoff,noise]=spec;
      const bus=ctx.createGain();nodes.push(bus);bus.gain.value=volume;
      if(ctx.createStereoPanner){const pan=ctx.createStereoPanner();pan.pan.value=clamp(Number(options.pan)||0,-.65,.65);nodes.push(pan);bus.connect(pan);pan.connect(ctx.destination);}else bus.connect(ctx.destination);
      function envelope(peak){const gain=ctx.createGain();nodes.push(gain);gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(peak,time+.004);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);gain.connect(bus);return gain;}
      if(body){const oscillator=ctx.createOscillator();sources.push(oscillator);nodes.push(oscillator);oscillator.type=name==='beat'||name==='parry'?'triangle':'sine';oscillator.frequency.setValueAtTime(start,time);oscillator.frequency.exponentialRampToValueAtTime(end,time+duration);oscillator.connect(envelope(body));}
      if(noise){const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter();sources.push(source);nodes.push(source,filter);source.buffer=b.buffer;filter.type=name==='whiff'||name==='dash'?'bandpass':'lowpass';filter.frequency.setValueAtTime(cutoff,time);filter.Q.value=.7;source.connect(filter);filter.connect(envelope(noise));}
      let remaining=sources.length;
      const voice={until:time+duration+.015};b.voices.push(voice);
      for(const source of sources){source.onended=function(){if(--remaining)return;for(const node of nodes)try{node.disconnect();}catch(e){}b.voices=b.voices.filter(v=>v!==voice);};source.start(time);source.stop(voice.until);}
      b.played++;root.__combatAudioLast={cue:name,at:time,active:b.voices.length,played:b.played,dropped:b.dropped};
    }catch(e){for(const source of sources)try{source.stop();}catch(_){}for(const node of nodes)try{node.disconnect();}catch(_){}root.__combatAudioError=String(e&&e.message||e);}
    return true;
  }
  root.TechOpsCombatAudio={VERSION:1,SPECS,play};
})(typeof globalThis!=='undefined'?globalThis:this);
