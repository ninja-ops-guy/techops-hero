from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"expected block missing in {path}: {old[:140]!r}")
    p.write_text(text.replace(old, new, 1))


# Publish the game's lexical save() through the same live bridge used for S/NM.
# Good Boys progression writes canonical mission state through root.save.
replace_once(
    "dogs.js",
    '  bridge("keys",function(){try{return typeof keys!=="undefined"?keys:null;}catch(e){return null;}});\n',
    '  bridge("keys",function(){try{return typeof keys!=="undefined"?keys:null;}catch(e){return null;}});\n  bridge("save",function(){try{return typeof save==="function"?save:null;}catch(e){return null;}});\n',
)
replace_once(
    "dogs.js",
    '  root.__techopsLexicalBridgeVersion=3;\n',
    '  root.__techopsLexicalBridgeVersion=4;\n',
)

# Canonical CLOCK IN creates a fresh S. Rehydrate the pre-title Good Dogs seen
# flags into that fresh state before CampaignState.transition persists M2.
replace_once(
    "good_boys_intro_repair.js",
    '      if(!canonicalClockIn())return false;\n      root.__gbiSkipBuiltinM1=true;root.__gbdSkipBuiltinM1=true;\n',
    '      if(!canonicalClockIn())return false;\n      try{if(root.GoodDogsCutscenes&&typeof root.GoodDogsCutscenes.state==="function")root.GoodDogsCutscenes.state();}catch(e){root.__goodBoysCutsceneStateMigrationError=String(e&&e.stack||e);}\n      root.__gbiSkipBuiltinM1=true;root.__gbdSkipBuiltinM1=true;\n',
)

# Background-bible intentionally samples missions out of sequence. In production
# the stable compositor calls progression.tick even when p.timer is parked, so
# freeze only that tick inside this test process while sampling backgrounds.
replace_once(
    "scripts/good_boys_background_bible_bot.mjs",
    "await page.evaluate(()=>{const p=window.TechOpsGoodBoysProgressionAuthority;if(p&&p.timer!=null){clearInterval(p.timer);p.timer=null;}window.__goodBoysBackgroundBibleSampling=true;});",
    "await page.evaluate(()=>{const p=window.TechOpsGoodBoysProgressionAuthority;if(p&&p.timer!=null){clearInterval(p.timer);p.timer=null;}if(p&&typeof p.tick==='function'){p.__backgroundBibleLiveTick=p.tick;p.tick=function(){return false;};}window.__goodBoysBackgroundBibleSampling=true;});",
)

# Director pads are retired presentation remnants. Canonical touch ownership is
# exactly one #good-dogs-touch pad; zero director pads is the intended state.
replace_once(
    "scripts/good_boys_progression_bot.mjs",
    "if(s.directorPads!==1)fail('director-pad-count',{count:s.directorPads});if(s.legacyPads!==0)fail('legacy-control-pads-remain',{count:s.legacyPads});if(s.canonicalPads!==1)fail('canonical-good-dogs-pad-count',{count:s.canonicalPads});",
    "if(s.directorPads!==0)fail('retired-director-pad-returned',{count:s.directorPads});if(s.legacyPads!==0)fail('legacy-control-pads-remain',{count:s.legacyPads});if(s.canonicalPads!==1)fail('canonical-good-dogs-pad-count',{count:s.canonicalPads});",
)

# Static contracts for persistence bridge + opening-state rehydration.
replace_once(
    "test_mobile_production_tester.js",
    "assert.ok(dogs.includes('__techopsLexicalBridgeVersion=3'),'dogs.js must expose current lexical runtime bridge v3');",
    "assert.ok(dogs.includes('__techopsLexicalBridgeVersion=4'),'dogs.js must expose current lexical runtime bridge v4');",
)
replace_once(
    "test_mobile_production_tester.js",
    "['bridge(\"S\"','bridge(\"NM\"','bridge(\"ctx\"','bridge(\"NM_DISTRICTS\"','__techopsPreProductionDrawNM','__techopsPreProductionStepNM'].forEach(marker=>assert.ok(dogs.includes(marker),`dogs.js lexical bridge missing ${marker}`));",
    "['bridge(\"S\"','bridge(\"NM\"','bridge(\"ctx\"','bridge(\"save\"','bridge(\"NM_DISTRICTS\"','__techopsPreProductionDrawNM','__techopsPreProductionStepNM'].forEach(marker=>assert.ok(dogs.includes(marker),`dogs.js lexical bridge missing ${marker}`));",
)
needle = "assert.ok(source.includes('__goodBoysCanonicalClockIn'), \"clock-in completion must expose a diagnostic contract\");\n"
replace_once(
    "test_good_boys_intro_repair.js",
    needle,
    needle + "assert.ok(source.includes('GoodDogsCutscenes.state()'), \"canonical CLOCK IN must rehydrate Good Dogs cutscene seen-state before M2 persistence\");\n",
)

print("Good Boys persistence + certification patch applied")
