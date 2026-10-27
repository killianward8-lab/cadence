#!/usr/bin/env python3
"""Stamp a new build number into core.js and build.json. Run before every push:
   python3 tools/bump.py && git add -A && git commit -m ... && git push
The page compares build.json (fetched fresh) with the build it is running and offers a reload."""
import json, pathlib, re, time
root = pathlib.Path(__file__).resolve().parent.parent
v = time.strftime("%Y%m%d-%H%M")
core = root / "core.js"
s = core.read_text()
s2 = re.sub(r'export const BUILD = "[^"]*";', f'export const BUILD = "{v}";', s)
if s2 == s:
    s2 = s.replace("// Shared helpers and state for Killian's Cadence. No imports here.", f"// Shared helpers and state for Killian's Cadence. No imports here.\nexport const BUILD = \"{v}\";")
core.write_text(s2)
(root / "build.json").write_text(json.dumps({"v": v}) + "\n")
print("build", v)
