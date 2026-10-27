#!/usr/bin/env python3
"""The reverse of assemble.py: split cadence.json back into the four editable files."""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
d = json.loads((root / "cadence.json").read_text(encoding="utf-8"))
w = lambda n, o: (root / n).write_text(json.dumps(o, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
w("stages.json", d["stages"]); w("objections.json", d["objections"])
w("offers.json", d["offers"]); w("coaches.json", d["coaches"])
w("versions.json", {"obv": d["obv"], "ov": d["ov"], "offv": d["offv"]})
print("split cadence.json into stages / objections / offers / coaches / versions")
