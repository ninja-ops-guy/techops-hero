from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"expected block missing in {path}: {old[:120]!r}")
    text = text.replace(old, new, 1)
    p.write_text(text)


# Production progression authority: the v6 mobile layout owns #good-dogs-touch.
# Never delete that canonical pad from a mutation observer; only retire the old
# gameplay-loop pad and duplicate director pads.
replace_once(
    "good_boys_progression_authority.js",
    "var VERSION=12,timer=null,observer=null,missionSeen=0,seenEnemy=false,emptySince=0,transition=false,lastAdvance=0,repairs=0;",
    "var VERSION=13,timer=null,observer=null,missionSeen=0,seenEnemy=false,emptySince=0,transition=false,lastAdvance=0,repairs=0;",
)
replace_once(
    "good_boys_progression_authority.js",
    'function removeCompetingPads(){try{if(!root.document)return;["good-dogs-touch","good-boys-loop-controls"].forEach(function(id){var xs=root.document.querySelectorAll("#"+id);for(var i=0;i<xs.length;i++)if(xs[i]&&xs[i].parentNode)xs[i].parentNode.removeChild(xs[i]);});var ds=root.document.querySelectorAll("#good-boys-director-controls");for(var j=1;j<ds.length;j++)if(ds[j].parentNode)ds[j].parentNode.removeChild(ds[j]);var keep=ds[0],live=cs(),owns=!!(live&&!live.ending&&!cinematicVisible());if(keep){keep.style.display=owns?"grid":"none";keep.style.pointerEvents=owns?"auto":"none";}}catch(_){} }',
    'function removeCompetingPads(){try{if(!root.document)return;var legacy=root.document.querySelectorAll("#good-boys-loop-controls");for(var i=0;i<legacy.length;i++)if(legacy[i]&&legacy[i].parentNode)legacy[i].parentNode.removeChild(legacy[i]);var canonical=root.document.querySelectorAll("#good-dogs-touch");for(var k=1;k<canonical.length;k++)if(canonical[k]&&canonical[k].parentNode)canonical[k].parentNode.removeChild(canonical[k]);var ds=root.document.querySelectorAll("#good-boys-director-controls");for(var j=1;j<ds.length;j++)if(ds[j].parentNode)ds[j].parentNode.removeChild(ds[j]);var keep=ds[0],live=cs(),owns=!!(live&&!live.ending&&!cinematicVisible());if(keep){keep.style.display=owns?"grid":"none";keep.style.pointerEvents=owns?"auto":"none";}root.__goodBoysCanonicalPadCount=canonical.length?1:0;}catch(_){} }',
)
replace_once(
    "good_boys_progression_authority.js",
    'function installObserver(){try{if(observer||!root.MutationObserver||!root.document)return;observer=new root.MutationObserver(function(records){var dirty=false;for(var i=0;i<records.length;i++)if(records[i].addedNodes&&records[i].addedNodes.length){dirty=true;break;}if(dirty){reconcileMission("dom-mutation");removeCompetingPads();enforceCinematicBlock();}});observer.observe(root.document.documentElement,{subtree:true,childList:true});}catch(e){root.__goodBoysProgressionObserverError=String(e&&e.stack||e);}}',
    'function installObserver(){try{if(root.__productionSingleCompositor){if(observer){observer.disconnect();observer=null;}root.__goodBoysProgressionObserverSuppressed=true;return false;}if(observer||!root.MutationObserver||!root.document)return false;observer=new root.MutationObserver(function(records){var dirty=false;for(var i=0;i<records.length;i++)if(records[i].addedNodes&&records[i].addedNodes.length){dirty=true;break;}if(dirty){reconcileMission("dom-mutation");removeCompetingPads();enforceCinematicBlock();}});observer.observe(root.document.documentElement,{subtree:true,childList:true});return true;}catch(e){root.__goodBoysProgressionObserverError=String(e&&e.stack||e);return false;}}',
)
replace_once(
    "good_boys_progression_authority.js",
    'legacyPads:root.document?root.document.querySelectorAll("#good-dogs-touch,#good-boys-loop-controls").length:0,canonicalState:true',
    'legacyPads:root.document?root.document.querySelectorAll("#good-boys-loop-controls").length:0,canonicalPads:root.document?root.document.querySelectorAll("#good-dogs-touch").length:0,observerSuppressed:!!root.__goodBoysProgressionObserverSuppressed,canonicalState:true',
)

