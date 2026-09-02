from pathlib import Path
import re

index=Path('index.html')
html=index.read_text()
if 'good_boys_ship_approach.js' not in html:
    pat=r'(<script src="good_dogs_cutscenes_v2_2\.js[^"]*"></script>)(<script src="good_dogs_cutscene_bridge\.js[^"]*"></script>)'
    repl=r'\1<script src="good_boys_ship_approach.js?v=20260902-ship-approach-r1"></script>\2'
    html2,n=re.subn(pat,repl,html,count=1)
    if n!=1: raise SystemExit('could not locate Good Dogs player -> bridge insertion point in index.html')
    index.write_text(html2)

perf=Path('test_production_performance_budget.js')
s=perf.read_text()
s=s.replace('assert.ok(local.length <= 264, `startup script count ${local.length} exceeds reviewed Good Dogs integration ceiling 264`);',
            'assert.ok(local.length <= 265, `startup script count ${local.length} exceeds reviewed Good Dogs + ship approach ceiling 265`);')
s=s.replace('["good_dogs_cutscenes_v2_2.js","good_dogs_cutscene_bridge.js"]',
            '["good_dogs_cutscenes_v2_2.js","good_boys_ship_approach.js","good_dogs_cutscene_bridge.js"]')
s=s.replace('"good_boys_canon_runtime.js","good_boys_gameplay_loop.js","good_dogs_cutscenes_v2_2.js","good_dogs_cutscene_bridge.js"',
            '"good_boys_canon_runtime.js","good_boys_gameplay_loop.js","good_dogs_cutscenes_v2_2.js","good_boys_ship_approach.js","good_dogs_cutscene_bridge.js"')
perf.write_text(s)

static=Path('test_static_entrypoint_integrity.js')
s=static.read_text()
s=s.replace('"good_boys_intro_repair.js","good_dogs_cutscenes_v2_2.js","good_dogs_cutscene_bridge.js"',
            '"good_boys_intro_repair.js","good_dogs_cutscenes_v2_2.js","good_boys_ship_approach.js","good_dogs_cutscene_bridge.js"')
needle='assert.ok(order("good_dogs_cutscenes_v2_2.js")<order("good_dogs_cutscene_bridge.js"),"Good Dogs cutscene player must load before the bridge");'
if 'Good Boys supplied-asset ship approach must load after the cutscene player' not in s:
    if needle not in s: raise SystemExit('could not locate Good Dogs order assertion')
    insert='assert.ok(order("good_dogs_cutscenes_v2_2.js")<order("good_boys_ship_approach.js"),"Good Boys supplied-asset ship approach must load after the cutscene player");\nassert.ok(order("good_boys_ship_approach.js")<order("good_dogs_cutscene_bridge.js"),"Good Boys supplied-asset ship approach must load before the mission bridge");\n'+needle
    s=s.replace(needle,insert)
static.write_text(s)
