/* Shared browser driver for the canonical Good Dogs M1 -> M2 route.
 *
 * This helper deliberately uses real keyboard/button input for the two playable
 * missions. It may observe runtime state to choose an input direction, but it
 * never mutates campaign, enemy, objective, save, or media state.
 */

export const GOOD_DOGS_CONTRACT_VERSION=14;
export const GOOD_DOGS_LAUNCH_RE=/(118\/1984|BREAKOUT|GOOD\s*(?:BOYS|DOGS))/i;

export async function clickGoodDogsLaunch(page){
  const buttons=page.locator('button'),count=await buttons.count();
  for(let i=0;i<count;i++){
    const button=buttons.nth(i),text=(await button.innerText().catch(()=>'' )).trim();
    if(GOOD_DOGS_LAUNCH_RE.test(text)){
      await button.click();
      return text;
    }
  }
  return null;
}

export async function domClick(page,selector){
  return page.evaluate(sel=>{const el=document.querySelector(sel);if(!el)return false;el.click();return true;},selector).catch(()=>false);
}

export async function routeState(page){
  return page.evaluate(()=>{
    const n=window.NM||null,c=n&&n._v736||null,s=window.S||null,m=s&&s.meta&&s.meta._v736||null;
    const alive=(n&&n.enemies||[]).filter(e=>e&&e.alive!==false&&Number(e.hp)>0);
    const target=alive.slice().sort((a,b)=>Math.abs(Number(a.x||0)-Number(n&&n.x||0))-Math.abs(Number(b.x||0)-Number(n&&n.x||0)))[0]||null;
    const overlay=document.querySelector('#good-dogs-cutscene-overlay.active'),video=overlay&&overlay.querySelector('video'),play=overlay&&overlay.querySelector('.gd-film-play');
    return{
      mission:Number(c&&c.m||0),metaMission:Number(m&&m.m||0),x:Number(n&&n.x||0),partnerX:Number(c&&c.partner&&c.partner.x||0),
      pair:!!(c&&c.chars&&c.chars.katrin&&c.chars.manchez&&c.partner),activeDog:c&&c.active||null,inDialog:!!(s&&s.inDialog),
      trailStep:Number(n&&n._gbWaldoTrailStep||0),trailComplete:!!(n&&n._gbWaldoTrailComplete),hiddenBayEntered:!!(n&&n._gbHiddenBayEntered),
      wave:Number(c&&c.wave||0),living:alive.length,pending:!!(c&&(c.pendingSpawn||c.wavePending||Number(c.spawnT)>0)),shipRevealed:!!(n&&n._gbShipRevealed),
      target:target?{kind:target.kind||null,x:Number(target.x||0),hp:Number(target.hp||0)}:null,
      hp:Number(n&&n.hp||0),partnerDown:!!(c&&c.chars&&Object.values(c.chars).some(ch=>ch&&ch.downed)),resolving:!!(c&&c.resolving),
      hard:window.__goodBoysHardButtonLaunch||null,openingPhase:window.__goodBoysOpeningPhase||null,openingError:window.__goodBoysOpeningErrorDetail||null,
      cutscene:{id:overlay&&overlay.dataset.activeCutscene||null,src:video&&(video.currentSrc||video.getAttribute('src'))||null,currentTime:Number(video&&video.currentTime||0),readyState:Number(video&&video.readyState||0),playButton:!!(play&&play.classList.contains('active')),exit:window.__goodDogsCutsceneExit||null},
      boardVisible:!!document.getElementById('good-boys-board-ship'),deckVisible:!!document.getElementById('good-boys-deck-supplied')
    };
  });
}

async function tapDirection(page,direction,ms){
  const key=direction<0?'ArrowLeft':'ArrowRight';
  await page.keyboard.down(key);
  try{await page.waitForTimeout(ms);}finally{await page.keyboard.up(key).catch(()=>{});}
}

export async function resolveOpeningSignal(page,{onEvent=()=>{},requireDecoded=true}={}){
  await page.waitForFunction(()=>{
    const c=window.NM&&window.NM._v736,o=document.querySelector('#good-dogs-cutscene-overlay.active'),e=window.__goodDogsCutsceneExit;
    return !!(c&&Number(c.m)===1||o&&o.dataset.activeCutscene==='GD_CUT_01'||e&&e.id==='GD_CUT_01');
  },null,{timeout:12000});

  let state=await routeState(page);onEvent('gd-cut-01-start',state);
  if(state.cutscene.id==='GD_CUT_01'){
    await page.waitForFunction(()=>{
      const o=document.querySelector('#good-dogs-cutscene-overlay.active'),v=o&&o.querySelector('video'),e=window.__goodDogsCutsceneExit;
      return !!(v&&Number(v.readyState)>=2&&Number(v.currentTime)>.08||e&&e.id==='GD_CUT_01'&&Number(e.currentTime)>.08);
    },null,{timeout:9000}).catch(()=>{});
    state=await routeState(page);onEvent('gd-cut-01-decoded',state);
    const exit=state.cutscene.exit,decoded=state.cutscene.readyState>=2&&state.cutscene.currentTime>.08||exit&&exit.id==='GD_CUT_01'&&Number(exit.currentTime)>.08;
    if(state.cutscene.playButton)throw new Error('GD_CUT_01 required a manual PLAY gesture');
    if(requireDecoded&&!decoded)throw new Error('GD_CUT_01 produced no decoded playback evidence: '+JSON.stringify(state.cutscene));
    if(state.cutscene.id==='GD_CUT_01'&&!await domClick(page,'#good-dogs-cutscene-overlay.active .gd-film-skip'))throw new Error('GD_CUT_01 SKIP control unavailable');
  }
  await page.waitForFunction(()=>window.NM&&window.NM._v736&&Number(window.NM._v736.m)===1,null,{timeout:9000});
  state=await routeState(page);onEvent('m1-mounted',state);
  if(state.metaMission!==1||!state.pair)throw new Error('Fresh Good Dogs launch did not mount the canonical M1 pair: '+JSON.stringify(state));
  if(state.openingError)throw new Error('Good Dogs opening error: '+JSON.stringify(state.openingError));
  if(state.hard?.openingAuthority!=='TechOpsGoodBoysButtonHardFix'||Number(state.hard?.version||0)<GOOD_DOGS_CONTRACT_VERSION)throw new Error('Good Dogs v14 title authority is not active: '+JSON.stringify(state.hard));
  return state;
}