# The campaign director is compositor-driven in production. Its MutationObserver
# is redundant there and was the other half of the remove/rebuild feedback loop.
replace_once(
    "good_boys_campaign_director.js",
    "var VERSION=6,style=null,observer=null,shipImg=null,combo={step:0,last:0};",
    "var VERSION=7,style=null,observer=null,shipImg=null,combo={step:0,last:0};",
)
replace_once(
    "good_boys_campaign_director.js",
    'function installObserver(){try{if(observer||!root.MutationObserver||!root.document)return;observer=new root.MutationObserver(function(){if(active())handoffControls();});observer.observe(root.document.documentElement,{subtree:true,childList:true});}catch(e){}}',
    'function installObserver(){try{if(root.__productionSingleCompositor){if(observer){observer.disconnect();observer=null;}root.__goodBoysDirectorObserverSuppressed=true;return false;}if(observer||!root.MutationObserver||!root.document)return false;observer=new root.MutationObserver(function(){if(active())handoffControls();});observer.observe(root.document.documentElement,{subtree:true,childList:true});return true;}catch(e){return false;}}',
)

# Runtime progression certification: canonical mobile controls are not legacy.
replace_once(
    "scripts/good_boys_progression_bot.mjs",
    "legacyPads:document.querySelectorAll('#good-dogs-touch,#good-boys-loop-controls').length,followTrail:",
    "legacyPads:document.querySelectorAll('#good-boys-loop-controls').length,canonicalPads:document.querySelectorAll('#good-dogs-touch').length,followTrail:",
)
replace_once(
    "scripts/good_boys_progression_bot.mjs",
    "if(s.directorPads!==1)fail('director-pad-count',{count:s.directorPads});if(s.legacyPads!==0)fail('legacy-control-pads-remain',{count:s.legacyPads});",
    "if(s.directorPads!==1)fail('director-pad-count',{count:s.directorPads});if(s.legacyPads!==0)fail('legacy-control-pads-remain',{count:s.legacyPads});if(s.canonicalPads!==1)fail('canonical-good-dogs-pad-count',{count:s.canonicalPads});",
)

# Static contracts: lock the ownership rule so a future cleanup cannot
# reintroduce the WebKit MutationObserver ping-pong.
replace_once(
    "test_good_boys_intro_repair.js",
    "assert.ok(progression.includes('VERSION=12'), \"progression authority must expose v12 core-owned direct-M2 + async-safe handoff semantics\");",
    "assert.ok(progression.includes('VERSION=13'), \"progression authority must expose v13 core-owned direct-M2 + canonical mobile-pad ownership\");",
)
needle = "assert.ok(!progression.includes('cine.skip()'), \"progression authority must not emulate direct gameplay by skipping the cinematic engine\");\n"
insert = needle + "assert.ok(!progression.includes('[\"good-dogs-touch\",\"good-boys-loop-controls\"]'), \"progression cleanup must never delete the canonical good-dogs-touch pad\");\nassert.ok(progression.includes('querySelectorAll(\"#good-boys-loop-controls\")'), \"progression cleanup must target only the retired loop control pad\");\nassert.ok(progression.includes('__goodBoysProgressionObserverSuppressed'), \"production compositor must suppress the redundant progression MutationObserver\");\n"
replace_once("test_good_boys_intro_repair.js", needle, insert)
replace_once(
    "test_static_entrypoint_integrity.js",
    "assert.ok(directorSource.includes('VERSION=6'),\"Good Boys director must be presentation-only v6\");",
    "assert.ok(directorSource.includes('VERSION=7'),\"Good Boys director must be presentation-only v7 with compositor-owned observation\");",
)
replace_once(
    "test_static_entrypoint_integrity.js",
    "assert.ok(progressionSource.includes('VERSION=12'),\"Good Boys progression must expose v12 core-owned direct-M2 plus async-safe state authority\");",
    "assert.ok(progressionSource.includes('VERSION=13'),\"Good Boys progression must expose v13 core-owned direct-M2 plus canonical mobile-pad ownership\");",
)

print("Good Boys canonical control ownership patch applied")
