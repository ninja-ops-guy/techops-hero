from pathlib import Path
import re

path = Path("index.html")
text = path.read_text(encoding="utf-8")
pattern = r'good_dogs_cutscenes_v2_2\.js(?:\?v=[A-Za-z0-9._-]+)?'
replacement = 'good_dogs_cutscenes_v2_2.js?v=20260901-ios-blackfix-v27'
matches = re.findall(pattern, text)
if len(matches) != 1:
    raise SystemExit(f"expected exactly one Good Dogs player entrypoint, found {len(matches)}: {matches}")
text = re.sub(pattern, replacement, text, count=1)
path.write_text(text, encoding="utf-8")
print("cache-busted Good Dogs player entrypoint")
