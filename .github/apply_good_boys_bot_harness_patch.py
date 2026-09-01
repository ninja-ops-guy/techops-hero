#!/usr/bin/env python3
from pathlib import Path


def replace_once(path, old, new):
    p=Path(path); text=p.read_text(); count=text.count(old)
    if count!=1: raise SystemExit(f"{path}: expected 1 match, found {count}: {old[:80]!r}")
    p.write_text(text.replace(old,new,1))


def replace_all_checked(path, old, new, expected=1):
    p=Path(path); text=p.read_text(); count=text.count(old)
    if count!=expected: raise SystemExit(f"{path}: expected {expected} matches, found {count}: {old[:80]!r}")
    p.write_text(text.replace(old,new))

# Avoid Playwright actionability races when an authored click immediately mutates the DOM.
intro='scripts/good_boys_intro_mobile_bot.mjs'
replace_once(intro,"await b.click({timeout:1500});return t;","await b.evaluate(el=>{el.click();return true;});return t;")
replace_once(intro,"async function domClick(page,selector){return page.locator(selector).evaluate(el=>{el.click();return true;}).catch(()=>false);}","async function domClick(page,selector){return page.evaluate(sel=>{const el=document.querySelector(sel);if(!el)return false;el.click();return true;},selector).catch(()=>false);}")

runtime='scripts/runtime_bot.mjs'
replace_once(runtime,"async function clickByRegex(page,regex,timeout=2500){const buttons=page.locator('button'),n=await buttons.count();for(let i=0;i<n;i++){const b=buttons.nth(i);let txt='';try{txt=(await b.innerText()).trim();}catch{}if(regex.test(txt)){try{await b.click({timeout});return txt;}catch{}}}return null;}","async function clickByRegex(page,regex,timeout=2500){const buttons=page.locator('button'),n=await buttons.count();for(let i=0;i<n;i++){const b=buttons.nth(i);let txt='';try{txt=(await b.innerText()).trim();}catch{}if(regex.test(txt)){try{await b.evaluate(el=>{el.click();return true;});return txt;}catch{}}}return null;}")
replace_once(runtime,"async function domClick(page,selector){return page.locator(selector).evaluate(el=>{el.click();return true;}).catch(()=>false);}","async function domClick(page,selector){return page.evaluate(sel=>{const el=document.querySelector(sel);if(!el)return false;el.click();return true;},selector).catch(()=>false);}")
replace_once(runtime,"""    const film='#good-dogs-cutscene-overlay.active .gd-film-skip';if(await page.locator(film).count()){await domClick(page,film);await page.waitForTimeout(140);continue;}
    const authored=page.locator('#good-boys-story-cine button,#gb-prison-cine button,#good-boys-campaign-intro button,#good-boys-earthfall-cine button');
    if(await authored.count()){await authored.first().evaluate(el=>el.click()).catch(()=>{});await page.waitForTimeout(120);continue;}
""","""    const premise='#good-boys-campaign-intro button';if(await page.locator(premise).count()){await domClick(page,premise);await page.waitForTimeout(140);continue;}
    const film='#good-dogs-cutscene-overlay.active .gd-film-skip';if(await page.locator(film).count()){await domClick(page,film);await page.waitForTimeout(140);continue;}
    const authored=page.locator('#good-boys-story-cine button,#gb-prison-cine button,#good-boys-earthfall-cine button');
    if(await authored.count()){await authored.first().evaluate(el=>el.click()).catch(()=>{});await page.waitForTimeout(120);continue;}
""")
replace_once(runtime,"""    const s=await snapshotRuntime(page);if(!s.cutsceneVisible&&!s.runtime.inDialog)break;
""","""    const introBusy=await page.evaluate(()=>!!(window.TechOpsGoodBoysIntroRepair&&window.TechOpsGoodBoysIntroRepair.launching)).catch(()=>false);
    if(introBusy){await page.waitForTimeout(120);continue;}
    const s=await snapshotRuntime(page);if(!s.cutsceneVisible&&!s.runtime.inDialog)break;
""")

