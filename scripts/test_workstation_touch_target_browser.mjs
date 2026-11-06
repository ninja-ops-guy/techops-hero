// Isolated renderer fixture. Uses production markup/CSS, not a gameplay certification.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
import {assertWorkstationTouchTarget} from './workstation_touch_target.mjs';
const browser = await chromium.launch({headless:true});
let failed = false;
try {
  for (const [profile, width, height, hasTouch] of [['portrait',390,844,true],['landscape',844,390,true],['desktop',1280,800,false]]) {
    const context = await browser.newContext({viewport:{width,height},hasTouch});
    const page = await context.newPage();
    try {
      await page.setContent('<div id="dialogue"><div id="dlg-name"></div><div id="dlg-text"></div><div id="dlg-options"></div></div>');
      await page.addStyleTag({content:fs.readFileSync('style.css','utf8')});
      await page.addStyleTag({content:fs.readFileSync('runtime_day.css','utf8')});
      await page.addScriptTag({content:fs.readFileSync('runtime_day.js','utf8')});
      await page.evaluate(() => {
        // Fixture bypasses proximity only to exercise the real desktop renderer.
        window.S = {day:1,inDialog:true};
        TechOpsDayExperience.desktopNearby = () => true;
        TechOpsDayDesktop.present('WORKSTATION // MUSIC','Music muted.',[{t:'Back to desktop',f:()=>{}}]);
        document.getElementById('dialogue').style.display = 'block';
      });
      const target = page.getByRole('button',{name:'Back to desktop',exact:true});
      const samples = await assertWorkstationTouchTarget(target);
      await page.emulateMedia({reducedMotion:'reduce'});
      const reduced = await assertWorkstationTouchTarget(target);
      assert.equal(reduced[0].computed.animationName,'none');
      console.log(JSON.stringify({profile,status:'passed',samples,reduced}));
    } catch (error) {failed=true; console.log(JSON.stringify({profile,status:'failed',error:String(error.stack||error)}));}
    finally {await context.close();}
  }
} finally {await browser.close();}
if (failed) process.exitCode=1;
