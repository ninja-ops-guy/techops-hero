/* TechOps Hero — deterministic Day Mode seasons and outside weather. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.TechOpsDaySeasons=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var CYCLE=112, SEASON_LENGTH=28;
  var SEASONS=[
    {id:'spring',label:'SPRING',tint:'rgba(126,188,150,.08)',accent:'#9ad7a8'},
    {id:'summer',label:'SUMMER',tint:'rgba(244,194,92,.06)',accent:'#f6d47c'},
    {id:'autumn',label:'AUTUMN',tint:'rgba(202,113,62,.10)',accent:'#e7a06b'},
    {id:'winter',label:'WINTER',tint:'rgba(100,144,192,.14)',accent:'#b8d8f4'}
  ];
  function normalized(day){day=Math.max(1,Number(day)||1);return (day-1)%CYCLE;}
  function weather(day){
    var n=normalized(day), season=Math.floor(n/SEASON_LENGTH),within=n%SEASON_LENGTH;
    var kind=season===3?(within===0?'first-snow':within<10?'snow':within<18?'overcast':'cold-clear'):season===0?(within<8?'rain':'clear'):season===1?(within<7?'humid':'clear'):(within<8?'wind':'clear');
    return {day:Number(day)||1,season:SEASONS[season],seasonIndex:season,dayInSeason:within+1,weather:kind,firstSnow:kind==='first-snow'};
  }
  function hash(n){n=(n|0)+0x6d2b79f5;n=Math.imul(n^(n>>>15),n|1);n^=n+Math.imul(n^(n>>>7),n|61);return ((n^(n>>>14))>>>0)/4294967296;}
  function render(ctx,now,day){
    if(!ctx)return false;
    var state=weather(day),w=ctx.canvas.width||1280,h=ctx.canvas.height||720,t=Number(now)||0;
    ctx.save();
    ctx.fillStyle=state.season.tint;ctx.fillRect(0,0,w,h);
    if(state.weather==='first-snow'||state.weather==='snow'){
      var count=state.weather==='first-snow'?42:30;
      for(var i=0;i<count;i++){var x=hash(i*17+state.day*31)*w,y=(hash(i*29+state.day*13)*h+t*(18+hash(i+7)*18))%(h+18)-9,r=1+hash(i+3)*2;
        ctx.fillStyle='rgba(232,246,255,'+(0.45+hash(i+11)*.4).toFixed(2)+')';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
      if(state.firstSnow){ctx.fillStyle='#dceeff';ctx.font='bold 12px monospace';ctx.textAlign='left';ctx.fillText('FIRST SNOW · OUTSIDE CONDITIONS CHANGED',12,24);}
    } else if(state.weather==='rain'){
      ctx.strokeStyle='rgba(155,205,232,.32)';ctx.lineWidth=1;
      for(var j=0;j<36;j++){var rx=hash(j*19+state.day*7)*w,ry=(hash(j*23+state.day*5)*h+t*70)%(h+20)-10;ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-3,ry+10);ctx.stroke();}
    } else if(state.weather==='wind'){
      ctx.strokeStyle='rgba(236,178,115,.25)';ctx.lineWidth=1;
      for(var k=0;k<18;k++){var wx=hash(k*11+state.day*3)*w,wy=hash(k*17+state.day*9)*h;ctx.beginPath();ctx.moveTo(wx,wy);ctx.quadraticCurveTo(wx+16,wy-3,wx+32,wy);ctx.stroke();}
    }
    ctx.restore();return state;
  }
  return Object.freeze({CYCLE:CYCLE,SEASON_LENGTH:SEASON_LENGTH,seasons:function(){return SEASONS.slice();},weather:weather,render:render});
});