progress='scripts/good_boys_progression_bot.mjs'
replace_once(progress,"async function clickText(page,re){for(const b of await page.locator('button').all()){let t='';try{t=(await b.innerText()).trim();}catch{}if(re.test(t)){try{await b.click({timeout:500});return true;}catch{}}}return false;}","async function clickText(page,re){for(const b of await page.locator('button').all()){let t='';try{t=(await b.innerText()).trim();}catch{}if(re.test(t)){try{await b.evaluate(el=>{el.click();return true;});return true;}catch{}}}return false;}")
replace_once(progress,"async function domClick(page,selector){return page.locator(selector).evaluate(el=>{el.click();return true;}).catch(()=>false);}","async function domClick(page,selector){return page.evaluate(sel=>{const el=document.querySelector(sel);if(!el)return false;el.click();return true;},selector).catch(()=>false);}")
replace_once(progress,"""  const film='#good-dogs-cutscene-overlay.active .gd-film-skip';if(await page.locator(film).count()){idle=0;await domClick(page,film);await page.waitForTimeout(120);continue;}
  let handled=false;for(const selector of ['#good-boys-earthfall-cine button','#gb-prison-cine button','#good-boys-story-cine button','#good-boys-campaign-intro button']){const b=page.locator(selector).last();if(!await b.count())continue;try{if(await b.isVisible()){await b.evaluate(el=>el.click());handled=true;break;}}catch{}}
""","""  const premise='#good-boys-campaign-intro button';if(await page.locator(premise).count()){idle=0;await domClick(page,premise);await page.waitForTimeout(120);continue;}
  const film='#good-dogs-cutscene-overlay.active .gd-film-skip';if(await page.locator(film).count()){idle=0;await domClick(page,film);await page.waitForTimeout(120);continue;}
  let handled=false;for(const selector of ['#good-boys-earthfall-cine button','#gb-prison-cine button','#good-boys-story-cine button']){const b=page.locator(selector).last();if(!await b.count())continue;try{if(await b.isVisible()){await b.evaluate(el=>el.click());handled=true;break;}}catch{}}
""")
replace_once(progress,"""  idle++;if(idle>=3)return true;await page.waitForTimeout(120);
""","""  const introBusy=await page.evaluate(()=>!!(window.TechOpsGoodBoysIntroRepair&&window.TechOpsGoodBoysIntroRepair.launching)).catch(()=>false);if(introBusy){idle=0;await page.waitForTimeout(120);continue;}
  idle++;if(idle>=8)return true;await page.waitForTimeout(120);
""")

background='scripts/good_boys_background_bible_bot.mjs'
replace_once(background,"async function clickText(page,re){for(const b of await page.locator('button').all()){let t='';try{t=(await b.innerText()).trim();}catch{}if(re.test(t)){try{await b.click({timeout:500});return true;}catch{}}}return false;}","async function clickText(page,re){for(const b of await page.locator('button').all()){let t='';try{t=(await b.innerText()).trim();}catch{}if(re.test(t)){try{await b.evaluate(el=>{el.click();return true;});return true;}catch{}}}return false;}")
replace_once(background,"async function domClick(page,selector){return page.locator(selector).evaluate(el=>{el.click();return true;}).catch(()=>false);}","async function domClick(page,selector){return page.evaluate(sel=>{const el=document.querySelector(sel);if(!el)return false;el.click();return true;},selector).catch(()=>false);}")
replace_once(background,"""  const film='#good-dogs-cutscene-overlay.active .gd-film-skip';if(await page.locator(film).count()){idle=0;await domClick(page,film);await page.waitForTimeout(100);continue;}
  let handled=false;for(const sel of ['#good-boys-earthfall-cine button','#gb-prison-cine button','#good-boys-story-cine button','#good-boys-campaign-intro button']){const b=page.locator(sel).first();if(!await b.count())continue;if(await b.isVisible().catch(()=>false)){await b.evaluate(el=>el.click()).catch(()=>{});handled=true;break;}}
""","""  const premise='#good-boys-campaign-intro button';if(await page.locator(premise).count()){idle=0;await domClick(page,premise);await page.waitForTimeout(120);continue;}
  const film='#good-dogs-cutscene-overlay.active .gd-film-skip';if(await page.locator(film).count()){idle=0;await domClick(page,film);await page.waitForTimeout(100);continue;}
  let handled=false;for(const sel of ['#good-boys-earthfall-cine button','#gb-prison-cine button','#good-boys-story-cine button']){const b=page.locator(sel).first();if(!await b.count())continue;if(await b.isVisible().catch(()=>false)){await b.evaluate(el=>el.click()).catch(()=>{});handled=true;break;}}
""")
replace_once(background,"""  idle++;if(idle>=3)return true;await page.waitForTimeout(100);
""","""  const introBusy=await page.evaluate(()=>!!(window.TechOpsGoodBoysIntroRepair&&window.TechOpsGoodBoysIntroRepair.launching)).catch(()=>false);if(introBusy){idle=0;await page.waitForTimeout(120);continue;}
  idle++;if(idle>=8)return true;await page.waitForTimeout(100);
""")

print('Good Boys runtime harness race patch applied')
