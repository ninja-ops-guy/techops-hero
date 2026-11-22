// Focused board integration on the real game page. Uses a labeled completed-save
// fixture; does not claim a playable district mission or physical phone coverage.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base=process.env.LOW_QUARTER_BASE_URL||'http://127.0.0.1:4208/';
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
try{
  for(const [name,width,height,touch] of [['desktop',1280,800,false],['touch',390,844,true]]){
    const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});
    await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
    const page=await context.newPage();
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.TechOpsProductionTitleExperience?.state().ready,null,{timeout:30000});
    await page.locator('#btn-start').click();
    await page.locator('#dlg-options button').filter({hasText:'Standard'}).click();
    await page.locator('#dlg-options button').filter({hasText:'Clock in'}).click();
    await page.waitForFunction(()=>window.S&&window.TechOpsLowQuarterRuntime&&window.TechOpsLateGameBootstrap?.ready(),null,{timeout:30000});
    for(const ending of ['shutdown','control','open_network']){
      await page.evaluate(ending=>{
        if(S.inDialog)closeDlg();
        const s=TechOpsCampaign.load(localStorage);
        // Explicit save fixture, not traversal evidence.
        s.story={schemaVersion:2,ending,completedActs:[],facts:{campaign_complete:true}};
        s.lateGame={chapters:{ending,campaignComplete:true}};
        TechOpsCampaign.save(s,localStorage);TechOpsLowQuarterRuntime.install();
        TechOpsLowQuarterRuntime.open();
      },ending);
      await page.locator('#dialogue:not(.hidden)').waitFor();
      const text=await page.locator('#dlg-text').innerText();
      assert.match(text,/authored defense mission is required/i);
      assert.match(text,ending==='shutdown'?/military cooperation/i:ending==='control'?/independently operated stop/i:/distributed command authority/i);
      assert.equal(await page.getByRole('button',{name:'Confirm permanent closeout',exact:true}).count(),0,'No fake rescue success controls');
      await page.locator('#dlg-options button').filter({hasText:'Close'}).click();
    }
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.TechOpsLowQuarterRuntime,null,{timeout:30000});
    assert.equal(await page.evaluate(()=>TechOpsCampaign.load(localStorage).story.ending),'open_network');
    assert.equal(await page.evaluate(()=>TechOpsLowQuarterRuntime.snapshot().phase),'unassessed');
    console.log(name+': real-page board, three authority contracts, legacy non-inference and reload PASS');
    await context.close();
  }
}finally{await browser.close();}