export async function driveMissionOne(page,{onEvent=()=>{}}={}){
  await page.keyboard.down('ArrowRight');
  try{
    await page.waitForFunction(()=>window.NM&&Number(window.NM.x)>=1430&&window.NM._gbWaldoTrailComplete===true,null,{timeout:14000});
  }finally{await page.keyboard.up('ArrowRight').catch(()=>{});}
  await page.waitForFunction(()=>{
    const n=window.NM,c=n&&n._v736;return !!(c&&c.partner&&Math.abs(Number(c.partner.x||0)-Number(n.x||0))<175);
  },null,{timeout:5000});
  let state=await routeState(page);onEvent('m1-hidden-bay-ready',state);
  if(state.trailStep<4||!state.trailComplete)throw new Error('M1 trail did not complete');
  await page.keyboard.press('KeyE');
  await page.waitForFunction(()=>window.S&&window.S.meta&&window.S.meta._v736&&Number(window.S.meta._v736.m)===2,null,{timeout:5000});
  await page.waitForFunction(()=>!!document.getElementById('good-boys-campaign-intro')||window.NM&&window.NM._v736&&!window.NM._v736.ending&&!window.NM._gbHiddenBayEntered&&Number(window.NM._v736.m)===2,null,{timeout:9000});
  const intro=page.locator('#good-boys-campaign-intro button').first();
  if(await intro.count()&&await intro.isVisible().catch(()=>false))await intro.evaluate(el=>el.click());
  await page.waitForFunction(()=>window.NM&&window.NM._v736&&Number(window.NM._v736.m)===2&&!window.NM._v736.ending&&!window.NM._gbHiddenBayEntered&&!(window.S&&window.S.inDialog),null,{timeout:9000});
  state=await routeState(page);onEvent('m2-mounted',state);
  if(state.metaMission!==2||state.hiddenBayEntered)throw new Error('M1 -> M2 handoff diverged: '+JSON.stringify(state));
  return state;
}

export async function clearMissionTwoWithInput(page,{onEvent=()=>{},timeoutMs=45000}={}){
  await page.waitForFunction(()=>window.NM&&window.NM._v736&&Number(window.NM._v736.m)===2,null,{timeout:9000});
  await tapDirection(page,1,260);
  const deadline=Date.now()+timeoutMs;
  let lastWave=-1,lastLiving=-1;
  while(Date.now()<deadline){
    const state=await routeState(page);
    if(state.openingError)throw new Error('Good Dogs runtime error during M2: '+JSON.stringify(state.openingError));
    if(state.mission!==2||state.metaMission!==2)throw new Error('M2 lost campaign ownership: '+JSON.stringify(state));
    if(state.resolving)throw new Error('M2 entered mission failure resolution: '+JSON.stringify(state));
    if(state.wave!==lastWave||state.living!==lastLiving){onEvent('m2-combat',state);lastWave=state.wave;lastLiving=state.living;}
    if(state.shipRevealed&&state.living===0)break;
    if(state.inDialog){
      const keep=page.getByRole('button',{name:/Keep fighting/i});
      if(await keep.count()&&await keep.isVisible().catch(()=>false)){await keep.click();continue;}
      throw new Error('Unexpected blocking dialog during M2: '+JSON.stringify(state));
    }
    if(!state.target){await page.waitForTimeout(120);continue;}
    const dx=state.target.x-state.x;
    if(Math.abs(dx)>210)await tapDirection(page,Math.sign(dx)||1,90);
    else if(Math.abs(dx)<68)await tapDirection(page,-(Math.sign(dx)||1),105);
    await tapDirection(page,Math.sign(dx)||1,26);
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(72);
  }
  let state=await routeState(page);
  if(!state.shipRevealed||state.living!==0)throw new Error('M2 hangar did not clear through real input: '+JSON.stringify(state));
  if(state.x<1210){
    await page.keyboard.down('ArrowRight');
    try{await page.waitForFunction(()=>window.NM&&Number(window.NM.x)>=1210,null,{timeout:9000});}
    finally{await page.keyboard.up('ArrowRight').catch(()=>{});}
  }
  await page.waitForSelector('#good-boys-board-ship',{state:'visible',timeout:5000});
  state=await routeState(page);onEvent('m2-board-ready',state);
  if(!await domClick(page,'#good-boys-board-ship'))throw new Error('BOARD THE SHIP action unavailable');
  await page.waitForSelector('#good-boys-deck-supplied',{state:'visible',timeout:12000});
  state=await routeState(page);onEvent('m2-cockpit-mounted',state);
  return state;
}

export async function driveFreshRouteToCockpit(page,options={}){
  await resolveOpeningSignal(page,options);
  await driveMissionOne(page,options);
  return clearMissionTwoWithInput(page,options);
}
